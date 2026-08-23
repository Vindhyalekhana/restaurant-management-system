USE restaurant_db;

-- Business Rule 01: Table Capacity (cannot be negative or zero)
ALTER TABLE RESTAURANT_TABLE
ADD CONSTRAINT chk_table_capacity CHECK (capacity > 0);

-- Reservation rules
ALTER TABLE RESERVATION
ADD CONSTRAINT chk_guest_count CHECK (guest_count > 0),
ADD CONSTRAINT chk_time_range CHECK (start_time < end_time);

-- Business Rule 03: Positive Order Quantity
ALTER TABLE ORDER_ITEM
ADD CONSTRAINT chk_order_quantity CHECK (quantity > 0);

-- Business Rule 04: Menu Price
ALTER TABLE MENU_ITEM
ADD CONSTRAINT chk_menu_price CHECK (price >= 0);

-- Order Item Unit Price validation (price paid cannot be negative)
ALTER TABLE ORDER_ITEM
ADD CONSTRAINT chk_unit_price CHECK (unit_price >= 0);

-- Discount bounds (must be between 0% and 100%)
ALTER TABLE DISCOUNT
ADD CONSTRAINT chk_discount_percentage CHECK (percentage >= 0 AND percentage <= 100);

-- Bill amounts validation (financial integrity)
ALTER TABLE BILL
ADD CONSTRAINT chk_bill_amounts CHECK (
    subtotal >= 0 AND 
    discount_amount >= 0 AND 
    tax_amount >= 0 AND 
    total_amount >= 0
),
ADD CONSTRAINT chk_discount_subtotal CHECK (discount_amount <= subtotal);

-- Payment amount validation
ALTER TABLE PAYMENT
ADD CONSTRAINT chk_payment_amount CHECK (amount_paid > 0);

