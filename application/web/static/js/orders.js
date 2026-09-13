document.addEventListener("DOMContentLoaded", initializeOrders);

let currentOrderId = null;
let menuItems = [];
let reservations = [];

async function initializeOrders() {
  await Promise.all([
    loadTables(),
    loadWaiters(),
    loadReservations(),
    loadMenuItems(),
    loadOrders(),
  ]);

  setupOrderEvents();
  disableItemForm();
}

/* Load restaurant tables */
async function loadTables() {
  const select = document.getElementById("table-select");

  try {
    const response = await fetch("/api/tables");
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Unable to load tables.");
    }

    select.innerHTML = '<option value="">Select table</option>';

    result.data.forEach((table) => {
      const option = document.createElement("option");

      option.value = table.table_id;

      option.textContent =
        `Table ${table.table_number} - ` +
        `${table.capacity} seats - ` +
        `${table.area_name}`;

      select.appendChild(option);
    });
  } catch (error) {
    console.error("Table loading error:", error);

    select.innerHTML = '<option value="">Unable to load tables</option>';

    showMessage("order-form-message", error.message, "error");
  }
}

/* Load waiters */
async function loadWaiters() {
  const select = document.getElementById("waiter-select");

  try {
    const response = await fetch("/api/waiters");
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Unable to load waiters.");
    }

    select.innerHTML = '<option value="">Select waiter</option>';

    result.data.forEach((waiter) => {
      const option = document.createElement("option");

      option.value = waiter.waiter_id;

      option.textContent = `${waiter.first_name} ${waiter.last_name}`;

      select.appendChild(option);
    });
  } catch (error) {
    console.error("Waiter loading error:", error);

    select.innerHTML = '<option value="">Unable to load waiters</option>';

    showMessage("order-form-message", error.message, "error");
  }
}

/* Load reservations for optional order linking */
async function loadReservations() {
  const select = document.getElementById("reservation-select");

  try {
    const response = await fetch("/api/reservations");

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Unable to load reservations.");
    }

    reservations = result.data || [];

    select.innerHTML = '<option value="">Walk-in order</option>';

    reservations
      .filter((reservation) => reservation.status !== "Cancelled")
      .forEach((reservation) => {
        const option = document.createElement("option");

        option.value = reservation.reservation_id;

        const customerName =
          reservation.customer_name ||
          `${reservation.first_name || ""} ${reservation.last_name || ""}`.trim() ||
          "Customer";

        const tableNumber =
          reservation.table_number || reservation.table_id || "Table";

        const reservationDate = reservation.reservation_date || "";

        option.textContent =
          `#${reservation.reservation_id} - ` +
          `${customerName} - ` +
          `Table ${tableNumber} - ` +
          `${reservationDate}`;

        select.appendChild(option);
      });
  } catch (error) {
    console.error("Reservation loading error:", error);

    select.innerHTML = '<option value="">Walk-in order</option>';
  }
}

/* Load menu items */
async function loadMenuItems() {
  const select = document.getElementById("order-item-select");

  try {
    const response = await fetch("/api/menu-items");

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Unable to load menu items.");
    }

    menuItems = result.data || [];

    select.innerHTML = '<option value="">Select menu item</option>';

    menuItems
      .filter((item) => Boolean(item.is_available))
      .forEach((item) => {
        const option = document.createElement("option");

        option.value = item.item_id;

        option.textContent = `${item.name} - ₹${formatMoney(item.price)}`;

        select.appendChild(option);
      });
  } catch (error) {
    console.error("Menu loading error:", error);

    select.innerHTML = '<option value="">Unable to load menu</option>';

    showMessage("item-form-message", error.message, "error");
  }
}

/* Load order list */
async function loadOrders() {
  const tbody = document.getElementById("orders-table-body");

  tbody.innerHTML = `<tr>
            <td colspan="8" class="table-loading">
                Loading orders...
            </td>
        </tr>`;

  try {
    const response = await fetch("/api/orders");

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Unable to load orders.");
    }

    renderOrders(result.data || []);
  } catch (error) {
    console.error("Order loading error:", error);

    tbody.innerHTML = `<tr>
                <td colspan="8" class="table-loading">
                    ${escapeHtml(error.message)}
                </td>
            </tr>`;
  }
}

/* Render order table */
function renderOrders(orders) {
  const tbody = document.getElementById("orders-table-body");

  if (!orders.length) {
    tbody.innerHTML = `<tr>
                <td colspan="8" class="table-loading">
                    No orders found.
                </td>
            </tr>`;

    return;
  }

  tbody.innerHTML = "";

  orders.forEach((order) => {
    const row = document.createElement("tr");

    const customer = order.customer_name || "Walk-in";

    const statusClass = getStatusClass(order.status);

    const actionButton = document.createElement("button");

    actionButton.className = "secondary-button";

    actionButton.textContent = "View";

    actionButton.addEventListener("click", () => selectOrder(order.order_id));

    const actionCell = document.createElement("td");

    actionCell.appendChild(actionButton);

    if (order.status === "Active") {
      const closeButton = document.createElement("button");

      closeButton.className = "secondary-button";

      closeButton.textContent = "Close";

      closeButton.style.marginLeft = "6px";

      closeButton.addEventListener("click", () => closeOrder(order.order_id));

      actionCell.appendChild(closeButton);
    }

    row.innerHTML = `
            <td>${escapeHtml(order.order_id)}</td>

            <td>
                Table ${escapeHtml(order.table_number || order.table_id)}
            </td>

            <td>
                ${escapeHtml(order.waiter_name || "-")}
            </td>

            <td>
                ${escapeHtml(customer)}
            </td>

            <td>
                ${formatDate(order.order_date)}
            </td>

            <td>
                ${formatTime(order.order_time)}
            </td>

            <td>
                <span class="status-badge ${statusClass}">
                    ${escapeHtml(order.status)}
                </span>
            </td>
        `;

    row.appendChild(actionCell);

    tbody.appendChild(row);
  });
}

/* Select an order and load its details */
async function selectOrder(orderId) {
  currentOrderId = Number(orderId);

  enableItemForm();

  await loadOrderDetails(currentOrderId);

  document.getElementById("order-details").scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

/* Load detailed order information */
async function loadOrderDetails(orderId) {
  const container = document.getElementById("order-details");

  container.innerHTML = `<p class="table-loading">
            Loading order details...
        </p>`;

  try {
    const response = await fetch(`/api/orders/${orderId}`);

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Unable to load order details.");
    }

    renderOrderDetails(result.data);
  } catch (error) {
    console.error("Order detail error:", error);

    container.innerHTML = `<p class="table-loading">
                ${escapeHtml(error.message)}
            </p>`;
  }
}

/* Render selected order */
function renderOrderDetails(order) {
  const container = document.getElementById("order-details");

  const items = order.items || [];

  let itemsHtml = "";

  if (!items.length) {
    itemsHtml = `<tr>
                <td colspan="5">
                    No items have been added to this order.
                </td>
            </tr>`;
  } else {
    itemsHtml = items
      .map(
        (item) => `
                <tr>
                    <td>
                        ${escapeHtml(item.item_name)}
                    </td>

                    <td>
                        ${escapeHtml(item.quantity)}
                    </td>

                    <td>
                        ₹${formatMoney(item.unit_price)}
                    </td>

                    <td>
                        ₹${formatMoney(item.line_total)}
                    </td>

                    <td>
                        ${escapeHtml(item.special_instructions || "-")}
                    </td>
                </tr>
            `,
      )
      .join("");
  }

  container.innerHTML = `
        <div class="order-summary">

            <div>
                <strong>Order #${escapeHtml(order.order_id)}</strong>

                <span class="status-badge ${getStatusClass(order.status)}">
                    ${escapeHtml(order.status)}
                </span>
            </div>

            <p>
                Table ${escapeHtml(order.table_id)}
                &nbsp; | &nbsp;
                Waiter: ${escapeHtml(order.waiter)}
            </p>

            <p>
                ${formatDate(order.order_date)}
                &nbsp;
                ${formatTime(order.order_time)}
            </p>

        </div>


        <div class="table-wrapper">

            <table>

                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Qty</th>
                        <th>Unit Price</th>
                        <th>Line Total</th>
                        <th>Instructions</th>
                    </tr>
                </thead>

                <tbody>
                    ${itemsHtml}
                </tbody>

            </table>

        </div>


        <div class="order-total">

            <strong>
                Order Total
            </strong>

            <strong>
                ₹${formatMoney(order.order_total)}
            </strong>

        </div>
    `;
}

/* Create an order */
async function createOrder(event) {
  event.preventDefault();

  clearMessage("order-form-message");

  const tableId = document.getElementById("table-select").value;

  const waiterId = document.getElementById("waiter-select").value;

  const reservationId = document.getElementById("reservation-select").value;

  if (!tableId) {
    showMessage("order-form-message", "Please select a table.", "error");

    return;
  }

  if (!waiterId) {
    showMessage("order-form-message", "Please select a waiter.", "error");

    return;
  }

  const button = document.getElementById("create-order-button");

  button.disabled = true;
  button.textContent = "Creating...";

  try {
    const response = await fetch("/api/orders", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        table_id: Number(tableId),

        waiter_id: Number(waiterId),

        reservation_id: reservationId ? Number(reservationId) : null,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Unable to create order.");
    }

    currentOrderId = Number(result.order_id);

    showMessage(
      "order-form-message",
      `${result.message} Order ID: ${result.order_id}`,
      "success",
    );

    enableItemForm();

    document.getElementById("order-form").reset();

    await loadOrders();

    await loadOrderDetails(currentOrderId);
  } catch (error) {
    console.error("Order creation error:", error);

    showMessage("order-form-message", error.message, "error");
  } finally {
    button.disabled = false;
    button.textContent = "Create Order";
  }
}

/* Add an item to the selected order */
async function addOrderItem(event) {
  event.preventDefault();

  clearMessage("item-form-message");

  if (!currentOrderId) {
    showMessage(
      "item-form-message",
      "Please select or create an order first.",
      "error",
    );

    return;
  }

  const itemId = document.getElementById("order-item-select").value;

  const quantity = document.getElementById("item-quantity").value;

  const instructions = document
    .getElementById("special-instructions")
    .value.trim();

  if (!itemId) {
    showMessage("item-form-message", "Please select a menu item.", "error");

    return;
  }

  if (!quantity || Number(quantity) <= 0) {
    showMessage(
      "item-form-message",
      "Quantity must be greater than zero.",
      "error",
    );

    return;
  }

  const button = document.getElementById("add-item-button");

  button.disabled = true;
  button.textContent = "Adding...";

  try {
    const response = await fetch(`/api/orders/${currentOrderId}/items`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        item_id: Number(itemId),

        quantity: Number(quantity),

        special_instructions: instructions || null,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Unable to add order item.");
    }

    showMessage("item-form-message", result.message, "success");

    document.getElementById("order-item-form").reset();

    document.getElementById("item-quantity").value = 1;

    updateMenuItemPrice();

    await loadOrderDetails(currentOrderId);

    await loadOrders();
  } catch (error) {
    console.error("Order item error:", error);

    showMessage("item-form-message", error.message, "error");
  } finally {
    button.disabled = false;
    button.textContent = "Add Item";
  }
}

/* Close an active order */
async function closeOrder(orderId) {
  const confirmed = window.confirm(`Close order #${orderId}?`);

  if (!confirmed) {
    return;
  }

  try {
    const response = await fetch(`/api/orders/${orderId}/close`, {
      method: "PUT",
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Unable to close order.");
    }

    showMessage("order-form-message", result.message, "success");

    await loadOrders();

    if (currentOrderId === Number(orderId)) {
      await loadOrderDetails(orderId);
    }
  } catch (error) {
    console.error("Order close error:", error);

    showMessage("order-form-message", error.message, "error");
  }
}

/* Reservation selection can automatically select its table */
function handleReservationChange() {
  const reservationId = document.getElementById("reservation-select").value;

  if (!reservationId) {
    return;
  }

  const reservation = reservations.find(
    (item) => Number(item.reservation_id) === Number(reservationId),
  );

  if (reservation && reservation.table_id) {
    document.getElementById("table-select").value = reservation.table_id;
  }
}

/* Update displayed menu price */
function updateMenuItemPrice() {
  const itemId = document.getElementById("order-item-select").value;

  const priceElement = document.getElementById("menu-item-price");

  if (!itemId) {
    priceElement.textContent = "Select an available menu item.";

    return;
  }

  const item = menuItems.find(
    (menuItem) => Number(menuItem.item_id) === Number(itemId),
  );

  if (!item) {
    priceElement.textContent = "";

    return;
  }

  priceElement.textContent = `${item.category} | ₹${formatMoney(item.price)}`;
}

/* Configure page events */
function setupOrderEvents() {
  document.getElementById("order-form").addEventListener("submit", createOrder);

  document
    .getElementById("order-item-form")
    .addEventListener("submit", addOrderItem);

  document
    .getElementById("refresh-orders")
    .addEventListener("click", loadOrders);

  document
    .getElementById("reservation-select")
    .addEventListener("change", handleReservationChange);

  document
    .getElementById("order-item-select")
    .addEventListener("change", updateMenuItemPrice);
}

/* Enable item entry after an order is selected */
function enableItemForm() {
  document.getElementById("add-item-button").disabled = false;
}

/* Disable item entry when no order is selected */
function disableItemForm() {
  document.getElementById("add-item-button").disabled = true;
}

/* Display form messages */
function showMessage(elementId, message, type) {
  const element = document.getElementById(elementId);

  if (!element) {
    return;
  }

  element.textContent = message;

  element.className = `form-message ${type}`;
}

/* Clear form message */
function clearMessage(elementId) {
  const element = document.getElementById(elementId);

  if (!element) {
    return;
  }

  element.textContent = "";

  element.className = "form-message";
}

/* Format money */
function formatMoney(value) {
  const number = Number(value);

  if (Number.isNaN(number)) {
    return "0.00";
  }

  return number.toFixed(2);
}

/* Format database date */
function formatDate(value) {
  if (!value) {
    return "-";
  }

  return String(value);
}

/* Format database time */
function formatTime(value) {
  if (!value) {
    return "-";
  }

  return String(value).substring(0, 5);
}

/* Return a status badge class */
function getStatusClass(status) {
  const normalized = String(status || "").toLowerCase();

  if (normalized === "active") {
    return "status-active";
  }

  if (normalized === "closed") {
    return "status-closed";
  }

  return "";
}

/* Prevent HTML injection when rendering database values */
function escapeHtml(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
