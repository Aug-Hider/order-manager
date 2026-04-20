import { describe, it, expect } from 'vitest';
import { sanitizeWhatsAppInput, checkAccess } from '@/lib/security';

describe('Security', () => {
  it('should strip HTML tags from input', () => {
    const dirty = '<script>alert("xss")</script>pizza';
    const clean = sanitizeWhatsAppInput(dirty);
    expect(clean).not.toContain('<');
    expect(clean).not.toContain('>');
  });

  it('should truncate long input', () => {
    const long = 'a'.repeat(2000);
    expect(sanitizeWhatsAppInput(long).length).toBe(1000);
  });

  it('should allow staff access to common routes', () => {
    expect(checkAccess('staff', '/admin/dashboard')).toBe(true);
  });

  it('should block staff from chef-only routes', () => {
    expect(checkAccess('staff', '/admin/benefices')).toBe(false);
  });

  it('should allow chef access to all routes', () => {
    expect(checkAccess('chef', '/admin/benefices')).toBe(true);
  });
});
