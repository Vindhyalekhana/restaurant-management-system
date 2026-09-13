document.addEventListener("DOMContentLoaded", loadDashboard);

async function loadDashboard() {
  try {
    const response = await fetch("/api/dashboard");

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Unable to load dashboard");
    }

    const data = result.data;

    document.getElementById("reservation-count").textContent =
      data.today_reservations;

    document.getElementById("order-count").textContent = data.active_orders;

    document.getElementById("kitchen-count").textContent = data.kitchen_pending;

    document.getElementById("revenue").textContent = formatCurrency(
      data.today_revenue,
    );
  } catch (error) {
    console.error("Dashboard error:", error);
  }
}

function formatCurrency(amount) {
  return `₹ ${Number(amount || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
