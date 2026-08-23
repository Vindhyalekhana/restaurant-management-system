from application.database import execute_query
from mysql.connector import Error

# The state machine mapping valid transitions
VALID_TRANSITIONS = {
    "Queued": {"Preparing"},
    "Preparing": {"Ready"},
    "Ready": {"Served"},
    "Served": set()
}

class KitchenService:
    @staticmethod
    def view_queued_tickets():
        """
        Retrieves all kitchen tickets currently in 'Queued' status.
        """
        query = """
            SELECT ticket_id, order_id, generated_time, status 
            FROM KITCHEN_TICKET 
            WHERE status = 'Queued'
            ORDER BY generated_time ASC
        """
        return {"success": True, "data": execute_query(query, fetch=True)}

    @staticmethod
    def view_active_tickets():
        """
        Retrieves all kitchen tickets that are not 'Served' or 'Cancelled'.
        Includes Queued, Preparing, and Ready tickets.
        """
        query = """
            SELECT ticket_id, order_id, generated_time, ready_time, status 
            FROM KITCHEN_TICKET 
            WHERE status IN ('Queued', 'Preparing', 'Ready')
            ORDER BY generated_time ASC
        """
        return {"success": True, "data": execute_query(query, fetch=True)}

    @staticmethod
    def _update_status(ticket_id, expected_status, new_status):
        """
        Private method handling the concurrency-safe conditional database update.
        """
        # 1. State machine validation in Python
        if new_status not in VALID_TRANSITIONS.get(expected_status, set()):
            return {
                "success": False, 
                "message": f"Invalid transition: {expected_status} -> {new_status}"
            }

        # 2. Concurrency-safe database conditional update
        try:
            if new_status == 'Ready':
                # Reaching Ready populates ready_time exactly once
                query = """
                    UPDATE KITCHEN_TICKET 
                    SET status = %s, ready_time = CURRENT_TIMESTAMP 
                    WHERE ticket_id = %s AND status = %s
                """
            else:
                # Other transitions strictly update status without touching ready_time
                query = """
                    UPDATE KITCHEN_TICKET 
                    SET status = %s 
                    WHERE ticket_id = %s AND status = %s
                """
            
            affected_rows = execute_query(query, (new_status, ticket_id, expected_status), fetch=False)
            
            if affected_rows == 0:
                # This could mean the ticket doesn't exist, or its status wasn't what we expected (race condition)
                return {
                    "success": False, 
                    "message": f"Transition failed. Ticket may not exist or its status is no longer '{expected_status}'."
                }

            return {"success": True, "message": f"Ticket {ticket_id} updated to '{new_status}'."}
            
        except Error as e:
            return {"success": False, "message": f"Database error updating ticket: {e.msg}"}

    @classmethod
    def update_preparing(cls, ticket_id):
        return cls._update_status(ticket_id, "Queued", "Preparing")

    @classmethod
    def update_ready(cls, ticket_id):
        return cls._update_status(ticket_id, "Preparing", "Ready")

    @classmethod
    def update_served(cls, ticket_id):
        return cls._update_status(ticket_id, "Ready", "Served")
