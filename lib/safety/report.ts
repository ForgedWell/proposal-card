import { db } from "@/lib/db";

export type ReportCategory = "SPAM" | "HARASSMENT" | "INAPPROPRIATE" | "OTHER";

export interface CreateReportInput {
  reporterId: string;
  connectionRequestId?: string;
  contact?: string;
  category: ReportCategory;
  details?: string;
}

export async function createReport(input: CreateReportInput) {
  return db.report.create({ data: input });
}
