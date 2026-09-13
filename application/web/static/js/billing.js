document.addEventListener("DOMContentLoaded", initializeBilling);

let billableOrders = [];
let discounts = [];
let waiters = [];
let bills = [];
let selectedBillId = null;

/* Initialize billing page */
async function initializeBilling() {
  setupBillingEvents();

  await Promise.all([
    loadBillableOrders(),
    loadDiscounts(),
    loadWaiters(),
    loadBills(),
  ]);

  updateBillingStats();
  populateUnpaidBills();
}

/* Configure page events */
function setupBillingEvents() {
  document
    .getElementById("billing-form")
    .addEventListener("submit", generateBill);

  document
    .getElementById("payment-form")
    .addEventListener("submit", processPayment);

  document
    .getElementById("billable-order-select")
    .addEventListener("change", handleBillableOrderChange);

  document
    .getElementById("discount-select")
    .addEventListener("change", handleDiscountChange);

  document
    .getElementById("unpaid-bill-select")
    .addEventListener("change", handlePaymentBillChange);

  document
    .getElementById("refresh-bills")
    .addEventListener("click", refreshBillingData);

  document
    .getElementById("clear-bill-details")
    .addEventListener("click", clearBillDetails);
}

/* Load closed orders that do not have bills */
async function loadBillableOrders() {
  const select = document.getElementById("billable-order-select");

  setSelectLoading(select, "Loading closed orders...");

  try {
    const response = await fetch("/api/billing/orders");
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Unable to load billable orders.");
    }

    billableOrders = result.data || [];

    select.innerHTML = '<option value="">Select closed order</option>';

    billableOrders.forEach((order) => {
      const option = document.createElement("option");

      option.value = order.order_id;

      option.textContent =
        `Order #${order.order_id} - ` +
        `${order.table_number || "Table"} - ` +
        `₹${formatMoney(order.order_subtotal)}`;

      select.appendChild(option);
    });

    updateGenerateButton();
  } catch (error) {
    console.error("Billable order loading error:", error);

    select.innerHTML = '<option value="">Unable to load closed orders</option>';

    showMessage("billing-form-message", error.message, "error");
  }
}

/* Load active discounts */
async function loadDiscounts() {
  const select = document.getElementById("discount-select");

  try {
    const response = await fetch("/api/billing/discounts");
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Unable to load discounts.");
    }

    discounts = result.data || [];

    select.innerHTML = '<option value="">No discount</option>';

    discounts.forEach((discount) => {
      const option = document.createElement("option");

      option.value = discount.discount_id;

      option.textContent =
        `${discount.discount_name} - ` + `${discount.percentage}%`;

      select.appendChild(option);
    });
  } catch (error) {
    console.error("Discount loading error:", error);

    select.innerHTML = '<option value="">Unable to load discounts</option>';

    showMessage("billing-form-message", error.message, "error");
  }
}

/* Load active waiters for discount authorization */
async function loadWaiters() {
  const select = document.getElementById("authorizing-waiter-select");

  try {
    const response = await fetch("/api/billing/waiters");
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Unable to load active waiters.");
    }

    waiters = result.data || [];

    select.innerHTML = '<option value="">Select active waiter</option>';

    waiters.forEach((waiter) => {
      const option = document.createElement("option");

      option.value = waiter.waiter_id;
      option.textContent = waiter.waiter_name;

      select.appendChild(option);
    });
  } catch (error) {
    console.error("Waiter loading error:", error);

    select.innerHTML = '<option value="">Unable to load waiters</option>';
  }
}

/* Load bill history */
async function loadBills() {
  const tbody = document.getElementById("bills-table-body");

  tbody.innerHTML = `
    <tr>
      <td colspan="9" class="table-loading">
        Loading bills...
      </td>
    </tr>
  `;

  try {
    const response = await fetch("/api/billing/bills");
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Unable to load bills.");
    }

    bills = result.data || [];

    renderBills(bills);
    updateBillingStats();
    populateUnpaidBills();
  } catch (error) {
    console.error("Bill loading error:", error);

    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="table-loading error-text">
          ${escapeHtml(error.message)}
        </td>
      </tr>
    `;
  }
}

/* Render bill history */
function renderBills(items) {
  const tbody = document.getElementById("bills-table-body");

  if (!items.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="table-empty">
          No bills found.
        </td>
      </tr>
    `;

    return;
  }

  tbody.innerHTML = "";

  items.forEach((bill) => {
    const row = document.createElement("tr");

    const statusClass = getStatusClass(bill.status);

    row.innerHTML = `
      <td>
        ${escapeHtml(bill.bill_id)}
      </td>

      <td>
        ${escapeHtml(bill.order_id)}
      </td>

      <td>
        ${formatDateTime(bill.generation_time)}
      </td>

      <td>
        ₹${formatMoney(bill.subtotal)}
      </td>

      <td>
        ${
          bill.discount_name
            ? `${escapeHtml(bill.discount_name)} - ₹${formatMoney(bill.discount_amount)}`
            : "-"
        }
      </td>

      <td>
        ₹${formatMoney(bill.tax_amount)}
      </td>

      <td>
        ₹${formatMoney(bill.total_amount)}
      </td>

      <td>
        <span class="status-badge ${statusClass}">
          ${escapeHtml(bill.status)}
        </span>
      </td>

      <td></td>
    `;

    const actionCell = row.lastElementChild;

    const viewButton = document.createElement("button");

    viewButton.type = "button";
    viewButton.className = "secondary-button";
    viewButton.textContent = "View";

    viewButton.addEventListener("click", () => selectBill(bill.bill_id));

    actionCell.appendChild(viewButton);

    tbody.appendChild(row);
  });
}

/* Populate unpaid bills in payment form */
function populateUnpaidBills() {
  const select = document.getElementById("unpaid-bill-select");

  const unpaidBills = bills.filter((bill) => bill.status === "Unpaid");

  select.innerHTML = '<option value="">Select unpaid bill</option>';

  unpaidBills.forEach((bill) => {
    const option = document.createElement("option");

    option.value = bill.bill_id;

    option.textContent =
      `Bill #${bill.bill_id} - ` +
      `Order #${bill.order_id} - ` +
      `₹${formatMoney(bill.total_amount)}`;

    select.appendChild(option);
  });

  updatePaymentButton();
}

/* Handle closed-order selection */
function handleBillableOrderChange() {
  const orderId = document.getElementById("billable-order-select").value;

  const summary = document.getElementById("selected-order-billing-summary");

  if (!orderId) {
    summary.innerHTML = `
      <span>▤</span>
      <p>
        Select an order to view its billing information.
      </p>
    `;

    updateGenerateButton();
    return;
  }

  const order = billableOrders.find(
    (item) => Number(item.order_id) === Number(orderId),
  );

  if (!order) {
    summary.innerHTML = `
      <p class="error-text">
        Unable to find the selected order.
      </p>
    `;

    updateGenerateButton();
    return;
  }

  summary.className = "billing-order-summary";

  summary.innerHTML = `
    <div class="billing-summary-row">
      <span>Order</span>
      <strong>#${escapeHtml(order.order_id)}</strong>
    </div>

    <div class="billing-summary-row">
      <span>Table</span>
      <strong>${escapeHtml(order.table_number || "-")}</strong>
    </div>

    <div class="billing-summary-row">
      <span>Waiter</span>
      <strong>${escapeHtml(order.waiter_name || "-")}</strong>
    </div>

    <div class="billing-summary-row billing-summary-total">
      <span>Subtotal</span>
      <strong>₹${formatMoney(order.order_subtotal)}</strong>
    </div>
  `;

  updateGenerateButton();
}

/* Handle discount selection */
function handleDiscountChange() {
  const discountId = document.getElementById("discount-select").value;

  const authorization = document.getElementById("discount-authorization");

  const waiterSelect = document.getElementById("authorizing-waiter-select");

  if (discountId) {
    authorization.classList.remove("hidden");
    waiterSelect.required = true;
  } else {
    authorization.classList.add("hidden");
    waiterSelect.required = false;
    waiterSelect.value = "";
  }

  updateGenerateButton();
}

/* Generate a bill */
async function generateBill(event) {
  event.preventDefault();

  clearMessage("billing-form-message");

  const orderId = document.getElementById("billable-order-select").value;

  const discountId = document.getElementById("discount-select").value;

  const waiterId = document.getElementById("authorizing-waiter-select").value;

  if (!orderId) {
    showMessage(
      "billing-form-message",
      "Please select a closed order.",
      "error",
    );

    return;
  }

  if (discountId && !waiterId) {
    showMessage(
      "billing-form-message",
      "Please select an authorizing waiter for the discount.",
      "error",
    );

    return;
  }

  const button = document.getElementById("generate-bill-button");

  button.disabled = true;
  button.textContent = "Generating...";

  try {
    const payload = {
      order_id: Number(orderId),
      discount_id: discountId ? Number(discountId) : null,
      authorized_by_waiter_id: waiterId ? Number(waiterId) : null,
    };

    const response = await fetch("/api/billing/generate", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Unable to generate bill.");
    }

    showMessage(
      "billing-form-message",
      `${result.message} Bill ID: ${result.data.bill_id}`,
      "success",
    );

    const generatedBillId = Number(result.data.bill_id);

    document.getElementById("billing-form").reset();

    document.getElementById("discount-authorization").classList.add("hidden");

    document.getElementById("authorizing-waiter-select").required = false;

    document.getElementById("selected-order-billing-summary").className =
      "billing-selection-empty";

    document.getElementById("selected-order-billing-summary").innerHTML = `
      <span>▤</span>
      <p>
        Select an order to view its billing information.
      </p>
    `;

    await loadBillableOrders();
    await loadBills();

    selectPaymentBill(generatedBillId);
    await selectBill(generatedBillId);
  } catch (error) {
    console.error("Bill generation error:", error);

    showMessage("billing-form-message", error.message, "error");
  } finally {
    button.textContent = "Generate Bill";
    updateGenerateButton();
  }
}

/* Handle payment bill selection */
async function handlePaymentBillChange() {
  const billId = document.getElementById("unpaid-bill-select").value;

  if (!billId) {
    document.getElementById("selected-payment-summary").className =
      "billing-selection-empty";

    document.getElementById("selected-payment-summary").innerHTML = `
      <span>▤</span>
      <p>
        Select a bill to view its details.
      </p>
    `;

    document.getElementById("amount-paid").value = "";

    updatePaymentButton();

    return;
  }

  const bill = bills.find((item) => Number(item.bill_id) === Number(billId));

  if (!bill) {
    return;
  }

  renderPaymentSummary(bill);

  document.getElementById("amount-paid").value = Number(
    bill.total_amount,
  ).toFixed(2);

  updatePaymentButton();
}

/* Select payment bill without triggering duplicate work */
function selectPaymentBill(billId) {
  const select = document.getElementById("unpaid-bill-select");

  const exists = bills.some(
    (bill) =>
      Number(bill.bill_id) === Number(billId) && bill.status === "Unpaid",
  );

  if (!exists) {
    return;
  }

  select.value = billId;

  handlePaymentBillChange();
}

/* Render selected payment summary */
function renderPaymentSummary(bill) {
  const container = document.getElementById("selected-payment-summary");

  container.className = "billing-payment-summary";

  container.innerHTML = `
    <div class="billing-summary-row">
      <span>Bill</span>
      <strong>#${escapeHtml(bill.bill_id)}</strong>
    </div>

    <div class="billing-summary-row">
      <span>Order</span>
      <strong>#${escapeHtml(bill.order_id)}</strong>
    </div>

    <div class="billing-summary-row billing-summary-total">
      <span>Amount Due</span>
      <strong>₹${formatMoney(bill.total_amount)}</strong>
    </div>
  `;
}

/* Process payment */
async function processPayment(event) {
  event.preventDefault();

  clearMessage("payment-form-message");

  const billId = document.getElementById("unpaid-bill-select").value;

  const paymentMethod = document.getElementById("payment-method").value;

  const amountPaid = document.getElementById("amount-paid").value;

  if (!billId) {
    showMessage(
      "payment-form-message",
      "Please select an unpaid bill.",
      "error",
    );

    return;
  }

  if (!paymentMethod) {
    showMessage(
      "payment-form-message",
      "Please select a payment method.",
      "error",
    );

    return;
  }

  if (!amountPaid || Number(amountPaid) <= 0) {
    showMessage(
      "payment-form-message",
      "Please enter a valid payment amount.",
      "error",
    );

    return;
  }

  const button = document.getElementById("process-payment-button");

  button.disabled = true;
  button.textContent = "Processing...";

  try {
    const response = await fetch("/api/billing/payment", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        bill_id: Number(billId),
        payment_method: paymentMethod,
        amount_paid: Number(amountPaid),
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Unable to process payment.");
    }

    showMessage("payment-form-message", result.message, "success");

    await loadBills();

    await selectBill(Number(billId));

    document.getElementById("payment-form").reset();

    document.getElementById("selected-payment-summary").className =
      "billing-selection-empty";

    document.getElementById("selected-payment-summary").innerHTML = `
      <span>▤</span>
      <p>
        Select an unpaid bill to process payment.
      </p>
    `;
  } catch (error) {
    console.error("Payment processing error:", error);

    showMessage("payment-form-message", error.message, "error");
  } finally {
    button.textContent = "Process Payment";
    updatePaymentButton();
  }
}

/* Select a bill from history */
async function selectBill(billId) {
  selectedBillId = Number(billId);

  const container = document.getElementById("bill-details");

  container.innerHTML = `
    <div class="bill-details-loading">
      Loading bill details...
    </div>
  `;

  try {
    const response = await fetch(`/api/billing/bills/${selectedBillId}`);

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Unable to load bill details.");
    }

    renderBillDetails(result.data);

    container.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  } catch (error) {
    console.error("Bill detail error:", error);

    container.innerHTML = `
      <div class="bill-details-loading error-text">
        ${escapeHtml(error.message)}
      </div>
    `;
  }
}

/* Render selected bill details */
function renderBillDetails(bill) {
  const container = document.getElementById("bill-details");

  const statusClass = getStatusClass(bill.status);

  const hasDiscount = bill.discount && bill.discount.name;

  container.innerHTML = `
    <div class="bill-receipt">

      <div class="bill-receipt-header">

        <div>
          <span class="bill-receipt-label">
            BILL
          </span>

          <h4>
            Bill #${escapeHtml(bill.bill_id)}
          </h4>

          <p>
            Order #${escapeHtml(bill.order_id)}
          </p>
        </div>

        <span class="status-badge ${statusClass}">
          ${escapeHtml(bill.status)}
        </span>

      </div>


      <div class="bill-receipt-meta">

        <div>
          <span>Generated</span>
          <strong>
            ${formatDateTime(bill.generation_time)}
          </strong>
        </div>

        <div>
          <span>Closed</span>
          <strong>
            ${bill.closed_time ? formatDateTime(bill.closed_time) : "-"}
          </strong>
        </div>

      </div>


      <div class="bill-receipt-breakdown">

        <div class="bill-receipt-row">

          <span>
            Subtotal
          </span>

          <strong>
            ₹${formatMoney(bill.subtotal)}
          </strong>

        </div>


        <div class="bill-receipt-row">

          <span>
            ${hasDiscount ? escapeHtml(bill.discount.name) : "Discount"}
          </span>

          <strong>
            - ₹${formatMoney(bill.discount ? bill.discount.amount : 0)}
          </strong>

        </div>


        ${
          hasDiscount
            ? `
              <div class="bill-receipt-row bill-receipt-secondary">
                <span>
                  Authorized by
                </span>

                <strong>
                  ${escapeHtml(bill.discount.authorized_by || "-")}
                </strong>
              </div>
            `
            : ""
        }


        <div class="bill-receipt-row">

          <span>
            Tax
          </span>

          <strong>
            ₹${formatMoney(bill.tax_amount)}
          </strong>

        </div>


        <div class="bill-receipt-total">

          <span>
            Total Amount
          </span>

          <strong>
            ₹${formatMoney(bill.total_amount)}
          </strong>

        </div>

      </div>

    </div>
  `;
}

/* Clear selected bill details */
function clearBillDetails() {
  selectedBillId = null;

  const container = document.getElementById("bill-details");

  container.innerHTML = `
    <div class="billing-selection-empty bill-details-empty">

      <span>▤</span>

      <h4>
        Select a bill
      </h4>

      <p>
        Select a bill from the history below to view
        detailed billing information.
      </p>

    </div>
  `;
}

/* Refresh all billing data */
async function refreshBillingData() {
  clearMessage("billing-form-message");
  clearMessage("payment-form-message");

  await Promise.all([
    loadBillableOrders(),
    loadDiscounts(),
    loadWaiters(),
    loadBills(),
  ]);

  updateBillingStats();
}

/* Update summary cards */
function updateBillingStats() {
  const billableCount = billableOrders.length;

  const unpaidBills = bills.filter((bill) => bill.status === "Unpaid");

  const paidBills = bills.filter((bill) => bill.status === "Paid");

  const paidRevenue = paidBills.reduce(
    (total, bill) => total + Number(bill.total_amount || 0),
    0,
  );

  document.getElementById("billable-orders-count").textContent = billableCount;

  document.getElementById("unpaid-bills-count").textContent =
    unpaidBills.length;

  document.getElementById("paid-bills-count").textContent = paidBills.length;

  document.getElementById("paid-revenue").textContent =
    `₹${formatMoney(paidRevenue)}`;
}

/* Enable or disable Generate Bill */
function updateGenerateButton() {
  const button = document.getElementById("generate-bill-button");

  const orderId = document.getElementById("billable-order-select").value;

  const discountId = document.getElementById("discount-select").value;

  const waiterId = document.getElementById("authorizing-waiter-select").value;

  button.disabled = !orderId || (Boolean(discountId) && !waiterId);
}

/* Enable or disable Process Payment */
function updatePaymentButton() {
  const button = document.getElementById("process-payment-button");

  const billId = document.getElementById("unpaid-bill-select").value;

  const paymentMethod = document.getElementById("payment-method").value;

  const amount = document.getElementById("amount-paid").value;

  button.disabled = !billId || !paymentMethod || !amount || Number(amount) <= 0;
}

/* Apply payment-field event listeners */
document.addEventListener("DOMContentLoaded", () => {
  const paymentMethod = document.getElementById("payment-method");

  const amountPaid = document.getElementById("amount-paid");

  if (paymentMethod) {
    paymentMethod.addEventListener("change", updatePaymentButton);
  }

  if (amountPaid) {
    amountPaid.addEventListener("input", updatePaymentButton);
  }
});

/* Set a select element to loading state */
function setSelectLoading(select, message) {
  if (!select) {
    return;
  }

  select.innerHTML = `
    <option value="">
      ${message}
    </option>
  `;
}

/* Display form message */
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

/* Format money values */
function formatMoney(value) {
  const number = Number(value || 0);

  return number.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/* Format date and time */
function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return escapeHtml(String(value));
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/* Create status badge class */
function getStatusClass(status) {
  const normalized = String(status || "").toLowerCase();

  if (normalized === "paid") {
    return "status-success";
  }

  if (normalized === "unpaid") {
    return "status-pending";
  }

  if (normalized === "cancelled" || normalized === "failed") {
    return "status-danger";
  }

  return "status-default";
}

/* Escape dynamic HTML */
function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
