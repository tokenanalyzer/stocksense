import { google, type sheets_v4 } from "googleapis";
import { getGoogleJwtClient } from "./googleAuth.js";
import type { DateRange } from "./adsClient.js";

/**
 * Read-only Sheets client for "StockSense Leads". Only ever calls
 * `values.batchGet` (read) — no update/append/clear method exists here.
 *
 * Column layout confirmed by live inspection on 2026-08-10 (never inferred
 * from memory, per the requirement that motivated this check): column A is
 * the submission timestamp, column M is the lead status. Columns B and C
 * are the lead's name and phone number — this client must NEVER request
 * them. Row range is bounded (2..2000) rather than open-ended, to keep the
 * read small and predictable.
 *
 * Timestamps in column A are DD/MM/YYYY HH:MM (India-format, matching the
 * site's audience) — parsed explicitly rather than via Date's ambiguous
 * native parsing, which would misread day/month on many locales.
 */

const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly";
const ROW_RANGE = "2:2000";

export interface SheetsMetrics {
  leadCount: number;
  leadsByDate: { date: string; count: number }[]; // date: YYYY-MM-DD
  statusCounts: Record<string, number>;
}

function emptySheetsMetrics(): SheetsMetrics {
  return { leadCount: 0, leadsByDate: [], statusCounts: {} };
}

/** Parses "DD/MM/YYYY HH:MM..." into a "YYYY-MM-DD" string, or null if unparseable. */
function parseLeadDate(raw: string | undefined): string | null {
  if (!raw) return null;
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(raw.trim());
  if (!match) return null;
  const [, day, month, year] = match;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

export async function getSheetsMetrics(
  previousPeriod: DateRange,
  currentPeriod: DateRange,
): Promise<{ current: SheetsMetrics; previous: SheetsMetrics }> {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (!spreadsheetId) {
    throw new Error("Sheets is not configured (missing spreadsheet ID)");
  }

  const auth = await getGoogleJwtClient(SHEETS_SCOPE);
  const options: sheets_v4.Options = { version: "v4", auth };
  const sheets = google.sheets(options);

  const resp = await sheets.spreadsheets.values.batchGet({
    spreadsheetId,
    ranges: [`A${ROW_RANGE}`, `M${ROW_RANGE}`],
  });

  const timestampRows = resp.data.valueRanges?.[0]?.values ?? [];
  const statusRows = resp.data.valueRanges?.[1]?.values ?? [];

  const current = emptySheetsMetrics();
  const previous = emptySheetsMetrics();
  const currentByDate = new Map<string, number>();
  const previousByDate = new Map<string, number>();

  for (let i = 0; i < timestampRows.length; i++) {
    const date = parseLeadDate(timestampRows[i]?.[0]);
    if (!date) continue;

    const status = String(statusRows[i]?.[0] ?? "Unknown");

    if (date >= currentPeriod.start && date <= currentPeriod.end) {
      current.leadCount += 1;
      current.statusCounts[status] = (current.statusCounts[status] ?? 0) + 1;
      currentByDate.set(date, (currentByDate.get(date) ?? 0) + 1);
    } else if (date >= previousPeriod.start && date <= previousPeriod.end) {
      previous.leadCount += 1;
      previous.statusCounts[status] = (previous.statusCounts[status] ?? 0) + 1;
      previousByDate.set(date, (previousByDate.get(date) ?? 0) + 1);
    }
  }

  current.leadsByDate = [...currentByDate.entries()].map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date));
  previous.leadsByDate = [...previousByDate.entries()].map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date));

  return { current, previous };
}
