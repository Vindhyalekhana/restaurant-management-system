-- ============================================
-- PHASE 5.4 : INDEXES
-- Restaurant Table Reservation & Food Service
-- ============================================

USE restaurant_db;

-- --------------------------------------------
-- RESERVATION INDEXES
-- --------------------------------------------

-- Frequently used for table availability
-- and reservation-overlap checks.
CREATE INDEX idx_reservation_table_date
ON RESERVATION (table_id, reservation_date);

-- Useful for daily/upcoming reservation reports.
CREATE INDEX idx_reservation_date
ON RESERVATION (reservation_date);


-- --------------------------------------------
-- ORDER INDEXES
-- --------------------------------------------

-- Find orders associated with a table.
CREATE INDEX idx_order_table
ON RESTAURANT_ORDER (table_id);

-- Supports waiter performance reports.
CREATE INDEX idx_order_waiter
ON RESTAURANT_ORDER (waiter_id);

-- Find orders associated with reservations.
CREATE INDEX idx_order_reservation
ON RESTAURANT_ORDER (reservation_id);


-- --------------------------------------------
-- ORDER ITEM INDEXES
-- --------------------------------------------

-- Retrieve all items belonging to an order.
CREATE INDEX idx_order_item_order
ON ORDER_ITEM (order_id);

-- Supports item-sales and popularity reports.
CREATE INDEX idx_order_item_item
ON ORDER_ITEM (item_id);


-- --------------------------------------------
-- KITCHEN INDEX
-- --------------------------------------------

-- Supports kitchen queue/status queries.
CREATE INDEX idx_kitchen_ticket_status
ON KITCHEN_TICKET (status);


-- --------------------------------------------
-- BILL INDEXES
-- --------------------------------------------

-- Find unpaid/paid bills efficiently.
CREATE INDEX idx_bill_status
ON BILL (status);

-- Supports daily/monthly revenue reports.
CREATE INDEX idx_bill_generation_time
ON BILL (generation_time);


-- --------------------------------------------
-- PAYMENT INDEX
-- --------------------------------------------

-- Supports payment and revenue reports.
CREATE INDEX idx_payment_time
ON PAYMENT (payment_time);
