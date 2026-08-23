# Restaurant Table Reservation & Food Service Management System

> A database-driven restaurant management system that handles reservations, table allocation, orders, kitchen operations, billing, payments, and analytical reports through a Python CLI application backed by MySQL.

---

## Overview

The **Restaurant Table Reservation & Food Service Management System** is a Python + MySQL application designed to manage the complete operational workflow of a restaurant.

The system connects the customer reservation process with restaurant tables, waiters, food orders, kitchen tickets, billing, discounts, and payments while enforcing business rules at the database level.

The project focuses on:

- Relational database design
- Referential integrity
- SQL constraints
- Database triggers
- Stored procedures
- Transactions
- Python service-layer architecture
- Historical item pricing
- Kitchen workflow management
- Billing and payment validation
- Operational reporting
- Negative/error-case testing

---

## Key Features

### Reservation Management

- Check table availability
- Create reservations
- View reservations
- Cancel reservations
- Validate table capacity
- Prevent overlapping reservations
- Associate customers with restaurant tables
- Support special requests

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

- Automatically create kitchen tickets for new orders
- Queue orders
- Mark orders as preparing
- Mark orders as ready
- Mark orders as served
- Track kitchen preparation times

### Billing

- Generate bills from orders
- Calculate subtotal
- Apply discounts
- Calculate tax
- Calculate final total
- View bills
- Prevent modification of paid bills

### Payment

- Support:
  - Cash
  - Card
  - UPI

- Validate exact payment amount

- Prevent payment of already-paid bills

- Automatically mark bills as paid

- Record payment timestamps

### Reports

The application provides reports for:

- Available tables
- Table turnover
- Waiter performance
- Item sales
- Kitchen delays
- Discount usage
- Revenue

---

# System Architecture

The project follows a layered architecture:

```text
┌──────────────────────────────────────────┐
│              CLI / UI Layer              │
│             application/ui               │
│                 cli.py                   │
└────────────────────┬─────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────┐
│              Service Layer               │
│                                          │
│ ReservationService                       │
│ OrderService                             │
│ KitchenService                           │
│ BillingService                           │
│ PaymentService                            │
│ ReportService                             │
└────────────────────┬─────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────┐
│             Database Layer               │
│                                          │
│ get_connection()                         │
│ execute_query()                          │
│ execute_procedure()                      │
└────────────────────┬─────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────┐
│                 MySQL                    │
│                                          │
│ Tables                                   │
│ Constraints                              │
│ Triggers                                 │
│ Stored Procedures                        │
│ Transactions                             │
└──────────────────────────────────────────┘
```

---

# Technology Stack

| Technology               | Purpose                           |
| ------------------------ | --------------------------------- |
| Python                   | Application logic                 |
| MySQL                    | Relational database               |
| `mysql-connector-python` | Python–MySQL connectivity         |
| SQL                      | Database operations               |
| Stored Procedures        | Transactional database operations |
| Triggers                 | Business-rule enforcement         |
| Git/GitHub               | Version control                   |

---

# Project Structure

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
│   │   ├── payment_service.py
│   │   └── ...
│   │
│   ├── reports/
│   │   └── report_service.py
│   │
│   └── ui/
│       └── cli.py
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

> The exact file list may vary depending on the final project directory. The database scripts shown above reflect the project files and commands used during implementation.

---

# Database Design

The system uses a relational database named:

```sql
restaurant_db
```

The main entities are:

```text
CUSTOMER
    │
    └── RESERVATION
             │
             └── RESTAURANT_TABLE
                      │
                      └── DINING_AREA

WAITER
    │
    └── RESTAURANT_ORDER
             │
             ├── ORDER_ITEM ─── MENU_ITEM
             │
             └── KITCHEN_TICKET
             │
             └── BILL
                    │
                    └── PAYMENT

DISCOUNT
    │
    └── BILL
```

---

# Main Database Entities

## CUSTOMER

Stores restaurant customers.

Typical information includes:

- Customer ID
- First name
- Last name
- Phone number
- Email
- Registration date

---

## DINING_AREA

Represents different areas of the restaurant.

Example areas:

- Indoor Dining
- Outdoor Dining
- Family Dining
- Private Dining

---

## RESTAURANT_TABLE

Stores individual restaurant tables.

Important attributes include:

- Table ID
- Dining area
- Table number
- Capacity
- Status

Example statuses:

```text
Available
Occupied
Reserved
Maintenance
```

---

## WAITER

Stores restaurant waiter information.

Important attributes:

- Waiter ID
- First name
- Last name
- Phone number
- Hire date
- Status

---

## MENU_ITEM

Stores food and beverage items.

Important attributes:

- Item ID
- Name
- Description
- Category
- Price
- Availability

Example categories:

```text
Starter
Main Course
Dessert
Beverage
```

---

## DISCOUNT

Stores discount offers.

Attributes include:

- Discount ID
- Discount name
- Percentage
- Active/inactive status

---

## RESERVATION

Stores customer table reservations.

Important attributes:

- Reservation ID
- Customer ID
- Table ID
- Reservation date
- Start time
- End time
- Guest count
- Status
- Special requests

Reservation statuses include:

```text
Pending
Confirmed
Seated
Cancelled
```

---

## RESTAURANT_ORDER

Stores restaurant orders.

An order may either:

- reference a reservation, or
- represent a walk-in order using `reservation_id = NULL`.

Important attributes include:

- Order ID
- Reservation ID
- Table ID
- Waiter ID
- Order date
- Order time
- Status

---

## ORDER_ITEM

Acts as the relationship between orders and menu items.

It stores:

- Order item ID
- Order ID
- Item ID
- Quantity
- Unit price
- Special instructions

### Historical Pricing

The system deliberately stores the price in:

```text
ORDER_ITEM.unit_price
```

instead of always reading the current price from `MENU_ITEM`.

For example:

```text
Menu price today:       ₹280
Historical order price: ₹250
```

The order can therefore retain its original transaction price even if the menu price changes later.

---

## KITCHEN_TICKET

Tracks kitchen processing for orders.

Important fields include:

- Ticket ID
- Order ID
- Generated time
- Ready time
- Status

Kitchen statuses include:

```text
Queued
Preparing
Ready
Served
```

---

## BILL

Stores financial information associated with an order.

Important attributes:

- Bill ID
- Order ID
- Discount ID
- Authorizing waiter
- Generation time
- Closed time
- Subtotal
- Discount amount
- Tax amount
- Total amount
- Status

Bill statuses:

```text
Unpaid
Paid
```

---

## PAYMENT

Stores completed payments.

Important attributes:

- Payment ID
- Bill ID
- Payment time
- Payment method
- Amount paid

Supported methods:

```text
Cash
Card
UPI
```

---

# Database Integrity

The project does not depend solely on Python validation.

Business rules are enforced at multiple levels:

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

This provides defense in depth for data integrity.

---

# Important Constraints

The project includes database constraints for rules such as:

### Order Quantity

```text
quantity > 0
```

Invalid values such as:

```text
-1
0
```

are rejected by:

```text
chk_order_quantity
```

### Unit Price

Order item prices cannot be negative.

### Referential Integrity

Foreign keys prevent references to non-existent:

- Customers
- Tables
- Orders
- Menu items
- Bills
- Payments
- Reservations
- Waiters

---

# Database Triggers

## Reservation Capacity

```text
trg_reservation_capacity_insert
trg_reservation_capacity_update
```

These triggers prevent a reservation from exceeding the capacity of its assigned table.

Example:

```text
Table capacity = 2
Guest count    = 5
        ↓
Reservation rejected
```

---

## Order/Reservation Consistency

```text
trg_order_consistency_insert
trg_order_consistency_update
```

Ensures that an order associated with a reservation uses the same table as the reservation.

Example:

```text
Reservation 5 → Table 7
Order         → Table 5

Result:
Order rejected
```

---

## Discount Authorization

```text
trg_discount_auth_insert
trg_discount_auth_update
```

When a discount is applied:

1. The discount must be active.
2. An authorizing waiter must be specified.
3. The waiter must be active.

---

## Paid Bill Immutability

```text
trg_bill_immutability_update
```

Once a bill is marked:

```text
Paid
```

it cannot be modified.

This protects financial records from accidental or unauthorized changes.

---

# Stored Procedures

## `sp_create_reservation`

Responsible for controlled reservation creation.

The procedure:

1. Starts a transaction.
2. Locks the relevant table row.
3. Checks table capacity.
4. Checks reservation overlap.
5. Inserts the reservation.
6. Commits the transaction.

If validation fails, the transaction is rolled back.

---

## `sp_process_payment`

Responsible for payment processing.

The procedure:

1. Starts a transaction.
2. Locks the bill.
3. Checks the bill status.
4. Validates the payment amount.
5. Inserts the payment.
6. Changes the bill status to `Paid`.
7. Records the closing timestamp.
8. Commits the transaction.

If any validation fails:

```text
ROLLBACK
```

is performed.

---

# Transaction Flow

A typical successful transaction follows:

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

### `execute_query()`

Provides a common interface for:

- SELECT
- INSERT
- UPDATE
- DELETE

It also:

- creates a connection,
- executes parameterized SQL,
- commits successful changes,
- rolls back failed transactions,
- closes the cursor,
- closes the database connection.

### Parameterized Queries

The project uses parameterized queries such as:

```python
cursor.execute(query, params)
```

instead of directly concatenating user input into SQL.

This is important for security and reliability.

---

# Order Service

The main order functionality is implemented through:

```text
application/services/order_service.py
```

The service handles:

```text
create_order()
add_order_item()
view_order()
close_order()
```

The service layer communicates with MySQL through:

```python
execute_query()
```

---

# Kitchen Integration

When an order is created, the application also creates its kitchen ticket.

The verified example was:

```text
Order ID       : 20
Kitchen Ticket : 19
Kitchen Status : Queued
```

The ticket was then successfully moved through:

```text
Queued
   ↓
Preparing
   ↓
Ready
   ↓
Served
```

---

# Billing Calculation

The system calculates:

```text
Total Amount =
Subtotal - Discount Amount + Tax Amount
```

Example from the verified transaction:

```text
Subtotal       = ₹280.00
Discount       = ₹0.00
Tax            = ₹14.00
-----------------------
Total          = ₹294.00
```

---

# Verified End-to-End Transaction

One complete transaction was successfully tested using **Order 20**.

```text
Order ID       : 20
Table ID       : 5
Waiter         : Arjun Rao

Order Item:
Veg Biryani × 1
Unit Price: ₹280.00

Kitchen Ticket:
Ticket ID: 19
Final Status: Served

Bill:
Bill ID: 17
Subtotal: ₹280.00
Tax: ₹14.00
Total: ₹294.00
Status: Paid

Payment:
Payment ID: 16
Method: UPI
Amount: ₹294.00
```

This transaction demonstrates the complete operational lifecycle:

```text
Order
 ↓
Kitchen
 ↓
Billing
 ↓
Payment
```

---

# Testing & Validation

The system was tested using both positive and negative test cases.

## Positive Tests

- Valid order creation
- Valid order item insertion
- Order retrieval
- Order closing
- Kitchen ticket creation
- Kitchen status transitions
- Bill generation
- Payment processing
- Correct bill calculation

## Negative Tests

### Invalid Quantity

```text
Quantity = -1
```

Result:

```text
Rejected
```

### Zero Quantity

```text
Quantity = 0
```

Result:

```text
Rejected
```

### Unavailable Menu Item

Mutton Curry was configured as unavailable.

Result:

```text
Rejected
```

### Capacity Violation

A reservation exceeding table capacity was attempted.

Result:

```text
Rejected
```

### Overlapping Reservation

A reservation overlapping an existing reservation was attempted.

Result:

```text
Rejected
```

### Order/Reservation Mismatch

An order was deliberately created using a table different from its reservation.

Result:

```text
Rejected
```

### Paid Bill Modification

A paid bill was deliberately modified.

Result:

```text
Rejected
```

---

# Final Database Audit

After testing, consistency checks were executed.

| Audit                       | Result |
| --------------------------- | -----: |
| Orphan reservations         |    `0` |
| Invalid order items         |    `0` |
| Orphan order items          |    `0` |
| Paid bills without payment  |    `0` |
| Unpaid bills with payment   |    `0` |
| Incorrect bill calculations |    `0` |

The bill calculation validation returned:

```text
Empty set
```

which means no bill violated the expected calculation.

---

# Final Database State After Testing

The final verified database contained:

| Entity            | Records |
| ----------------- | ------: |
| Customers         |      18 |
| Reservations      |      22 |
| Restaurant Orders |      20 |
| Order Items       |      37 |
| Kitchen Tickets   |      19 |
| Bills             |      17 |
| Payments          |      16 |

The additional records were generated during application testing.

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

Create/use the database according to the project's SQL scripts.

At minimum:

```sql
CREATE DATABASE restaurant_db;
USE restaurant_db;
```

Then execute the database scripts in their intended order.

For example:

```text
database/
├── 01_schema.sql
├── 02_constraints.sql
├── ...
├── 05_advanced_integrity.sql
└── 06_sample_data.sql
```

The exact execution order should follow the dependencies between the schema, constraints, advanced integrity objects, and sample data.

---

# Python Environment

From the project directory:

```powershell
cd "C:\Users\vindh\Desktop\projects\Restaurant Table Reservation & Food Service Management System"
```

Install dependencies:

```powershell
pip install -r requirements.txt
```

If `mysql-connector-python` is not already listed in `requirements.txt`:

```powershell
pip install mysql-connector-python
```

---

# Database Configuration

Database credentials are loaded through:

```text
application/config.py
```

The configuration should provide values equivalent to:

```text
DB_HOST
DB_PORT
DB_USER
DB_PASSWORD
DB_NAME
```

Example:

```text
Host: localhost
Port: 3306
Database: restaurant_db
```

Do **not** commit real database passwords to GitHub.

For a public repository, environment variables should be preferred.

---

# Running the Application

From the project root:

```powershell
python -m application.app
```

The application opens the main CLI:

```text
==================================================
   RESTAURANT TABLE RESERVATION & FOOD SERVICE
==================================================
1. Reservation Management
2. Order Management
3. Kitchen Management
4. Billing & Payment
5. Reports
0. Exit
```

---

# CLI Modules

## Reservation Management

```text
1. Check Table Availability
2. Create Reservation
3. View Reservations
4. Cancel Reservation
0. Back
```

## Order Management

```text
1. Create Order
2. Add Order Item
3. View Order
4. Close Order
0. Back
```

## Kitchen Management

```text
1. View Queued Tickets
2. View Active/Preparing Tickets
3. Mark Preparing
4. Mark Ready
5. Mark Served
0. Back
```

## Billing & Payment

```text
1. Generate Bill
2. View Bill
3. Process Payment
0. Back
```

## Reports

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

# Security Considerations

The project uses several mechanisms to improve data safety.

### Parameterized SQL

User-provided values are passed through parameters rather than string concatenation.

### Database Constraints

Invalid data is rejected at the database level.

### Transactions

Critical multi-step operations use transactions.

### Row Locking

The reservation and payment procedures use `FOR UPDATE` where required to protect concurrent operations.

### Paid Bill Protection

Paid bills cannot be modified through normal updates.

### Configuration Security

Database credentials should not be hard-coded into publicly shared source code.

---

# Error Handling

The Python service layer catches MySQL errors using:

```python
from mysql.connector import Error
```

Errors are converted into structured responses such as:

```python
{
    "success": False,
    "message": "..."
}
```

Successful operations use responses such as:

```python
{
    "success": True,
    "message": "..."
}
```

This keeps the CLI layer separate from database-specific error handling.

---

# Design Decisions

## Why MySQL?

MySQL is suitable because the project contains highly related entities and requires:

- Foreign keys
- Constraints
- Transactions
- Stored procedures
- Triggers
- Relational queries

## Why a Service Layer?

The service layer separates:

```text
User Interface
       ↓
Business Logic
       ↓
Database
```

This makes the system easier to maintain and extend.

## Why Store Historical Prices?

Menu prices can change. An old order should retain the price that was applicable when it was created.

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

Application validation alone is insufficient because database records could potentially be modified by another application or direct SQL.

Triggers provide database-level enforcement.

---

# Scalability Considerations

For a larger production deployment, the following improvements could be introduced:

- REST API layer
- Web/mobile frontend
- Authentication and role-based access control
- Connection pooling
- Database migrations
- Centralized logging
- Audit logs
- Automated testing
- Docker deployment
- CI/CD
- Cloud-hosted MySQL
- Redis caching
- Background workers
- Real-time kitchen notifications
- Payment gateway integration
- Inventory management
- Customer notifications

---

# Limitations

The current implementation is primarily a **CLI-based academic/project system**.

Potential future improvements include:

- Graphical/web interface
- User authentication
- Role-based authorization
- Production-grade concurrency handling across all workflows
- Advanced inventory management
- Real payment gateway integration
- Automated notification systems
- Comprehensive automated test suite
- Production deployment configuration

---

# Future Enhancements

### Customer Portal

Customers could:

- Register/login
- Browse menus
- Reserve tables
- View reservation status
- Place orders
- View bills

### Restaurant Dashboard

Management could monitor:

- Table occupancy
- Revenue
- Popular dishes
- Waiter performance
- Kitchen delays
- Reservation trends

### Kitchen Dashboard

Kitchen staff could receive real-time:

```text
Queued → Preparing → Ready → Served
```

notifications.

### Analytics

Future versions could include:

- Peak-hour analysis
- Revenue forecasting
- Demand prediction
- Menu popularity analysis
- Table utilization analytics

---

# Learning Outcomes

This project demonstrates practical understanding of:

- Relational database design
- Entity relationships
- Primary and foreign keys
- SQL constraints
- Joins
- Aggregation
- Stored procedures
- Triggers
- Transactions
- Row locking
- Python database connectivity
- Service-layer architecture
- Exception handling
- Business-rule enforcement
- Database testing
- Data integrity validation

---

# Viva-Ready Architecture Explanation

A concise explanation for project demonstration:

> The Restaurant Table Reservation and Food Service Management System is a layered Python and MySQL application. The CLI handles user interaction, the service layer contains application-level business logic, and the database layer manages MySQL connectivity. MySQL provides additional integrity through constraints, triggers, stored procedures, foreign keys, and transactions. The system covers the complete restaurant workflow from reservation and order creation to kitchen processing, billing, and payment.

---

# Project Validation Status

```text
┌──────────────────────────────────────┐
│       PROJECT VALIDATION STATUS      │
├──────────────────────────────────────┤
│ Reservation Management       PASS    │
│ Order Management             PASS    │
│ Kitchen Management           PASS    │
│ Billing                      PASS    │
│ Payment                      PASS    │
│ Database Integrity           PASS    │
│ Constraints                  PASS    │
│ Triggers                     PASS    │
│ Stored Procedures            PASS    │
│ Transaction Handling         PASS    │
│ Negative Testing             PASS    │
│ Final Consistency Audit       PASS    │
└──────────────────────────────────────┘
```

---

# Author

**Vindhya Lekhana**

B.Tech Computer Science & Engineering
Specialization: Blockchain, IoT & Cybersecurity

---

# License

This project was developed as an academic project. Unless a separate license is added to the repository, the source code should be treated as **academic/project work** and not assumed to be freely licensed for redistribution.

---

## Project Status

**Status: Completed and Functionally Validated**

The current implementation has successfully demonstrated the core restaurant workflow, database integrity mechanisms, application-layer integration, error handling, and final database consistency checks.
