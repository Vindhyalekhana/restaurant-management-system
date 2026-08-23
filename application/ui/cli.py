from application.services.reservation_service import ReservationService
from application.services.order_service import OrderService
from application.services.kitchen_service import KitchenService
from application.services.billing_service import BillingService
from application.services.payment_service import PaymentService
from application.reports.report_service import ReportService


# ============================================================
# COMMON OUTPUT / INPUT HELPERS
# ============================================================

def print_result(res):
    """
    Displays service results consistently.

    Supports:
    - message
    - order_id
    - ticket_id
    - bill_id
    - payment_id
    - data
    """
    if res.get("success"):
        if "message" in res:
            print(f"\n[OK] {res['message']}")

        # Display generated IDs when returned by services
        if "order_id" in res:
            print(f"Order ID: {res['order_id']}")

        if "ticket_id" in res:
            print(f"Kitchen Ticket ID: {res['ticket_id']}")

        if "bill_id" in res:
            print(f"Bill ID: {res['bill_id']}")

        if "payment_id" in res:
            print(f"Payment ID: {res['payment_id']}")

        if "data" in res and res["data"]:
            import pprint
            print("\n--- Data ---")
            pprint.pprint(res["data"])

    else:
        print(
            f"\n[ERROR] "
            f"{res.get('message', 'Unknown error occurred.')}"
        )


def get_int_input(prompt):
    """
    Safely reads an integer from the user.
    Pressing Enter returns None.
    """
    while True:
        try:
            val = input(prompt)

            if not val.strip():
                return None

            return int(val)

        except ValueError:
            print("Please enter a valid integer.")


def get_float_input(prompt):
    """
    Safely reads a floating-point number.
    Pressing Enter returns None.
    """
    while True:
        try:
            val = input(prompt)

            if not val.strip():
                return None

            return float(val)

        except ValueError:
            print("Please enter a valid number.")


# ============================================================
# RESERVATION MANAGEMENT
# ============================================================

def reservation_menu():

    while True:

        print("\n---------------- RESERVATIONS ----------------")
        print("1. Check Table Availability")
        print("2. Create Reservation")
        print("3. View Reservations")
        print("4. Cancel Reservation")
        print("0. Back")

        choice = input("\nEnter choice: ")

        # ----------------------------------------------------
        # Check availability
        # ----------------------------------------------------
        if choice == "1":

            date = input("Date (YYYY-MM-DD): ")
            start = input("Start Time (HH:MM): ")
            end = input("End Time (HH:MM): ")
            guests = get_int_input("Guest Count: ")

            print_result(
                ReservationService.check_availability(
                    date,
                    start,
                    end,
                    guests
                )
            )

        # ----------------------------------------------------
        # Create reservation
        # ----------------------------------------------------
        elif choice == "2":

            cust_id = get_int_input("Customer ID: ")
            table_id = get_int_input("Table ID: ")
            date = input("Date (YYYY-MM-DD): ")
            start = input("Start Time (HH:MM): ")
            end = input("End Time (HH:MM): ")
            guests = get_int_input("Guest Count: ")
            special = input("Special Requests (optional): ")

            print_result(
                ReservationService.create_reservation(
                    cust_id,
                    table_id,
                    date,
                    start,
                    end,
                    guests,
                    special if special else None
                )
            )

        # ----------------------------------------------------
        # View reservations
        # ----------------------------------------------------
        elif choice == "3":

            cust_id = get_int_input(
                "Customer ID (optional, press Enter to skip): "
            )

            date = input(
                "Date (YYYY-MM-DD) "
                "(optional, press Enter to skip): "
            )

            print_result(
                ReservationService.view_reservations(
                    cust_id,
                    date if date else None
                )
            )

        # ----------------------------------------------------
        # Cancel reservation
        # ----------------------------------------------------
        elif choice == "4":

            res_id = get_int_input("Reservation ID: ")

            print_result(
                ReservationService.cancel_reservation(res_id)
            )

        # ----------------------------------------------------
        # Back
        # ----------------------------------------------------
        elif choice == "0":
            break

        else:
            print("Invalid choice.")


# ============================================================
# ORDER MANAGEMENT
# ============================================================

def order_menu():

    while True:

        print("\n---------------- ORDERS ----------------")
        print("1. Create Order")
        print("2. Add Order Item")
        print("3. View Order")
        print("4. Close Order")
        print("0. Back")

        choice = input("\nEnter choice: ")

        # ----------------------------------------------------
        # Create order
        # ----------------------------------------------------
        if choice == "1":

            table_id = get_int_input("Table ID: ")
            waiter_id = get_int_input("Waiter ID: ")

            res_id = get_int_input(
                "Reservation ID "
                "(optional, press Enter for walk-in): "
            )

            result = OrderService.create_order(
                table_id,
                waiter_id,
                res_id
            )

            print_result(result)

        # ----------------------------------------------------
        # Add order item
        # ----------------------------------------------------
        elif choice == "2":

            order_id = get_int_input("Order ID: ")
            item_id = get_int_input("Menu Item ID: ")
            quantity = get_int_input("Quantity: ")

            special = input(
                "Special Instructions (optional): "
            )

            print_result(
                OrderService.add_order_item(
                    order_id,
                    item_id,
                    quantity,
                    special if special else None
                )
            )

        # ----------------------------------------------------
        # View order
        # ----------------------------------------------------
        elif choice == "3":

            order_id = get_int_input("Order ID: ")

            print_result(
                OrderService.view_order(order_id)
            )

        # ----------------------------------------------------
        # Close order
        # ----------------------------------------------------
        elif choice == "4":

            order_id = get_int_input("Order ID: ")

            print_result(
                OrderService.close_order(order_id)
            )

        # ----------------------------------------------------
        # Back
        # ----------------------------------------------------
        elif choice == "0":
            break

        else:
            print("Invalid choice.")


# ============================================================
# KITCHEN MANAGEMENT
# ============================================================

def kitchen_menu():

    while True:

        print("\n---------------- KITCHEN ----------------")
        print("1. View Queued Tickets")
        print("2. View Active/Preparing Tickets")
        print("3. Mark Preparing")
        print("4. Mark Ready")
        print("5. Mark Served")
        print("0. Back")

        choice = input("\nEnter choice: ")

        # ----------------------------------------------------
        # Queued tickets
        # ----------------------------------------------------
        if choice == "1":

            print_result(
                KitchenService.view_queued_tickets()
            )

        # ----------------------------------------------------
        # Active tickets
        # ----------------------------------------------------
        elif choice == "2":

            print_result(
                KitchenService.view_active_tickets()
            )

        # ----------------------------------------------------
        # Update ticket status
        # ----------------------------------------------------
        elif choice in ("3", "4", "5"):

            ticket_id = get_int_input("Ticket ID: ")

            if choice == "3":

                print_result(
                    KitchenService.update_preparing(ticket_id)
                )

            elif choice == "4":

                print_result(
                    KitchenService.update_ready(ticket_id)
                )

            elif choice == "5":

                print_result(
                    KitchenService.update_served(ticket_id)
                )

        # ----------------------------------------------------
        # Back
        # ----------------------------------------------------
        elif choice == "0":
            break

        else:
            print("Invalid choice.")


# ============================================================
# BILLING & PAYMENT
# ============================================================

def billing_menu():

    while True:

        print("\n---------------- BILLING ----------------")
        print("1. Generate Bill")
        print("2. View Bill")
        print("3. Process Payment")
        print("0. Back")

        choice = input("\nEnter choice: ")

        # ----------------------------------------------------
        # Generate bill
        # ----------------------------------------------------
        if choice == "1":

            order_id = get_int_input("Order ID: ")

            apply_disc = input(
                "Apply Discount? (Y/N): "
            ).strip().upper()

            discount_id = None
            waiter_id = None

            if apply_disc == "Y":

                discount_id = get_int_input(
                    "Discount ID: "
                )

                waiter_id = get_int_input(
                    "Authorizing Waiter ID: "
                )

            print_result(
                BillingService.generate_bill(
                    order_id,
                    discount_id,
                    waiter_id
                )
            )

        # ----------------------------------------------------
        # View bill
        # ----------------------------------------------------
        elif choice == "2":

            bill_id = get_int_input("Bill ID: ")

            print_result(
                BillingService.view_bill(bill_id)
            )

        # ----------------------------------------------------
        # Process payment
        # ----------------------------------------------------
        elif choice == "3":

            bill_id = get_int_input("Bill ID: ")

            method = input(
                "Payment Method (Cash/Card/UPI): "
            ).strip()

            amount = get_float_input(
                "Amount: "
            )

            print_result(
                PaymentService.process_payment(
                    bill_id,
                    method,
                    amount
                )
            )

        # ----------------------------------------------------
        # Back
        # ----------------------------------------------------
        elif choice == "0":
            break

        else:
            print("Invalid choice.")


# ============================================================
# REPORTS
# ============================================================

def reports_menu():

    while True:

        print("\n---------------- REPORTS ----------------")
        print("1. Available Tables")
        print("2. Table Turnover")
        print("3. Waiter Performance")
        print("4. Item Sales")
        print("5. Kitchen Delays")
        print("6. Discount Usage")
        print("7. Revenue")
        print("0. Back")

        choice = input("\nEnter choice: ")

        if choice == "1":

            print_result(
                ReportService.available_tables()
            )

        elif choice == "2":

            print_result(
                ReportService.table_turnover()
            )

        elif choice == "3":

            print_result(
                ReportService.waiter_performance()
            )

        elif choice == "4":

            print_result(
                ReportService.item_sales()
            )

        elif choice == "5":

            print_result(
                ReportService.kitchen_delays()
            )

        elif choice == "6":

            print_result(
                ReportService.discount_usage()
            )

        elif choice == "7":

            print_result(
                ReportService.revenue()
            )

        elif choice == "0":
            break

        else:
            print("Invalid choice.")


# ============================================================
# MAIN APPLICATION
# ============================================================

def run_cli():

    while True:

        print("\n==================================================")
        print("   RESTAURANT TABLE RESERVATION & FOOD SERVICE")
        print("==================================================")

        print("1. Reservation Management")
        print("2. Order Management")
        print("3. Kitchen Management")
        print("4. Billing & Payment")
        print("5. Reports")
        print("0. Exit")

        choice = input("\nEnter choice: ")

        if choice == "1":

            reservation_menu()

        elif choice == "2":

            order_menu()

        elif choice == "3":

            kitchen_menu()

        elif choice == "4":

            billing_menu()

        elif choice == "5":

            reports_menu()

        elif choice == "0":

            print("\nExiting application. Goodbye!")
            break

        else:

            print("Invalid choice. Please select 0-5.")