import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => import("../__mocks__/db"));

import { db } from "@/lib/db";
import { createReport } from "@/lib/safety/report";

const mdb = db as any;

describe("createReport", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a report with all fields", async () => {
    mdb.report.create.mockResolvedValue({ id: "r1" });

    const result = await createReport({
      reporterId: "u1",
      connectionRequestId: "cr1",
      contact: "bad@test.com",
      category: "HARASSMENT",
      details: "Sent threatening messages",
    });

    expect(mdb.report.create).toHaveBeenCalledWith({
      data: {
        reporterId: "u1",
        connectionRequestId: "cr1",
        contact: "bad@test.com",
        category: "HARASSMENT",
        details: "Sent threatening messages",
      },
    });
    expect(result.id).toBe("r1");
  });

  it("creates a report with minimal fields", async () => {
    mdb.report.create.mockResolvedValue({ id: "r2" });

    await createReport({ reporterId: "u1", category: "SPAM" });

    expect(mdb.report.create).toHaveBeenCalledWith({
      data: { reporterId: "u1", category: "SPAM" },
    });
  });

  it("handles all report categories", async () => {
    for (const category of ["SPAM", "HARASSMENT", "INAPPROPRIATE", "OTHER"] as const) {
      mdb.report.create.mockResolvedValue({ id: `r-${category}` });
      const result = await createReport({ reporterId: "u1", category });
      expect(result.id).toBe(`r-${category}`);
    }
  });
});
