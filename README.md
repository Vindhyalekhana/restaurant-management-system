# Restaurant Table Reservation & Food Service Management System

> A database-driven restaurant management system for reservations, table allocation, food ordering, kitchen processing, billing, payments, discounts, and operational reporting using Python, Flask, JavaScript, and MySQL.

---

## Overview

The **Restaurant Table Reservation & Food Service Management System** manages the complete operational workflow of a restaurant through a relational MySQL database and a layered Python application.

The system connects:

- Customers
- Dining areas and restaurant tables
- Reservations
- Waiters
- Menu items
- Orders and order items
- Kitchen tickets
- Discounts
- Bills
- Payments
- Operational reports

The project was developed as an academic DBMS project with emphasis on relational database design, integrity enforcement, transactions, business-rule validation, and practical application integration.

---

## Objectives

The main objectives are to:

1. Design a normalized relational database for restaurant operations.
2. Manage table reservations and availability.
3. Support both reservation-linked and walk-in orders.
4. Capture food orders and historical item prices.
5. Track kitchen processing from queued to served.
6. Generate bills with discounts and tax calculations.
7. Process and validate payments.
8. Provide operational reports using SQL queries and aggregations.
9. Enforce important business rules using constraints, triggers, stored procedures, and transactions.
10. Provide both CLI and web-based interfaces over the same service and database layers.

---

## Key Features

### Reservation Management

- Check table availability
- Create reservations
- View reservations
- Cancel reservations
- Validate table capacity
- Prevent overlapping reservations
- Associate customers with tables
- Store special requests

### Order Management

- Create dine-in orders
- Support reservation-linked orders
- Support walk-in orders
- Assign waiters
- Add menu items
- Store historical item prices
- Add special instructions
- Calculate order totals
- Close orders
- Validate reservation/table consistency

### Kitchen Management

- Automatically create a kitchen ticket when an order is created
- View queued and active kitchen tickets
- Move tickets through the controlled workflow:
  `Queued → Preparing → Ready → Served`
- Record kitchen ready time
- Track preparation delays

### Billing

- Generate bills only for closed orders
- Calculate subtotal
- Apply authorized discounts
- Calculate tax
- Calculate final total
- View bills and billing history
- Protect paid bills from modification

### Payment

- Support Cash, Card, and UPI
- Validate exact payment amount
- Prevent payment of already-paid bills
- Record payment time
- Mark bills as Paid through transactional processing

### Reports

The application provides seven operational reports:

1. Available Tables
2. Table Turnover
3. Waiter Performance
4. Item Sales
5. Kitchen Delays
6. Discount Usage
7. Revenue

---

## System Architecture

The project follows a layered architecture. The CLI and web interface act as presentation layers and reuse the same application services and database layer.

```text
┌──────────────────────────────────────────────┐
│             Presentation Layer               │
│                                              │
│     CLI                Flask Web UI          │
│  application/ui       HTML / CSS / JS        │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│              Flask API / Routes              │
│              application/web                 │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│                Service Layer                 │
│                                              │
│ ReservationService                           │
│ OrderService                                 │
│ KitchenService                               │
│ BillingService                               │
│ PaymentService                               │
│ ReportService                                │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│                Database Layer                │
│                                              │
│ get_connection()                             │
│ execute_query()                              │
│ execute_procedure()                          │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│                    MySQL                     │
│                                              │
│ Tables • Constraints • Foreign Keys          │
│ Triggers • Stored Procedures • Transactions  │
└──────────────────────────────────────────────┘
```

### Web Application Flow

```text
HTML / CSS / JavaScript
          ↓
      Flask Routes
          ↓
    Service Layer
          ↓
      MySQL DB
```

The web frontend does not duplicate the core business logic. It communicates with the Flask API, which delegates operations to the existing service layer.

---

## Technology Stack

| Technology               | Purpose                                   |
| ------------------------ | ----------------------------------------- |
| Python 3.x               | Application and service logic             |
| Flask                    | Web application and API layer             |
| HTML                     | Web page structure                        |
| CSS                      | Web interface styling                     |
| JavaScript               | Web interaction and API communication     |
| MySQL 9.x                | Relational database                       |
| `mysql-connector-python` | Python–MySQL connectivity                 |
| SQL                      | Database operations, reports, constraints |
| Stored Procedures        | Transactional database operations         |
| Triggers                 | Database-level business-rule enforcement  |
| Git/GitHub               | Version control and project hosting       |

---

## Project Structure

```text
Restaurant Table Reservation & Food Service Management System/
│
├── application/
│   ├── app.py
│   ├── config.py
│   ├── database.py
│   │
│   ├── services/
│   │   ├── reservation_service.py
│   │   ├── order_service.py
│   │   ├── kitchen_service.py
│   │   ├── billing_service.py
│   │   └── payment_service.py
│   │
│   ├── reports/
│   │   └── report_service.py
│   │
│   ├── ui/
│   │   └── cli.py
│   │
│   └── web/
│       ├── __init__.py
│       ├── routes.py
│       ├── templates/
│       │   ├── base.html
│       │   ├── dashboard.html
│       │   ├── reservations.html
│       │   ├── tables.html
│       │   ├── orders.html
│       │   ├── kitchen.html
│       │   ├── billing.html
│       │   └── reports.html
│       │
│       └── static/
│           ├── css/
│           │   └── style.css
│           └── js/
│               ├── reservations.js
│               ├── orders.js
│               ├── kitchen.js
│               └── billing.js
│
├── database/
│   ├── 01_schema.sql
│   ├── 02_constraints.sql
│   ├── ...
│   ├── 05_advanced_integrity.sql
│   └── 06_sample_data.sql
│
├── README.md
└── requirements.txt
```

---

# Database Design

The system uses the MySQL database:

```sql
restaurant_db
```

### Main Entity Relationships

```text
CUSTOMER
    │
    └── RESERVATION ─── RESTAURANT_TABLE ─── DINING_AREA

WAITER
    │
    └── RESTAURANT_ORDER
            │
            ├── ORDER_ITEM ─── MENU_ITEM
            │
            └── KITCHEN_TICKET
                    │
                    └── operational status tracking

RESTAURANT_ORDER
    │
    └── BILL ─── PAYMENT
          │
          └── DISCOUNT
```

The design separates independent entities and relationship data to reduce redundancy and maintain referential integrity.

---

## Main Database Entities

### CUSTOMER

Stores restaurant customer information.

Typical attributes:

- `customer_id`
- `first_name`
- `last_name`
- `phone`
- `email`
- `registration_date`

### DINING_AREA

Represents restaurant areas such as:

- Indoor Dining
- Outdoor Dining
- Family Dining
- Private Dining

### RESTAURANT_TABLE

Stores restaurant table information.

Important attributes:

- `table_id`
- `area_id`
- `table_number`
- `capacity`
- `status`

Example statuses:

```text
Available
Occupied
Reserved
Maintenance
```

### WAITER

Stores waiter information including:

- `waiter_id`
- `first_name`
- `last_name`
- `phone`
- `hire_date`
- `status`

### MENU_ITEM

Stores food and beverage items.

Attributes:

- `item_id`
- `name`
- `description`
- `category`
- `price`
- `is_available`

Categories include:

```text
Starter
Main Course
Dessert
Beverage
```

### DISCOUNT

Stores discount offers.

Attributes include:

- `discount_id`
- `discount_name`
- `percentage`
- `is_active`

### RESERVATION

Stores customer table reservations.

Important attributes:

- `reservation_id`
- `customer_id`
- `table_id`
- `reservation_date`
- `start_time`
- `end_time`
- `guest_count`
- `status`
- `special_requests`

Reservation statuses include:

```text
Pending
Confirmed
Seated
Cancelled
```

### RESTAURANT_ORDER

Stores restaurant orders.

An order can either:

- reference a reservation, or
- represent a walk-in order with `reservation_id = NULL`.

Important attributes:

- `order_id`
- `reservation_id`
- `table_id`
- `waiter_id`
- `order_date`
- `order_time`
- `status`

### ORDER_ITEM

Represents the items contained in an order.

Attributes:

- `order_item_id`
- `order_id`
- `item_id`
- `quantity`
- `unit_price`
- `special_instructions`

#### Historical Pricing

The system stores the transaction price in:

```text
ORDER_ITEM.unit_price
```

instead of relying only on the current `MENU_ITEM.price`.

This means an old order can retain the price applicable when it was created, even if the menu price changes later.

### KITCHEN_TICKET

Tracks kitchen processing.

Attributes:

- `ticket_id`
- `order_id`
- `generated_time`
- `ready_time`
- `status`

Kitchen states:

```text
Queued
Preparing
Ready
Served
```

### BILL

Stores financial information for an order.

Attributes include:

- `bill_id`
- `order_id`
- `discount_id`
- `authorized_by_waiter_id`
- `generation_time`
- `closed_time`
- `subtotal`
- `discount_amount`
- `tax_amount`
- `total_amount`
- `status`

Bill statuses:

```text
Unpaid
Paid
```

### PAYMENT

Stores completed payments.

Attributes include:

- `payment_id`
- `bill_id`
- `payment_time`
- `payment_method`
- `amount_paid`

Supported methods:

```text
Cash
Card
UPI
```

---

# Database Integrity

The system uses defense in depth for data integrity:

```text
Application Validation
        +
SQL Constraints
        +
Foreign Keys
        +
Triggers
        +
Stored Procedures
        +
Transactions
```

This means important rules are not dependent only on the frontend or Python application.

---

## Important Constraints

### Order Quantity

Order quantity must be positive:

```text
quantity > 0
```

Invalid values such as:

```text
0
-1
```

are rejected by the database constraint:

```text
chk_order_quantity
```

### Referential Integrity

Foreign keys prevent references to non-existent entities such as:

- Customers
- Tables
- Reservations
- Orders
- Menu items
- Waiters
- Bills
- Payments

---

# Database Triggers

### Reservation Capacity

Reservation capacity triggers prevent a reservation from exceeding the assigned table capacity.

Example:

```text
Table capacity = 2
Guest count    = 5
        ↓
Reservation rejected
```

### Order/Reservation Consistency

Order consistency triggers ensure that when an order is linked to a reservation, the order uses the same table associated with that reservation.

Example:

```text
Reservation → Table 7
Order       → Table 5
        ↓
Order rejected
```

### Discount Authorization

When a discount is applied:

1. The discount must be active.
2. An authorizing waiter must be specified.
3. The authorizing waiter must be active.

### Paid Bill Immutability

Once a bill is marked:

```text
Paid
```

the system prevents modification of the paid financial record.

---

# Stored Procedures

## `sp_create_reservation`

The reservation procedure performs controlled reservation creation by:

1. Starting a transaction.
2. Locking the relevant table row.
3. Checking table capacity.
4. Checking reservation overlap.
5. Inserting the reservation.
6. Committing the transaction.

If validation fails, the transaction is rolled back.

## `sp_process_payment`

The payment procedure performs transactional payment processing by:

1. Starting a transaction.
2. Locking the bill.
3. Checking bill status.
4. Validating the payment amount.
5. Inserting the payment.
6. Marking the bill as `Paid`.
7. Recording the closing timestamp.
8. Committing the transaction.

If validation fails, the operation is rolled back.

---

# Transaction Flow

A typical successful restaurant transaction follows:

```text
Customer
   ↓
Reservation / Walk-in
   ↓
Restaurant Order
   ↓
Order Items
   ↓
Kitchen Ticket
   ↓
Queued → Preparing → Ready → Served
   ↓
Order Closed
   ↓
Bill Generated
   ↓
Payment
   ↓
Bill Paid
```

---

# Python Database Layer

The database connection is centralized in:

```text
application/database.py
```

Important functions include:

```python
get_connection()
execute_query()
execute_procedure()
```

The database layer provides a common interface for:

- `SELECT`
- `INSERT`
- `UPDATE`
- `DELETE`
- Stored procedure execution

Successful operations are committed, failed operations are rolled back, and database resources are closed appropriately.

### Parameterized Queries

The project uses parameterized SQL:

```python
cursor.execute(query, params)
```

instead of directly concatenating user input into SQL statements.

---

# Service Layer

Business logic is separated into service modules:

```text
application/services/
```

### ReservationService

Handles reservation creation, availability, viewing, and cancellation.

### OrderService

Handles:

```text
create_order()
add_order_item()
view_order()
close_order()
```

When an order is created, a kitchen ticket is created in the same operation.

### KitchenService

Controls the valid kitchen state transitions:

```text
Queued → Preparing
Preparing → Ready
Ready → Served
```

### BillingService

Handles:

- Bill generation
- Historical order totals
- Discount validation
- Tax calculation
- Final bill creation

### PaymentService

Handles transactional payment processing and bill status updates.

### ReportService

Provides SQL-based operational reports for tables, orders, waiters, menu sales, kitchen delays, discounts, and revenue.

---

# Web Application

The project includes a Flask-based web interface in addition to the CLI.

### Web Pages

```text
Dashboard
Reservations
Tables
Orders
Kitchen
Billing
Reports
```

The frontend communicates with Flask JSON APIs and reuses the existing service layer.

### Main Workflow

```text
Reservations
     ↓
Orders
     ↓
Kitchen
     ↓
Billing
     ↓
Payment
     ↓
Reports
```

The web application provides separate pages for each major operational area instead of placing the complete system on one long page.

---

# CLI Application

The original CLI interface remains available as a separate presentation layer.

Run it with:

```powershell
python -m application.app
```

The CLI provides modules for:

```text
1. Reservation Management
2. Order Management
3. Kitchen Management
4. Billing & Payment
5. Reports
0. Exit
```

### Reservation Management

```text
1. Check Table Availability
2. Create Reservation
3. View Reservations
4. Cancel Reservation
0. Back
```

### Order Management

```text
1. Create Order
2. Add Order Item
3. View Order
4. Close Order
0. Back
```

### Kitchen Management

```text
1. View Queued Tickets
2. View Active/Preparing Tickets
3. Mark Preparing
4. Mark Ready
5. Mark Served
0. Back
```

### Billing & Payment

```text
1. Generate Bill
2. View Bill
3. Process Payment
0. Back
```

### Reports

```text
1. Available Tables
2. Table Turnover
3. Waiter Performance
4. Item Sales
5. Kitchen Delays
6. Discount Usage
7. Revenue
0. Back
```

---

# Installation

## Prerequisites

Install:

- Python 3.x
- MySQL Server
- MySQL client
- `pip`

Verify Python:

```powershell
python --version
```

Verify MySQL:

```powershell
mysql --version
```

---

# Database Setup

Open MySQL:

```powershell
mysql -u root -p
```

Create the database if required:

```sql
CREATE DATABASE restaurant_db;
USE restaurant_db;
```

Execute the database scripts in their dependency order. The project database directory contains schema, constraints, advanced integrity objects, and sample data scripts.

Example:

```text
database/
├── 01_schema.sql
├── 02_constraints.sql
├── ...
├── 05_advanced_integrity.sql
└── 06_sample_data.sql
```

---

# Python Environment

From the project root:

```powershell
cd "C:\Users\vindh\Desktop\projects\Restaurant Table Reservation & Food Service Management System"
```

Install dependencies:

```powershell
python -m pip install -r requirements.txt
```

If the MySQL connector is not already installed:

```powershell
python -m pip install mysql-connector-python
```

Flask is required for the web interface:

```powershell
python -m pip install flask
```

---

# Database Configuration

Database configuration is stored in:

```text
application/config.py
```

The configuration provides values equivalent to:

```text
DB_HOST
DB_PORT
DB_USER
DB_PASSWORD
DB_NAME
```

Typical local configuration:

```text
Host: localhost
Port: 3306
Database: restaurant_db
```

Do **not** commit real database passwords or other sensitive credentials to GitHub.

---

# Running the Application

## CLI

From the project root:

```powershell
python -m application.app
```

## Web Application

From the project root:

````powershell
python -m application.web_app
```ko

Then open:

```text
http://127.0.0.1:5000/
````

The web application exposes separate pages for Dashboard, Reservations, Tables, Orders, Kitchen, Billing, and Reports.

---

# API Endpoints

The Flask application provides APIs for the main modules, including:

```text
/api/health
/api/dashboard
/api/customers
/api/tables

/api/reservations
/api/reservations/availability

/api/orders
/api/orders/<order_id>
/api/orders/<order_id>/items
/api/orders/<order_id>/close

/api/kitchen/tickets
/api/kitchen/tickets/queued
/api/kitchen/tickets/<ticket_id>/preparing
/api/kitchen/tickets/<ticket_id>/ready
/api/kitchen/tickets/<ticket_id>/served

/api/bills
/api/bills/generate
/api/payments

/api/reports/available-tables
/api/reports/table-turnover
/api/reports/waiter-performance
/api/reports/item-sales
/api/reports/kitchen-delays
/api/reports/discount-usage
/api/reports/revenue
```

The exact route set is implemented in:

```text
application/web/routes.py
```

---

# Testing & Validation

The system was tested using both positive and negative cases.

## Reservation Tests

| Test                               | Expected Result                         | Status |
| ---------------------------------- | --------------------------------------- | ------ |
| Check table availability           | Suitable tables displayed               | PASS   |
| Guest count exceeds table capacity | No suitable table / reservation blocked | PASS   |
| Overlapping reservation            | Conflicting table excluded              | PASS   |
| Valid reservation creation         | Reservation created successfully        | PASS   |

## Order Tests

| Test           | Expected Result                             | Status |
| -------------- | ------------------------------------------- | ------ |
| Create order   | Order and kitchen ticket created            | PASS   |
| Add valid item | Item added with current menu price snapshot | PASS   |
| Quantity = 0   | Rejected                                    | PASS   |
| Quantity = -1  | Rejected                                    | PASS   |
| Close order    | Order becomes Closed                        | PASS   |

## Kitchen Tests

| Test               | Expected Result                        | Status |
| ------------------ | -------------------------------------- | ------ |
| Queued → Preparing | Status updated                         | PASS   |
| Preparing → Ready  | Status updated and ready time recorded | PASS   |
| Ready → Served     | Status updated                         | PASS   |

## Billing & Payment Tests

| Test                           | Expected Result  | Status |
| ------------------------------ | ---------------- | ------ |
| Bill active order              | Rejected         | PASS   |
| Generate bill for closed order | Bill generated   | PASS   |
| Correct tax/total calculation  | Correct values   | PASS   |
| Exact payment                  | Payment accepted | PASS   |
| Duplicate payment              | Rejected         | PASS   |
| Paid bill modification         | Rejected         | PASS   |

## Report Tests

All seven report APIs were verified successfully:

| Report             | Status |
| ------------------ | ------ |
| Available Tables   | PASS   |
| Table Turnover     | PASS   |
| Waiter Performance | PASS   |
| Item Sales         | PASS   |
| Kitchen Delays     | PASS   |
| Discount Usage     | PASS   |
| Revenue            | PASS   |

---

# Final Database Integrity Audit

After functional testing, the following database consistency checks were executed:

| Audit                      | Result |
| -------------------------- | -----: |
| Orphan reservations        |    `0` |
| Invalid order items        |    `0` |
| Orphan order items         |    `0` |
| Paid bills without payment |    `0` |
| Unpaid bills with payment  |    `0` |
| Bills with invalid totals  |    `0` |

The audit confirms that the tested database state contains no detected orphan records, invalid order quantities, payment-status inconsistencies, or negative/invalid bill totals.

---

# Verified End-to-End Transaction

The final web application workflow was successfully demonstrated using **Order #24**.

```text
Order ID        : 24
Table           : T06
Waiter          : Arjun Rao

Order Item:
Chicken Biryani × 1

Unit Price      : ₹350.00
Line Total      : ₹350.00

Kitchen Ticket  : 23
Kitchen Status  : Served

Order Status    : Closed

Bill ID         : 20
Subtotal        : ₹350.00
Tax             : ₹17.50
Total           : ₹367.50

Payment Method  : UPI
Payment Amount  : ₹367.50

Bill Status     : Paid
```

The database verification confirmed the complete relationship:

```text
Order #24
    ↓
Kitchen Ticket #23
    ↓
Served
    ↓
Order Closed
    ↓
Bill #20
    ↓
₹367.50
    ↓
Payment
    ↓
Paid
```

This provides an end-to-end demonstration from order creation through kitchen processing, billing, and payment.

---

# Security & Reliability

The project uses several mechanisms to improve data safety:

### Parameterized SQL

User-provided values are passed through SQL parameters rather than string concatenation.

### Database Constraints

Invalid values are rejected at the database level.

### Foreign Keys

Relationships between entities are protected by referential integrity.

### Transactions

Critical multi-step operations use transactions.

### Row Locking

Reservation and payment procedures use row locking where required to protect concurrent operations.

### Paid Bill Protection

Paid financial records cannot be modified through normal update operations.

### Configuration Security

Database credentials should be kept outside publicly shared source code.

---

# Error Handling

The Python service layer handles MySQL exceptions using:

```python
from mysql.connector import Error
```

Operations return structured responses such as:

```python
{
    "success": True,
    "message": "..."
}
```

or:

```python
{
    "success": False,
    "message": "..."
}
```

This keeps database-specific error handling inside the application/service layers rather than exposing raw database errors directly to the user interface.

---

# Design Decisions

## Why MySQL?

MySQL is suitable because the project requires:

- Foreign keys
- Constraints
- Transactions
- Stored procedures
- Triggers
- Relational queries
- Aggregation and reporting

## Why a Service Layer?

The service layer separates:

```text
User Interface
      ↓
Business Logic
      ↓
Database
```

This allows the CLI and web interface to reuse the same business logic.

## Why Store Historical Prices?

Menu prices may change over time. An existing order must retain the price that applied when the order was created.

Therefore:

```text
MENU_ITEM.price
```

represents the current menu price, while:

```text
ORDER_ITEM.unit_price
```

represents the transaction price.

## Why Use Database Triggers?

Application validation alone cannot guarantee integrity if data is modified through another application or directly through SQL. Database triggers provide an additional database-level enforcement layer.

---

# Scalability and Future Enhancements

Possible future improvements include:

- Authentication and role-based access control
- Customer portal
- Mobile application
- Real payment gateway integration
- Inventory management
- Customer notifications
- Real-time kitchen notifications
- Audit logging
- Centralized application logging
- Automated test suite
- Database migrations
- Docker deployment
- CI/CD
- Cloud-hosted deployment
- Connection pooling
- Redis caching
- Background workers
- Advanced restaurant analytics
- Revenue forecasting
- Demand prediction

---

# Learning Outcomes

This project demonstrates practical understanding of:

- Relational database design
- ER modeling
- Primary and foreign keys
- Normalization and 3NF
- SQL constraints
- Referential integrity
- SQL joins
- Aggregation
- Stored procedures
- Triggers
- Transactions
- Row locking
- Python–MySQL connectivity
- Flask API development
- Service-layer architecture
- Exception handling
- Business-rule enforcement
- Database testing
- Data integrity validation
- Operational reporting

---

# Architecture Explanation

A concise explanation for project demonstration:

> The Restaurant Table Reservation and Food Service Management System is a layered Python and MySQL application. The CLI handles user interaction, the service layer contains application-level business logic, and the database layer manages MySQL connectivity. MySQL provides additional integrity through constraints, triggers, stored procedures, foreign keys, and transactions. The system covers the complete restaurant workflow from reservation and order creation to kitchen processing, billing, and payment.

---

# Review 3 Validation Status

```text
┌────────────────────────────────────────────┐
│       PROJECT VALIDATION STATUS            │
├────────────────────────────────────────────┤
│ Reservation Management             PASS    │
│ Table Availability                 PASS    │
│ Capacity Validation                PASS    │
│ Overlap Protection                 PASS    │
│ Order Management                   PASS    │
│ Order Item Validation              PASS    │
│ Kitchen Management                 PASS    │
│ Kitchen State Transitions          PASS    │
│ Billing                            PASS    │
│ Discount Validation                PASS    │
│ Payment Processing                 PASS    │
│ Duplicate Payment Protection       PASS    │
│ Reports (7/7)                      PASS    │
│ Database Integrity (6/6)          PASS    │
│ End-to-End Transaction             PASS    │
└────────────────────────────────────────────┘
```

---

# Project Status

**Status: Completed and Functionally Validated**

The current implementation successfully demonstrates:

- Complete restaurant operational workflow
- MySQL relational database integration
- CLI and Flask web interfaces
- Database-level integrity mechanisms
- Application-level business rules
- Kitchen state management
- Billing and payment processing
- Operational reporting
- Positive and negative testing
- Final database consistency validation

---

# Author

**Vindhya Lekhana**

B.Tech Computer Science & Engineering  
Specialization: Blockchain, IoT & Cybersecurity
