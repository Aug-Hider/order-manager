import { vi } from 'vitest';

process.env.NEXTAUTH_SECRET = 'test-secret';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.GROQ_API_KEY = 'test-key';

vi.mock('next-auth', () => ({ getServerSession: vi.fn(), default: vi.fn() }));
vi.mock('stripe', () => ({
  default: vi.fn(() => ({
    webhooks: { constructEvent: vi.fn() },
    checkout: { sessions: { create: vi.fn(), retrieve: vi.fn() } },
  })),
}));
