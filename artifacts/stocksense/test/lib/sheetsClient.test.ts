import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

vi.mock("../../api/_lib/googleAuth", () => ({
  getGoogleJwtClient: vi.fn().mockResolvedValue({}),
}));

const { batchGetMock } = vi.hoisted(() => ({ batchGetMock: vi.fn() }));
vi.mock("googleapis", () => ({
  google: {
    sheets: vi.fn(() => ({ spreadsheets: { values: { batchGet: batchGetMock } } })),
  },
}));

import { getSheetsMetrics } from "../../api/_lib/sheetsClient";

const originalEnv = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

describe("sheetsClient — PII protection", () => {
  beforeEach(() => {
    process.env.GOOGLE_SHEETS_SPREADSHEET_ID = "fake-sheet-id";
    batchGetMock.mockReset();
  });

  afterEach(() => {
    process.env.GOOGLE_SHEETS_SPREADSHEET_ID = originalEnv;
    vi.restoreAllMocks();
  });

  it("only ever requests columns A and M — never B (name) or C (phone)", async () => {
    batchGetMock.mockResolvedValue({ data: { valueRanges: [{ values: [] }, { values: [] }] } });

    await getSheetsMetrics({ start: "2026-08-01", end: "2026-08-03" }, { start: "2026-08-04", end: "2026-08-06" });

    expect(batchGetMock).toHaveBeenCalledTimes(1);
    const [args] = batchGetMock.mock.calls[0];
    const ranges: string[] = args.ranges;

    expect(ranges).toHaveLength(2);
    for (const range of ranges) {
      expect(range.startsWith("A") || range.startsWith("M")).toBe(true);
      expect(range.startsWith("B")).toBe(false);
      expect(range.startsWith("C")).toBe(false);
    }
  });

  it("never returns name/phone fields in its output shape", async () => {
    batchGetMock.mockResolvedValue({
      data: {
        valueRanges: [{ values: [["04/08/2026 10:00"]] }, { values: [["New"]]}],
      },
    });

    const { current } = await getSheetsMetrics({ start: "2026-08-01", end: "2026-08-03" }, { start: "2026-08-04", end: "2026-08-06" });

    const keys = Object.keys(current);
    expect(keys).toEqual(["leadCount", "leadsByDate", "statusCounts"]);
    expect(JSON.stringify(current)).not.toMatch(/name|phone|email/i);
  });

  it("counts leads correctly and buckets them by period from column A timestamps", async () => {
    batchGetMock.mockResolvedValue({
      data: {
        valueRanges: [
          { values: [["05/08/2026 10:00"], ["02/08/2026 09:00"], ["06/08/2026 14:30"]] },
          { values: [["New"], ["Converted"], ["New"]] },
        ],
      },
    });

    const { current, previous } = await getSheetsMetrics(
      { start: "2026-08-01", end: "2026-08-03" },
      { start: "2026-08-04", end: "2026-08-06" },
    );

    expect(current.leadCount).toBe(2); // 05/08 and 06/08
    expect(previous.leadCount).toBe(1); // 02/08
    expect(current.statusCounts.New).toBe(2);
    expect(previous.statusCounts.Converted).toBe(1);
  });

  it("ignores rows with unparseable or missing timestamps rather than crashing", async () => {
    batchGetMock.mockResolvedValue({
      data: {
        valueRanges: [{ values: [["not a date"], [""], []] }, { values: [["New"], ["New"], ["New"]] }],
      },
    });

    const { current, previous } = await getSheetsMetrics({ start: "2026-08-01", end: "2026-08-03" }, { start: "2026-08-04", end: "2026-08-06" });
    expect(current.leadCount).toBe(0);
    expect(previous.leadCount).toBe(0);
  });

  it("handles an entirely empty sheet gracefully", async () => {
    batchGetMock.mockResolvedValue({ data: { valueRanges: [{ values: [] }, { values: [] }] } });
    const { current, previous } = await getSheetsMetrics({ start: "2026-08-01", end: "2026-08-03" }, { start: "2026-08-04", end: "2026-08-06" });
    expect(current).toEqual({ leadCount: 0, leadsByDate: [], statusCounts: {} });
    expect(previous).toEqual({ leadCount: 0, leadsByDate: [], statusCounts: {} });
  });

  it("throws when the spreadsheet ID env var is missing", async () => {
    delete process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    await expect(
      getSheetsMetrics({ start: "2026-08-01", end: "2026-08-03" }, { start: "2026-08-04", end: "2026-08-06" }),
    ).rejects.toThrow(/not configured/);
  });
});
