document.addEventListener("DOMContentLoaded", () => {
  checkDatabaseConnection();
});

async function checkDatabaseConnection() {
  const statusElement = document.getElementById("database-status");

  const headerStatusElement = document.getElementById("header-database-status");

  try {
    const response = await fetch("/api/health");

    if (!response.ok) {
      throw new Error("Database connection failed");
    }

    const data = await response.json();

    if (data.status === "success") {
      if (statusElement) {
        statusElement.textContent = "Connected";

        statusElement.className = "badge success";
      }

      if (headerStatusElement) {
        headerStatusElement.textContent = "Connected";
      }
    } else {
      throw new Error(data.message || "Database unavailable");
    }
  } catch (error) {
    console.error("Database connection error:", error);

    if (statusElement) {
      statusElement.textContent = "Unavailable";

      statusElement.className = "badge pending";
    }

    if (headerStatusElement) {
      headerStatusElement.textContent = "Unavailable";
    }
  }
}
