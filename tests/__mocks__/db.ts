// Mock Prisma client — used by all tests via vi.mock('@/lib/db')
import { vi } from "vitest";

export const db = {
  otpCode: {
    updateMany: vi.fn(),
    create: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
  },
  session: {
    create: vi.fn(),
    findUnique: vi.fn(),
    deleteMany: vi.fn(),
    delete: vi.fn(),
  },
};
