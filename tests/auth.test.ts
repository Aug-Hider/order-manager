import { describe, it, expect, vi } from 'vitest';
import { authOptions } from '@/lib/auth';

vi.mock('@/db', () => ({
  db: { query: { staffAccounts: { findFirst: vi.fn() } }, update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn() }) }) },
}));

describe('Authentication', () => {
  it('should reject empty credentials', async () => {
    const authorize = (authOptions.providers[0] as any).authorize;
    const result = await authorize({ email: '', password: '' });
    expect(result).toBeNull();
  });
});
