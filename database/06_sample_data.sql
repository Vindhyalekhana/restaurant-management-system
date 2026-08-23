-- ============================================
-- PHASE 5.6 : SAMPLE DATA
-- Restaurant Table Reservation & Food Service
-- ============================================

USE restaurant_db;

-- 1. DINING_AREA (4 records)
INSERT INTO DINING_AREA (area_name, description) VALUES
('Indoor Dining', 'Air-conditioned main hall'),
('Outdoor Dining', 'Open-air patio seating'),
('Family Dining', 'Quiet area for families and large groups'),
('Private Dining', 'Exclusive rooms for private events');

-- 2. RESTAURANT_TABLE (12 records)
INSERT INTO RESTAURANT_TABLE (area_id, table_number, capacity, status) VALUES
(1, 'T01', 2, 'Available'),
(1, 'T02', 2, 'Occupied'),
(1, 'T03', 4, 'Occupied'),
(1, 'T04', 4, 'Reserved'),
(2, 'T05', 2, 'Available'),
(2, 'T06', 4, 'Available'),
(2, 'T07', 6, 'Occupied'),
(3, 'T08', 4, 'Available'),
(3, 'T09', 6, 'Reserved'),
(3, 'T10', 8, 'Maintenance'),
(4, 'T11', 6, 'Available'),
(4, 'T12', 10, 'Occupied');

-- 3. CUSTOMER (18 records)
INSERT INTO CUSTOMER (first_name, last_name, phone_number, email, registration_date) VALUES
('Anand', 'Kumar', '9876543210', 'anand.k@example.com', '2026-01-10'),
('Priya', 'Sharma', '9876543211', 'priya.s@example.com', '2026-01-15'),
('Rahul', 'Verma', '9876543212', 'rahul.v@example.com', '2026-02-20'),
('Neha', 'Gupta', '9876543213', NULL, '2026-03-05'),
('Vikram', 'Singh', '9876543214', 'vikram.s@example.com', '2026-03-12'),
('Anjali', 'Desai', '9876543215', NULL, '2026-04-01'),
('Rohan', 'Mehta', '9876543216', 'rohan.m@example.com', '2026-04-18'),
('Pooja', 'Joshi', '9876543217', 'pooja.j@example.com', '2026-05-22'),
('Amit', 'Patel', '9876543218', NULL, '2026-06-11'),
('Kavita', 'Reddy', '9876543219', 'kavita.r@example.com', '2026-06-30'),
('Suresh', 'Nair', '9876543220', NULL, '2026-07-05'),
('Divya', 'Iyer', '9876543221', 'divya.i@example.com', '2026-07-14'),
('Karan', 'Malhotra', '9876543222', 'karan.m@example.com', '2026-07-28'),
('Sneha', 'Rao', '9876543223', NULL, '2026-08-02'),
('Raj', 'Chopra', '9876543224', 'raj.c@example.com', '2026-08-09'),
('Megha', 'Das', '9876543225', NULL, '2026-08-11'),
('Arun', 'Pillai', '9876543226', 'arun.p@example.com', '2026-08-15'),
('Tara', 'Sen', '9876543227', 'tara.s@example.com', '2026-08-18');

-- 4. WAITER (5 records)
INSERT INTO WAITER (first_name, last_name, phone_number, hire_date, status) VALUES
('Arjun', 'Rao', '9123456780', '2025-01-15', 'Active'),
('Sneha', 'Patel', '9123456781', '2025-03-10', 'Active'),
('Kiran', 'Kumar', '9123456782', '2025-06-20', 'Active'),
('Meera', 'Singh', '9123456783', '2025-11-05', 'Active'),
('Ravi', 'Das', '9123456784', '2024-05-12', 'Inactive');

-- 5. MENU_ITEM (18 records)
INSERT INTO MENU_ITEM (name, description, category, price, is_available) VALUES
('Paneer Tikka', 'Grilled cottage cheese with spices', 'Starter', 220.00, TRUE),
('Veg Spring Rolls', 'Crispy rolls stuffed with vegetables', 'Starter', 180.00, TRUE),
('Chicken 65', 'Spicy deep-fried chicken chunks', 'Starter', 260.00, TRUE),
('Crispy Corn', 'Fried corn kernels tossed in spices', 'Starter', 190.00, TRUE),
('Gobi Manchurian', 'Cauliflower tossed in soy-garlic sauce', 'Starter', 200.00, TRUE),
('Veg Biryani', 'Aromatic basmati rice cooked with mixed vegetables', 'Main Course', 280.00, TRUE),
('Chicken Biryani', 'Classic Indian rice dish with marinated chicken', 'Main Course', 350.00, TRUE),
('Paneer Butter Masala', 'Cottage cheese cubes in a rich tomato gravy', 'Main Course', 290.00, TRUE),
('Dal Tadka', 'Yellow lentils tempered with cumin and garlic', 'Main Course', 180.00, TRUE),
('Butter Naan', 'Soft Indian flatbread brushed with butter', 'Main Course', 50.00, TRUE),
('Fried Rice', 'Wok-tossed rice with vegetables and soy sauce', 'Main Course', 220.00, TRUE),
('Mutton Curry', 'Tender lamb slow-cooked in traditional spices', 'Main Course', 420.00, FALSE),
('Gulab Jamun', 'Deep-fried milk dumplings soaked in sugar syrup', 'Dessert', 90.00, TRUE),
('Brownie', 'Warm chocolate brownie', 'Dessert', 150.00, TRUE),
('Ice Cream', 'Vanilla and Chocolate flavors', 'Dessert', 120.00, TRUE),
('Lime Soda', 'Refreshing sweet and salty lime drink', 'Beverage', 80.00, TRUE),
('Cold Coffee', 'Blended iced coffee with milk', 'Beverage', 130.00, TRUE),
('Masala Tea', 'Traditional Indian spiced tea', 'Beverage', 40.00, TRUE);

-- 6. DISCOUNT (5 records)
INSERT INTO DISCOUNT (discount_name, percentage, is_active) VALUES
('Festival Offer', 10.00, TRUE),
('Weekend Offer', 15.00, TRUE),
('Student Offer', 5.00, TRUE),
('Staff Discount', 50.00, TRUE),
('Old Promotion', 20.00, FALSE);

-- 7. RESERVATION (18 records)
-- Ensuring no overlapping times for the same table on the same date.
INSERT INTO RESERVATION (customer_id, table_id, reservation_date, start_time, end_time, guest_count, status, special_requests) VALUES
(1, 4, '2026-08-20', '18:00', '19:30', 2, 'Confirmed', 'Window seat preferred'),
(2, 4, '2026-08-20', '20:00', '21:30', 4, 'Pending', NULL),
(3, 9, '2026-08-20', '19:00', '20:30', 5, 'Confirmed', 'Birthday celebration'),
(4, 9, '2026-08-21', '13:00', '14:30', 6, 'Cancelled', NULL),
(5, 7, '2026-08-20', '20:00', '22:00', 4, 'Seated', 'Outdoor preferred'),
(6, 12, '2026-08-20', '19:30', '22:30', 10, 'Seated', 'Corporate dinner'),
(7, 3, '2026-08-20', '18:30', '19:30', 3, 'Seated', NULL),
(8, 2, '2026-08-20', '20:00', '21:00', 2, 'Seated', NULL),
(9, 6, '2026-08-21', '19:00', '20:00', 4, 'Confirmed', NULL),
(10, 11, '2026-08-22', '19:00', '21:00', 6, 'Pending', NULL),
(11, 8, '2026-08-22', '18:00', '19:30', 4, 'Confirmed', NULL),
(12, 1, '2026-08-23', '20:00', '21:00', 2, 'Confirmed', NULL),
(13, 2, '2026-08-23', '19:00', '20:30', 2, 'Pending', NULL),
(14, 5, '2026-08-24', '18:30', '19:30', 2, 'Confirmed', NULL),
(15, 7, '2026-08-24', '19:30', '21:30', 5, 'Confirmed', NULL),
(16, 9, '2026-08-25', '20:00', '22:00', 6, 'Pending', NULL),
(17, 3, '2026-08-25', '19:00', '20:30', 4, 'Confirmed', NULL),
(18, 4, '2026-08-25', '18:00', '19:30', 3, 'Cancelled', 'Plans changed');

-- 8. RESTAURANT_ORDER (18 records)
-- Mix of reservation-linked and walk-in (reservation_id = NULL)
INSERT INTO RESTAURANT_ORDER (reservation_id, table_id, waiter_id, order_date, order_time, status) VALUES
(5, 7, 1, '2026-08-20', '20:15', 'Active'),   -- Order 1: Reservation 5 (T07)
(6, 12, 2, '2026-08-20', '19:45', 'Closed'),   -- Order 2: Reservation 6 (T12)
(7, 3, 3, '2026-08-20', '18:40', 'Closed'),    -- Order 3: Reservation 7 (T03)
(8, 2, 1, '2026-08-20', '20:10', 'Active'),    -- Order 4: Reservation 8 (T02)
(NULL, 1, 4, '2026-08-20', '19:00', 'Closed'), -- Order 5: Walk-in (T01)
(NULL, 5, 2, '2026-08-20', '19:30', 'Closed'), -- Order 6: Walk-in (T05)
(NULL, 8, 3, '2026-08-20', '20:00', 'Closed'), -- Order 7: Walk-in (T08)
(NULL, 11, 4, '2026-08-20', '20:30', 'Active'),-- Order 8: Walk-in (T11)
(NULL, 6, 1, '2026-08-20', '21:00', 'Closed'), -- Order 9: Walk-in (T06)
(NULL, 1, 2, '2026-08-21', '13:00', 'Closed'), -- Order 10: Walk-in (T01)
(NULL, 2, 3, '2026-08-21', '13:30', 'Closed'), -- Order 11: Walk-in (T02)
(NULL, 3, 4, '2026-08-21', '14:00', 'Closed'), -- Order 12: Walk-in (T03)
(NULL, 4, 1, '2026-08-21', '14:30', 'Closed'), -- Order 13: Walk-in (T04)
(NULL, 5, 2, '2026-08-21', '15:00', 'Closed'), -- Order 14: Walk-in (T05)
(NULL, 6, 3, '2026-08-21', '15:30', 'Closed'), -- Order 15: Walk-in (T06)
(NULL, 7, 4, '2026-08-21', '16:00', 'Closed'), -- Order 16: Walk-in (T07)
(NULL, 8, 1, '2026-08-21', '16:30', 'Closed'), -- Order 17: Walk-in (T08)
(NULL, 9, 2, '2026-08-21', '17:00', 'Closed'); -- Order 18: Walk-in (T09)

-- 9. ORDER_ITEM (40+ records)
-- Simulating historical price: Veg Biryani current is 280, ordered here at 250.
INSERT INTO ORDER_ITEM (order_id, item_id, quantity, unit_price, special_instructions) VALUES
(1, 1, 2, 220.00, 'Extra spicy'),
(1, 8, 1, 290.00, NULL),
(1, 10, 4, 50.00, 'Hot'),
(1, 16, 2, 80.00, NULL),

(2, 3, 3, 260.00, NULL),
(2, 7, 4, 350.00, 'Less spicy'),
(2, 17, 4, 130.00, NULL),

(3, 2, 1, 180.00, NULL),
(3, 6, 2, 250.00, 'Historical price example'), -- Historical price! Current is 280
(3, 13, 2, 90.00, NULL),

(4, 4, 1, 190.00, NULL),
(4, 11, 1, 220.00, NULL),
(4, 18, 2, 40.00, 'Less sugar'),

(5, 1, 1, 220.00, NULL),
(5, 8, 1, 290.00, NULL),
(5, 10, 2, 50.00, NULL),

(6, 3, 1, 260.00, NULL),
(6, 11, 1, 220.00, NULL),
(6, 16, 1, 80.00, NULL),

(7, 2, 2, 180.00, NULL),
(7, 6, 2, 280.00, NULL),
(7, 13, 4, 90.00, NULL),

(8, 7, 3, 350.00, NULL),
(8, 17, 3, 130.00, NULL),

(9, 8, 2, 290.00, NULL),
(9, 10, 4, 50.00, NULL),

(10, 1, 1, 220.00, NULL),
(11, 3, 1, 260.00, NULL),
(12, 8, 1, 290.00, NULL),
(13, 6, 1, 280.00, NULL),
(14, 11, 1, 220.00, NULL),
(15, 7, 1, 350.00, NULL),
(16, 2, 1, 180.00, NULL),
(17, 13, 1, 90.00, NULL),
(18, 16, 1, 80.00, NULL);

-- 10. KITCHEN_TICKET (18 records)
-- Demonstrating varied kitchen delays
INSERT INTO KITCHEN_TICKET (order_id, generated_time, ready_time, status) VALUES
(1, '2026-08-20 20:16:00', NULL, 'Preparing'),
(2, '2026-08-20 19:46:00', '2026-08-20 20:15:00', 'Served'),   -- 29 min
(3, '2026-08-20 18:41:00', '2026-08-20 18:55:00', 'Served'),   -- 14 min
(4, '2026-08-20 20:11:00', '2026-08-20 20:25:00', 'Ready'),    -- 14 min
(5, '2026-08-20 19:01:00', '2026-08-20 19:15:00', 'Served'),   -- 14 min
(6, '2026-08-20 19:31:00', '2026-08-20 19:42:00', 'Served'),   -- 11 min
(7, '2026-08-20 20:01:00', '2026-08-20 20:20:00', 'Served'),   -- 19 min
(8, '2026-08-20 20:31:00', NULL, 'Queued'),
(9, '2026-08-20 21:01:00', '2026-08-20 21:15:00', 'Served'),   -- 14 min
(10, '2026-08-21 13:01:00', '2026-08-21 13:10:00', 'Served'),  -- 9 min
(11, '2026-08-21 13:31:00', '2026-08-21 13:40:00', 'Served'),
(12, '2026-08-21 14:01:00', '2026-08-21 14:12:00', 'Served'),
(13, '2026-08-21 14:31:00', '2026-08-21 14:45:00', 'Served'),
(14, '2026-08-21 15:01:00', '2026-08-21 15:10:00', 'Served'),
(15, '2026-08-21 15:31:00', '2026-08-21 15:45:00', 'Served'),
(16, '2026-08-21 16:01:00', '2026-08-21 16:11:00', 'Served'),
(17, '2026-08-21 16:31:00', '2026-08-21 16:35:00', 'Served'),
(18, '2026-08-21 17:01:00', '2026-08-21 17:05:00', 'Served');

-- 11. BILL (15 records)
-- Paid bills are closed, unpaid are not.
INSERT INTO BILL (order_id, discount_id, authorized_by_waiter_id, generation_time, closed_time, subtotal, discount_amount, tax_amount, total_amount, status) VALUES
(2, NULL, NULL, '2026-08-20 21:00:00', '2026-08-20 21:05:00', 2700.00, 0.00, 135.00, 2835.00, 'Paid'),
(3, 1, 1, '2026-08-20 19:40:00', '2026-08-20 19:45:00', 860.00, 86.00, 43.00, 817.00, 'Paid'),
(5, NULL, NULL, '2026-08-20 19:45:00', '2026-08-20 19:50:00', 610.00, 0.00, 30.50, 640.50, 'Paid'),
(6, NULL, NULL, '2026-08-20 20:00:00', '2026-08-20 20:05:00', 560.00, 0.00, 28.00, 588.00, 'Paid'),
(7, 2, 2, '2026-08-20 20:45:00', '2026-08-20 20:50:00', 1280.00, 192.00, 64.00, 1152.00, 'Paid'),
(9, NULL, NULL, '2026-08-20 21:30:00', '2026-08-20 21:35:00', 780.00, 0.00, 39.00, 819.00, 'Paid'),
(10, NULL, NULL, '2026-08-21 13:20:00', '2026-08-21 13:25:00', 220.00, 0.00, 11.00, 231.00, 'Paid'),
(11, 3, 3, '2026-08-21 13:50:00', '2026-08-21 13:55:00', 260.00, 13.00, 13.00, 260.00, 'Paid'),
(12, NULL, NULL, '2026-08-21 14:30:00', '2026-08-21 14:35:00', 290.00, 0.00, 14.50, 304.50, 'Paid'),
(13, NULL, NULL, '2026-08-21 15:00:00', '2026-08-21 15:05:00', 280.00, 0.00, 14.00, 294.00, 'Paid'),
(14, NULL, NULL, '2026-08-21 15:30:00', '2026-08-21 15:35:00', 220.00, 0.00, 11.00, 231.00, 'Paid'),
(15, 4, 1, '2026-08-21 16:00:00', '2026-08-21 16:05:00', 350.00, 175.00, 17.50, 192.50, 'Paid'),
(16, NULL, NULL, '2026-08-21 16:30:00', NULL, 180.00, 0.00, 9.00, 189.00, 'Unpaid'),
(17, NULL, NULL, '2026-08-21 16:45:00', NULL, 90.00, 0.00, 4.50, 94.50, 'Unpaid'),
(18, NULL, NULL, '2026-08-21 17:15:00', NULL, 80.00, 0.00, 4.00, 84.00, 'Unpaid');

-- 12. PAYMENT (12 records)
-- Payments must exactly match total_amount of Paid bills.
INSERT INTO PAYMENT (bill_id, payment_time, payment_method, amount_paid) VALUES
(1, '2026-08-20 21:05:00', 'Card', 2835.00),
(2, '2026-08-20 19:45:00', 'UPI', 817.00),
(3, '2026-08-20 19:50:00', 'Cash', 640.50),
(4, '2026-08-20 20:05:00', 'UPI', 588.00),
(5, '2026-08-20 20:50:00', 'Card', 1152.00),
(6, '2026-08-20 21:35:00', 'Cash', 819.00),
(7, '2026-08-21 13:25:00', 'UPI', 231.00),
(8, '2026-08-21 13:55:00', 'Card', 260.00),
(9, '2026-08-21 14:35:00', 'Cash', 304.50),
(10, '2026-08-21 15:05:00', 'UPI', 294.00),
(11, '2026-08-21 15:35:00', 'Card', 231.00),
(12, '2026-08-21 16:05:00', 'Cash', 192.50);
