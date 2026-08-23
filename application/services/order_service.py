from application.database import execute_query, get_connection
from mysql.connector import Error


class OrderService:

    @staticmethod
    def create_order(table_id, waiter_id, reservation_id=None):
        """
        Creates a restaurant order and its corresponding kitchen ticket.

        If reservation_id is provided, the MySQL trigger validates that
        the order table matches the reservation table.

        Order creation and kitchen-ticket creation are performed inside
        one transaction. If either operation fails, both are rolled back.
        """

        order_query = """
            INSERT INTO RESTAURANT_ORDER
            (
                reservation_id,
                table_id,
                waiter_id,
                order_date,
                order_time,
                status
            )
            VALUES
            (
                %s,
                %s,
                %s,
                CURRENT_DATE(),
                CURRENT_TIME(),
                'Active'
            )
        """

        ticket_query = """
            INSERT INTO KITCHEN_TICKET
            (
                order_id,
                generated_time,
                ready_time,
                status
            )
            VALUES
            (
                %s,
                CURRENT_TIMESTAMP,
                NULL,
                'Queued'
            )
        """

        conn = get_connection()
        cursor = None

        if not conn:
            return {
                "success": False,
                "message": "Failed to connect to the database."
            }

        try:
            cursor = conn.cursor(dictionary=True)

            # 1. Create the restaurant order
            cursor.execute(
                order_query,
                (reservation_id, table_id, waiter_id)
            )

            order_id = cursor.lastrowid

            # 2. Create the corresponding kitchen ticket
            cursor.execute(
                ticket_query,
                (order_id,)
            )

            # 3. Commit both operations together
            conn.commit()

            return {
                "success": True,
                "message": "Order and kitchen ticket successfully created.",
                "order_id": order_id
            }

        except Error as e:
            # Undo the order if kitchen-ticket creation fails
            conn.rollback()

            return {
                "success": False,
                "message": f"Order creation failed: {e.msg}"
            }

        except Exception as e:
            conn.rollback()

            return {
                "success": False,
                "message": f"Unexpected error while creating order: {str(e)}"
            }

        finally:
            if cursor is not None:
                cursor.close()

            if conn.is_connected():
                conn.close()

    @staticmethod
    def add_order_item(
        order_id,
        item_id,
        quantity,
        special_instructions=None
    ):
        """
        Adds an item to an existing order.

        The current menu price is copied into ORDER_ITEM.unit_price.
        This preserves the historical price even if the menu price
        changes later.
        """

        try:
            # 1. Check that the menu item exists
            menu_query = """
                SELECT
                    price,
                    is_available
                FROM MENU_ITEM
                WHERE item_id = %s
            """

            menu_res = execute_query(
                menu_query,
                (item_id,),
                fetch=True
            )

            if not menu_res:
                return {
                    "success": False,
                    "message": "Menu item not found."
                }

            item = menu_res[0]

            # 2. Check menu availability
            if not item["is_available"]:
                return {
                    "success": False,
                    "message": "This menu item is currently unavailable."
                }

            # 3. Store the current price as historical price
            current_price = item["price"]

            insert_query = """
                INSERT INTO ORDER_ITEM
                (
                    order_id,
                    item_id,
                    quantity,
                    unit_price,
                    special_instructions
                )
                VALUES
                (
                    %s,
                    %s,
                    %s,
                    %s,
                    %s
                )
            """

            execute_query(
                insert_query,
                (
                    order_id,
                    item_id,
                    quantity,
                    current_price,
                    special_instructions
                ),
                fetch=False
            )

            return {
                "success": True,
                "message": "Order item successfully added."
            }

        except Error as e:
            return {
                "success": False,
                "message": f"Failed to add order item: {e.msg}"
            }

        except Exception as e:
            return {
                "success": False,
                "message": f"Unexpected error: {str(e)}"
            }

    @staticmethod
    def view_order(order_id):
        """
        Retrieves the complete order including:
        - Table
        - Waiter
        - Order date/time
        - Order status
        - Ordered items
        - Quantity
        - Historical unit price
        - Line total
        - Special instructions
        """

        query = """
            SELECT
                o.order_id,
                o.table_id,
                w.first_name AS waiter_first,
                w.last_name AS waiter_last,
                o.order_date,
                o.order_time,
                o.status,
                oi.item_id,
                m.name AS item_name,
                oi.quantity,
                oi.unit_price,
                (oi.quantity * oi.unit_price) AS line_total,
                oi.special_instructions
            FROM RESTAURANT_ORDER o
            JOIN WAITER w
                ON o.waiter_id = w.waiter_id
            LEFT JOIN ORDER_ITEM oi
                ON o.order_id = oi.order_id
            LEFT JOIN MENU_ITEM m
                ON oi.item_id = m.item_id
            WHERE o.order_id = %s
        """

        try:
            items = execute_query(
                query,
                (order_id,),
                fetch=True
            )

            if not items:
                return {
                    "success": False,
                    "message": "Order not found."
                }

            first_row = items[0]

            order_info = {
                "order_id": first_row["order_id"],
                "table_id": first_row["table_id"],
                "waiter": (
                    f"{first_row['waiter_first']} "
                    f"{first_row['waiter_last']}"
                ),
                "order_date": first_row["order_date"],
                "order_time": first_row["order_time"],
                "status": first_row["status"],
                "items": [],
                "order_total": 0.0
            }

            for item in items:

                # LEFT JOIN can return NULL when an order has no items
                if item["item_id"] is not None:

                    line_total = float(item["line_total"])

                    order_info["items"].append({
                        "item_id": item["item_id"],
                        "item_name": item["item_name"],
                        "quantity": item["quantity"],
                        "unit_price": float(item["unit_price"]),
                        "line_total": line_total,
                        "special_instructions": (
                            item["special_instructions"]
                        )
                    })

                    order_info["order_total"] += line_total

            return {
                "success": True,
                "data": order_info
            }

        except Error as e:
            return {
                "success": False,
                "message": f"Failed to retrieve order: {e.msg}"
            }

        except Exception as e:
            return {
                "success": False,
                "message": f"Unexpected error: {str(e)}"
            }

    @staticmethod
    def close_order(order_id):
        """
        Changes an Active order to Closed.

        A Closed order cannot be reopened through this service.
        """

        try:
            # 1. Check whether the order exists
            check_query = """
                SELECT status
                FROM RESTAURANT_ORDER
                WHERE order_id = %s
            """

            result = execute_query(
                check_query,
                (order_id,),
                fetch=True
            )

            if not result:
                return {
                    "success": False,
                    "message": "Order not found."
                }

            current_status = result[0]["status"]

            # 2. Prevent closing an already closed order
            if current_status == "Closed":
                return {
                    "success": False,
                    "message": "Order is already closed."
                }

            # 3. Close the order
            update_query = """
                UPDATE RESTAURANT_ORDER
                SET status = 'Closed'
                WHERE order_id = %s
                  AND status = 'Active'
            """

            affected_rows = execute_query(
                update_query,
                (order_id,),
                fetch=False
            )

            if affected_rows == 0:
                return {
                    "success": False,
                    "message": "Order could not be closed."
                }

            return {
                "success": True,
                "message": "Order successfully closed."
            }

        except Error as e:
            return {
                "success": False,
                "message": f"Failed to close order: {e.msg}"
            }

        except Exception as e:
            return {
                "success": False,
                "message": f"Unexpected error: {str(e)}"
            }