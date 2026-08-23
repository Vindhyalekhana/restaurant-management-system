from application.database import get_connection

def test_connection():
    print("Testing MySQL connection...")
    conn = get_connection()
    if conn:
        print("✅ Connection successful!")
        
        # Additional verification requested by user
        cursor = conn.cursor()
        cursor.execute("SELECT DATABASE();")
        db_name = cursor.fetchone()[0]
        print(f"Connected to Database: {db_name}")
        cursor.close()
        
        conn.close()
    else:
        print("❌ Connection failed. Please check your .env credentials and ensure MySQL is running.")

if __name__ == "__main__":
    test_connection()
