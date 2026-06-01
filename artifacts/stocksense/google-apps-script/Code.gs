/**
 * StockSense Lead Capture — Google Apps Script
 * ─────────────────────────────────────────────
 * SETUP STEPS (read carefully):
 *
 * 1. Open your Google Sheet → Extensions → Apps Script
 * 2. Delete any existing code and paste this entire file
 * 3. Replace NOTIFY_EMAIL below with your Gmail address
 * 4. Click "Save" (floppy disk icon)
 * 5. Click "Deploy" → "New deployment"
 *    - Type: Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 6. Click "Deploy" → copy the Web App URL
 * 7. In Replit, set environment variable:
 *    VITE_APPS_SCRIPT_URL = <paste the URL here>
 * 8. Re-run the Replit workflow to pick up the new env var
 *
 * TRIGGER SETUP (for email):
 * The email is sent directly inside doPost() — no extra trigger needed.
 * Every POST → sheet row added + email sent simultaneously.
 */

// ── CONFIG — replace these ────────────────────────────────────────────────────
var NOTIFY_EMAIL = "YOUR_EMAIL@gmail.com";   // ← your Gmail address
var SHEET_NAME   = "Leads";                  // sheet tab name (auto-created)
var BRAND_NAME   = "StockSense";
// ─────────────────────────────────────────────────────────────────────────────

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    // ── 1. Save to Google Sheet ──────────────────────────────────────────────
    var ss    = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME);

    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      // Header row
      sheet.appendRow([
        "Timestamp", "Full Name", "Mobile Number", "City",
        "Experience Level", "Best Time to Contact",
        "What They Want to Understand", "Consent Given"
      ]);
      // Bold the header row
      sheet.getRange(1, 1, 1, 8).setFontWeight("bold");
      sheet.setFrozenRows(1);
    }

    var timestamp = Utilities.formatDate(
      new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss"
    );

    sheet.appendRow([
      timestamp,
      data.fullName    || "",
      data.mobile      || "",
      data.city        || "",
      data.experience  || "",
      data.contactTime || "",
      data.intent      || "",
      data.consent ? "Yes" : "No"
    ]);

    // ── 2. Send email notification ───────────────────────────────────────────
    var subject = BRAND_NAME + " — New Lead: " + (data.fullName || "Unknown");

    var htmlBody = "<div style='font-family:Arial,sans-serif;max-width:600px;'>"
      + "<div style='background:#16a34a;padding:20px 28px;border-radius:8px 8px 0 0;'>"
      + "<h2 style='color:#fff;margin:0;font-size:20px;'>New Lead — " + BRAND_NAME + "</h2>"
      + "</div>"
      + "<div style='background:#f8fafc;padding:24px 28px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px;'>"
      + "<table style='width:100%;border-collapse:collapse;font-size:15px;'>"
      + row("Full Name",                  data.fullName)
      + row("Mobile Number",              data.mobile)
      + row("City",                       data.city)
      + row("Experience Level",           formatExperience(data.experience))
      + row("Best Time to Contact",       formatTime(data.contactTime))
      + row("What They Want to Understand", data.intent)
      + row("Consent Given",              data.consent ? "Yes" : "No")
      + row("Timestamp",                  timestamp)
      + "</table>"
      + "<div style='margin-top:24px;padding:14px 18px;background:#dcfce7;border-radius:6px;font-size:13px;color:#166534;'>"
      + "Reply to this email or call the number above to follow up."
      + "</div>"
      + "</div>"
      + "</div>";

    var plainBody = BRAND_NAME + " — New Lead\n\n"
      + "Full Name:                 " + (data.fullName    || "") + "\n"
      + "Mobile Number:             " + (data.mobile      || "") + "\n"
      + "City:                      " + (data.city        || "") + "\n"
      + "Experience Level:          " + formatExperience(data.experience) + "\n"
      + "Best Time to Contact:      " + formatTime(data.contactTime) + "\n"
      + "What They Want to Understand:\n" + (data.intent  || "") + "\n"
      + "Consent Given:             " + (data.consent ? "Yes" : "No") + "\n"
      + "Timestamp:                 " + timestamp + "\n";

    GmailApp.sendEmail(NOTIFY_EMAIL, subject, plainBody, {
      htmlBody: htmlBody,
      name: BRAND_NAME + " Leads"
    });

    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    Logger.log("Error in doPost: " + err.toString());
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Health-check — hit the URL in a browser to confirm it's live
function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ status: "StockSense lead endpoint is active" }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function row(label, value) {
  return "<tr>"
    + "<td style='padding:10px 12px;font-weight:600;color:#374151;white-space:nowrap;vertical-align:top;width:40%;background:#fff;border-bottom:1px solid #e2e8f0;'>" + label + "</td>"
    + "<td style='padding:10px 12px;color:#1e293b;border-bottom:1px solid #e2e8f0;background:#fff;'>" + (value || "—") + "</td>"
    + "</tr>";
}

function formatExperience(val) {
  var map = {
    beginner: "Complete Beginner",
    demat:    "Have a Demat Account",
    tried:    "Tried Trading",
    learning: "Learning Actively"
  };
  return map[val] || val || "—";
}

function formatTime(val) {
  var map = {
    morning:   "Morning (10AM – 12PM)",
    afternoon: "Afternoon (1PM – 4PM)",
    evening:   "Evening (5PM – 7PM)"
  };
  return map[val] || val || "—";
}
