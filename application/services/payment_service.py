from decimal import Decimal
from application.database import execute_procedure
from mysql.connector import Error

class PaymentService:
    @staticmethod
    def process_payment(bill_id, payment_method, amount_paid):
        """
        Delegates the payment process entirely to the MySQL stored procedure sp_process_payment.
        The procedure handles:
        - Locking the BILL
        - Validating the exact payment amount matches the total_amount
        - Ensuring the bill is currently 'Unpaid'
        - Inserting the PAYMENT
        - Changing the BILL status to 'Paid' and setting closed_time
        """
        try:
            # We strictly cast amount_paid to Decimal to ensure no floating point issues before passing
            amount_decimal = Decimal(str(amount_paid))
            
            # The procedure expects: p_bill_id INT, p_payment_method ENUM, p_amount_paid DECIMAL
            args = (bill_id, payment_method, amount_decimal)
            
            execute_procedure('sp_process_payment', args, fetch=False)
            
            return {
                "success": True, 
                "message": f"Payment of {amount_decimal} via {payment_method} successfully processed. Bill is now Paid."
            }
            
        except Error as e:
            # Captures SQLSTATE 45000 errors directly from our procedure rules
            return {"success": False, "message": f"Payment rejected: {e.msg}"}
        except Exception as ex:
            return {"success": False, "message": f"Payment processing error: {str(ex)}"}
