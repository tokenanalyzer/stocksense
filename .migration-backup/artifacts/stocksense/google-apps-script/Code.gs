/**
 * StockSense Lead Capture + Admin API — Google Apps Script v4
 * ─────────────────────────────────────────────────────────────
 * v4 changes:
 *   New fields: Starting Capital, Demat Status, Demat Account, Demat Account Other
 *   Migration: automatically inserts 4 new columns on existing 9-column sheets
 *              (City/Experience/etc shift right — no existing data lost)
 *
 * HOW TO DEPLOY (update existing deployment — keep same URL):
 * 1. Paste this file into Apps Script (replace all)
 * 2. Save (Ctrl+S)
 * 3. Deploy → Manage Deployments → Edit (pencil) → Version: New version → Deploy
 *
 * COLUMN LAYOUT (A–M, 13 columns):
 *   A: Timestamp          B: Full Name          C: Mobile Number
 *   D: Starting Capital   E: Demat Status       F: Demat Account  G: Demat Account Other
 *   H: City               I: Experience Level   J: Best Time to Contact
 *   K: What They Want     L: Consent Given      M: Status
 */

// ── CONFIG ────────────────────────────────────────────────────────────────────
var SPREADSHEET_ID = "1dm8bORIe7CXmaI4bLgmOicW2m78dvNRjr66H5uO4-jk";
var NOTIFY_EMAIL   = "stocksense00@gmail.com";
var ADMIN_PASSWORD = "Adilhusain@9967";
var SHEET_NAME     = "StockSense Leads";
var BRAND_NAME     = "StockSense";
// ─────────────────────────────────────────────────────────────────────────────

var COL = {
  TIMESTAMP:           1,
  FULL_NAME:           2,
  MOBILE:              3,
  INVESTMENT_CAPITAL:  4,
  DEMAT_STATUS:        5,
  DEMAT_ACCOUNT:       6,
  DEMAT_ACCOUNT_OTHER: 7,
  CITY:                8,
  EXPERIENCE:          9,
  CONTACT_TIME:       10,
  INTENT:             11,
  CONSENT:            12,
  STATUS:             13
};
var TOTAL_COLS = 13;

function getSheet() {
  var ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    // Brand-new sheet
    sheet = ss.insertSheet(SHEET_NAME);
    var headers = [
      "Timestamp", "Full Name", "Mobile Number",
      "Starting Capital (₹)", "Demat Status", "Demat Account", "Demat Account Other",
      "City", "Experience Level", "Best Time to Contact",
      "What They Want to Understand", "Consent Given", "Status"
    ];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, TOTAL_COLS).setFontWeight("bold");
    sheet.setFrozenRows(1);

  } else {
    var lastCol = sheet.getLastColumn();

    if (lastCol === 9) {
      // v3 → v4 migration: insert 4 new columns after Mobile (col 3)
      // insertColumnsAfter automatically shifts City / Experience / Best Time /
      // Intent / Consent / Status one step right — zero data loss.
      sheet.insertColumnsAfter(3, 4);
      sheet.getRange(1, 4).setValue("Starting Capital (₹)"); sheet.getRange(1, 4).setFontWeight("bold");
      sheet.getRange(1, 5).setValue("Demat Status");           sheet.getRange(1, 5).setFontWeight("bold");
      sheet.getRange(1, 6).setValue("Demat Account");          sheet.getRange(1, 6).setFontWeight("bold");
      sheet.getRange(1, 7).setValue("Demat Account Other");    sheet.getRange(1, 7).setFontWeight("bold");

    } else if (lastCol < TOTAL_COLS) {
      // Partial schema — fill any missing trailing headers
      sheet.insertColumnsAfter(lastCol, TOTAL_COLS - lastCol);
      sheet.getRange(1, TOTAL_COLS).setValue("Status").setFontWeight("bold");
    }
    // lastCol === TOTAL_COLS → already v4; check if D1 still has old header and rename it
    if (lastCol >= TOTAL_COLS) {
      var d1 = sheet.getRange(1, COL.INVESTMENT_CAPITAL).getValue();
      if (d1 === "Investment Capital (₹)") {
        sheet.getRange(1, COL.INVESTMENT_CAPITAL).setValue("Starting Capital (₹)");
      }
    }
  }

  return sheet;
}

// ── GET — health check + admin getLeads ──────────────────────────────────────
function doGet(e) {
  var action = e && e.parameter && e.parameter.action;
  var token  = e && e.parameter && e.parameter.token;

  if (action === "getLeads") {
    if (token !== ADMIN_PASSWORD) {
      return jsonOut({ success: false, error: "Unauthorized" });
    }
    return jsonOut({ success: true, leads: readLeads() });
  }

  // Health check — version "4" = new fields + migration applied
  return jsonOut({
    success: true,
    status:  "StockSense endpoint active",
    version: "4",
    ts:      new Date().toISOString()
  });
}

// ── POST — lead submission + admin status update ──────────────────────────────
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    if (data.action === "updateStatus") {
      if (data.token !== ADMIN_PASSWORD) {
        return jsonOut({ success: false, error: "Unauthorized" });
      }
      var sheet = getSheet();
      sheet.getRange(data.rowIndex, COL.STATUS).setValue(data.status);
      return jsonOut({ success: true });
    }

    return handleLeadSubmission(data);

  } catch (err) {
    Logger.log("doPost error: " + err.toString());
    return jsonOut({ success: false, error: err.toString() });
  }
}

// ── Lead submission ───────────────────────────────────────────────────────────
function handleLeadSubmission(data) {
  var sheet = getSheet();

  var timestamp = Utilities.formatDate(
    new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss"
  );

  // Store investment_capital as a number when possible, else empty string
  var capital = "";
  if (data.investmentCapital !== undefined && data.investmentCapital !== null && data.investmentCapital !== "") {
    var parsed = Number(data.investmentCapital);
    capital = isNaN(parsed) ? String(data.investmentCapital) : parsed;
  }

  sheet.appendRow([
    timestamp,
    data.fullName          || "",
    data.mobile            || "",
    capital,
    data.dematStatus       || "",
    data.dematAccount      || "",
    data.dematAccountOther || "",
    data.city              || "",
    data.experience        || "",
    data.contactTime       || "",
    data.intent            || "",
    data.consent ? "Yes" : "No",
    "New"
  ]);

  // Email notification (non-fatal)
  try {
    GmailApp.sendEmail(
      NOTIFY_EMAIL,
      BRAND_NAME + " — New Lead: " + (data.fullName || "Unknown"),
      buildEmailPlain(data, timestamp),
      { htmlBody: buildEmailHtml(data, timestamp), name: BRAND_NAME + " Leads" }
    );
  } catch (mailErr) {
    Logger.log("Email error (lead still saved): " + mailErr.toString());
  }

  return jsonOut({ success: true });
}

// ── Read leads ────────────────────────────────────────────────────────────────
function readLeads() {
  var sheet = getSheet();
  if (sheet.getLastRow() < 2) return [];

  var data  = sheet.getRange(2, 1, sheet.getLastRow() - 1, TOTAL_COLS).getValues();
  var leads = [];

  for (var i = 0; i < data.length; i++) {
    var r = data[i];
    if (!r[0] && !r[1]) continue;

    var capRaw = r[COL.INVESTMENT_CAPITAL - 1];
    var cap    = (capRaw !== undefined && capRaw !== null && capRaw !== "") ? String(capRaw) : "";

    leads.push({
      rowIndex:          i + 2,
      timestamp:         r[COL.TIMESTAMP           - 1] ? r[COL.TIMESTAMP           - 1].toString() : "",
      fullName:          r[COL.FULL_NAME            - 1] || "",
      mobile:            r[COL.MOBILE               - 1] || "",
      investmentCapital: cap,
      dematStatus:       r[COL.DEMAT_STATUS         - 1] || "",
      dematAccount:      r[COL.DEMAT_ACCOUNT        - 1] || "",
      dematAccountOther: r[COL.DEMAT_ACCOUNT_OTHER  - 1] || "",
      city:              r[COL.CITY                 - 1] || "",
      experience:        r[COL.EXPERIENCE           - 1] || "",
      contactTime:       r[COL.CONTACT_TIME         - 1] || "",
      intent:            r[COL.INTENT               - 1] || "",
      consent:           r[COL.CONSENT              - 1] || "",
      status:            r[COL.STATUS               - 1] || "New"
    });
  }
  return leads;
}

// ── Email builders ────────────────────────────────────────────────────────────
function buildEmailHtml(data, timestamp) {
  var capFmt = data.investmentCapital
    ? "\u20B9" + Number(data.investmentCapital).toLocaleString("en-IN")
    : "\u2014";

  return "<div style='font-family:Arial,sans-serif;max-width:600px;'>"
    + "<div style='background:#16a34a;padding:20px 28px;border-radius:8px 8px 0 0;'>"
    + "<h2 style='color:#fff;margin:0;font-size:20px;'>New Lead \u2014 " + BRAND_NAME + "</h2>"
    + "</div>"
    + "<div style='background:#f8fafc;padding:24px 28px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px;'>"
    + "<table style='width:100%;border-collapse:collapse;font-size:15px;'>"
    + eRow("Full Name",             data.fullName)
    + eRow("Mobile Number",         data.mobile)
    + eRow("Starting Capital",      capFmt)
    + eRow("Demat Status",          data.dematStatus || "\u2014")
    + eRow("Demat Account",         data.dematAccount || "\u2014")
    + eRow("Demat Account (Other)", data.dematAccountOther || "\u2014")
    + eRow("City",                  data.city)
    + eRow("Experience Level",      fmtExp(data.experience))
    + eRow("Best Time to Contact",  fmtTime(data.contactTime))
    + eRow("What They Want",        data.intent || "\u2014")
    + eRow("Consent Given",         data.consent ? "Yes" : "No")
    + eRow("Timestamp",             timestamp)
    + "</table>"
    + "<div style='margin-top:24px;padding:14px 18px;background:#dcfce7;border-radius:6px;font-size:13px;color:#166534;'>"
    + "Reply to this email or call the number above to follow up."
    + "</div></div></div>";
}

function buildEmailPlain(data, timestamp) {
  var capFmt = data.investmentCapital ? "\u20B9" + data.investmentCapital : "\u2014";
  return BRAND_NAME + " \u2014 New Lead\n\n"
    + "Full Name:              " + (data.fullName          || "") + "\n"
    + "Mobile Number:          " + (data.mobile            || "") + "\n"
    + "Starting Capital:       " + capFmt                         + "\n"
    + "Demat Status:           " + (data.dematStatus       || "\u2014") + "\n"
    + "Demat Account:          " + (data.dematAccount      || "\u2014") + "\n"
    + "Demat Account (Other):  " + (data.dematAccountOther || "\u2014") + "\n"
    + "City:                   " + (data.city              || "") + "\n"
    + "Experience Level:       " + fmtExp(data.experience)        + "\n"
    + "Best Time to Contact:   " + fmtTime(data.contactTime)      + "\n"
    + "What They Want:\n"        + (data.intent            || "\u2014") + "\n"
    + "Consent Given:          " + (data.consent ? "Yes" : "No") + "\n"
    + "Timestamp:              " + timestamp + "\n";
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function eRow(label, value) {
  return "<tr>"
    + "<td style='padding:10px 12px;font-weight:600;color:#374151;white-space:nowrap;vertical-align:top;width:40%;background:#fff;border-bottom:1px solid #e2e8f0;'>" + label + "</td>"
    + "<td style='padding:10px 12px;color:#1e293b;border-bottom:1px solid #e2e8f0;background:#fff;'>" + (value || "\u2014") + "</td>"
    + "</tr>";
}

function fmtExp(val) {
  var m = { beginner: "Complete Beginner", demat: "Have a Demat Account", tried: "Tried Trading", learning: "Learning Actively" };
  return m[val] || val || "\u2014";
}

function fmtTime(val) {
  var m = { morning: "Morning (10AM \u2013 12PM)", afternoon: "Afternoon (1PM \u2013 4PM)", evening: "Evening (5PM \u2013 7PM)" };
  return m[val] || val || "\u2014";
}
