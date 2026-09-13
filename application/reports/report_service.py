from application.database import execute_query
from mysql.connector import Error


class ReportService:

    @staticmethod
    def dashboard_summary():
        """
        Returns the main statistics displayed on the web dashboard.
        """

        query = """
            SELECT
                (
                    SELECT COUNT(*)
                    FROM RESERVATION
                    WHERE reservation_date = CURDATE()
                ) AS today_reservations,

                (
                    SELECT COUNT(*)
                    FROM RESTAURANT_ORDER
                    WHERE status = 'Active'
                ) AS active_orders,

                (
                    SELECT COUNT(*)
                    FROM KITCHEN_TICKET
                    WHERE status IN ('Queued', 'Preparing', 'Ready')
                ) AS kitchen_pending,

                (
                    SELECT COALESCE(SUM(total_amount), 0.00)
                    FROM BILL
                    WHERE status = 'Paid'
                      AND closed_time IS NOT NULL
                      AND DATE(closed_time) = CURDATE()
                ) AS today_revenue;
        """

        try:
            rows = execute_query(
                query,
                fetch=True
            )

            if not rows:
                return {
                    "success": False,
                    "message": "Dashboard statistics could not be retrieved."
                }

            row = rows[0]

            return {
                "success": True,
                "data": {
                    "today_reservations": int(
                        row["today_reservations"] or 0
                    ),
                    "active_orders": int(
                        row["active_orders"] or 0
                    ),
                    "kitchen_pending": int(
                        row["kitchen_pending"] or 0
                    ),
                    "today_revenue": float(
                        row["today_revenue"] or 0
                    )
                }
            }

        except Error as e:
            return {
                "success": False,
                "message": f"Error fetching dashboard statistics: {e.msg}"
            }


    @staticmethod
    def available_tables():
        """
        Returns tables currently marked 'Available', including area and capacity.
        """

        query = """
            SELECT t.table_number, a.area_name, t.capacity, t.status
            FROM RESTAURANT_TABLE t
            JOIN DINING_AREA a ON t.area_id = a.area_id
            WHERE t.status = 'Available'
            ORDER BY a.area_name, t.table_number
        """

        try:
            return {
                "success": True,
                "data": execute_query(
                    query,
                    fetch=True
                )
            }

        except Error as e:
            return {
                "success": False,
                "message": f"Error fetching tables: {e.msg}"
            }


    @staticmethod
    def table_turnover():
        """
        Returns the number of orders handled by each table.
        Uses LEFT JOIN to include tables with 0 orders.
        """

        query = """
            SELECT
                t.table_number,
                a.area_name,
                COUNT(o.order_id) AS total_orders
            FROM RESTAURANT_TABLE t
            JOIN DINING_AREA a
                ON t.area_id = a.area_id
            LEFT JOIN RESTAURANT_ORDER o
                ON t.table_id = o.table_id
            GROUP BY
                t.table_id,
                t.table_number,
                a.area_name
            ORDER BY
                total_orders DESC,
                t.table_number
        """

        try:
            return {
                "success": True,
                "data": execute_query(
                    query,
                    fetch=True
                )
            }

        except Error as e:
            return {
                "success": False,
                "message": f"Error fetching turnover: {e.msg}"
            }


    @staticmethod
    def waiter_performance():
        """
        Returns the number of orders handled by each waiter.
        """

        query = """
            SELECT
                w.waiter_id,
                w.first_name,
                w.last_name,
                COUNT(o.order_id) AS total_orders
            FROM WAITER w
            LEFT JOIN RESTAURANT_ORDER o
                ON w.waiter_id = o.waiter_id
            GROUP BY
                w.waiter_id,
                w.first_name,
                w.last_name
            ORDER BY total_orders DESC
        """

        try:
            return {
                "success": True,
                "data": execute_query(
                    query,
                    fetch=True
                )
            }

        except Error as e:
            return {
                "success": False,
                "message": f"Error fetching waiter performance: {e.msg}"
            }


    @staticmethod
    def item_sales():
        """
        Returns total quantity sold per menu item.
        """

        query = """
            SELECT
                m.name AS item_name,
                m.category,
                COALESCE(SUM(oi.quantity), 0) AS total_quantity_sold
            FROM MENU_ITEM m
            LEFT JOIN ORDER_ITEM oi
                ON m.item_id = oi.item_id
            GROUP BY
                m.item_id,
                m.name,
                m.category
            ORDER BY total_quantity_sold DESC
        """

        try:
            return {
                "success": True,
                "data": execute_query(
                    query,
                    fetch=True
                )
            }

        except Error as e:
            return {
                "success": False,
                "message": f"Error fetching item sales: {e.msg}"
            }


    @staticmethod
    def kitchen_delays():
        """
        Returns tickets with recorded ready_time and their
        preparation delay in minutes.
        """

        query = """
            SELECT
                ticket_id,
                order_id,
                generated_time,
                ready_time,
                TIMESTAMPDIFF(
                    MINUTE,
                    generated_time,
                    ready_time
                ) AS delay_minutes
            FROM KITCHEN_TICKET
            WHERE ready_time IS NOT NULL
            ORDER BY delay_minutes DESC
        """

        try:
            return {
                "success": True,
                "data": execute_query(
                    query,
                    fetch=True
                )
            }

        except Error as e:
            return {
                "success": False,
                "message": f"Error fetching kitchen delays: {e.msg}"
            }


    @staticmethod
    def discount_usage():
        """
        Returns the number of times each discount was used
        and the total amount discounted.
        """

        query = """
            SELECT
                d.discount_name,
                d.percentage,
                COUNT(b.bill_id) AS times_used,
                COALESCE(
                    SUM(b.discount_amount),
                    0.00
                ) AS total_discounted
            FROM DISCOUNT d
            LEFT JOIN BILL b
                ON d.discount_id = b.discount_id
            GROUP BY
                d.discount_id,
                d.discount_name,
                d.percentage
            ORDER BY times_used DESC
        """

        try:
            return {
                "success": True,
                "data": execute_query(
                    query,
                    fetch=True
                )
            }

        except Error as e:
            return {
                "success": False,
                "message": f"Error fetching discount usage: {e.msg}"
            }


    @staticmethod
    def revenue():
        """
        Returns total realized revenue aggregated by date,
        considering ONLY 'Paid' bills.
        """

        query = """
            SELECT
                DATE(closed_time) AS revenue_date,
                SUM(total_amount) AS daily_revenue
            FROM BILL
            WHERE status = 'Paid'
              AND closed_time IS NOT NULL
            GROUP BY DATE(closed_time)
            ORDER BY revenue_date DESC
        """

        try:
            return {
                "success": True,
                "data": execute_query(
                    query,
                    fetch=True
                )
            }

        except Error as e:
            return {
                "success": False,
                "message": f"Error fetching revenue: {e.msg}"
            }