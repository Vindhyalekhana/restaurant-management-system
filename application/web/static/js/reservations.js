document.addEventListener("DOMContentLoaded", initializeReservations);

let selectedTableId = null;

/* Initialize the reservations page */

async function initializeReservations() {
  setDefaultDate();

  await loadCustomers();

  await loadReservations();

  setupReservationEvents();
}

/* Set today's date in the reservation form */

function setDefaultDate() {
  const dateInput = document.getElementById("reservation-date");

  if (!dateInput) {
    return;
  }

  const today = new Date();

  const year = today.getFullYear();

  const month = String(today.getMonth() + 1).padStart(2, "0");

  const day = String(today.getDate()).padStart(2, "0");

  dateInput.value = `${year}-${month}-${day}`;
}

/* Load customers from the database */

async function loadCustomers() {
  const customerSelect = document.getElementById("customer-select");

  if (!customerSelect) {
    return;
  }

  try {
    const response = await fetch("/api/customers");

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Unable to load customers.");
    }

    customerSelect.innerHTML = '<option value="">Select customer</option>';

    result.data.forEach((customer) => {
      const option = document.createElement("option");

      option.value = customer.customer_id;

      option.textContent = `${customer.first_name} ${customer.last_name}`;

      customerSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Customer loading error:", error);

    customerSelect.innerHTML =
      '<option value="">Unable to load customers</option>';

    showMessage(error.message, "error");
  }
}

/* Check table availability */

async function checkAvailability() {
  const customerId = document.getElementById("customer-select").value;

  const reservationDate = document.getElementById("reservation-date").value;

  const startTime = document.getElementById("start-time").value;

  const endTime = document.getElementById("end-time").value;

  const guestCount = document.getElementById("guest-count").value;

  if (!customerId) {
    showMessage("Please select a customer.", "error");

    return;
  }

  if (!reservationDate) {
    showMessage("Please select a reservation date.", "error");

    return;
  }

  if (!startTime || !endTime) {
    showMessage("Please enter both start and end time.", "error");

    return;
  }

  if (startTime >= endTime) {
    showMessage("End time must be later than start time.", "error");

    return;
  }

  if (!guestCount || Number(guestCount) <= 0) {
    showMessage("Guest count must be greater than zero.", "error");

    return;
  }

  selectedTableId = null;

  disableCreateButton();

  setTableSelectionLoading();

  try {
    const response = await fetch("/api/reservations/availability", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        reservation_date: reservationDate,

        start_time: startTime,

        end_time: endTime,

        guest_count: Number(guestCount),
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Unable to check availability.");
    }

    displayAvailableTables(result.data);

    if (!result.data || result.data.length === 0) {
      showMessage(
        "No suitable tables are available for the selected time.",
        "error",
      );

      return;
    }

    showMessage(
      `${result.data.length} suitable table(s) available. Select a table to continue.`,
      "success",
    );
  } catch (error) {
    console.error("Availability error:", error);

    showMessage(error.message, "error");

    showEmptyTableSelection();
  }
}

/* Display available tables */

function displayAvailableTables(tables) {
  const container = document.getElementById("table-selection");

  if (!container) {
    return;
  }

  if (!tables || tables.length === 0) {
    showEmptyTableSelection("No suitable tables are available.");

    return;
  }

  container.innerHTML = `
    <div class="table-selection-header">
      <div>
        <h4>Available Tables</h4>
        <span>Select one table</span>
      </div>
    </div>

    <div class="table-options">
      ${tables.map((table) => createTableOption(table)).join("")}
    </div>
  `;

  const tableButtons = container.querySelectorAll(".table-option");

  tableButtons.forEach((button) => {
    button.addEventListener("click", () => {
      selectTable(Number(button.dataset.tableId));
    });
  });
}

/* Create one available table card */

function createTableOption(table) {
  return `
    <button
      type="button"
      class="table-option"
      data-table-id="${table.table_id}"
    >

      <strong>
        Table ${escapeHtml(table.table_number)}
      </strong>

      <span>
        Capacity: ${table.capacity} guests
      </span>

      <small>
        ${escapeHtml(table.area_name)}
      </small>

    </button>
  `;
}

/* Select a table */

function selectTable(tableId) {
  selectedTableId = tableId;

  const options = document.querySelectorAll(".table-option");

  options.forEach((option) => {
    const optionId = Number(option.dataset.tableId);

    option.classList.toggle("selected", optionId === tableId);
  });

  const createButton = document.getElementById("create-reservation-button");

  if (createButton) {
    createButton.disabled = false;
  }

  showMessage("Table selected. You can now create the reservation.", "success");
}

/* Create reservation */

async function createReservation(event) {
  event.preventDefault();

  if (!selectedTableId) {
    showMessage("Please check availability and select a table first.", "error");

    return;
  }

  const customerId = document.getElementById("customer-select").value;

  const reservationDate = document.getElementById("reservation-date").value;

  const startTime = document.getElementById("start-time").value;

  const endTime = document.getElementById("end-time").value;

  const guestCount = document.getElementById("guest-count").value;

  const specialRequests = document
    .getElementById("special-requests")
    .value.trim();

  const createButton = document.getElementById("create-reservation-button");

  createButton.disabled = true;

  createButton.textContent = "Creating Reservation...";

  try {
    const response = await fetch("/api/reservations", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        customer_id: Number(customerId),

        table_id: Number(selectedTableId),

        reservation_date: reservationDate,

        start_time: startTime,

        end_time: endTime,

        guest_count: Number(guestCount),

        special_requests: specialRequests || null,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Unable to create reservation.");
    }

    showMessage(
      result.message || "Reservation successfully created.",
      "success",
    );

    resetReservationForm();

    await loadReservations();
  } catch (error) {
    console.error("Reservation creation error:", error);

    showMessage(error.message, "error");
  } finally {
    createButton.textContent = "Create Reservation";

    createButton.disabled = selectedTableId === null;
  }
}

/* Load existing reservations */

async function loadReservations() {
  const tableBody = document.getElementById("reservations-table-body");

  if (!tableBody) {
    return;
  }

  tableBody.innerHTML = `
    <tr>
      <td
        colspan="8"
        class="table-loading"
      >
        Loading reservations...
      </td>
    </tr>
  `;

  try {
    const response = await fetch("/api/reservations");

    const contentType = response.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
      const text = await response.text();

      console.error("Non-JSON reservation response:", text);

      throw new Error(
        "The reservation API did not return JSON. Check the Flask server console.",
      );
    }

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Unable to load reservations.");
    }

    renderReservations(result.data);
  } catch (error) {
    console.error("Reservation loading error:", error);

    tableBody.innerHTML = `
      <tr>
        <td
          colspan="8"
          class="table-empty error-text"
        >
          ${escapeHtml(error.message)}
        </td>
      </tr>
    `;
  }
}

/* Render reservation rows */

function renderReservations(reservations) {
  const tableBody = document.getElementById("reservations-table-body");

  if (!tableBody) {
    return;
  }

  if (!reservations || reservations.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td
          colspan="8"
          class="table-empty"
        >
          No reservations found.
        </td>
      </tr>
    `;

    return;
  }

  tableBody.innerHTML = reservations
    .map((reservation) => {
      const customerName = `${reservation.first_name || ""} ${
        reservation.last_name || ""
      }`.trim();

      const time = `${formatTime(reservation.start_time)} - ${formatTime(
        reservation.end_time,
      )}`;

      return `
            <tr>

              <td>
                ${reservation.reservation_id}
              </td>

              <td>
                ${escapeHtml(customerName)}
              </td>

              <td>
                Table ${escapeHtml(reservation.table_number)}
              </td>

              <td>
                ${formatDate(reservation.reservation_date)}
              </td>

              <td>
                ${time}
              </td>

              <td>
                ${reservation.guest_count}
              </td>

              <td>
                ${createStatusBadge(reservation.status)}
              </td>

              <td>
                ${
                  reservation.status !== "Cancelled" &&
                  reservation.status !== "Seated"
                    ? `
                      <button
                        type="button"
                        class="table-action danger"
                        data-cancel-id="${reservation.reservation_id}"
                      >
                        Cancel
                      </button>
                    `
                    : `
                      <span class="action-disabled">
                        -
                      </span>
                    `
                }
              </td>

            </tr>
          `;
    })
    .join("");

  attachCancelHandlers();
}

/* Cancel reservation */

async function cancelReservation(reservationId) {
  const confirmed = window.confirm(`Cancel reservation #${reservationId}?`);

  if (!confirmed) {
    return;
  }

  try {
    const response = await fetch(`/api/reservations/${reservationId}/cancel`, {
      method: "PUT",
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Unable to cancel reservation.");
    }

    showMessage(
      result.message || "Reservation successfully cancelled.",
      "success",
    );

    await loadReservations();
  } catch (error) {
    console.error("Reservation cancellation error:", error);

    showMessage(error.message, "error");
  }
}

/* Attach cancellation buttons */

function attachCancelHandlers() {
  const buttons = document.querySelectorAll("[data-cancel-id]");

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      cancelReservation(Number(button.dataset.cancelId));
    });
  });
}

/* Setup page events */

function setupReservationEvents() {
  const availabilityButton = document.getElementById("availability-button");

  if (availabilityButton) {
    availabilityButton.addEventListener("click", checkAvailability);
  }

  const reservationForm = document.getElementById("reservation-form");

  if (reservationForm) {
    reservationForm.addEventListener("submit", createReservation);
  }

  const refreshButton = document.getElementById("refresh-reservations");

  if (refreshButton) {
    refreshButton.addEventListener("click", loadReservations);
  }
}

/* Reset form after successful creation */

function resetReservationForm() {
  const form = document.getElementById("reservation-form");

  if (form) {
    form.reset();
  }

  setDefaultDate();

  selectedTableId = null;

  disableCreateButton();

  showEmptyTableSelection();

  clearMessage();
}

/* Disable create button */

function disableCreateButton() {
  const button = document.getElementById("create-reservation-button");

  if (button) {
    button.disabled = true;
  }
}

/* Show loading state for tables */

function setTableSelectionLoading() {
  const container = document.getElementById("table-selection");

  if (!container) {
    return;
  }

  container.innerHTML = `
    <div class="empty-state">

      <span>...</span>

      <h4>
        Checking availability
      </h4>

      <p>
        Finding suitable tables for the selected time.
      </p>

    </div>
  `;
}

/* Show empty table state */

function showEmptyTableSelection(
  message = "Check availability to see suitable tables.",
) {
  const container = document.getElementById("table-selection");

  if (!container) {
    return;
  }

  container.innerHTML = `
    <div class="table-selection-empty">

      <span>▤</span>

      <p>
        ${escapeHtml(message)}
      </p>

    </div>
  `;
}

/* Display form message */

function showMessage(message, type) {
  const element = document.getElementById("availability-message");

  if (!element) {
    return;
  }

  element.textContent = message;

  element.className = `form-message ${type}`;
}

/* Clear form message */

function clearMessage() {
  const element = document.getElementById("availability-message");

  if (!element) {
    return;
  }

  element.textContent = "";

  element.className = "form-message";
}

/* Create status badge */

function createStatusBadge(status) {
  const normalized = String(status || "").toLowerCase();

  let className = "status-default";

  if (normalized === "confirmed" || normalized === "seated") {
    className = "status-success";
  } else if (normalized === "pending") {
    className = "status-pending";
  } else if (normalized === "cancelled") {
    className = "status-danger";
  }

  return `
    <span class="status-badge ${className}">
      ${escapeHtml(status || "Unknown")}
    </span>
  `;
}

/* Format reservation date */

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return escapeHtml(String(value));
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/* Format reservation time */

function formatTime(value) {
  if (!value) {
    return "-";
  }

  const text = String(value);

  const match = text.match(/^(\d{1,2}):(\d{2})/);

  if (!match) {
    return escapeHtml(text);
  }

  const hours = Number(match[1]);

  const minutes = match[2];

  const suffix = hours >= 12 ? "PM" : "AM";

  const displayHour = hours % 12 || 12;

  return `${displayHour}:${minutes} ${suffix}`;
}

/* Prevent HTML injection when rendering database values */

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
