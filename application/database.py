import mysql.connector
from mysql.connector import Error
from .config import Config


def get_connection():
    """
    Creates and returns a connection to the MySQL database.
    Returns None if connection fails.
    """
    try:
        connection = mysql.connector.connect(
            host=Config.DB_HOST,
            port=Config.DB_PORT,
            user=Config.DB_USER,
            password=Config.DB_PASSWORD,
            database=Config.DB_NAME
        )

        if connection.is_connected():
            return connection

    except Error as e:
        print(f"Database Connection Error: {e}")
        return None


def execute_query(query, params=None, fetch=False):
    """
    Executes a standard SQL query.

    fetch=True:
        Returns fetched rows as a list of dictionaries.

    fetch=False:
        INSERT  -> returns last inserted ID
        UPDATE/DELETE -> returns affected row count
    """
    conn = get_connection()

    if not conn:
        raise Exception("Failed to connect to the database")

    cursor = None

    try:
        cursor = conn.cursor(dictionary=True)

        cursor.execute(query, params or ())

        if fetch:
            return cursor.fetchall()

        conn.commit()

        query_upper = query.strip().upper()

        if query_upper.startswith("UPDATE") or query_upper.startswith("DELETE"):
            return cursor.rowcount

        return cursor.lastrowid

    except Error as e:
        conn.rollback()
        raise e

    finally:
        if cursor is not None:
            cursor.close()

        if conn.is_connected():
            conn.close()


def execute_procedure(proc_name, args=None, fetch=False):
    """
    Executes a MySQL stored procedure.

    fetch=True:
        Returns result sets as a list of dictionaries.

    fetch=False:
        Returns the procedure arguments returned by callproc().
    """
    conn = get_connection()

    if not conn:
        raise Exception("Failed to connect to the database")

    cursor = None

    try:
        cursor = conn.cursor(dictionary=True)

        result_args = cursor.callproc(
            proc_name,
            args or ()
        )

        results = []

        if fetch:
            for result in cursor.stored_results():
                results.extend(result.fetchall())

        conn.commit()

        if fetch:
            return results

        return result_args

    except Error as e:
        conn.rollback()
        raise e

    finally:
        if cursor is not None:
            cursor.close()

        if conn.is_connected():
            conn.close()