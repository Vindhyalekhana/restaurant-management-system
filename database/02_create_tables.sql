USE restaurant_db;

CREATE TABLE DINING_AREA (
    area_id INT AUTO_INCREMENT PRIMARY KEY,
    area_name VARCHAR(100) UNIQUE NOT NULL,
    description VARCHAR(255)
);

CREATE TABLE RESTAURANT_TABLE (
    table_id INT AUTO_INCREMENT PRIMARY KEY,
    area_id INT NOT NULL,
    table_number VARCHAR(20) UNIQUE NOT NULL,
    capacity INT NOT NULL,
    status ENUM('Available', 'Occupied', 'Reserved', 'Maintenance') DEFAULT 'Available',
    FOREIGN KEY (area_id) REFERENCES DINING_AREA(area_id) ON DELETE RESTRICT
);

CREATE TABLE CUSTOMER (
    customer_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone_number VARCHAR(15) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NULL,
    registration_date DATE NOT NULL
);

CREATE TABLE RESERVATION (
    reservation_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    table_id INT NOT NULL,
    reservation_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    guest_count INT NOT NULL,
    status ENUM('Pending', 'Confirmed', 'Seated', 'Cancelled') DEFAULT 'Pending',
    special_requests VARCHAR(255),
    FOREIGN KEY (customer_id) REFERENCES CUSTOMER(customer_id) ON DELETE CASCADE,
    FOREIGN KEY (table_id) REFERENCES RESTAURANT_TABLE(table_id) ON DELETE RESTRICT
);

CREATE TABLE MENU_ITEM (
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    category ENUM('Starter', 'Main Course', 'Dessert', 'Beverage') NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    is_available BOOLEAN DEFAULT TRUE
);

CREATE TABLE WAITER (
    waiter_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone_number VARCHAR(15) UNIQUE NOT NULL,
    hire_date DATE NOT NULL,
    status ENUM('Active', 'Inactive') DEFAULT 'Active'
);

CREATE TABLE RESTAURANT_ORDER (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    reservation_id INT NULL,
    table_id INT NOT NULL,
    waiter_id INT NOT NULL,
    order_date DATE NOT NULL,
    order_time TIME NOT NULL,
    status ENUM('Active', 'Closed') DEFAULT 'Active',
    FOREIGN KEY (reservation_id) REFERENCES RESERVATION(reservation_id) ON DELETE SET NULL,
    FOREIGN KEY (table_id) REFERENCES RESTAURANT_TABLE(table_id) ON DELETE RESTRICT,
    FOREIGN KEY (waiter_id) REFERENCES WAITER(waiter_id) ON DELETE RESTRICT
);

CREATE TABLE ORDER_ITEM (
    order_item_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    item_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    special_instructions VARCHAR(255),
    FOREIGN KEY (order_id) REFERENCES RESTAURANT_ORDER(order_id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES MENU_ITEM(item_id) ON DELETE RESTRICT
);

CREATE TABLE KITCHEN_TICKET (
    ticket_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT UNIQUE NOT NULL,
    generated_time DATETIME NOT NULL,
    ready_time DATETIME NULL,
    status ENUM('Queued', 'Preparing', 'Ready', 'Served') DEFAULT 'Queued',
    FOREIGN KEY (order_id) REFERENCES RESTAURANT_ORDER(order_id) ON DELETE CASCADE
);

CREATE TABLE DISCOUNT (
    discount_id INT AUTO_INCREMENT PRIMARY KEY,
    discount_name VARCHAR(100) NOT NULL,
    percentage DECIMAL(5,2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE BILL (
    bill_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT UNIQUE NOT NULL,
    discount_id INT NULL,
    authorized_by_waiter_id INT NULL,
    generation_time DATETIME NOT NULL,
    closed_time DATETIME NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status ENUM('Unpaid', 'Paid') DEFAULT 'Unpaid',
    FOREIGN KEY (order_id) REFERENCES RESTAURANT_ORDER(order_id) ON DELETE RESTRICT,
    FOREIGN KEY (discount_id) REFERENCES DISCOUNT(discount_id) ON DELETE SET NULL,
    FOREIGN KEY (authorized_by_waiter_id) REFERENCES WAITER(waiter_id) ON DELETE SET NULL
);

CREATE TABLE PAYMENT (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    bill_id INT UNIQUE NOT NULL,
    payment_time DATETIME NOT NULL,
    payment_method ENUM('Cash', 'Card', 'UPI') NOT NULL,
    amount_paid DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (bill_id) REFERENCES BILL(bill_id) ON DELETE RESTRICT
);
