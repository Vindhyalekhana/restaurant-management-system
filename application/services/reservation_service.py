from application.database import execute_query, execute_procedure
from mysql.connector import Error


class ReservationService:

    VALID_STATUS_TRANSITIONS = {
        "Pending": {"Confirmed", "Cancelled"},
        "Confirmed": {"Seated", "Cancelled"},
        "Seated": set(),
        "Cancelled": set()
    }

    @staticmethod
    def check_availability(reservation_date, 
    start_time, end_time, guest_count):
        """
        Finds tables that can accommodate the requested number of guests
        and have no overlapping active reservation.
        """

        query = """
            SELECT
                t.table_id,
                t.table_number,
                t.capacity,
                a.area_name
            FROM RESTAURANT_TABLE t
            JOIN DINING_AREA a
                ON t.area_id = a.area_id
            WHERE t.capacity >= %s
              AND t.status = 'Available'
              AND t.table_id NOT IN (
                    SELECT r.table_id
                    FROM RESERVATION r
                    WHERE r.reservation_date = %s
                      AND r.status IN ('Pending', 'Confirmed', 'Seated')
                      AND (
                            r.start_time < %s
                            AND r.end_time > %s
                      )
              )
            ORDER BY t.capacity ASC;
        """

        params = (
            guest_count,
            reservation_date,
            end_time,
            start_time
        )

        try:
            rows = execute_query(
                query,
                params,
                fetch=True
            )

            return {
                "success": True,
                "data": rows
            }

        except Error as e:
            return {
                "success": False,
                "message": f"Availability check failed: {e.msg}"
            }

    @staticmethod
    def create_reservation(
        customer_id,
        table_id,
        reservation_date,
        start_time,
        end_time,
        guest_count,
        special_requests=None
    ):
        """
        Creates a reservation through the MySQL stored procedure.
        Database procedures enforce capacity and overlap rules.
        """

        args = (
            customer_id,
            table_id,
            reservation_date,
            start_time,
            end_time,
            guest_count,
            special_requests
        )

        try:
            execute_procedure(
                'sp_create_reservation',
                args,
                fetch=False
            )

            return {
                "success": True,
                "message": "Reservation successfully created."
            }

        except Error as e:
            return {
                "success": False,
                "message": f"Reservation failed: {e.msg}"
            }

    @staticmethod
    def view_reservations(
        customer_id=None,
        reservation_date=None
    ):
        """
        Retrieves reservations, optionally filtered by customer
        or reservation date.
        """

        query = """
            SELECT
                r.reservation_id,
                r.reservation_date,
                r.start_time,
                r.end_time,
                r.guest_count,
                r.status,
                c.first_name,
                c.last_name,
                t.table_number
            FROM RESERVATION r
            JOIN CUSTOMER c
                ON r.customer_id = c.customer_id
            JOIN RESTAURANT_TABLE t
                ON r.table_id = t.table_id
            WHERE 1 = 1
        """

        params = []

        if customer_id:
            query += " AND r.customer_id = %s"
            params.append(customer_id)

        if reservation_date:
            query += " AND r.reservation_date = %s"
            params.append(reservation_date)

        query += """
            ORDER BY
                r.reservation_date DESC,
                r.start_time ASC
        """

        try:
            rows = execute_query(
                query,
                tuple(params),
                fetch=True
            )

            return {
                "success": True,
                "data": rows
            }

        except Error as e:
            return {
                "success": False,
                "message": f"Unable to retrieve reservations: {e.msg}"
            }

    @staticmethod
    def update_status(reservation_id, new_status):
        """
        Updates reservation status using controlled state transitions.
        """

        allowed_statuses = {
            "Pending",
            "Confirmed",
            "Seated",
            "Cancelled"
        }

        if new_status not in allowed_statuses:
            return {
                "success": False,
                "message": "Invalid reservation status."
            }

        try:
            check_query = """
                SELECT status
                FROM RESERVATION
                WHERE reservation_id = %s
            """

            result = execute_query(
                check_query,
                (reservation_id,),
                fetch=True
            )

            if not result:
                return {
                    "success": False,
                    "message": "Reservation not found."
                }

            current_status = result[0]["status"]

            allowed_transitions = (
                ReservationService.VALID_STATUS_TRANSITIONS
                .get(current_status, set())
            )

            if new_status not in allowed_transitions:
                return {
                    "success": False,
                    "message": (
                        f"Cannot change reservation from "
                        f"{current_status} to {new_status}."
                    )
                }

            update_query = """
                UPDATE RESERVATION
                SET status = %s
                WHERE reservation_id = %s
            """

            execute_query(
                update_query,
                (
                    new_status,
                    reservation_id
                ),
                fetch=False
            )

            return {
                "success": True,
                "message": (
                    f"Reservation status updated to {new_status}."
                )
            }

        except Error as e:
            return {
                "success": False,
                "message": (
                    f"Status update failed: {e.msg}"
                )
            }

    @staticmethod
    def cancel_reservation(reservation_id):
        """
        Cancels a reservation using the controlled
        reservation status transition.
        """

        return ReservationService.update_status(
            reservation_id,
            "Cancelled"
        )