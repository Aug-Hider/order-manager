import { z } from 'zod';

export function sanitizeWhatsAppInput(input: string): string {
  return input.replace(/[<>]/g, '').substring(0, 1000);
}

export const orderSchema = z.object({
  items: z.array(z.object({
    pizzaId: z.string().uuid(),
    quantity: z.number().int().min(1).max(20),
    supplements: z.array(z.string().uuid()).optional(),
  })).min(1).max(50),
  requestedTime: z.date().min(new Date()).max(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
});

export const pizzaSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  ingredients: z.string().max(500).optional(),
  basePrice: z.number().positive().max(1000),
  categoryId: z.string().uuid().optional(),
  aiKeywords: z.array(z.string().min(1).max(50)).max(20),
  isAvailable: z.boolean().default(true),
});

export const dessertSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  price: z.number().positive().max(1000),
  category: z.enum(['dessert', 'drink', 'entree']).default('dessert'),
  aiKeywords: z.array(z.string().min(1).max(50)).max(20),
  isAvailable: z.boolean().default(true),
});

export function checkAccess(role: string, route: string): boolean {
  const chefOnly = ['/admin/benefices', '/admin/settings', '/api/admin/config', '/api/admin/benefices'];
  return role === 'chef' || !chefOnly.some(r => route.startsWith(r));
}
