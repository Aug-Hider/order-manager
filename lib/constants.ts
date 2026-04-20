export const APP_NAME = 'PizzaOS';
export const APP_VERSION = '1.0.0';

export const DEFAULT_PIZZA_CONFIG = { pizzasPerHour: 12, averagePizzaTime: 5, maxConcurrentPizzas: 4 };

export const ORDER_STATUS_LABELS = {
  pending_payment: 'En attente de paiement', paid: 'Payée',
  preparing: 'En préparation', ready: 'Prête', picked_up: 'Retirée', cancelled: 'Annulée',
};

export const ORDER_STATUS_COLORS = {
  pending_payment: 'bg-yellow-100 text-yellow-800', paid: 'bg-blue-100 text-blue-800',
  preparing: 'bg-orange-100 text-orange-800', ready: 'bg-green-100 text-green-800',
  picked_up: 'bg-gray-100 text-gray-800', cancelled: 'bg-red-100 text-red-800',
};

export const KANBAN_COLUMNS = {
  paid: { title: '🔥 Nouvelles', color: 'bg-orange-50 border-orange-200' },
  preparing: { title: '👨‍🍳 En cours', color: 'bg-blue-50 border-blue-200' },
  ready: { title: '✅ Prêtes', color: 'bg-green-50 border-green-200' },
  picked_up: { title: '📦 Parties', color: 'bg-gray-50 border-gray-200' },
};

export const WHATSAPP_EXPIRY_MINUTES = 30;
export const PAYMENT_EXPIRY_MINUTES = 15;
export const ARCHIVE_AFTER_MINUTES = 30;
