// Mock Prisma client — used by all tests via vi.mock('@/lib/db')
import { vi } from "vitest";

export const db = {
  otpCode: {
    updateMany: vi.fn(),
    create:     vi.fn(),
    findFirst:  vi.fn(),
    update:     vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
    findFirst:  vi.fn(),
    upsert:     vi.fn(),
    update:     vi.fn(),
  },
  session: {
    create:     vi.fn(),
    findUnique: vi.fn(),
    deleteMany: vi.fn(),
    delete:     vi.fn(),
  },
  cardScan: {
    create: vi.fn(),
    count:  vi.fn(),
  },
  connectionRequest: {
    create:     vi.fn(),
    findUnique: vi.fn(),
    findFirst:  vi.fn(),
    findMany:   vi.fn(),
    update:     vi.fn(),
    updateMany: vi.fn(),
    count:      vi.fn(),
  },
  message: {
    create:     vi.fn(),
    findMany:   vi.fn(),
    updateMany: vi.fn(),
    count:      vi.fn(),
  },
  block: {
    create:     vi.fn(),
    delete:     vi.fn(),
    findFirst:  vi.fn(),
    findMany:   vi.fn(),
  },
  report: {
    create: vi.fn(),
  },
  contactAttempt: {
    create:     vi.fn(),
    count:      vi.fn(),
    deleteMany: vi.fn(),
  },
  waliNote: {
    create:   vi.fn(),
    findMany: vi.fn(),
  },
  smsAlert: {
    create: vi.fn(),
    count:  vi.fn(),
  },
};
