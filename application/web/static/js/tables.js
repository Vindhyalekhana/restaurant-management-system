document.addEventListener("DOMContentLoaded", initializeTables);

let allTables = [];

/* Initialize the tables page */
async function initializeTables() {
  setupTableEvents();
  await loadTables();
}

/* Load tables from the Flask API */
async function loadTables() {
  const container = document.getElementById("tables-container");

  if (!container) {
    return;
  }

  showLoadingState();

  try {
    const response = await fetch("/api/tables");

    const contentType = response.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
      const text = await response.text();

      console.error("Non-JSON table response:", text);

      throw new Error(
        "The table API did not return JSON. Check the Flask server console.",
      );
    }

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Unable to load tables.");
    }

    allTables = result.data || [];

    updateTableSummary(allTables);
    renderTables();
  } catch (error) {
    console.error("Table loading error:", error);

    container.innerHTML = `
      <div class="table-page-message error-text">
        ${escapeHtml(error.message)}
      </div>
    `;

    updateTableSummary([]);
  }
}

/* Set up search, filter and refresh controls */
function setupTableEvents() {
  const searchInput = document.getElementById("table-search");

  if (searchInput) {
    searchInput.addEventListener("input", renderTables);
  }

  const statusFilter = document.getElementById("status-filter");

  if (statusFilter) {
    statusFilter.addEventListener("change", renderTables);
  }

  const refreshButton = document.getElementById("refresh-tables");

  if (refreshButton) {
    refreshButton.addEventListener("click", loadTables);
  }
}

/* Render tables according to current search and filter */
function renderTables() {
  const container = document.getElementById("tables-container");

  if (!container) {
    return;
  }

  const searchInput = document.getElementById("table-search");
  const statusFilter = document.getElementById("status-filter");

  const searchValue = searchInput ? searchInput.value.trim().toLowerCase() : "";

  const selectedStatus = statusFilter ? statusFilter.value : "All";

  const filteredTables = allTables.filter((table) => {
    const tableNumber = String(table.table_number || "").toLowerCase();
    const areaName = String(table.area_name || "").toLowerCase();

    const matchesSearch =
      !searchValue ||
      tableNumber.includes(searchValue) ||
      areaName.includes(searchValue);

    const matchesStatus =
      selectedStatus === "All" || String(table.status || "") === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  if (filteredTables.length === 0) {
    container.innerHTML = `
      <div class="table-page-message">
        <span>▤</span>
        <h4>No tables found</h4>
        <p>Try changing the search or status filter.</p>
      </div>
    `;

    return;
  }

  container.innerHTML = filteredTables
    .map((table) => createTableCard(table))
    .join("");
}

/* Create one table card */
function createTableCard(table) {
  const status = String(table.status || "Unknown");

  return `
    <article class="restaurant-table-card">

      <div class="restaurant-table-card-top">

        <div class="table-number-block">
          <span class="table-label">TABLE</span>
          <strong>
            ${escapeHtml(table.table_number)}
          </strong>
        </div>

        ${createTableStatusBadge(status)}

      </div>

      <div class="restaurant-table-details">

        <div class="table-detail">
          <span class="detail-label">Dining Area</span>
          <strong>
            ${escapeHtml(table.area_name || "—")}
          </strong>
        </div>

        <div class="table-detail">
          <span class="detail-label">Capacity</span>
          <strong>
            ${escapeHtml(table.capacity)} guests
          </strong>
        </div>

      </div>

    </article>
  `;
}

/* Create a status badge */
function createTableStatusBadge(status) {
  const normalizedStatus = status.toLowerCase();

  let statusClass = "status-default";

  if (normalizedStatus === "available") {
    statusClass = "status-success";
  } else if (normalizedStatus === "occupied") {
    statusClass = "status-danger";
  } else if (normalizedStatus === "reserved") {
    statusClass = "status-pending";
  } else if (normalizedStatus === "maintenance") {
    statusClass = "status-maintenance";
  }

  return `
    <span class="table-status-badge ${statusClass}">
      ${escapeHtml(status)}
    </span>
  `;
}

/* Update summary counters */
function updateTableSummary(tables) {
  const totalElement = document.getElementById("total-tables");
  const availableElement = document.getElementById("available-tables");
  const occupiedElement = document.getElementById("occupied-tables");
  const reservedElement = document.getElementById("reserved-tables");

  const total = tables.length;

  const available = tables.filter(
    (table) => String(table.status) === "Available",
  ).length;

  const occupied = tables.filter(
    (table) => String(table.status) === "Occupied",
  ).length;

  const reserved = tables.filter(
    (table) => String(table.status) === "Reserved",
  ).length;

  if (totalElement) {
    totalElement.textContent = total;
  }

  if (availableElement) {
    availableElement.textContent = available;
  }

  if (occupiedElement) {
    occupiedElement.textContent = occupied;
  }

  if (reservedElement) {
    reservedElement.textContent = reserved;
  }
}

/* Show loading state */
function showLoadingState() {
  const container = document.getElementById("tables-container");

  if (!container) {
    return;
  }

  container.innerHTML = `
    <div class="table-page-message">
      <span>...</span>
      <h4>Loading tables</h4>
      <p>Retrieving restaurant table information.</p>
    </div>
  `;
}

/* Escape dynamic values before inserting HTML */
function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
