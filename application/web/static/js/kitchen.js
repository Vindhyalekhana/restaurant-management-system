document.addEventListener("DOMContentLoaded", initializeKitchen);

let kitchenTickets = [];

async function initializeKitchen() {
  setupKitchenEvents();
  await loadKitchenTickets();
}

function setupKitchenEvents() {
  const refreshButton = document.getElementById("refresh-kitchen");
  const searchInput = document.getElementById("kitchen-search");
  const statusFilter = document.getElementById("kitchen-status-filter");

  if (refreshButton) {
    refreshButton.addEventListener("click", loadKitchenTickets);
  }

  if (searchInput) {
    searchInput.addEventListener("input", renderFilteredTickets);
  }

  if (statusFilter) {
    statusFilter.addEventListener("change", renderFilteredTickets);
  }
}

async function loadKitchenTickets() {
  const grid = document.getElementById("kitchen-tickets-grid");

  grid.innerHTML = `
        <div class="kitchen-empty-state">
            <span>K</span>
            <h4>Loading kitchen tickets...</h4>
            <p>
                Retrieving active tickets from the database.
            </p>
        </div>
    `;

  clearKitchenMessage();

  try {
    const response = await fetch("/api/kitchen/tickets");
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Unable to load kitchen tickets.");
    }

    kitchenTickets = result.data || [];

    updateKitchenStats(kitchenTickets);
    renderFilteredTickets();
  } catch (error) {
    console.error("Kitchen ticket loading error:", error);

    updateKitchenStats([]);
    grid.innerHTML = `
            <div class="kitchen-empty-state">
                <span>!</span>
                <h4>Unable to load tickets</h4>
                <p>${escapeHtml(error.message)}</p>
            </div>
        `;

    showKitchenMessage(error.message, "error");
  }
}

function updateKitchenStats(tickets) {
  const total = tickets.length;

  const queued = tickets.filter((ticket) => ticket.status === "Queued").length;

  const preparing = tickets.filter(
    (ticket) => ticket.status === "Preparing",
  ).length;

  const ready = tickets.filter((ticket) => ticket.status === "Ready").length;

  document.getElementById("total-active-count").textContent = total;
  document.getElementById("queued-count").textContent = queued;
  document.getElementById("preparing-count").textContent = preparing;
  document.getElementById("ready-count").textContent = ready;
}

function renderFilteredTickets() {
  const searchInput = document.getElementById("kitchen-search");
  const statusFilter = document.getElementById("kitchen-status-filter");
  const grid = document.getElementById("kitchen-tickets-grid");
  const countLabel = document.getElementById("kitchen-ticket-count");

  const searchValue = (searchInput.value || "").trim().toLowerCase();

  const selectedStatus = statusFilter.value;

  const filteredTickets = kitchenTickets.filter((ticket) => {
    const ticketId = String(ticket.ticket_id || "").toLowerCase();
    const orderId = String(ticket.order_id || "").toLowerCase();

    const matchesSearch =
      !searchValue ||
      ticketId.includes(searchValue) ||
      orderId.includes(searchValue);

    const matchesStatus =
      selectedStatus === "All" || ticket.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  countLabel.textContent =
    `${filteredTickets.length} ` +
    `${filteredTickets.length === 1 ? "ticket" : "tickets"}`;

  if (!filteredTickets.length) {
    grid.innerHTML = `
            <div class="kitchen-empty-state">
                <span>K</span>
                <h4>No kitchen tickets found</h4>
                <p>
                    No active tickets match the selected search or status filter.
                </p>
            </div>
        `;

    return;
  }

  grid.innerHTML = "";

  filteredTickets.forEach((ticket) => {
    grid.appendChild(createTicketCard(ticket));
  });
}

function createTicketCard(ticket) {
  const card = document.createElement("article");

  card.className = "kitchen-ticket-card";

  const statusClass = getStatusClass(ticket.status);
  const nextAction = getNextAction(ticket.status);
  const generatedTime = formatDateTime(ticket.generated_time);
  const readyTime = ticket.ready_time ? formatDateTime(ticket.ready_time) : "-";

  card.innerHTML = `
        <div class="kitchen-ticket-top">

            <div>
                <div class="kitchen-ticket-label">
                    Ticket
                </div>

                <div class="kitchen-ticket-id">
                    #${escapeHtml(ticket.ticket_id)}
                </div>

                <div class="kitchen-order-id">
                    Order #${escapeHtml(ticket.order_id)}
                </div>
            </div>

            <span class="kitchen-status-badge ${statusClass}">
                ${escapeHtml(ticket.status)}
            </span>

        </div>

        <div class="kitchen-ticket-divider"></div>

        <div class="kitchen-ticket-details">

            <div>
                <span class="kitchen-detail-label">
                    Generated
                </span>

                <span class="kitchen-detail-value">
                    ${escapeHtml(generatedTime)}
                </span>
            </div>

            <div>
                <span class="kitchen-detail-label">
                    Ready Time
                </span>

                <span class="kitchen-detail-value">
                    ${escapeHtml(readyTime)}
                </span>
            </div>

        </div>

        <button
            type="button"
            class="kitchen-action-button"
            data-ticket-id="${escapeHtml(ticket.ticket_id)}"
            ${nextAction ? "" : "disabled"}
        >
            ${escapeHtml(nextAction || "Completed")}
        </button>
    `;

  const actionButton = card.querySelector(".kitchen-action-button");

  if (nextAction) {
    actionButton.addEventListener("click", () =>
      updateTicketStatus(ticket.ticket_id, ticket.status),
    );
  }

  return card;
}

function getNextAction(status) {
  switch (status) {
    case "Queued":
      return "Start Preparing";

    case "Preparing":
      return "Mark Ready";

    case "Ready":
      return "Mark Served";

    default:
      return null;
  }
}

function getStatusClass(status) {
  switch (status) {
    case "Queued":
      return "queued";

    case "Preparing":
      return "preparing";

    case "Ready":
      return "ready";

    default:
      return "";
  }
}

async function updateTicketStatus(ticketId, currentStatus) {
  const endpointMap = {
    Queued: `/api/kitchen/tickets/${ticketId}/preparing`,
    Preparing: `/api/kitchen/tickets/${ticketId}/ready`,
    Ready: `/api/kitchen/tickets/${ticketId}/served`,
  };

  const endpoint = endpointMap[currentStatus];

  if (!endpoint) {
    return;
  }

  clearKitchenMessage();

  try {
    const response = await fetch(endpoint, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Unable to update kitchen ticket.");
    }

    showKitchenMessage(
      result.message || `Ticket ${ticketId} updated successfully.`,
      "success",
    );

    await loadKitchenTickets();
  } catch (error) {
    console.error("Kitchen ticket update error:", error);

    showKitchenMessage(error.message, "error");
  }
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
    hour: "numeric",
    minute: "2-digit",
  });
}

function showKitchenMessage(message, type) {
  const element = document.getElementById("kitchen-message");

  element.textContent = message;
  element.className = `form-message ${type}`;
}

function clearKitchenMessage() {
  const element = document.getElementById("kitchen-message");

  if (!element) {
    return;
  }

  element.textContent = "";
  element.className = "form-message";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
