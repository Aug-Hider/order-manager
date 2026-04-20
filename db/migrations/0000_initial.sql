-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Numérotation commandes par semaine
CREATE OR REPLACE FUNCTION generate_display_number(p_pizzeria_id UUID, p_week_year TEXT)
RETURNS INTEGER AS $$
DECLARE next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(display_number), 0) + 1 INTO next_num
  FROM orders WHERE pizzeria_id = p_pizzeria_id AND week_year = p_week_year;
  RETURN next_num;
END;
$$ LANGUAGE plpgsql;

-- Semaine-année
CREATE OR REPLACE FUNCTION get_week_year()
RETURNS TEXT AS $$
BEGIN RETURN to_char(CURRENT_DATE, 'IYYY-IW'); END;
$$ LANGUAGE plpgsql;

-- Archivage automatique 30 min après retrait
CREATE OR REPLACE FUNCTION auto_archive_orders() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO order_logs (pizzeria_id, order_id, order_data, total_amount, preparation_minutes, delay_minutes)
  SELECT pizzeria_id, id,
    jsonb_build_object(
      'display_number', display_number, 'week_year', week_year, 'items', items,
      'customer', jsonb_build_object('name', customer_name, 'phone', customer_phone),
      'timestamps', jsonb_build_object('paid', paid_at, 'preparing', preparing_at,
        'ready', ready_at, 'picked_up', picked_up_at,
        'requested', requested_time, 'estimated', estimated_ready_time)
    ),
    total_amount,
    EXTRACT(EPOCH FROM (ready_at - preparing_at))/60,
    CASE WHEN ready_at > estimated_ready_time
      THEN EXTRACT(EPOCH FROM (ready_at - estimated_ready_time))/60 ELSE 0 END
  FROM orders
  WHERE status = 'picked_up' AND picked_up_at < NOW() - INTERVAL '30 minutes' AND archived_at IS NULL;

  UPDATE orders SET archived_at = NOW()
  WHERE status = 'picked_up' AND picked_up_at < NOW() - INTERVAL '30 minutes' AND archived_at IS NULL;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
