import {
  pgTable, varchar, text, integer, boolean, timestamp,
  jsonb, decimal, uuid, index, uniqueIndex, pgEnum, foreignKey
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const userRoleEnum = pgEnum('user_role', ['chef', 'staff']);
export const orderStatusEnum = pgEnum('order_status', ['pending_payment', 'paid', 'preparing', 'ready', 'picked_up', 'cancelled']);
export const sessionStatusEnum = pgEnum('session_status', ['active', 'completed', 'expired', 'cancelled']);

export const pizzerias = pgTable('pizzerias', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 50 }).notNull().unique(),
  whatsappNumber: varchar('whatsapp_number', { length: 20 }).notNull(),
  stripeAccountId: varchar('stripe_account_id', { length: 255 }),
  address: text('address'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({ slugIdx: uniqueIndex('pizzeria_slug_idx').on(table.slug) }));

export const pizzeriaConfigs = pgTable('pizzeria_configs', {
  id: uuid('id').defaultRandom().primaryKey(),
  pizzeriaId: uuid('pizzeria_id').references(() => pizzerias.id, { onDelete: 'cascade' }).notNull().unique(),
  pizzasPerHour: integer('pizzas_per_hour').default(12).notNull(),
  averagePizzaTime: integer('average_pizza_time').default(5).notNull(),
  maxConcurrentPizzas: integer('max_concurrent_pizzas').default(4).notNull(),
  openingHours: jsonb('opening_hours').default('{}').notNull(),
  welcomeMessage: text('welcome_message').default('🍕 Bienvenue ! Envoyez-moi votre commande.').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const staffAccounts = pgTable('staff_accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  pizzeriaId: uuid('pizzeria_id').references(() => pizzerias.id, { onDelete: 'cascade' }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  role: userRoleEnum('role').default('staff').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  emailIdx: uniqueIndex('staff_email_idx').on(table.email),
  pizzeriaIdx: index('staff_pizzeria_idx').on(table.pizzeriaId),
}));

export const pizzaCategories = pgTable('pizza_categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  pizzeriaId: uuid('pizzeria_id').references(() => pizzerias.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  sortOrder: integer('sort_order').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
}, (table) => ({ pizzeriaIdx: index('category_pizzeria_idx').on(table.pizzeriaId) }));

export const pizzas = pgTable('pizzas', {
  id: uuid('id').defaultRandom().primaryKey(),
  pizzeriaId: uuid('pizzeria_id').references(() => pizzerias.id, { onDelete: 'cascade' }).notNull(),
  categoryId: uuid('category_id').references(() => pizzaCategories.id, { onDelete: 'set null' }),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  ingredients: text('ingredients'),
  basePrice: decimal('base_price', { precision: 10, scale: 2 }).notNull(),
  imageUrl: text('image_url'),
  isAvailable: boolean('is_available').default(true).notNull(),
  isHidden: boolean('is_hidden').default(false).notNull(),
  aiKeywords: jsonb('ai_keywords').default('[]').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  pizzeriaIdx: index('pizza_pizzeria_idx').on(table.pizzeriaId),
  availableIdx: index('pizza_available_idx').on(table.pizzeriaId, table.isAvailable),
}));

export const supplements = pgTable('supplements', {
  id: uuid('id').defaultRandom().primaryKey(),
  pizzeriaId: uuid('pizzeria_id').references(() => pizzerias.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  aiKeywords: jsonb('ai_keywords').default('[]').notNull(),
  isAvailable: boolean('is_available').default(true).notNull(),
  isHidden: boolean('is_hidden').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({ pizzeriaIdx: index('supplement_pizzeria_idx').on(table.pizzeriaId) }));

export const desserts = pgTable('desserts', {
  id: uuid('id').defaultRandom().primaryKey(),
  pizzeriaId: uuid('pizzeria_id').references(() => pizzerias.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  category: varchar('category', { length: 50 }).default('dessert').notNull(),
  imageUrl: text('image_url'),
  aiKeywords: jsonb('ai_keywords').default('[]').notNull(),
  isAvailable: boolean('is_available').default(true).notNull(),
  isHidden: boolean('is_hidden').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({ pizzeriaIdx: index('dessert_pizzeria_idx').on(table.pizzeriaId) }));

export const whatsappSessions = pgTable('whatsapp_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  pizzeriaId: uuid('pizzeria_id').references(() => pizzerias.id, { onDelete: 'cascade' }).notNull(),
  customerPhone: varchar('customer_phone', { length: 20 }).notNull(),
  customerName: varchar('customer_name', { length: 100 }),
  status: sessionStatusEnum('status').default('active').notNull(),
  currentStep: varchar('current_step', { length: 50 }).default('intake').notNull(),
  cartItems: jsonb('cart_items').default('[]').notNull(),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).default('0'),
  requestedTime: timestamp('requested_time'),
  estimatedReadyTime: timestamp('estimated_ready_time'),
  timeConfirmed: boolean('time_confirmed').default(false),
  stripePaymentIntentId: varchar('stripe_payment_intent_id', { length: 255 }),
  stripeCheckoutUrl: text('stripe_checkout_url'),
  paymentExpiresAt: timestamp('payment_expires_at'),
  orderId: uuid('order_id'),
  conversationHistory: jsonb('conversation_history').default('[]').notNull(),
  lastActivityAt: timestamp('last_activity_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at'),
}, (table) => ({
  phoneIdx: index('session_phone_idx').on(table.customerPhone),
  pizzeriaIdx: index('session_pizzeria_idx').on(table.pizzeriaId),
  statusIdx: index('session_status_idx').on(table.status),
  uniqueActive: uniqueIndex('session_active_unique').on(table.pizzeriaId, table.customerPhone, table.status),
}));

export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  pizzeriaId: uuid('pizzeria_id').references(() => pizzerias.id, { onDelete: 'cascade' }).notNull(),
  displayNumber: integer('display_number').notNull(),
  weekYear: varchar('week_year', { length: 10 }).notNull(),
  customerPhone: varchar('customer_phone', { length: 20 }).notNull(),
  customerName: varchar('customer_name', { length: 100 }),
  items: jsonb('items').notNull(),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  requestedTime: timestamp('requested_time'),
  estimatedReadyTime: timestamp('estimated_ready_time'),
  actualReadyTime: timestamp('actual_ready_time'),
  status: orderStatusEnum('status').default('paid').notNull(),
  paidAt: timestamp('paid_at'),
  preparingAt: timestamp('preparing_at'),
  readyAt: timestamp('ready_at'),
  pickedUpAt: timestamp('picked_up_at'),
  archivedAt: timestamp('archived_at'),
  stripePaymentIntentId: varchar('stripe_payment_intent_id', { length: 255 }),
  totalPizzas: integer('total_pizzas').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  pizzeriaIdx: index('order_pizzeria_idx').on(table.pizzeriaId),
  statusIdx: index('order_status_idx').on(table.status),
  weekIdx: index('order_week_idx').on(table.weekYear),
  displayNumIdx: index('order_display_num_idx').on(table.pizzeriaId, table.weekYear),
  createdIdx: index('order_created_idx').on(table.createdAt),
}));

export const orderLogs = pgTable('order_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  pizzeriaId: uuid('pizzeria_id').references(() => pizzerias.id, { onDelete: 'cascade' }).notNull(),
  orderId: uuid('order_id').notNull(),
  orderData: jsonb('order_data').notNull(),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  preparationMinutes: integer('preparation_minutes'),
  delayMinutes: integer('delay_minutes'),
  archivedAt: timestamp('archived_at').defaultNow().notNull(),
}, (table) => ({
  pizzeriaIdx: index('log_pizzeria_idx').on(table.pizzeriaId),
  dateIdx: index('log_date_idx').on(table.archivedAt),
}));

export const pizzeriaSubscriptions = pgTable('pizzeria_subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  pizzeriaId: uuid('pizzeria_id').references(() => pizzerias.id).notNull(),
  status: varchar('status', { length: 20 }).default('trial').notNull(),
  plan: varchar('plan', { length: 20 }).default('standard').notNull(),
  priceMonthly: decimal('price_monthly', { precision: 10, scale: 2 }).notNull(),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  nextBillingAt: timestamp('next_billing_at'),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }),
  notes: text('notes'),
});

export const promotions = pgTable('promotions', {
  id: uuid('id').defaultRandom().primaryKey(),
  pizzeriaId: uuid('pizzeria_id').references(() => pizzerias.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  reductionType: varchar('reduction_type', { length: 20 }).notNull().default('percent'),
  reductionValue: decimal('reduction_value', { precision: 10, scale: 2 }).notNull(),
  applicationType: varchar('application_type', { length: 20 }).notNull().default('category'),
  categoryId: uuid('category_id').references(() => pizzaCategories.id, { onDelete: 'cascade' }),
  pizzaIds: jsonb('pizza_ids').default('[]').notNull(),
  recurringDays: jsonb('recurring_days').default('[]').notNull(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({ pizzeriaIdx: index('promo_pizzeria_idx').on(table.pizzeriaId) }));

export const qrCodes = pgTable('qr_codes', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull(),
  pizzeriaId: uuid('pizzeria_id').references(() => pizzerias.id, { onDelete: 'cascade' }).notNull(),
  qrContent: text('qr_content').notNull(),
  scannedAt: timestamp('scanned_at'),
  scannedBy: varchar('scanned_by', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({ pizzeriaIdx: index('qr_pizzeria_idx').on(table.pizzeriaId) }));

// Relations
export const pizzeriaRelations = relations(pizzerias, ({ one, many }) => ({
  config: one(pizzeriaConfigs, { fields: [pizzerias.id], references: [pizzeriaConfigs.pizzeriaId] }),
  staff: many(staffAccounts),
  pizzas: many(pizzas),
  supplements: many(supplements),
  desserts: many(desserts),
  categories: many(pizzaCategories),
  sessions: many(whatsappSessions),
  orders: many(orders),
  logs: many(orderLogs),
  promotions: many(promotions),
}));

export const pizzaCategoryRelations = relations(pizzaCategories, ({ one, many }) => ({
  pizzeria: one(pizzerias, { fields: [pizzaCategories.pizzeriaId], references: [pizzerias.id] }),
  pizzas: many(pizzas),
  promotions: many(promotions),
}));

export const pizzaRelations = relations(pizzas, ({ one }) => ({
  pizzeria: one(pizzerias, { fields: [pizzas.pizzeriaId], references: [pizzerias.id] }),
  category: one(pizzaCategories, { fields: [pizzas.categoryId], references: [pizzaCategories.id] }),
}));

export const supplementRelations = relations(supplements, ({ one }) => ({
  pizzeria: one(pizzerias, { fields: [supplements.pizzeriaId], references: [pizzerias.id] }),
}));

export const dessertRelations = relations(desserts, ({ one }) => ({
  pizzeria: one(pizzerias, { fields: [desserts.pizzeriaId], references: [pizzerias.id] }),
}));

export const staffRelations = relations(staffAccounts, ({ one }) => ({
  pizzeria: one(pizzerias, { fields: [staffAccounts.pizzeriaId], references: [pizzerias.id] }),
}));

export const promotionRelations = relations(promotions, ({ one }) => ({
  pizzeria: one(pizzerias, { fields: [promotions.pizzeriaId], references: [pizzerias.id] }),
  category: one(pizzaCategories, { fields: [promotions.categoryId], references: [pizzaCategories.id] }),
}));

export const qrCodeRelations = relations(qrCodes, ({ one }) => ({
  pizzeria: one(pizzerias, { fields: [qrCodes.pizzeriaId], references: [pizzerias.id] }),
}));

// Types
export type Pizzeria = typeof pizzerias.$inferSelect;
export type StaffAccount = typeof staffAccounts.$inferSelect;
export type Pizza = typeof pizzas.$inferSelect;
export type Supplement = typeof supplements.$inferSelect;
export type Dessert = typeof desserts.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type WhatsappSession = typeof whatsappSessions.$inferSelect;
export type OrderLog = typeof orderLogs.$inferSelect;
export type PizzeriaSubscription = typeof pizzeriaSubscriptions.$inferSelect;
export type Promotion = typeof promotions.$inferSelect;
export type QrCode = typeof qrCodes.$inferSelect;