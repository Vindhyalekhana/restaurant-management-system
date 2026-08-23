from application.database import execute_procedure


print("Testing reservation time handling...")

result = execute_procedure(
    "sp_create_reservation",
    (
        1,                  # customer_id
        5,                  # table_id
        "2026-08-27",       # reservation_date
        "17:15",            # start_time
        "18:45",            # end_time
        2,                  # guest_count
        "PYTHON TIME TEST"  # special_requests
    ),
    fetch=False
)

print("Procedure executed successfully.")
print("Result:", result)