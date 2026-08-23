from decimal import Decimal, ROUND_HALF_UP

from application.database import execute_query
from application.config import Config
from mysql.connector import Error


class BillingService:

    @staticmethod
    def generate_bill(order_id, discount_id=None, authorized_by_waiter_id=None):
        """
        Generates the financial snapshot for a closed order.
        """

        try:
            # --------------------------------------------------
            # 1. Validate order status and bill uniqueness
            # --------------------------------------------------

            order_query = """
                SELECT status
                FROM RESTAURANT_ORDER
                WHERE order_id = %s
            """

            order_res = execute_query(
                order_query,
                (order_id,),
                fetch=True
            )

            if not order_res:
                return {
                    "success": False,
                    "message": "Order not found."
                }

            if order_res[0]["status"] != "Closed":
                return {
                    "success": False,
                    "message": "Cannot generate a bill for an active order."
                }

            bill_check_query = """
                SELECT bill_id
                FROM BILL
                WHERE order_id = %s
            """

            existing_bill = execute_query(
                bill_check_query,
                (order_id,),
                fetch=True
            )

            if existing_bill:
                return {
                    "success": False,
                    "message": "A bill already exists for this order."
                }

            # --------------------------------------------------
            # 2. Calculate subtotal from historical unit_price
            # --------------------------------------------------

            items_query = """
                SELECT quantity, unit_price
                FROM ORDER_ITEM
                WHERE order_id = %s
            """

            items = execute_query(
                items_query,
                (order_id,),
                fetch=True
            )

            if not items:
                return {
                    "success": False,
                    "message": "Cannot generate a bill for an empty order."
                }

            subtotal = Decimal("0.00")

            for item in items:
                quantity = Decimal(str(item["quantity"]))
                unit_price = Decimal(str(item["unit_price"]))

                subtotal += quantity * unit_price

            subtotal = subtotal.quantize(
                Decimal("0.01"),
                rounding=ROUND_HALF_UP
            )

            # --------------------------------------------------
            # 3. Validate and calculate discount
            # --------------------------------------------------

            discount_amount = Decimal("0.00")

            if discount_id:

                if not authorized_by_waiter_id:
                    return {
                        "success": False,
                        "message": "Discount requires waiter authorization."
                    }

                # Check discount
                discount_query = """
                    SELECT percentage, is_active
                    FROM DISCOUNT
                    WHERE discount_id = %s
                """

                discount_res = execute_query(
                    discount_query,
                    (discount_id,),
                    fetch=True
                )

                if not discount_res:
                    return {
                        "success": False,
                        "message": "Discount does not exist."
                    }

                if not discount_res[0]["is_active"]:
                    return {
                        "success": False,
                        "message": "Discount is inactive."
                    }

                # Check waiter
                waiter_query = """
                    SELECT status
                    FROM WAITER
                    WHERE waiter_id = %s
                """

                waiter_res = execute_query(
                    waiter_query,
                    (authorized_by_waiter_id,),
                    fetch=True
                )

                if not waiter_res:
                    return {
                        "success": False,
                        "message": "Authorizing waiter not found."
                    }

                if waiter_res[0]["status"] != "Active":
                    return {
                        "success": False,
                        "message": "Authorizing waiter must be active."
                    }

                discount_percentage = Decimal(
                    str(discount_res[0]["percentage"])
                )

                discount_amount = (
                    subtotal
                    * discount_percentage
                    / Decimal("100")
                ).quantize(
                    Decimal("0.01"),
                    rounding=ROUND_HALF_UP
                )

            # --------------------------------------------------
            # 4. Calculate tax and final total
            # --------------------------------------------------

            taxable_amount = subtotal - discount_amount

            tax_rate = Decimal(str(Config.TAX_RATE))

            tax_amount = (
                taxable_amount * tax_rate
            ).quantize(
                Decimal("0.01"),
                rounding=ROUND_HALF_UP
            )

            total_amount = (
                taxable_amount + tax_amount
            ).quantize(
                Decimal("0.01"),
                rounding=ROUND_HALF_UP
            )

            # --------------------------------------------------
            # 5. Insert final BILL snapshot
            # --------------------------------------------------

            insert_query = """
                INSERT INTO BILL (
                    order_id,
                    discount_id,
                    authorized_by_waiter_id,
                    generation_time,
                    subtotal,
                    discount_amount,
                    tax_amount,
                    total_amount,
                    status
                )
                VALUES (
                    %s,
                    %s,
                    %s,
                    CURRENT_TIMESTAMP,
                    %s,
                    %s,
                    %s,
                    %s,
                    'Unpaid'
                )
            """

            params = (
                order_id,
                discount_id,
                authorized_by_waiter_id,
                subtotal,
                discount_amount,
                tax_amount,
                total_amount
            )

            bill_id = execute_query(
                insert_query,
                params,
                fetch=False
            )

            # --------------------------------------------------
            # 6. Return structured response
            # --------------------------------------------------

            return {
                "success": True,
                "message": "Bill successfully generated.",
                "data": {
                    "bill_id": bill_id,
                    "order_id": order_id,
                    "subtotal": str(subtotal),
                    "discount_amount": str(discount_amount),
                    "tax_amount": str(tax_amount),
                    "total_amount": str(total_amount),
                    "status": "Unpaid"
                }
            }

        except Error as e:

            return {
                "success": False,
                "message": f"Failed to generate bill: {e.msg}"
            }

    @staticmethod
    def view_bill(bill_id):
        """
        Retrieves the finalized bill details.
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
                d.discount_name,
                w.first_name AS auth_first,
                w.last_name AS auth_last
            FROM BILL b
            LEFT JOIN DISCOUNT d
                ON b.discount_id = d.discount_id
            LEFT JOIN WAITER w
                ON b.authorized_by_waiter_id = w.waiter_id
            WHERE b.bill_id = %s
        """

        try:

            res = execute_query(
                query,
                (bill_id,),
                fetch=True
            )

            if not res:
                return {
                    "success": False,
                    "message": "Bill not found."
                }

            bill = res[0]

            auth_name = None

            if bill["auth_first"]:
                auth_name = (
                    f"{bill['auth_first']} "
                    f"{bill['auth_last']}"
                )

            return {
                "success": True,
                "data": {
                    "bill_id": bill["bill_id"],
                    "order_id": bill["order_id"],
                    "generation_time": bill["generation_time"],
                    "closed_time": bill["closed_time"],
                    "status": bill["status"],
                    "subtotal": str(bill["subtotal"]),
                    "discount": {
                        "name": bill["discount_name"],
                        "amount": str(bill["discount_amount"]),
                        "authorized_by": auth_name
                    } if bill["discount_name"] else None,
                    "tax_amount": str(bill["tax_amount"]),
                    "total_amount": str(bill["total_amount"])
                }
            }

        except Error as e:

            return {
                "success": False,
                "message": f"Failed to view bill: {e.msg}"
            }