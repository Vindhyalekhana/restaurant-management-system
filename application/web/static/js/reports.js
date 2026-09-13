document.addEventListener("DOMContentLoaded", initializeReports);

const reportDefinitions = {
  "available-tables": {
    title: "Available Tables",
    description: "Tables currently available for seating.",
    columns: [
      {
        key: "table_number",
        label: "Table",
      },
      {
        key: "area_name",
        label: "Dining Area",
      },
      {
        key: "capacity",
        label: "Capacity",
      },
      {
        key: "status",
        label: "Status",
      },
    ],
  },

  "table-turnover": {
    title: "Table Turnover",
    description: "Number of orders handled by each restaurant table.",
    columns: [
      {
        key: "table_number",
        label: "Table",
      },
      {
        key: "area_name",
        label: "Dining Area",
      },
      {
        key: "total_orders",
        label: "Total Orders",
      },
    ],
  },

  "waiter-performance": {
    title: "Waiter Performance",
    description: "Number of orders handled by each waiter.",
    columns: [
      {
        key: "waiter_id",
        label: "Waiter ID",
      },
      {
        key: "first_name",
        label: "First Name",
      },
      {
        key: "last_name",
        label: "Last Name",
      },
      {
        key: "total_orders",
        label: "Total Orders",
      },
    ],
  },

  "item-sales": {
    title: "Item Sales",
    description: "Total quantity sold for each menu item.",
    columns: [
      {
        key: "item_name",
        label: "Menu Item",
      },
      {
        key: "category",
        label: "Category",
      },
      {
        key: "total_quantity_sold",
        label: "Quantity Sold",
      },
    ],
  },

  "kitchen-delays": {
    title: "Kitchen Delays",
    description: "Preparation time recorded for completed kitchen tickets.",
    columns: [
      {
        key: "ticket_id",
        label: "Ticket ID",
      },
      {
        key: "order_id",
        label: "Order ID",
      },
      {
        key: "generated_time",
        label: "Generated",
      },
      {
        key: "ready_time",
        label: "Ready",
      },
      {
        key: "delay_minutes",
        label: "Delay (min)",
      },
    ],
  },

  "discount-usage": {
    title: "Discount Usage",
    description: "Usage count and total discounted amount for each discount.",
    columns: [
      {
        key: "discount_name",
        label: "Discount",
      },
      {
        key: "percentage",
        label: "Percentage",
      },
      {
        key: "times_used",
        label: "Times Used",
      },
      {
        key: "total_discounted",
        label: "Total Discounted",
      },
    ],
  },

  revenue: {
    title: "Revenue",
    description: "Realized revenue from paid bills grouped by date.",
    columns: [
      {
        key: "revenue_date",
        label: "Date",
      },
      {
        key: "daily_revenue",
        label: "Daily Revenue",
      },
    ],
  },
};

async function initializeReports() {
  setupReportEvents();
  await loadReport("available-tables");
}

function setupReportEvents() {
  const reportSelect = document.getElementById("report-select");
  const runButton = document.getElementById("run-report-button");
  const refreshButton = document.getElementById("refresh-report-button");

  if (reportSelect) {
    reportSelect.addEventListener("change", () => {
      const selectedReport = reportSelect.value;

      updateReportInformation(selectedReport);
    });
  }

  if (runButton) {
    runButton.addEventListener("click", () => {
      const selectedReport = reportSelect.value;

      loadReport(selectedReport);
    });
  }

  if (refreshButton) {
    refreshButton.addEventListener("click", () => {
      const selectedReport = reportSelect.value;

      loadReport(selectedReport);
    });
  }
}

async function loadReport(reportName) {
  const definition = reportDefinitions[reportName];

  if (!definition) {
    showReportMessage("Invalid report selected.", "error");
    return;
  }

  updateReportInformation(reportName);
  setReportLoading();

  const runButton = document.getElementById("run-report-button");
  const refreshButton = document.getElementById("refresh-report-button");

  if (runButton) {
    runButton.disabled = true;
    runButton.textContent = "Loading...";
  }

  if (refreshButton) {
    refreshButton.disabled = true;
  }

  try {
    const response = await fetch(
      `/api/reports/${encodeURIComponent(reportName)}`,
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Unable to generate report.");
    }

    const rows = Array.isArray(result.data) ? result.data : [];

    renderReport(rows, definition);

    updateSummary(definition.title, rows.length);

    showReportMessage(`${definition.title} loaded successfully.`, "success");
  } catch (error) {
    console.error("Report loading error:", error);

    setReportError(error.message);

    updateSummary(definition.title, 0);

    showReportMessage(error.message, "error");
  } finally {
    if (runButton) {
      runButton.disabled = false;
      runButton.textContent = "Run Report";
    }

    if (refreshButton) {
      refreshButton.disabled = false;
    }
  }
}

function updateReportInformation(reportName) {
  const definition = reportDefinitions[reportName];

  if (!definition) {
    return;
  }

  const title = document.getElementById("report-title");
  const description = document.getElementById("report-description");

  if (title) {
    title.textContent = definition.title;
  }

  if (description) {
    description.textContent = definition.description;
  }

  const summaryReport = document.getElementById("summary-report");

  if (summaryReport) {
    summaryReport.textContent = definition.title;
  }
}

function renderReport(rows, definition) {
  const tableHead = document.getElementById("report-table-head");
  const tableBody = document.getElementById("report-table-body");

  if (!tableHead || !tableBody) {
    return;
  }

  tableHead.innerHTML = `
        <tr>
            ${definition.columns
              .map((column) => `<th>${escapeHtml(column.label)}</th>`)
              .join("")}
        </tr>
    `;

  if (!rows || rows.length === 0) {
    tableBody.innerHTML = `
            <tr>
                <td
                    colspan="${definition.columns.length}"
                    class="table-loading"
                >
                    No records found for this report.
                </td>
            </tr>
        `;

    return;
  }

  tableBody.innerHTML = rows
    .map((row) => createReportRow(row, definition.columns))
    .join("");
}

function createReportRow(row, columns) {
  return `
        <tr>
            ${columns
              .map((column) => {
                const value = formatReportValue(row[column.key], column.key);

                return `
                        <td>
                            ${escapeHtml(value)}
                        </td>
                    `;
              })
              .join("")}
        </tr>
    `;
}

function formatReportValue(value, key) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  if (key === "daily_revenue" || key === "total_discounted") {
    return formatCurrency(value);
  }

  if (key === "percentage") {
    return `${formatNumber(value)}%`;
  }

  if (key === "generated_time" || key === "ready_time") {
    return formatDateTime(value);
  }

  if (key === "revenue_date") {
    return formatDate(value);
  }

  if (
    key === "capacity" ||
    key === "total_orders" ||
    key === "total_quantity_sold" ||
    key === "times_used" ||
    key === "delay_minutes" ||
    key === "waiter_id" ||
    key === "ticket_id" ||
    key === "order_id" ||
    key === "table_number"
  ) {
    return formatNumber(value);
  }

  return String(value);
}

function formatCurrency(value) {
  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) {
    return String(value);
  }

  return `₹${numericValue.toFixed(2)}`;
}

function formatNumber(value) {
  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) {
    return String(value);
  }

  return numericValue.toLocaleString("en-IN");
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function updateSummary(reportTitle, recordCount) {
  const summaryReport = document.getElementById("summary-report");
  const summaryRecords = document.getElementById("summary-records");
  const summaryUpdated = document.getElementById("summary-updated");

  if (summaryReport) {
    summaryReport.textContent = reportTitle;
  }

  if (summaryRecords) {
    summaryRecords.textContent = Number(recordCount).toLocaleString("en-IN");
  }

  if (summaryUpdated) {
    summaryUpdated.textContent = new Date().toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
}

function setReportLoading() {
  const tableHead = document.getElementById("report-table-head");
  const tableBody = document.getElementById("report-table-body");

  if (tableHead) {
    tableHead.innerHTML = `
            <tr>
                <th>Report</th>
            </tr>
        `;
  }

  if (tableBody) {
    tableBody.innerHTML = `
            <tr>
                <td class="table-loading">
                    Loading report data...
                </td>
            </tr>
        `;
  }
}

function setReportError(message) {
  const tableHead = document.getElementById("report-table-head");
  const tableBody = document.getElementById("report-table-body");

  if (tableHead) {
    tableHead.innerHTML = `
            <tr>
                <th>Report</th>
            </tr>
        `;
  }

  if (tableBody) {
    tableBody.innerHTML = `
            <tr>
                <td class="table-loading">
                    ${escapeHtml(message)}
                </td>
            </tr>
        `;
  }
}

function showReportMessage(message, type) {
  const messageElement = document.getElementById("report-message");

  if (!messageElement) {
    return;
  }

  messageElement.textContent = message;
  messageElement.className = `form-message ${type}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
