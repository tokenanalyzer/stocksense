/**
 * StockSense Lead Capture + Admin API — Google Apps Script
 * ─────────────────────────────────────────────────────────
 * SETUP (one time):
 *
 * 1. Open your Google Sheet → Extensions → Apps Script
 * 2. Paste this entire file, replacing any existing code
 * 3. Fill in the CONFIG section below (email + admin password)
 * 4. Click Save → Deploy → New deployment
 *      Type: Web app | Execute as: Me | Who has access: Anyone
 * 5. Copy the Web App URL
 * 6. In Replit Secrets, set:
 *      VITE_APPS_SCRIPT_URL = <Web App URL>
 *      VITE_ADMIN_PASSWORD  = <same as ADMIN_PASSWORD below>
 * 7. Re-run the Replit workflow
 *
 * COLUMN LAYOUT (sheet auto-created):
 *   A: Timestamp  B: Full Name  C: Mobile  D: Starting Capital
 *   E: Demat Account  F: City  G: Experience  H: Best Time
 *   I: Intent  J: Consent  K: Status
 */

// ── CONFIG ────────────────────────────────────────────────────────────────────
var NOTIFY_EMAIL   = "stocksense00@gmail.com"; // ← your Gmail
var ADMIN_PASSWORD = "CHANGE_ME_NOW";         // ← must match VITE_ADMIN_PASSWORD
var SHEET_NAME     = "StockSense Leads";
var BRAND_NAME     = "StockSense";
// ─────────────────────────────────────────────────────────────────────────────

var COL = {
  TIMESTAMP:       1,
  FULL_NAME:       2,
  MOBILE:          3,
  STARTING_CAPITAL:4,
  DEMAT_ACCOUNT:   5,
  CITY:            6,
  EXPERIENCE:      7,
  CONTACT_TIME:    8,
  INTENT:          9,
  CONSENT:         10,
  STATUS:          11
};
var TOTAL_COLS = 11;

// ── GET — admin reads (getLeads) + health check ───────────────────────────────
function doGet(e) {
  var action = e && e.parameter && e.parameter.action;
  var token  = e && e.parameter && e.parameter.token;

  if (action === "getLeads") {
    if (token !== ADMIN_PASSWORD) {
      return jsonOut({ success: false, error: "Unauthorized" });
    }
    return jsonOut({ success: true, leads: readLeads() });
  }

  // Health check
  return jsonOut({ status: "StockSense endpoint active", ts: new Date().toISOString() });
}

// ── POST — lead submission or admin status update ─────────────────────────────
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    // Admin: update status
    if (data.action === "updateStatus") {
      if (data.token !== ADMIN_PASSWORD) {
        return jsonOut({ success: false, error: "Unauthorized" });
      }
      var ss    = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName(SHEET_NAME);
      if (!sheet) return jsonOut({ success: false, error: "Sheet not found" });
      sheet.getRange(data.rowIndex, COL.STATUS).setValue(data.status);
      return jsonOut({ success: true });
    }

    // Regular lead submission
    return handleLeadSubmission(data);

  } catch (err) {
    Logger.log("doPost error: " + err.toString());
    return jsonOut({ success: false, error: err.toString() });
  }
}

// ── Lead submission logic ─────────────────────────────────────────────────────
function handleLeadSubmission(data) {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    var headers = ["Timestamp","Full Name","Mobile Number",
                   "Starting Capital (₹)","Demat Account",
                   "City","Experience Level","Best Time to Contact",
                   "What They Want to Understand","Consent Given","Status"];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, TOTAL_COLS).setFontWeight("bold");
    sheet.setFrozenRows(1);
  } else {
    // Ensure all columns exist for sheets created before this version
    var lastCol = sheet.getLastColumn();
    if (lastCol < TOTAL_COLS) {
      var existingHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
      var allHeaders = ["Timestamp","Full Name","Mobile Number",
                        "Starting Capital (₹)","Demat Account",
                        "City","Experience Level","Best Time to Contact",
                        "What They Want to Understand","Consent Given","Status"];
      for (var h = lastCol; h < TOTAL_COLS; h++) {
        sheet.getRange(1, h + 1).setValue(allHeaders[h]);
        sheet.getRange(1, h + 1).setFontWeight("bold");
      }
    }
  }

  var timestamp = Utilities.formatDate(
    new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss"
  );

  sheet.appendRow([
    timestamp,
    data.fullName        || "",
    data.mobile          || "",
    data.startingCapital || "",
    formatDemat(data.dematAccount),
    data.city            || "",
    data.experience      || "",
    data.contactTime     || "",
    data.intent          || "",
    data.consent ? "Yes" : "No",
    "New"
  ]);

  // Email notification
  try {
    var subject  = BRAND_NAME + " — New Lead: " + (data.fullName || "Unknown");
    var htmlBody = buildEmailHtml(data, timestamp);
    var plainBody = buildEmailPlain(data, timestamp);
    GmailApp.sendEmail(NOTIFY_EMAIL, subject, plainBody, {
      htmlBody: htmlBody,
      name: BRAND_NAME + " Leads"
    });
  } catch (mailErr) {
    Logger.log("Email error (lead still saved): " + mailErr.toString());
  }

  return jsonOut({ success: true });
}

// ── Read all leads from sheet ─────────────────────────────────────────────────
function readLeads() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) return [];

  var data  = sheet.getRange(2, 1, sheet.getLastRow() - 1, TOTAL_COLS).getValues();
  var leads = [];

  for (var i = 0; i < data.length; i++) {
    var r = data[i];
    if (!r[0] && !r[1]) continue;
    leads.push({
      rowIndex:        i + 2,
      timestamp:       r[COL.TIMESTAMP        - 1] ? r[COL.TIMESTAMP - 1].toString() : "",
      fullName:        r[COL.FULL_NAME        - 1] || "",
      mobile:          r[COL.MOBILE           - 1] || "",
      startingCapital: r[COL.STARTING_CAPITAL - 1] || "",
      dematAccount:    r[COL.DEMAT_ACCOUNT    - 1] || "",
      city:            r[COL.CITY             - 1] || "",
      experience:      r[COL.EXPERIENCE       - 1] || "",
      contactTime:     r[COL.CONTACT_TIME     - 1] || "",
      intent:          r[COL.INTENT           - 1] || "",
      consent:         r[COL.CONSENT          - 1] || "",
      status:          r[COL.STATUS           - 1] || "New"
    });
  }

  return leads;
}

// ── Email builders ────────────────────────────────────────────────────────────
function buildEmailHtml(data, timestamp) {
  return "<div style='font-family:Arial,sans-serif;max-width:600px;'>"
    + "<div style='background:#16a34a;padding:20px 28px;border-radius:8px 8px 0 0;'>"
    + "<h2 style='color:#fff;margin:0;font-size:20px;'>New Lead — " + BRAND_NAME + "</h2>"
    + "</div>"
    + "<div style='background:#f8fafc;padding:24px 28px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px;'>"
    + "<table style='width:100%;border-collapse:collapse;font-size:15px;'>"
    + emailRow("Full Name",                    data.fullName)
    + emailRow("Mobile Number",                data.mobile)
    + emailRow("Starting Capital (₹)",         data.startingCapital || "—")
    + emailRow("Demat Account",                formatDemat(data.dematAccount))
    + emailRow("City",                         data.city)
    + emailRow("Experience Level",             formatExperience(data.experience))
    + emailRow("Best Time to Contact",         formatTime(data.contactTime))
    + emailRow("What They Want to Understand", data.intent)
    + emailRow("Consent Given",                data.consent ? "Yes" : "No")
    + emailRow("Timestamp",                    timestamp)
    + "</table>"
    + "<div style='margin-top:24px;padding:14px 18px;background:#dcfce7;border-radius:6px;font-size:13px;color:#166534;'>"
    + "Reply to this email or call the number above to follow up."
    + "</div>"
    + "</div></div>";
}

function buildEmailPlain(data, timestamp) {
  return BRAND_NAME + " — New Lead\n\n"
    + "Full Name:             " + (data.fullName        || "") + "\n"
    + "Mobile Number:         " + (data.mobile          || "") + "\n"
    + "Starting Capital (₹):  " + (data.startingCapital || "—") + "\n"
    + "Demat Account:         " + formatDemat(data.dematAccount) + "\n"
    + "City:                  " + (data.city            || "") + "\n"
    + "Experience Level:      " + formatExperience(data.experience) + "\n"
    + "Best Time to Contact:  " + formatTime(data.contactTime) + "\n"
    + "What They Want:\n"       + (data.intent          || "") + "\n"
    + "Consent Given:         " + (data.consent ? "Yes" : "No") + "\n"
    + "Timestamp:             " + timestamp + "\n";
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function emailRow(label, value) {
  return "<tr>"
    + "<td style='padding:10px 12px;font-weight:600;color:#374151;white-space:nowrap;vertical-align:top;width:40%;background:#fff;border-bottom:1px solid #e2e8f0;'>" + label + "</td>"
    + "<td style='padding:10px 12px;color:#1e293b;border-bottom:1px solid #e2e8f0;background:#fff;'>" + (value || "—") + "</td>"
    + "</tr>";
}

function formatExperience(val) {
  var map = { beginner:"Complete Beginner", demat:"Have a Demat Account", tried:"Tried Trading", learning:"Learning Actively" };
  return map[val] || val || "—";
}

function formatTime(val) {
  var map = { morning:"Morning (10AM – 12PM)", afternoon:"Afternoon (1PM – 4PM)", evening:"Evening (5PM – 7PM)" };
  return map[val] || val || "—";
}

function formatDemat(val) {
  var map = { yes:"Yes, I have one", no:"No, not yet", opening:"Currently opening one" };
  return map[val] || val || "—";
}
