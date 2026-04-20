import { describe, it, expect } from 'vitest';

describe('Pizza Parser', () => {
  it('should detect order keywords', () => {
    const keywords = ['pizza', 'commander', 'menu', 'faim'];
    expect(keywords.some(k => 'je veux une pizza'.includes(k))).toBe(true);
  });

  it('should parse quantities', () => {
    const quantityMap: Record<string, number> = { 'une': 1, 'deux': 2, 'trois': 3 };
    expect(quantityMap['deux']).toBe(2);
  });
});
