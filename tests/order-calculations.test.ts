import { describe, it, expect } from 'vitest';

describe('Order Calculations', () => {
  it('should calculate preparation time correctly', () => {
    const totalPizzas = 4;
    const maxConcurrent = 4;
    const timePerBatch = 5;
    const batches = Math.ceil(totalPizzas / maxConcurrent);
    expect(batches * timePerBatch).toBe(5);
  });

  it('should handle multiple batches', () => {
    const totalPizzas = 6;
    const maxConcurrent = 4;
    const timePerBatch = 5;
    const batches = Math.ceil(totalPizzas / maxConcurrent);
    expect(batches * timePerBatch).toBe(10);
  });

  it('should calculate order total', () => {
    const items = [
      { basePrice: 8.5, quantity: 2, supplements: [{ price: 1 }] },
      { basePrice: 6.5, quantity: 1, supplements: [] },
    ];
    const total = items.reduce((sum, item) => {
      const suppTotal = item.supplements.reduce((s, sup) => s + sup.price, 0);
      return sum + (item.basePrice + suppTotal) * item.quantity;
    }, 0);
    expect(total).toBe(25.5);
  });
});
