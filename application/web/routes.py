from datetime import date, datetime, time, timedelta
from decimal import Decimal

from flask import Blueprint, jsonify, render_template, request

from application.database import execute_query, get_connection
from application.reports.report_service import ReportService
from application.services.billing_service import BillingService
from application.services.kitchen_service import KitchenService
from application.services.order_service import OrderService
from application.services.payment_service import PaymentService
from application.services.reservation_service import ReservationService

web_bp = Blueprint(
    "web",
    __name__
)


# --------------------------------------------------
# JSON serialization helper
# --------------------------------------------------

def make_json_safe(value):
    """
    Converts MySQL/Python data types into JSON-compatible values.

    MySQL TIME values are returned by mysql-connector as timedelta.
    DATE, TIME, DATETIME and DECIMAL values also need conversion
    before they can be returned through Flask jsonify().
    """

    if isinstance(value, timedelta):
        total_seconds = int(value.total_seconds())

        hours = total_seconds // 3600
        minutes = (total_seconds % 3600) // 60
        seconds = total_seconds % 60

        return f"{hours:02d}:{minutes:02d}:{seconds:02d}"

    if isinstance(value, datetime):
        return value.isoformat()

    if isinstance(value, date):
        return value.isoformat()

    if isinstance(value, time):
        return value.isoformat()

    if isinstance(value, Decimal):
        return float(value)

    if isinstance(value, dict):
        return {
            key: make_json_safe(item)
            for key, item in value.items()
        }

    if isinstance(value, (list, tuple)):
        return [
            make_json_safe(item)
            for item in value
        ]

    return value


def safe_jsonify(data, status_code=None):
    """
    Returns JSON after converting database values into
    JSON-compatible Python types.
    """

    response = jsonify(
        make_json_safe(data)
    )

    if status_code is not None:
        response.status_code = status_code

    return response


# --------------------------------------------------
# Page routes
# --------------------------------------------------

@web_bp.route("/")
def dashboard_page():
    return render_template(
        "dashboard.html",
        active_page="dashboard"
    )


@web_bp.route("/reservations")
def reservations_page():
    return render_template(
        "reservations.html",
        active_page="reservations"
    )


@web_bp.route("/tables")
def tables_page():
    return render_template(
        "tables.html",
        active_page="tables"
    )


@web_bp.route("/orders")
def orders_page():
    return render_template(
        "orders.html",
        active_page="orders"
    )


@web_bp.route("/kitchen")
def kitchen_page():
    return render_template(
        "kitchen.html",
        active_page="kitchen"
    )


@web_bp.route("/billing")
def billing_page():
    return render_template(
        "billing.html",
        active_page="billing"
    )


@web_bp.route("/reports")
def reports_page():
    return render_template(
        "reports.html",
        active_page="reports"
    )


# --------------------------------------------------
# Health check
# --------------------------------------------------

@web_bp.route("/api/health")
def health_check():

    connection = None

    try:
        connection = get_connection()

        if connection and connection.is_connected():
            return safe_jsonify({
                "status": "success",
                "message": "Database connection is active."
            })

        return safe_jsonify({
            "status": "error",
            "message": "Database connection is unavailable."
        }, 503)

    except Exception as e:
        return safe_jsonify({
            "status": "error",
            "message": f"Database connection failed: {str(e)}"
        }, 503)

    finally:
        if connection and connection.is_connected():
            connection.close()


# --------------------------------------------------
# Dashboard API
# --------------------------------------------------

@web_bp.route("/api/dashboard")
def dashboard():

    try:
        query = """
            SELECT
                (SELECT COUNT(*)
                 FROM RESERVATION
                 WHERE status IN ('Pending', 'Confirmed', 'Seated'))
                    AS active_reservations,

                (SELECT COUNT(*)
                 FROM RESTAURANT_ORDER
                 WHERE status = 'Active')
                    AS active_orders,

                (SELECT COUNT(*)
                 FROM KITCHEN_TICKET
                 WHERE status IN ('Queued', 'Preparing', 'Ready'))
                    AS pending_kitchen,

                (SELECT COUNT(*)
                 FROM BILL
                 WHERE status = 'Unpaid')
                    AS unpaid_bills,

                (SELECT COALESCE(SUM(total_amount), 0)
                 FROM BILL
                 WHERE status = 'Paid')
                    AS total_revenue
        """

        rows = execute_query(
            query,
            fetch=True
        )

        return safe_jsonify({
            "success": True,
            "data": rows[0] if rows else {}
        })

    except Exception as e:
        return safe_jsonify({
            "success": False,
            "message": f"Unable to load dashboard: {str(e)}"
        }, 500)


# --------------------------------------------------
# Customer API
# --------------------------------------------------

@web_bp.route("/api/customers")
def customers():

    query = """
        SELECT
            customer_id,
            first_name,
            last_name
        FROM CUSTOMER
        ORDER BY
            first_name,
            last_name
    """

    try:
        rows = execute_query(
            query,
            fetch=True
        )

        return safe_jsonify({
            "success": True,
            "data": rows
        })

    except Exception as e:
        return safe_jsonify({
            "success": False,
            "message": f"Unable to retrieve customers: {str(e)}"
        }, 500)


# --------------------------------------------------
# Tables API
# --------------------------------------------------

@web_bp.route("/api/tables")
def tables():

    query = """
        SELECT
            t.table_id,
            t.table_number,
            t.capacity,
            t.status,
            a.area_name
        FROM RESTAURANT_TABLE t
        JOIN DINING_AREA a
            ON t.area_id = a.area_id
        ORDER BY
            a.area_name,
            t.table_number
    """

    try:
        rows = execute_query(
            query,
            fetch=True
        )

        return safe_jsonify({
            "success": True,
            "data": rows
        })

    except Exception as e:
        return safe_jsonify({
            "success": False,
            "message": f"Unable to retrieve tables: {str(e)}"
        }, 500)


# --------------------------------------------------
# Reservation API
# --------------------------------------------------

@web_bp.route(
    "/api/reservations",
    methods=["GET"]
)
def get_reservations():

    customer_id = request.args.get(
        "customer_id"
    )

    reservation_date = request.args.get(
        "reservation_date"
    )

    try:
        if customer_id:
            customer_id = int(
                customer_id
            )

        result = ReservationService.view_reservations(
            customer_id=customer_id or None,
            reservation_date=reservation_date or None
        )

        if result.get("success"):
            return safe_jsonify(
                result
            )

        return safe_jsonify(
            result,
            500
        )

    except ValueError:
        return safe_jsonify({
            "success": False,
            "message": "Customer ID must be a valid number."
        }, 400)

    except Exception as e:
        return safe_jsonify({
            "success": False,
            "message": f"Unable to retrieve reservations: {str(e)}"
        }, 500)


@web_bp.route(
    "/api/reservations/availability",
    methods=["POST"]
)
def reservation_availability():

    data = request.get_json(
        silent=True
    ) or {}

    required_fields = [
        "reservation_date",
        "start_time",
        "end_time",
        "guest_count"
    ]

    missing_fields = [
        field
        for field in required_fields
        if data.get(field) in (None, "")
    ]

    if missing_fields:
        return safe_jsonify({
            "success": False,
            "message": (
                "Missing required fields: "
                + ", ".join(missing_fields)
            )
        }, 400)

    try:
        guest_count = int(
            data["guest_count"]
        )

    except (
        TypeError,
        ValueError
    ):
        return safe_jsonify({
            "success": False,
            "message": "Guest count must be a valid number."
        }, 400)

    if guest_count <= 0:
        return safe_jsonify({
            "success": False,
            "message": "Guest count must be greater than zero."
        }, 400)

    if data["start_time"] >= data["end_time"]:
        return safe_jsonify({
            "success": False,
            "message": "End time must be later than start time."
        }, 400)

    try:
        result = ReservationService.check_availability(
            data["reservation_date"],
            data["start_time"],
            data["end_time"],
            guest_count
        )

        if result.get("success"):
            return safe_jsonify(
                result
            )

        return safe_jsonify(
            result,
            500
        )

    except Exception as e:
        return safe_jsonify({
            "success": False,
            "message": f"Availability check failed: {str(e)}"
        }, 500)


@web_bp.route(
    "/api/reservations",
    methods=["POST"]
)
def create_reservation():

    data = request.get_json(
        silent=True
    ) or {}

    required_fields = [
        "customer_id",
        "table_id",
        "reservation_date",
        "start_time",
        "end_time",
        "guest_count"
    ]

    missing_fields = [
        field
        for field in required_fields
        if data.get(field) in (None, "")
    ]

    if missing_fields:
        return safe_jsonify({
            "success": False,
            "message": (
                "Missing required fields: "
                + ", ".join(missing_fields)
            )
        }, 400)

    try:
        customer_id = int(
            data["customer_id"]
        )

        table_id = int(
            data["table_id"]
        )

        guest_count = int(
            data["guest_count"]
        )

    except (
        TypeError,
        ValueError
    ):
        return safe_jsonify({
            "success": False,
            "message": (
                "Customer, table and guest count "
                "must be valid numbers."
            )
        }, 400)

    if customer_id <= 0 or table_id <= 0:
        return safe_jsonify({
            "success": False,
            "message": "Invalid customer or table selection."
        }, 400)

    if guest_count <= 0:
        return safe_jsonify({
            "success": False,
            "message": "Guest count must be greater than zero."
        }, 400)

    if data["start_time"] >= data["end_time"]:
        return safe_jsonify({
            "success": False,
            "message": "End time must be later than start time."
        }, 400)

    try:
        result = ReservationService.create_reservation(
            customer_id=customer_id,
            table_id=table_id,
            reservation_date=data["reservation_date"],
            start_time=data["start_time"],
            end_time=data["end_time"],
            guest_count=guest_count,
            special_requests=data.get(
                "special_requests"
            ) or None
        )

        if result.get("success"):
            return safe_jsonify(
                result,
                201
            )

        return safe_jsonify(
            result,
            400
        )

    except Exception as e:
        return safe_jsonify({
            "success": False,
            "message": f"Reservation creation failed: {str(e)}"
        }, 500)


@web_bp.route(
    "/api/reservations/<int:reservation_id>/cancel",
    methods=["PUT"]
)
def cancel_reservation(
    reservation_id
):

    if reservation_id <= 0:
        return safe_jsonify({
            "success": False,
            "message": "Invalid reservation ID."
        }, 400)

    try:
        result = ReservationService.cancel_reservation(
            reservation_id
        )

        if result.get("success"):
            return safe_jsonify(
                result
            )

        return safe_jsonify(
            result,
            400
        )

    except Exception as e:
        return safe_jsonify({
            "success": False,
            "message": (
                "Reservation cancellation failed: "
                f"{str(e)}"
            )
        }, 500)


@web_bp.route(
    "/api/reservations/<int:reservation_id>/status",
    methods=["PUT"]
)
def update_reservation_status(reservation_id):

    if reservation_id <= 0:
        return safe_jsonify({
            "success": False,
            "message": "Invalid reservation ID."
        }, 400)

    data = request.get_json(
        silent=True
    ) or {}

    new_status = data.get("status")

    if not new_status:
        return safe_jsonify({
            "success": False,
            "message": "Reservation status is required."
        }, 400)

    try:
        result = ReservationService.update_status(
            reservation_id,
            new_status
        )

        if result.get("success"):
            return safe_jsonify(result)

        return safe_jsonify(
            result,
            400
        )

    except Exception as e:
        return safe_jsonify({
            "success": False,
            "message": (
                "Reservation status update failed: "
                f"{str(e)}"
            )
        }, 500)


# --------------------------------------------------
# Order support APIs
# --------------------------------------------------

@web_bp.get("/api/waiters")
def get_waiters():

    query = """
        SELECT
            waiter_id,
            first_name,
            last_name
        FROM WAITER
        ORDER BY
            first_name,
            last_name
    """

    try:
        rows = execute_query(
            query,
            fetch=True
        )

        waiters = []

        for row in rows or []:
            waiters.append({
                "waiter_id": row["waiter_id"],
                "first_name": row["first_name"],
                "last_name": row["last_name"],
                "waiter_name": (
                    f"{row['first_name']} "
                    f"{row['last_name']}"
                )
            })

        return safe_jsonify({
            "success": True,
            "data": waiters
        })

    except Exception as exc:
        return safe_jsonify({
            "success": False,
            "message": f"Unable to retrieve waiters: {exc}"
        }, 500)


@web_bp.route("/api/menu-items")
def menu_items():

    query = """
        SELECT
            item_id,
            name,
            description,
            category,
            price,
            is_available
        FROM MENU_ITEM
        ORDER BY
            category,
            name
    """

    try:
        rows = execute_query(
            query,
            fetch=True
        )

        return safe_jsonify({
            "success": True,
            "data": rows
        })

    except Exception as e:
        return safe_jsonify({
            "success": False,
            "message": f"Unable to retrieve menu items: {str(e)}"
        }, 500)


# --------------------------------------------------
# Orders API
# --------------------------------------------------

@web_bp.route("/api/orders")
def get_orders():

    query = """
        SELECT
            o.order_id,
            o.reservation_id,
            o.table_id,
            t.table_number,
            o.waiter_id,
            CONCAT(
                w.first_name,
                ' ',
                w.last_name
            ) AS waiter_name,
            o.order_date,
            o.order_time,
            o.status,
            r.customer_id,
            CONCAT(
                c.first_name,
                ' ',
                c.last_name
            ) AS customer_name
        FROM RESTAURANT_ORDER o
        JOIN RESTAURANT_TABLE t
            ON o.table_id = t.table_id
        JOIN WAITER w
            ON o.waiter_id = w.waiter_id
        LEFT JOIN RESERVATION r
            ON o.reservation_id = r.reservation_id
        LEFT JOIN CUSTOMER c
            ON r.customer_id = c.customer_id
        ORDER BY
            o.order_date DESC,
            o.order_time DESC,
            o.order_id DESC
    """

    try:
        rows = execute_query(
            query,
            fetch=True
        )

        return safe_jsonify({
            "success": True,
            "data": rows
        })

    except Exception as e:
        return safe_jsonify({
            "success": False,
            "message": f"Unable to retrieve orders: {str(e)}"
        }, 500)


@web_bp.route(
    "/api/orders",
    methods=["POST"]
)
def create_order():

    data = request.get_json(
        silent=True
    ) or {}

    required_fields = [
        "table_id",
        "waiter_id"
    ]

    missing_fields = [
        field
        for field in required_fields
        if data.get(field) in (None, "")
    ]

    if missing_fields:
        return safe_jsonify({
            "success": False,
            "message": (
                "Missing required fields: "
                + ", ".join(missing_fields)
            )
        }, 400)

    try:
        table_id = int(
            data["table_id"]
        )

        waiter_id = int(
            data["waiter_id"]
        )

        reservation_id = data.get(
            "reservation_id"
        )

        if reservation_id not in (None, ""):
            reservation_id = int(
                reservation_id
            )
        else:
            reservation_id = None

    except (
        TypeError,
        ValueError
    ):
        return safe_jsonify({
            "success": False,
            "message": (
                "Table, waiter and reservation IDs "
                "must be valid numbers."
            )
        }, 400)

    if table_id <= 0 or waiter_id <= 0:
        return safe_jsonify({
            "success": False,
            "message": "Table and waiter selections are invalid."
        }, 400)

    if reservation_id is not None and reservation_id <= 0:
        return safe_jsonify({
            "success": False,
            "message": "Invalid reservation selection."
        }, 400)

    try:
        result = OrderService.create_order(
            table_id=table_id,
            waiter_id=waiter_id,
            reservation_id=reservation_id
        )

        if result.get("success"):
            return safe_jsonify(
                result,
                201
            )

        return safe_jsonify(
            result,
            400
        )

    except Exception as e:
        return safe_jsonify({
            "success": False,
            "message": f"Order creation failed: {str(e)}"
        }, 500)


@web_bp.route(
    "/api/orders/<int:order_id>",
    methods=["GET"]
)
def get_order(
    order_id
):

    if order_id <= 0:
        return safe_jsonify({
            "success": False,
            "message": "Invalid order ID."
        }, 400)

    try:
        result = OrderService.view_order(
            order_id
        )

        if result.get("success"):
            return safe_jsonify(
                result
            )

        return safe_jsonify(
            result,
            404
        )

    except Exception as e:
        return safe_jsonify({
            "success": False,
            "message": f"Unable to retrieve order: {str(e)}"
        }, 500)


@web_bp.route(
    "/api/orders/<int:order_id>/items",
    methods=["POST"]
)
def add_order_item(
    order_id
):

    if order_id <= 0:
        return safe_jsonify({
            "success": False,
            "message": "Invalid order ID."
        }, 400)

    data = request.get_json(
        silent=True
    ) or {}

    required_fields = [
        "item_id",
        "quantity"
    ]

    missing_fields = [
        field
        for field in required_fields
        if data.get(field) in (None, "")
    ]

    if missing_fields:
        return safe_jsonify({
            "success": False,
            "message": (
                "Missing required fields: "
                + ", ".join(missing_fields)
            )
        }, 400)

    try:
        item_id = int(
            data["item_id"]
        )

        quantity = int(
            data["quantity"]
        )

    except (
        TypeError,
        ValueError
    ):
        return safe_jsonify({
            "success": False,
            "message": "Menu item and quantity must be valid numbers."
        }, 400)

    if item_id <= 0:
        return safe_jsonify({
            "success": False,
            "message": "Invalid menu item selection."
        }, 400)

    if quantity <= 0:
        return safe_jsonify({
            "success": False,
            "message": "Quantity must be greater than zero."
        }, 400)

    try:
        result = OrderService.add_order_item(
            order_id=order_id,
            item_id=item_id,
            quantity=quantity,
            special_instructions=data.get(
                "special_instructions"
            ) or None
        )

        if result.get("success"):
            return safe_jsonify(
                result,
                201
            )

        return safe_jsonify(
            result,
            400
        )

    except Exception as e:
        return safe_jsonify({
            "success": False,
            "message": f"Unable to add order item: {str(e)}"
        }, 500)


@web_bp.route(
    "/api/orders/<int:order_id>/close",
    methods=["PUT"]
)
def close_order(
    order_id
):

    if order_id <= 0:
        return safe_jsonify({
            "success": False,
            "message": "Invalid order ID."
        }, 400)

    try:
        result = OrderService.close_order(
            order_id
        )

        if result.get("success"):
            return safe_jsonify(
                result
            )

        return safe_jsonify(
            result,
            400
        )

    except Exception as e:
        return safe_jsonify({
            "success": False,
            "message": f"Unable to close order: {str(e)}"
        }, 500)


# --------------------------------------------------
# Kitchen API
# --------------------------------------------------

@web_bp.route(
    "/api/kitchen/tickets",
    methods=["GET"]
)
def get_kitchen_tickets():

    try:
        result = KitchenService.view_active_tickets()

        if result.get("success"):
            return safe_jsonify(
                result
            )

        return safe_jsonify(
            result,
            500
        )

    except Exception as e:
        return safe_jsonify({
            "success": False,
            "message": f"Unable to retrieve kitchen tickets: {str(e)}"
        }, 500)


@web_bp.route(
    "/api/kitchen/tickets/queued",
    methods=["GET"]
)
def get_queued_kitchen_tickets():

    try:
        result = KitchenService.view_queued_tickets()

        if result.get("success"):
            return safe_jsonify(
                result
            )

        return safe_jsonify(
            result,
            500
        )

    except Exception as e:
        return safe_jsonify({
            "success": False,
            "message": f"Unable to retrieve queued tickets: {str(e)}"
        }, 500)


@web_bp.route(
    "/api/kitchen/tickets/<int:ticket_id>/preparing",
    methods=["PUT"]
)
def update_kitchen_preparing(
    ticket_id
):

    if ticket_id <= 0:
        return safe_jsonify({
            "success": False,
            "message": "Invalid ticket ID."
        }, 400)

    try:
        result = KitchenService.update_preparing(
            ticket_id
        )

        if result.get("success"):
            return safe_jsonify(
                result
            )

        return safe_jsonify(
            result,
            400
        )

    except Exception as e:
        return safe_jsonify({
            "success": False,
            "message": (
                f"Unable to start ticket {ticket_id}: "
                f"{str(e)}"
            )
        }, 500)


@web_bp.route(
    "/api/kitchen/tickets/<int:ticket_id>/ready",
    methods=["PUT"]
)
def update_kitchen_ready(
    ticket_id
):

    if ticket_id <= 0:
        return safe_jsonify({
            "success": False,
            "message": "Invalid ticket ID."
        }, 400)

    try:
        result = KitchenService.update_ready(
            ticket_id
        )

        if result.get("success"):
            return safe_jsonify(
                result
            )

        return safe_jsonify(
            result,
            400
        )

    except Exception as e:
        return safe_jsonify({
            "success": False,
            "message": (
                f"Unable to mark ticket {ticket_id} ready: "
                f"{str(e)}"
            )
        }, 500)


@web_bp.route(
    "/api/kitchen/tickets/<int:ticket_id>/served",
    methods=["PUT"]
)
def update_kitchen_served(
    ticket_id
):

    if ticket_id <= 0:
        return safe_jsonify({
            "success": False,
            "message": "Invalid ticket ID."
        }, 400)

    try:
        result = KitchenService.update_served(
            ticket_id
        )

        if result.get("success"):
            return safe_jsonify(
                result
            )

        return safe_jsonify(
            result,
            400
        )

    except Exception as e:
        return safe_jsonify({
            "success": False,
            "message": (
                f"Unable to mark ticket {ticket_id} served: "
                f"{str(e)}"
            )
        }, 500)

# --------------------------------------------------
# Billing and Payment API
# --------------------------------------------------

@web_bp.route("/api/billing/orders")
def billing_orders():
    """
    Returns closed orders that do not already have a bill.
    These orders are eligible for bill generation.
    """

    query = """
        SELECT
            o.order_id,
            o.table_id,
            t.table_number,
            o.waiter_id,
            CONCAT(
                w.first_name,
                ' ',
                w.last_name
            ) AS waiter_name,
            o.order_date,
            o.order_time,
            COALESCE(
                SUM(oi.quantity * oi.unit_price),
                0
            ) AS order_subtotal
        FROM RESTAURANT_ORDER o
        JOIN RESTAURANT_TABLE t
            ON o.table_id = t.table_id
        JOIN WAITER w
            ON o.waiter_id = w.waiter_id
        JOIN ORDER_ITEM oi
            ON o.order_id = oi.order_id
        LEFT JOIN BILL b
            ON o.order_id = b.order_id
        WHERE o.status = 'Closed'
          AND b.bill_id IS NULL
        GROUP BY
            o.order_id,
            o.table_id,
            t.table_number,
            o.waiter_id,
            w.first_name,
            w.last_name,
            o.order_date,
            o.order_time
        ORDER BY
            o.order_date DESC,
            o.order_time DESC,
            o.order_id DESC
    """

    try:
        rows = execute_query(
            query,
            fetch=True
        )

        return safe_jsonify({
            "success": True,
            "data": rows
        })

    except Exception as e:
        return safe_jsonify({
            "success": False,
            "message": (
                f"Unable to retrieve billable orders: {str(e)}"
            )
        }, 500)


@web_bp.route("/api/billing/discounts")
def billing_discounts():
    """
    Returns currently active discounts available for billing.
    """

    query = """
        SELECT
            discount_id,
            discount_name,
            percentage
        FROM DISCOUNT
        WHERE is_active = TRUE
        ORDER BY
            percentage DESC,
            discount_name
    """

    try:
        rows = execute_query(
            query,
            fetch=True
        )

        return safe_jsonify({
            "success": True,
            "data": rows
        })

    except Exception as e:
        return safe_jsonify({
            "success": False,
            "message": (
                f"Unable to retrieve discounts: {str(e)}"
            )
        }, 500)


@web_bp.route("/api/billing/waiters")
def billing_waiters():
    """
    Returns active waiters who can authorize discounts.
    """

    query = """
        SELECT
            waiter_id,
            first_name,
            last_name
        FROM WAITER
        WHERE status = 'Active'
        ORDER BY
            first_name,
            last_name
    """

    try:
        rows = execute_query(
            query,
            fetch=True
        )

        waiters = []

        for row in rows or []:
            waiters.append({
                "waiter_id": row["waiter_id"],
                "waiter_name": (
                    f"{row['first_name']} "
                    f"{row['last_name']}"
                )
            })

        return safe_jsonify({
            "success": True,
            "data": waiters
        })

    except Exception as e:
        return safe_jsonify({
            "success": False,
            "message": (
                f"Unable to retrieve active waiters: {str(e)}"
            )
        }, 500)


@web_bp.route(
    "/api/billing/generate",
    methods=["POST"]
)
def generate_bill():
    """
    Generates a bill through BillingService.
    """

    data = request.get_json(
        silent=True
    ) or {}

    if data.get("order_id") in (None, ""):
        return safe_jsonify({
            "success": False,
            "message": "Order ID is required."
        }, 400)

    try:
        order_id = int(
            data["order_id"]
        )

        discount_id = data.get(
            "discount_id"
        )

        if discount_id in (None, ""):
            discount_id = None
        else:
            discount_id = int(
                discount_id
            )

        authorized_by_waiter_id = data.get(
            "authorized_by_waiter_id"
        )

        if authorized_by_waiter_id in (None, ""):
            authorized_by_waiter_id = None
        else:
            authorized_by_waiter_id = int(
                authorized_by_waiter_id
            )

    except (
        TypeError,
        ValueError
    ):
        return safe_jsonify({
            "success": False,
            "message": (
                "Order, discount and waiter IDs "
                "must be valid numbers."
            )
        }, 400)

    if order_id <= 0:
        return safe_jsonify({
            "success": False,
            "message": "Invalid order ID."
        }, 400)

    if discount_id is not None and discount_id <= 0:
        return safe_jsonify({
            "success": False,
            "message": "Invalid discount selection."
        }, 400)

    if (
        authorized_by_waiter_id is not None
        and authorized_by_waiter_id <= 0
    ):
        return safe_jsonify({
            "success": False,
            "message": "Invalid authorizing waiter."
        }, 400)

    try:
        result = BillingService.generate_bill(
            order_id=order_id,
            discount_id=discount_id,
            authorized_by_waiter_id=(
                authorized_by_waiter_id
            )
        )

        if result.get("success"):
            return safe_jsonify(
                result,
                201
            )

        return safe_jsonify(
            result,
            400
        )

    except Exception as e:
        return safe_jsonify({
            "success": False,
            "message": (
                f"Unable to generate bill: {str(e)}"
            )
        }, 500)


@web_bp.route(
    "/api/billing/bills"
)
def get_bills():
    """
    Returns all bills for the billing history table.
    """

    query = """
        SELECT
            b.bill_id,
            b.order_id,
            b.generation_time,
            b.closed_time,
            b.status,
            b.subtotal,
            b.discount_amount,
            b.tax_amount,
            b.total_amount,
            d.discount_name
        FROM BILL b
        LEFT JOIN DISCOUNT d
            ON b.discount_id = d.discount_id
        ORDER BY
            b.generation_time DESC,
            b.bill_id DESC
    """

    try:
        rows = execute_query(
            query,
            fetch=True
        )

        return safe_jsonify({
            "success": True,
            "data": rows
        })

    except Exception as e:
        return safe_jsonify({
            "success": False,
            "message": (
                f"Unable to retrieve bills: {str(e)}"
            )
        }, 500)


@web_bp.route(
    "/api/billing/bills/<int:bill_id>"
)
def get_bill(bill_id):
    """
    Returns complete details for one bill.
    """

    if bill_id <= 0:
        return safe_jsonify({
            "success": False,
            "message": "Invalid bill ID."
        }, 400)

    try:
        result = BillingService.view_bill(
            bill_id
        )

        if result.get("success"):
            return safe_jsonify(
                result
            )

        return safe_jsonify(
            result,
            404
        )

    except Exception as e:
        return safe_jsonify({
            "success": False,
            "message": (
                f"Unable to retrieve bill: {str(e)}"
            )
        }, 500)


@web_bp.route(
    "/api/billing/payment",
    methods=["POST"]
)
def process_bill_payment():
    """
    Processes payment through PaymentService.
    """

    data = request.get_json(
        silent=True
    ) or {}

    required_fields = [
        "bill_id",
        "payment_method",
        "amount_paid"
    ]

    missing_fields = [
        field
        for field in required_fields
        if data.get(field) in (None, "")
    ]

    if missing_fields:
        return safe_jsonify({
            "success": False,
            "message": (
                "Missing required fields: "
                + ", ".join(missing_fields)
            )
        }, 400)

    try:
        bill_id = int(
            data["bill_id"]
        )

        amount_paid = Decimal(
            str(data["amount_paid"])
        )

    except (
        TypeError,
        ValueError
    ):
        return safe_jsonify({
            "success": False,
            "message": (
                "Bill ID and payment amount "
                "must be valid numbers."
            )
        }, 400)

    payment_method = str(
        data["payment_method"]
    ).strip()

    if bill_id <= 0:
        return safe_jsonify({
            "success": False,
            "message": "Invalid bill ID."
        }, 400)

    if not payment_method:
        return safe_jsonify({
            "success": False,
            "message": "Payment method is required."
        }, 400)

    if amount_paid <= 0:
        return safe_jsonify({
            "success": False,
            "message": (
                "Payment amount must be greater than zero."
            )
        }, 400)

    try:
        result = PaymentService.process_payment(
            bill_id=bill_id,
            payment_method=payment_method,
            amount_paid=amount_paid
        )

        if result.get("success"):
            return safe_jsonify(
                result
            )

        return safe_jsonify(
            result,
            400
        )

    except Exception as e:
        return safe_jsonify({
            "success": False,
            "message": (
                f"Unable to process payment: {str(e)}"
            )
        }, 500)

# --------------------------------------------------
# Reports API
# --------------------------------------------------

@web_bp.route(
    "/api/reports/<report_name>"
)
def report(report_name):

    report_methods = {
        "available-tables":
            ReportService.available_tables,

        "table-turnover":
            ReportService.table_turnover,

        "waiter-performance":
            ReportService.waiter_performance,

        "item-sales":
            ReportService.item_sales,

        "kitchen-delays":
            ReportService.kitchen_delays,

        "discount-usage":
            ReportService.discount_usage,

        "revenue":
            ReportService.revenue
    }

    report_method = report_methods.get(
        report_name
    )

    if not report_method:
        return safe_jsonify({
            "success": False,
            "message": "Unknown report."
        }, 404)

    try:
        result = report_method()

        if result.get("success"):
            return safe_jsonify(
                result
            )

        return safe_jsonify(
            result,
            500
        )

    except Exception as e:
        return safe_jsonify({
            "success": False,
            "message": (
                "Report generation failed: "
                f"{str(e)}"
            )
        }, 500)