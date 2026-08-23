-- ============================================
-- PHASE 5.7 : VALIDATION QUERIES
-- Restaurant Table Reservation & Food Service
-- ============================================

USE restaurant_db;

-- --------------------------------------------
-- A. Basic SELECT Verification
-- --------------------------------------------
SELECT 'Starting Validation Suite' AS status;

-- --------------------------------------------
-- C. Expected Failure Tests
-- --------------------------------------------

-- 1. Test: Table Capacity Violation
-- EXPECTED RESULT: ERROR (SQLSTATE 45000): Guest count exceeds table capacity
-- Table T03 (id 3) has capacity 4. We try booking 5 guests.
CALL sp_create_reservation(1, 3, '2026-08-25', '19:00:00', '20:00:00', 5, 'Capacity test');

-- 2. Test: Reservation Overlap
-- EXPECTED RESULT: ERROR (SQLSTATE 45000): Reservation overlaps with an existing reservation
-- Existing reservation: R001 (table_id=4, date=2026-08-20, 18:00 to 19:30). Overlap with 19:00 to 20:00.
CALL sp_create_reservation(1, 4, '2026-08-20', '19:00:00', '20:00:00', 2, 'Overlap test');

-- 5. Test: Invalid Reservation Time
-- EXPECTED RESULT: ERROR (CHECK constraint or trigger)
-- Time 20:00 to 19:00 is invalid.
-- Note: Check constraint `chk_time_range` checks (start_time < end_time).
CALL sp_create_reservation(1, 3, '2026-08-25', '20:00:00', '19:00:00', 2, 'Invalid time test');

-- 6. Test: Order/Reservation/Table Mismatch
-- EXPECTED RESULT: ERROR (SQLSTATE 45000): Order table must match reservation table
-- R001 is for table 4. We try to create an order for it on table 8.
INSERT INTO RESTAURANT_ORDER (reservation_id, table_id, waiter_id, order_date, order_time, status)
VALUES (1, 8, 1, '2026-08-20', '19:00:00', 'Active');

-- 8. Test: Inactive Discount
-- EXPECTED RESULT: ERROR (SQLSTATE 45000): Discount is not active
-- D005 (id 5) is inactive.
UPDATE BILL SET discount_id = 5 WHERE bill_id = 13;

-- 9. Test: Missing Discount Authorization
-- EXPECTED RESULT: ERROR (SQLSTATE 45000): Discount requires waiter authorization
-- D001 (id 1) is active. No waiter assigned.
UPDATE BILL SET discount_id = 1, authorized_by_waiter_id = NULL WHERE bill_id = 13;

-- 10. Test: Inactive Waiter Authorization
-- EXPECTED RESULT: ERROR (SQLSTATE 45000): Authorizing waiter must be active
-- Waiter W005 (id 5) is inactive.
UPDATE BILL SET discount_id = 1, authorized_by_waiter_id = 5 WHERE bill_id = 13;

-- 11. Test: Paid Bill Immutability
-- EXPECTED RESULT: ERROR (SQLSTATE 45000): Paid bills cannot be modified
-- Bill 1 is paid.
UPDATE BILL SET total_amount = total_amount + 100 WHERE bill_id = 1;

-- 12. Test: Modify Paid Bill Discount
-- EXPECTED RESULT: ERROR (SQLSTATE 45000): Paid bills cannot be modified
UPDATE BILL SET discount_amount = 0 WHERE bill_id = 1;

-- 13. Test: Modify Paid Bill Tax
-- EXPECTED RESULT: ERROR (SQLSTATE 45000): Paid bills cannot be modified
UPDATE BILL SET tax_amount = tax_amount + 50 WHERE bill_id = 1;

-- 14. Test: Exact Payment Validation
-- EXPECTED RESULT: ERROR (SQLSTATE 45000): Payment amount must exactly match the bill total amount
-- Bill 13 is unpaid. Total amount is 294.00. We try paying 250.00.
CALL sp_process_payment(13, 'UPI', 250.00);

-- 15. Test: Overpayment
-- EXPECTED RESULT: ERROR (SQLSTATE 45000): Payment amount must exactly match the bill total amount
CALL sp_process_payment(13, 'Cash', 1000.00);

-- 17. Test: Second Payment
-- EXPECTED RESULT: ERROR (SQLSTATE 45000): Bill is already paid or invalid status
-- Bill 1 is already paid.
CALL sp_process_payment(1, 'Cash', 2835.00);

-- 18. Basic CHECK Constraint Tests
-- EXPECTED RESULT: ERROR (CHECK constraint violation)
INSERT INTO ORDER_ITEM (order_id, item_id, quantity, unit_price) VALUES (1, 1, -2, 250.00);

-- EXPECTED RESULT: ERROR (CHECK constraint violation)
INSERT INTO ORDER_ITEM (order_id, item_id, quantity, unit_price) VALUES (1, 1, 0, 250.00);

-- 19. Invalid Discount Percentage
-- EXPECTED RESULT: ERROR (CHECK constraint violation)
INSERT INTO DISCOUNT (discount_name, percentage, is_active) VALUES ('Invalid', 150.00, TRUE);

-- 20. Invalid Payment Amount
-- EXPECTED RESULT: ERROR (CHECK constraint violation)
INSERT INTO PAYMENT (bill_id, payment_time, payment_method, amount_paid) VALUES (15, CURRENT_TIMESTAMP, 'UPI', 0);


-- --------------------------------------------
-- B. Positive Integrity Tests
-- --------------------------------------------

-- 3. Test: Adjacent Reservations
-- EXPECTED RESULT: SUCCESS
-- R001 on T04 (table_id 4) is 18:00 to 19:30. 19:30 to 20:30 is adjacent and valid.
CALL sp_create_reservation(1, 4, '2026-08-20', '19:30:00', '20:30:00', 2, 'Adjacent test');

-- 4. Test: Cancelled Reservation Does Not Block
-- EXPECTED RESULT: SUCCESS
-- R004 (table_id 9) 2026-08-21 13:00 to 14:30 is cancelled. We can book this slot.
CALL sp_create_reservation(1, 9, '2026-08-21', '13:00:00', '14:30:00', 2, 'Cancelled block test');

-- 7. Test: Active Discount + Authorization
-- EXPECTED RESULT: SUCCESS
-- Bill 14 is Unpaid. We apply an active discount (D001, id 1) authorized by active waiter W001 (id 1).
UPDATE BILL SET discount_id = 1, authorized_by_waiter_id = 1 WHERE bill_id = 14;

-- 16. Test: Correct Payment
-- EXPECTED RESULT: SUCCESS
-- Bill 13 is unpaid. total_amount is 294.00.
CALL sp_process_payment(13, 'UPI', 294.00);


-- --------------------------------------------
-- I. Required Reports
-- --------------------------------------------

-- Available tables
SELECT * FROM RESTAURANT_TABLE WHERE status = 'Available';

-- Waiter performance
SELECT w.waiter_id, CONCAT(w.first_name, ' ', w.last_name) AS waiter_name, COUNT(o.order_id) AS total_orders
FROM WAITER w LEFT JOIN RESTAURANT_ORDER o ON w.waiter_id = o.waiter_id
GROUP BY w.waiter_id, waiter_name;

-- Item sales
SELECT m.item_id, m.name, SUM(oi.quantity) AS total_quantity_sold
FROM MENU_ITEM m JOIN ORDER_ITEM oi ON m.item_id = oi.item_id
GROUP BY m.item_id, m.name ORDER BY total_quantity_sold DESC;

-- Kitchen delays
SELECT ticket_id, order_id, TIMESTAMPDIFF(MINUTE, generated_time, ready_time) AS delay_minutes
FROM KITCHEN_TICKET WHERE ready_time IS NOT NULL ORDER BY delay_minutes DESC;

-- Discount usage
SELECT d.discount_name, COUNT(b.bill_id) AS times_used, SUM(b.discount_amount) AS total_discount
FROM DISCOUNT d LEFT JOIN BILL b ON d.discount_id = b.discount_id
GROUP BY d.discount_id, d.discount_name;

-- Revenue
SELECT DATE(generation_time) AS revenue_date, SUM(total_amount) AS revenue
FROM BILL WHERE status = 'Paid' GROUP BY DATE(generation_time) ORDER BY revenue_date;
