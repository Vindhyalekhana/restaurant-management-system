-- ============================================
-- PHASE 5.5 : ADVANCED INTEGRITY
-- Restaurant Table Reservation & Food Service
-- ============================================

USE restaurant_db;

DELIMITER //

-- ============================================
-- 1. RESERVATION CAPACITY TRIGGERS
-- ============================================

CREATE TRIGGER trg_reservation_capacity_insert
BEFORE INSERT ON RESERVATION
FOR EACH ROW
BEGIN
    DECLARE v_capacity INT;
    SELECT capacity INTO v_capacity FROM RESTAURANT_TABLE WHERE table_id = NEW.table_id;
    IF NEW.guest_count > v_capacity THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Guest count exceeds table capacity';
    END IF;
END //

CREATE TRIGGER trg_reservation_capacity_update
BEFORE UPDATE ON RESERVATION
FOR EACH ROW
BEGIN
    DECLARE v_capacity INT;
    SELECT capacity INTO v_capacity FROM RESTAURANT_TABLE WHERE table_id = NEW.table_id;
    IF NEW.guest_count > v_capacity THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Guest count exceeds table capacity';
    END IF;
END //

-- ============================================
-- 2. RESERVATION VALIDATION PROCEDURE
-- ============================================

CREATE PROCEDURE sp_create_reservation (
    IN p_customer_id INT,
    IN p_table_id INT,
    IN p_reservation_date DATE,
    IN p_start_time TIME,
    IN p_end_time TIME,
    IN p_guest_count INT,
    IN p_special_requests VARCHAR(255)
)
BEGIN
    DECLARE v_capacity INT;
    DECLARE v_overlap_count INT;
    
    -- Start transaction
    START TRANSACTION;
    
    -- Capacity check
    SELECT capacity INTO v_capacity 
    FROM RESTAURANT_TABLE 
    WHERE table_id = p_table_id FOR UPDATE; -- lock the table row to serialize operations for this table
    
    IF p_guest_count > v_capacity THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Guest count exceeds table capacity';
    END IF;

    -- Overlap validation
    SELECT COUNT(*) INTO v_overlap_count
    FROM RESERVATION
    WHERE table_id = p_table_id
      AND reservation_date = p_reservation_date
      AND status IN ('Pending', 'Confirmed', 'Seated')
      AND (p_start_time < end_time AND p_end_time > start_time)
    FOR UPDATE;

    IF v_overlap_count > 0 THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Reservation overlaps with an existing reservation';
    END IF;
    
    -- Insert reservation
    INSERT INTO RESERVATION (
        customer_id, table_id, reservation_date, start_time, end_time, guest_count, status, special_requests
    ) VALUES (
        p_customer_id, p_table_id, p_reservation_date, p_start_time, p_end_time, p_guest_count, 'Pending', p_special_requests
    );
    
    COMMIT;
END //

-- ============================================
-- 3. ORDER / RESERVATION / TABLE CONSISTENCY
-- ============================================

CREATE TRIGGER trg_order_consistency_insert
BEFORE INSERT ON RESTAURANT_ORDER
FOR EACH ROW
BEGIN
    DECLARE v_res_table_id INT;
    IF NEW.reservation_id IS NOT NULL THEN
        SELECT table_id INTO v_res_table_id FROM RESERVATION WHERE reservation_id = NEW.reservation_id;
        IF NEW.table_id != v_res_table_id THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Order table must match reservation table';
        END IF;
    END IF;
END //

CREATE TRIGGER trg_order_consistency_update
BEFORE UPDATE ON RESTAURANT_ORDER
FOR EACH ROW
BEGIN
    DECLARE v_res_table_id INT;
    IF NEW.reservation_id IS NOT NULL THEN
        SELECT table_id INTO v_res_table_id FROM RESERVATION WHERE reservation_id = NEW.reservation_id;
        IF NEW.table_id != v_res_table_id THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Order table must match reservation table';
        END IF;
    END IF;
END //

-- ============================================
-- 4. DISCOUNT AUTHORIZATION
-- ============================================

CREATE TRIGGER trg_discount_auth_insert
BEFORE INSERT ON BILL
FOR EACH ROW
BEGIN
    DECLARE v_is_active BOOLEAN;
    DECLARE v_waiter_status ENUM('Active', 'Inactive');
    
    IF NEW.discount_id IS NOT NULL THEN
        -- Check discount active
        SELECT is_active INTO v_is_active FROM DISCOUNT WHERE discount_id = NEW.discount_id;
        IF v_is_active = FALSE THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Discount is not active';
        END IF;
        
        -- Check authorization
        IF NEW.authorized_by_waiter_id IS NULL THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Discount requires waiter authorization';
        ELSE
            SELECT status INTO v_waiter_status FROM WAITER WHERE waiter_id = NEW.authorized_by_waiter_id;
            IF v_waiter_status != 'Active' THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Authorizing waiter must be active';
            END IF;
        END IF;
    END IF;
END //

CREATE TRIGGER trg_discount_auth_update
BEFORE UPDATE ON BILL
FOR EACH ROW
BEGIN
    DECLARE v_is_active BOOLEAN;
    DECLARE v_waiter_status ENUM('Active', 'Inactive');
    
    IF NEW.discount_id IS NOT NULL THEN
        -- Check discount active
        SELECT is_active INTO v_is_active FROM DISCOUNT WHERE discount_id = NEW.discount_id;
        IF v_is_active = FALSE THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Discount is not active';
        END IF;
        
        -- Check authorization
        IF NEW.authorized_by_waiter_id IS NULL THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Discount requires waiter authorization';
        ELSE
            SELECT status INTO v_waiter_status FROM WAITER WHERE waiter_id = NEW.authorized_by_waiter_id;
            IF v_waiter_status != 'Active' THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Authorizing waiter must be active';
            END IF;
        END IF;
    END IF;
END //

-- ============================================
-- 5. CLOSED BILL IMMUTABILITY
-- ============================================

CREATE TRIGGER trg_bill_immutability_update
BEFORE UPDATE ON BILL
FOR EACH ROW
BEGIN
    IF OLD.status = 'Paid' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Paid bills cannot be modified';
    END IF;
END //

-- ============================================
-- 6. PAYMENT PROCESSING
-- ============================================

CREATE PROCEDURE sp_process_payment (
    IN p_bill_id INT,
    IN p_payment_method ENUM('Cash', 'Card', 'UPI'),
    IN p_amount_paid DECIMAL(10,2)
)
BEGIN
    DECLARE v_bill_status ENUM('Unpaid', 'Paid');
    DECLARE v_total_amount DECIMAL(10,2);
    
    START TRANSACTION;
    
    -- Lock bill for update
    SELECT status, total_amount INTO v_bill_status, v_total_amount
    FROM BILL
    WHERE bill_id = p_bill_id FOR UPDATE;
    
    IF v_bill_status != 'Unpaid' THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Bill is already paid or invalid status';
    END IF;
    
    IF p_amount_paid != v_total_amount THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Payment amount must exactly match the bill total amount';
    END IF;
    
    -- Insert payment
    INSERT INTO PAYMENT (bill_id, payment_time, payment_method, amount_paid)
    VALUES (p_bill_id, CURRENT_TIMESTAMP, p_payment_method, p_amount_paid);
    
    -- Update bill to Paid
    UPDATE BILL
    SET status = 'Paid', closed_time = CURRENT_TIMESTAMP
    WHERE bill_id = p_bill_id;
    
    COMMIT;
END //

DELIMITER ;
