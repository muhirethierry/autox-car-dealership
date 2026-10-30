(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const db = window.AutoXData;
  const $fleetForm = $("#vehicle-form");
  let toastTimer;
  let cachedRequests = [];
  let cachedFleet = [];
  let cachedPayments = [];
  let cachedMaintenance = [];

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"})[character]);
  }

  function money(value) {
    return `RWF ${Number(value || 0).toLocaleString("en-US")}`;
  }

  function dateText(value, includeYear = false) {
    if (!value) return "Not set";
    const date = new Date(`${String(value).slice(0,10)}T00:00:00`);
    return Number.isNaN(date.getTime()) ? "Not set" : date.toLocaleDateString("en-GB", {day:"numeric",month:"short",...(includeYear ? {year:"numeric"} : {})});
  }

  function localToday() {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
  }

  function showToast(message, isError = false) {
    const toast = $("#admin-toast");
    toast.textContent = message;
    toast.classList.toggle("is-error", isError);
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
  }

  function statusClass(status) {
    return `status-${String(status || "pending").toLowerCase().replace(/[^a-z]+/g,"-")}`;
  }

  function log(action, detail) {
    db.logActivity(action, detail);
    renderActivity();
  }

  function getRequests() { return db.getRequests(); }
  function getFleet(includeArchived = false) { return db.getFleet({includeArchived}); }

  function renderOverview() {
    const fleet = getFleet();
    const requests = getRequests();
    const payments = db.getPayments();
    const customers = db.getCustomers();
    const maintenance = db.getMaintenance();
    const activeRequests = requests.filter(request => request.status === "Active");
    const verifiedRevenue = payments.filter(payment => payment.verificationStatus === "Verified" && payment.verified === true).reduce((sum,payment) => sum + (Number(payment.amount) || 0), 0);
    const pending = requests.filter(request => request.status === "Pending").length;
    const maintenanceCars = fleet.filter(car => car.maintenanceStatus).length;

    $("#metric-total").textContent = fleet.length;
    $("#metric-available").textContent = fleet.filter(car => car.available).length;
    $("#metric-rented").textContent = activeRequests.length;
    $("#metric-maintenance").textContent = maintenanceCars;
    $("#metric-requests").textContent = requests.length;
    $("#metric-pending").textContent = pending;
    $("#metric-active").textContent = activeRequests.length;
    $("#metric-customers").textContent = customers.length;
    $("#metric-revenue").textContent = money(verifiedRevenue);
    $("#side-fleet").textContent = fleet.length;
    $("#side-requests").textContent = pending;
    $("#side-customers").textContent = customers.length;
    $("#side-notifications").textContent = getNotifications().filter(item => !item.read).length;

    const profile = db.getProfile();
    const firstName = (profile.name || "Admin").trim().split(/\s+/)[0] || "Admin";
    $("#welcome-admin-name").textContent = firstName;
    $("#sidebar-admin-name").textContent = profile.name || "AutoX Admin";
    $("#topbar-admin-name").textContent = firstName;
    $("#today-date").textContent = new Date().toLocaleDateString("en-GB", {weekday:"short",day:"numeric",month:"short",year:"numeric"});
    window.AutoXReports.render({fleet, requests, payments, range:6});
    renderRecentRequests(requests);
    renderRecentVehicles(fleet);
    renderActivity();
  }

  function renderRecentRequests(requests = getRequests()) {
    const list = $("#recent-request-list");
    const rows = requests.slice().sort((a,b) => String(b.createdAt || "").localeCompare(String(a.createdAt || ""))).slice(0,5);
    list.innerHTML = rows.map(request => `<article class="recent-request-row"><span class="request-dot"></span><div class="recent-request-main"><strong>${escapeHTML(request.name || "Customer")}</strong><small>${escapeHTML(request.carName || "Vehicle")} · ${dateText(request.pickup)}</small></div><span class="status-pill ${statusClass(request.status)}">${escapeHTML(request.status)}</span></article>`).join("") || `<div class="inline-empty">New rental enquiries will appear here.</div>`;
  }

  function renderRecentVehicles(fleet = getFleet()) {
    const list = $("#recent-vehicles-list");
    const added = fleet.filter(car => car.createdAt).sort((a,b) => String(b.createdAt).localeCompare(String(a.createdAt))).slice(0,4);
    const vehicles = added.length ? added : fleet.slice(-4).reverse();
    list.innerHTML = vehicles.map(car => `<article class="recent-vehicle-row"><img src="${escapeHTML(car.image || car.fallbackImage || "")}" data-image-fallback="${escapeHTML(car.fallbackImage || "")}" alt="${escapeHTML(car.make)} ${escapeHTML(car.model)}" loading="lazy"><span><strong>${escapeHTML(car.make)} ${escapeHTML(car.model)}</strong><small>${escapeHTML(car.category || car.type)} · ${car.createdAt ? `Added ${dateText(car.createdAt,true)}` : "Core fleet"}</small></span><b>${money(car.dailyRate)}<small>/ day</small></b></article>`).join("") || `<div class="inline-empty">Your fleet is empty.</div>`;
  }

  function renderActivity() {
    const activities = db.getActivities().slice(0,6);
    $("#activity-list").innerHTML = activities.map(item => `<article class="activity-row"><span class="activity-icon"><i class="fa-regular fa-circle-check"></i></span><div><strong>${escapeHTML(item.action)}</strong><small>${escapeHTML(item.detail)}</small></div><time>${timeAgo(item.createdAt)}</time></article>`).join("") || `<div class="inline-empty">Important dashboard actions will be recorded here.</div>`;
  }

  function timeAgo(value) {
    const time = new Date(value).getTime();
    if (!Number.isFinite(time)) return "Just now";
    const minutes = Math.max(0, Math.floor((Date.now() - time) / 60000));
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours/24)}d ago`;
  }

  function renderFleet() {
    const includeArchived = $("#availability-filter").value === "archived";
    const fleet = getFleet(includeArchived);
    const query = $("#fleet-search").value.trim().toLowerCase();
    const category = $("#fleet-category-filter").value;
    const availability = $("#availability-filter").value;
    const filtered = fleet.filter(car => {
      const matchesQuery = `${car.make} ${car.model} ${car.id} ${car.registration}`.toLowerCase().includes(query);
      const matchesCategory = category === "all" || (car.category || car.type) === category;
      const matchesAvailability = availability === "all" || (availability === "archived" ? car.archived : availability === "maintenance" ? Boolean(car.maintenanceStatus) : availability === "available" ? car.available : !car.available && !car.maintenanceStatus && !car.rentalActive && !car.archived);
      return matchesQuery && matchesCategory && matchesAvailability;
    });
    $("#fleet-table-count").textContent = `${filtered.length} vehicle${filtered.length === 1 ? "" : "s"}`;
    $("#fleet-empty").hidden = filtered.length > 0;
    $("#fleet-table-body").innerHTML = filtered.map(car => {
      const status = car.archived ? "Archived" : car.maintenanceStatus ? "Maintenance" : car.rentalActive ? "Rented" : car.available ? "Available" : "Unavailable";
      return `<tr class="${car.archived ? "is-archived" : ""}"><td><div class="car-cell"><img class="fleet-thumb" src="${escapeHTML(car.image || car.fallbackImage || "")}" data-image-fallback="${escapeHTML(car.fallbackImage || "")}" alt="${escapeHTML(car.make)} ${escapeHTML(car.model)}" loading="lazy"><span><strong>${escapeHTML(car.make)} ${escapeHTML(car.model)}</strong><small>${escapeHTML(car.year || "Year not set")} · ${escapeHTML(car.category || car.type)}</small></span></div></td><td><strong class="vehicle-code">${escapeHTML(car.id)}</strong><small class="registration-number">${escapeHTML(car.registration || "Registration not set")}</small></td><td><span class="vehicle-spec-line">${escapeHTML(car.transmission || "Automatic")}</span><small class="registration-number">${escapeHTML(car.fuel || "Fuel not set")} · ${Number(car.seats) || 5} seats</small></td><td>${money(car.dailyRate)}</td><td>${money(car.weeklyRate)}</td><td>${money(car.monthlyRate)}</td><td><span class="status-pill ${statusClass(status)}">${escapeHTML(status)}</span></td><td><div class="row-actions"><button class="row-action" data-edit-vehicle="${escapeHTML(car.id)}" type="button">Edit</button>${car.archived ? `<button class="row-action" data-restore-vehicle="${escapeHTML(car.id)}" type="button">Restore</button>` : `<button class="row-action remove" data-archive-vehicle="${escapeHTML(car.id)}" type="button">Archive</button>`}</div></td></tr>`;
    }).join("");
  }

  function updateCategoryFilter() {
    const select = $("#fleet-category-filter");
    const current = select.value || "all";
    const categories = [...new Set(getFleet(true).map(car => car.category || car.type).filter(Boolean))].sort();
    select.innerHTML = `<option value="all">All categories</option>${categories.map(category => `<option value="${escapeHTML(category)}">${escapeHTML(category)}</option>`).join("")}`;
    if (categories.includes(current)) select.value = current;
  }

  function renderRequests() {
    const requests = getRequests();
    const query = $("#request-search").value.trim().toLowerCase();
    const status = $("#request-status-filter").value;
    const sort = $("#request-sort").value;
    let filtered = requests.filter(request => `${request.reference} ${request.name} ${request.email} ${request.phone} ${request.carName}`.toLowerCase().includes(query) && (status === "all" || request.status === status));
    filtered.sort((a,b) => {
      if (sort === "oldest") return String(a.createdAt || "").localeCompare(String(b.createdAt || ""));
      if (sort === "pickup") return String(a.pickup || "").localeCompare(String(b.pickup || ""));
      return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
    });
    $("#requests-total").textContent = `${requests.length} request${requests.length === 1 ? "" : "s"}`;
    $("#requests-table-body").innerHTML = filtered.map(request => {
      const duration = rentalDuration(request.pickup, request.return);
      const payment = db.getPayments().find(item => item.requestId === request.id);
      const paymentText = payment ? (payment.verificationStatus === "Verified" && payment.verified === true ? "Verified" : "Manual note") : "Unrecorded";
      return `<tr><td><div class="customer-cell"><strong>${escapeHTML(request.reference)}</strong><small>${escapeHTML(request.name || "Customer")} · <a href="mailto:${escapeHTML(request.email || "")}">${escapeHTML(request.email || "No email")}</a></small><small>${escapeHTML(request.phone || "No phone")}</small></div></td><td><div class="request-car"><strong>${escapeHTML(request.carName || "Vehicle")}</strong><small>${dateText(request.pickup,true)} – ${dateText(request.return,true)}</small></div></td><td><strong>${escapeHTML(request.pickupLocation || "—")}</strong><small class="registration-number">${escapeHTML(request.pickupTime || "Time not set")}</small></td><td><strong>${duration} day${duration === 1 ? "" : "s"}</strong><small class="registration-number">Estimate ${money(request.estimatedTotal)}</small></td><td><span class="payment-label ${paymentText === "Verified" ? "payment-verified" : ""}">${escapeHTML(paymentText)}</span></td><td><div class="request-action-cell"><span class="status-pill ${statusClass(request.status)}">${escapeHTML(request.status)}</span><div class="row-actions"><button class="row-action" data-view-request="${escapeHTML(request.id)}" type="button">Details</button>${requestActionButton(request)}</div></div></td></tr>`;
    }).join("");
    $("#requests-empty").hidden = filtered.length > 0;
  }

  function requestActionButton(request) {
    if (request.status === "Pending") return `<button class="row-action" data-request-action="Approved" data-request-id="${escapeHTML(request.id)}" type="button">Approve</button><button class="row-action remove" data-request-action="Rejected" data-request-id="${escapeHTML(request.id)}" type="button">Reject</button>`;
    if (request.status === "Approved") return `<button class="row-action" data-request-action="Active" data-request-id="${escapeHTML(request.id)}" type="button">Start</button><button class="row-action remove" data-request-action="Cancelled" data-request-id="${escapeHTML(request.id)}" type="button">Cancel</button>`;
    if (request.status === "Active") return `<button class="row-action" data-request-action="Completed" data-request-id="${escapeHTML(request.id)}" type="button">Return</button>`;
    return "";
  }

  function rentalDuration(start, end) {
    if (!start || !end) return 0;
    const days = Math.round((new Date(`${end}T00:00:00`) - new Date(`${start}T00:00:00`)) / 86400000);
    return Math.max(0, days);
  }

  function hasBookingConflict(proposed) {
    if (!proposed.carId || !proposed.pickup || !proposed.return) return false;
    const bookingConflict = getRequests().some(other => other.id !== proposed.id && other.carId === proposed.carId && ["Approved","Active"].includes(other.status) && other.pickup < proposed.return && proposed.pickup < other.return);
    const maintenanceConflict = db.getMaintenance().some(record => record.vehicleId === proposed.carId && ["Scheduled","In progress"].includes(record.status) && record.serviceDate >= proposed.pickup && record.serviceDate < proposed.return);
    return bookingConflict || maintenanceConflict;
  }

  function setRequestStatus(id, nextStatus) {
    const requests = getRequests();
    const request = requests.find(item => item.id === id);
    if (!request) return;
    if (["Approved","Active"].includes(nextStatus) && hasBookingConflict({...request, status:nextStatus})) {
      showToast("This vehicle has an overlapping approved booking or maintenance date.", true);
      return;
    }
    const reservedVehicle = getFleet(true).find(car => car.id === request.carId);
    if (nextStatus === "Approved" && (!reservedVehicle || reservedVehicle.archived || reservedVehicle.maintenanceStatus || (!reservedVehicle.available && !reservedVehicle.rentalActive))) {
      showToast("This vehicle is unavailable. Check its fleet and maintenance status first.", true);
      return;
    }
    if (nextStatus === "Active" && request.pickup && request.pickup > localToday()) {
      showToast("A rental cannot start before its pickup date.", true);
      return;
    }
    request.status = nextStatus;
    request.updatedAt = new Date().toISOString();
    if (!db.saveRequests(requests)) { showToast("Could not save the booking update.", true); return; }
    log(`Booking ${nextStatus.toLowerCase()}`, `${request.reference} · ${request.name || "Customer"} · ${request.carName || "Vehicle"}`);
    showToast(`Request marked ${nextStatus.toLowerCase()}.`);
    renderAll();
  }

  function renderActiveRentals() {
    const active = getRequests().filter(request => request.status === "Active");
    $("#active-table-body").innerHTML = active.map(request => {
      const overdue = request.return && request.return < localToday();
      return `<tr><td><strong>${escapeHTML(request.name || "Customer")}</strong><small class="registration-number">${escapeHTML(request.phone || request.email || "")}</small></td><td><strong>${escapeHTML(request.carName || "Vehicle")}</strong><small class="registration-number">${escapeHTML(request.reference)}</small></td><td>${dateText(request.pickup,true)}</td><td><span class="${overdue ? "overdue-text" : ""}">${dateText(request.return,true)}${overdue ? " · OVERDUE" : ""}</span></td><td>${rentalDuration(request.pickup,request.return)} days</td><td><span class="status-pill ${overdue ? "status-cancelled" : "status-active"}">${overdue ? "Overdue" : "Active"}</span></td><td><button class="row-action" data-view-request="${escapeHTML(request.id)}" type="button">Details</button> <button class="row-action" data-request-action="Completed" data-request-id="${escapeHTML(request.id)}" type="button">Mark returned</button></td></tr>`;
    }).join("");
    $("#active-empty").hidden = active.length > 0;
  }

  function renderHistory() {
    const query = $("#history-search").value.trim().toLowerCase();
    const status = $("#history-status").value;
    const history = getRequests().filter(request => ["Completed","Cancelled","Rejected"].includes(request.status) && (status === "all" || request.status === status) && `${request.reference} ${request.name} ${request.email} ${request.carName}`.toLowerCase().includes(query));
    $("#history-table-body").innerHTML = history.map(request => `<tr><td>${escapeHTML(request.reference)}</td><td><strong>${escapeHTML(request.name || "Customer")}</strong><small class="registration-number">${escapeHTML(request.email || "")}</small></td><td>${escapeHTML(request.carName || "Vehicle")}</td><td>${dateText(request.pickup)} – ${dateText(request.return)}</td><td>${money(request.estimatedTotal)}</td><td><span class="status-pill ${statusClass(request.status)}">${escapeHTML(request.status)}</span></td><td><button class="row-action" data-view-request="${escapeHTML(request.id)}" type="button">Details</button></td></tr>`).join("");
    $("#history-empty").hidden = history.length > 0;
  }

  function renderCustomers() {
    const query = $("#customer-search").value.trim().toLowerCase();
    const status = $("#customer-status-filter").value;
    const customers = db.getCustomers().filter(customer => `${customer.name} ${customer.email} ${customer.phone}`.toLowerCase().includes(query) && (status === "all" || customer.status === status));
    $("#customers-table-body").innerHTML = customers.map(customer => `<tr><td><strong>${escapeHTML(customer.name)}</strong><small class="registration-number">${escapeHTML(customer.id.slice(0,18))}</small></td><td><a class="contact-link" href="mailto:${escapeHTML(customer.email)}">${escapeHTML(customer.email)}</a><small class="registration-number">${escapeHTML(customer.phone || "Phone not provided")}</small></td><td>${dateText(customer.registeredAt,true)}</td><td>${customer.requestCount}</td><td>${customer.rentals}</td><td><span class="status-pill ${customer.status === "Active" ? "status-available" : "status-cancelled"}">${escapeHTML(customer.status)}</span></td><td><div class="row-actions"><button class="row-action" data-view-customer="${escapeHTML(customer.email)}" type="button">Profile</button><button class="row-action" data-toggle-customer="${escapeHTML(customer.email)}" type="button">${customer.status === "Active" ? "Deactivate" : "Activate"}</button></div></td></tr>`).join("");
    $("#customers-empty").hidden = customers.length > 0;
  }

  function renderPayments() {
    const payments = db.getPayments();
    const query = $("#payment-search").value.trim().toLowerCase();
    const requests = getRequests();
    const verified = payments.filter(item => item.verificationStatus === "Verified" && item.verified === true).reduce((sum,item) => sum + (Number(item.amount) || 0), 0);
    const manual = payments.filter(item => !(item.verificationStatus === "Verified" && item.verified === true)).reduce((sum,item) => sum + (Number(item.amount) || 0), 0);
    const manualRefunds = payments.reduce((sum,item) => sum + (Number(item.refundAmount) || 0), 0);
    const unpaidCount = requests.filter(request => !payments.some(payment => payment.requestId === request.id)).length;
    $("#verified-payment-total").textContent = money(verified);
    $("#manual-payment-total").textContent = money(manual);
    $("#manual-refund-total").textContent = money(manualRefunds);
    $("#unrecorded-payment-count").textContent = unpaidCount;
    const filtered = payments.filter(payment => `${payment.reference} ${payment.customerName} ${payment.vehicleName} ${payment.method}`.toLowerCase().includes(query));
    $("#payments-table-body").innerHTML = filtered.map(payment => {
      const confirmed = payment.verificationStatus === "Verified" && payment.verified === true;
      return `<tr><td><strong>${escapeHTML(payment.reference)}</strong></td><td><strong>${escapeHTML(payment.customerName || "Customer")}</strong><small class="registration-number">${escapeHTML(payment.requestReference || "")}</small></td><td>${escapeHTML(payment.method || "—")}</td><td>${money(payment.amount)}</td><td>${Number(payment.refundAmount) > 0 ? `<strong>${money(payment.refundAmount)}</strong><small class="registration-number">${escapeHTML(payment.refundReference || "Manual · unverified")}</small>` : "—"}</td><td>${dateText(payment.date || payment.paidAt,true)}</td><td><span class="status-pill ${confirmed ? "status-available" : "status-pending"}">${confirmed ? "Provider verified" : "Manual · unverified"}</span></td><td><button class="row-action remove" data-delete-payment="${escapeHTML(payment.id)}" type="button">Remove note</button></td></tr>`;
    }).join("");
    $("#payments-empty").hidden = filtered.length > 0;
    $("#record-payment-button").disabled = requests.length === 0;
  }

  function renderMaintenance() {
    const query = $("#maintenance-search").value.trim().toLowerCase();
    const status = $("#maintenance-filter").value;
    const fleet = getFleet(true);
    const rows = db.getMaintenance().filter(record => {
      const car = fleet.find(item => item.id === record.vehicleId);
      return `${car?.make || ""} ${car?.model || ""} ${record.title} ${record.provider}`.toLowerCase().includes(query) && (status === "all" || record.status === status);
    });
    $("#maintenance-table-body").innerHTML = rows.map(record => {
      const car = fleet.find(item => item.id === record.vehicleId);
      return `<tr><td><strong>${escapeHTML(car ? `${car.make} ${car.model}` : record.vehicleName || "Archived vehicle")}</strong><small class="registration-number">${escapeHTML(record.provider || "Service record")}</small></td><td><strong>${escapeHTML(record.title)}</strong><small class="registration-number">${escapeHTML(record.notes || "No additional notes")}</small></td><td>${dateText(record.serviceDate,true)}</td><td>${dateText(record.nextDate,true)}</td><td>${money(record.expense)}</td><td><select class="compact-status-select" data-maintenance-status="${escapeHTML(record.id)}"><option ${record.status === "Scheduled" ? "selected" : ""}>Scheduled</option><option ${record.status === "In progress" ? "selected" : ""}>In progress</option><option ${record.status === "Completed" ? "selected" : ""}>Completed</option></select></td><td><button class="row-action remove" data-delete-maintenance="${escapeHTML(record.id)}" type="button">Delete</button></td></tr>`;
    }).join("");
    $("#maintenance-empty").hidden = rows.length > 0;
    const vehicleSelect = $("#maintenance-vehicle");
    vehicleSelect.innerHTML = fleet.filter(car => !car.archived).map(car => `<option value="${escapeHTML(car.id)}">${escapeHTML(car.make)} ${escapeHTML(car.model)}</option>`).join("") || `<option value="">No active vehicles</option>`;
  }

  function renderReviews() {
    const reviews = db.getReviews();
    const ratings = reviews.map(review => Number(review.rating)).filter(rating => rating >= 1 && rating <= 5);
    const average = ratings.length ? (ratings.reduce((sum,rating) => sum + rating,0) / ratings.length).toFixed(1) : "—";
    $("#reviews-count").textContent = `${reviews.length} review${reviews.length === 1 ? "" : "s"}`;
    $("#average-rating").textContent = average;
    $("#published-reviews").textContent = reviews.filter(review => review.status === "Published").length;
    $("#pending-reviews").textContent = reviews.filter(review => review.status === "Pending").length;
    $("#reviews-table-body").innerHTML = reviews.map(review => `<tr><td>${escapeHTML(review.customerName || "Customer")}</td><td>${escapeHTML(review.vehicleName || "Vehicle")}</td><td>${Number(review.rating) || "—"} / 5</td><td>${escapeHTML(review.comment || "")}</td><td>${dateText(review.createdAt,true)}</td><td><select class="compact-status-select" data-review-status="${escapeHTML(review.id)}"><option ${review.status === "Pending" ? "selected" : ""}>Pending</option><option ${review.status === "Published" ? "selected" : ""}>Published</option><option ${review.status === "Hidden" ? "selected" : ""}>Hidden</option></select></td><td><button class="row-action remove" data-delete-review="${escapeHTML(review.id)}" type="button">Delete</button></td></tr>`).join("");
    $("#reviews-empty").hidden = reviews.length > 0;
  }

  function getNotifications() {
    const items = [];
    const readAt = Number(db.read("autoxAdminNotificationsReadAt", 0)) || 0;
    const add = (id, title, detail, date, kind) => items.push({id,title,detail,date,kind,read:new Date(date || 0).getTime() <= readAt});
    for (const request of getRequests()) {
      if (request.status === "Pending") add(`request-${request.id}`, `New rental request · ${request.reference}`, `${request.name || "Customer"} requested ${request.carName || "a vehicle"}.`, request.createdAt, "request");
      if (request.status === "Active" && request.return && request.return < localToday()) add(`overdue-${request.id}`, `Overdue return · ${request.reference}`, `${request.carName || "Vehicle"} was due back ${dateText(request.return,true)}.`, request.return, "overdue");
      else if (request.status === "Active" && request.return) {
        const daysLeft = rentalDuration(localToday(), request.return);
        if (daysLeft <= 2) add(`return-${request.id}`, `Upcoming return · ${request.reference}`, `${request.carName || "Vehicle"} is due ${dateText(request.return,true)}.`, request.return, "return");
      }
      if (request.status === "Approved") add(`approved-${request.id}`, `Booking approved · ${request.reference}`, `${request.carName || "Vehicle"} is booked for ${request.name || "the customer"}.`, request.updatedAt || request.createdAt, "booking");
      if (request.status === "Cancelled") add(`cancelled-${request.id}`, `Booking cancelled · ${request.reference}`, `${request.carName || "Vehicle"} for ${request.name || "the customer"} was cancelled.`, request.updatedAt || request.createdAt, "booking");
    }
    for (const record of db.getMaintenance()) {
      if (record.status === "In progress") add(`maintenance-${record.id}`, `Vehicle in maintenance`, `${record.vehicleName || "Vehicle"}: ${record.title}.`, record.createdAt || record.serviceDate, "maintenance");
      if (record.nextDate && record.nextDate >= localToday() && record.nextDate <= addDays(localToday(),7)) add(`service-due-${record.id}`, `Service reminder · ${record.vehicleName || "Vehicle"}`, `${record.title} is scheduled by ${dateText(record.nextDate,true)}.`, record.nextDate, "maintenance");
    }
    return items.sort((a,b) => new Date(b.date || 0)-new Date(a.date || 0));
  }

  function addDays(dateValue, days) {
    const date = new Date(`${dateValue}T00:00:00`);
    date.setDate(date.getDate()+days);
    return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
  }

  function renderNotifications() {
    const notifications = getNotifications();
    $("#side-notifications").textContent = notifications.filter(item => !item.read).length;
    $("#notification-list").innerHTML = notifications.map(item => `<article class="notification-row ${item.read ? "is-read" : ""}"><span class="notification-icon ${escapeHTML(item.kind)}"><i class="fa-solid ${item.kind === "overdue" ? "fa-triangle-exclamation" : item.kind === "maintenance" ? "fa-screwdriver-wrench" : item.kind === "return" ? "fa-calendar-check" : "fa-bell"}"></i></span><div><strong>${escapeHTML(item.title)}</strong><p>${escapeHTML(item.detail)}</p></div><time>${timeAgo(item.date)}</time></article>`).join("") || `<div class="table-empty"><i class="fa-regular fa-bell"></i><strong>You are all caught up</strong><p>New requests, returns and service alerts will appear here.</p></div>`;
  }

  function renderSettings() {
    const settings = db.getSettings();
    const form = $("#settings-form");
    for (const field of ["company","currency","location","contactEmail","contactPhone","rentalPolicy"]) if (form.elements[field]) form.elements[field].value = settings[field] || "";
    const profile = db.getProfile();
    const profileForm = $("#profile-form");
    profileForm.elements.name.value = profile.name || "";
    profileForm.elements.email.value = profile.email || "";
    $("#profile-display-name").textContent = profile.name || "AutoX Admin";
    $("#profile-avatar").textContent = (profile.name || "A").trim().slice(0,1).toUpperCase();
    $("#sidebar-admin-name").textContent = profile.name || "AutoX Admin";
    $("#topbar-admin-name").textContent = (profile.name || "Admin").trim().split(/\s+/)[0];
    $("#welcome-admin-name").textContent = (profile.name || "Admin").trim().split(/\s+/)[0];
  }

  function renderAll() {
    cachedFleet = getFleet(true);
    cachedRequests = getRequests();
    cachedPayments = db.getPayments();
    cachedMaintenance = db.getMaintenance();
    updateCategoryFilter();
    renderOverview();
    renderFleet();
    renderRequests();
    renderActiveRentals();
    renderHistory();
    renderCustomers();
    renderPayments();
    renderMaintenance();
    renderReviews();
    renderNotifications();
    renderSettings();
  }

  function switchView(name) {
    if (name === "logout") { window.location.href = "index.html"; return; }
    const valid = document.querySelector(`#view-${CSS.escape(name)}`);
    if (!valid) return;
    document.querySelectorAll(".admin-view").forEach(section => { section.hidden = section !== valid; });
    document.querySelectorAll(".admin-nav-link[data-view]").forEach(button => button.classList.toggle("is-active", button.dataset.view === name));
    const active = document.querySelector(`.admin-nav-link[data-view="${CSS.escape(name)}"]`);
    $("#current-section").textContent = active ? active.textContent.trim().replace(/\d+$/," ").trim() : name;
    $("#admin-sidebar").classList.remove("is-open");
    $("#sidebar-toggle").setAttribute("aria-expanded","false");
    window.scrollTo({top:0,behavior:"smooth"});
  }

  function showDialog(dialog) { if (dialog && !dialog.open) dialog.showModal(); }
  function closeDialog(button) { button.closest("dialog")?.close(); }

  function populateVehicleDialog(vehicle = null) {
    const form = $fleetForm;
    form.reset();
    delete form.dataset.uploadedImage;
    form.elements.id.value = vehicle?.id || "";
    form.elements.make.value = vehicle?.make || "";
    form.elements.model.value = vehicle?.model || "";
    form.elements.year.value = vehicle?.year || "";
    form.elements.registration.value = vehicle?.registration || "";
    form.elements.category.value = vehicle?.category || vehicle?.type || "SUV";
    form.elements.transmission.value = vehicle?.transmission || "Automatic";
    form.elements.fuel.value = vehicle?.fuel || "Petrol";
    form.elements.seats.value = vehicle?.seats || 5;
    form.elements.dailyRate.value = vehicle?.dailyRate || "";
    form.elements.weeklyRate.value = vehicle?.weeklyRate || (vehicle?.dailyRate ? vehicle.dailyRate*6 : "");
    form.elements.monthlyRate.value = vehicle?.monthlyRate || (vehicle?.dailyRate ? Math.round(vehicle.dailyRate*25.5) : "");
    form.elements.available.value = vehicle?.available === false ? "false" : "true";
    form.elements.description.value = vehicle?.description || "";
    form.elements.image.value = vehicle?.image?.startsWith("http") ? vehicle.image : "";
    form.elements.photoFile.value = "";
    const preview = $("#vehicle-photo-preview");
    if (vehicle?.image) { preview.src = vehicle.image; preview.hidden = false; }
    else { preview.removeAttribute("src"); preview.hidden = true; }
    $("#vehicle-dialog-title").textContent = vehicle ? "Edit vehicle" : "Add vehicle";
    $("#vehicle-form-error").textContent = "";
    showDialog($("#vehicle-dialog"));
  }

  function idFor(make, model) {
    return `${make}-${model}`.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
  }

  async function compressImage(file) {
    if (!file || !/^image\/(png|jpeg|webp)$/.test(file.type)) throw new Error("Choose a JPG, PNG or WebP image.");
    if (file.size > 12 * 1024 * 1024) throw new Error("Choose an image smaller than 12 MB.");
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1000 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas.getContext("2d").drawImage(bitmap,0,0,canvas.width,canvas.height);
    bitmap.close?.();
    return canvas.toDataURL("image/jpeg",0.78);
  }

  $fleetForm.elements.photoFile.addEventListener("change", async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImage(file);
      $("#vehicle-photo-preview").src = dataUrl;
      $("#vehicle-photo-preview").hidden = false;
      $fleetForm.dataset.uploadedImage = dataUrl;
      $fleetForm.elements.image.value = "";
    } catch (error) {
      $("#vehicle-form-error").textContent = error.message;
    }
  });
  $fleetForm.elements.image.addEventListener("input", event => {
    const preview = $("#vehicle-photo-preview");
    if (event.target.value.trim()) { preview.src = event.target.value.trim(); preview.hidden = false; }
    else if (!$fleetForm.dataset.uploadedImage) preview.hidden = true;
  });

  $fleetForm.addEventListener("submit", event => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const make = String(formData.get("make") || "").trim();
    const model = String(formData.get("model") || "").trim();
    const existingId = String(formData.get("id") || "");
    const id = existingId || idFor(make,model);
    const oldVehicle = getFleet(true).find(car => car.id === existingId);
    const rate = Number(formData.get("dailyRate"));
    const weekly = Number(formData.get("weeklyRate"));
    const monthly = Number(formData.get("monthlyRate"));
    const error = $("#vehicle-form-error");
    error.textContent = "";
    if (!existingId && getFleet(true).some(car => `${car.make} ${car.model}`.toLowerCase() === `${make} ${model}`.toLowerCase())) { error.textContent = "That make and model already exist in the fleet."; return; }
    if (![rate,weekly,monthly].every(value => Number.isFinite(value) && value >= 1000)) { error.textContent = "Enter valid daily, weekly and monthly rates of at least RWF 1,000."; return; }
    const uploaded = form.dataset.uploadedImage || "";
    const imageUrl = String(formData.get("image") || "").trim();
    const vehicle = {
      ...(oldVehicle || {}), id, make, model,
      year:Number(formData.get("year")) || "",
      registration:String(formData.get("registration") || "").trim(),
      type:String(formData.get("category") || "SUV"),
      category:String(formData.get("category") || "SUV"),
      transmission:String(formData.get("transmission") || "Automatic"),
      fuel:String(formData.get("fuel") || "Petrol"),
      seats:Number(formData.get("seats")) || 5,
      dailyRate:rate, weeklyRate:weekly, monthlyRate:monthly,
      available:formData.get("available") === "true",
      description:String(formData.get("description") || "").trim() || `${make} ${model} rental vehicle. Contact AUTOX to confirm trip details.`,
      image:uploaded || imageUrl || oldVehicle?.image || oldVehicle?.fallbackImage || "",
      fallbackImage:oldVehicle?.fallbackImage || "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1000&q=85",
      alt:`${make} ${model}`,
      tag:String(formData.get("fuel") || "").toLowerCase() === "electric" ? "ELECTRIC" : String(formData.get("category") || "SUV").toUpperCase(),
      createdAt:oldVehicle?.createdAt || new Date().toISOString(),
      updatedAt:new Date().toISOString(),
      status:"Active"
    };
    if (!db.saveVehicle(vehicle)) { error.textContent = "Could not save this vehicle. Browser storage may be full."; return; }
    log(existingId ? "Vehicle updated" : "Vehicle added", `${make} ${model}`);
    form.dataset.uploadedImage = "";
    $("#vehicle-dialog").close();
    renderAll();
    showToast(existingId ? "Vehicle updated. Reload the rental site to see changes." : "Vehicle added to the fleet.");
  });

  function archiveVehicle(id, archived) {
    const vehicle = getFleet(true).find(car => car.id === id);
    if (!vehicle) return;
    const verb = archived ? "Archive" : "Restore";
    if (!window.confirm(`${verb} ${vehicle.make} ${vehicle.model}? ${archived ? "It will be hidden from customer listings." : "It will appear in customer listings again."}`)) return;
    if (!db.archiveVehicle(id,archived)) { showToast("Could not update the fleet.", true); return; }
    log(archived ? "Vehicle archived" : "Vehicle restored", `${vehicle.make} ${vehicle.model}`);
    renderAll();
    showToast(archived ? "Vehicle archived." : "Vehicle restored to the fleet.");
  }

  function showRequestDetails(id) {
    const request = getRequests().find(item => item.id === id);
    if (!request) return;
    const history = getRequests().filter(item => String(item.email || "").toLowerCase() === String(request.email || "").toLowerCase()).length;
    $("#detail-content").innerHTML = `<span class="admin-eyebrow">RENTAL REQUEST</span><h2 id="detail-title">${escapeHTML(request.reference)}</h2><div class="detail-status"><span class="status-pill ${statusClass(request.status)}">${escapeHTML(request.status)}</span></div><div class="detail-data-grid"><div><small>Customer</small><strong>${escapeHTML(request.name || "Customer")}</strong></div><div><small>Customer history</small><strong>${history} request${history === 1 ? "" : "s"}</strong></div><div><small>Email</small><a href="mailto:${escapeHTML(request.email || "")}">${escapeHTML(request.email || "Not provided")}</a></div><div><small>Phone</small><a href="tel:${escapeHTML(request.phone || "")}">${escapeHTML(request.phone || "Not provided")}</a></div><div><small>Vehicle</small><strong>${escapeHTML(request.carName || "Vehicle")}</strong></div><div><small>Rental period</small><strong>${dateText(request.pickup,true)} – ${dateText(request.return,true)}</strong></div><div><small>Pickup</small><strong>${escapeHTML(request.pickupLocation || "—")} · ${escapeHTML(request.pickupTime || "")}</strong></div><div><small>Return</small><strong>${escapeHTML(request.returnLocation || "—")} · ${escapeHTML(request.returnTime || "")}</strong></div><div><small>Duration</small><strong>${rentalDuration(request.pickup,request.return)} days</strong></div><div><small>Estimated total</small><strong>${money(request.estimatedTotal)}</strong></div><div><small>Payment</small><strong>${escapeHTML(request.paymentStatus || "Unrecorded")}</strong></div><div><small>Passengers</small><strong>${escapeHTML(request.passengers || "Not specified")}</strong></div></div><div class="detail-notes"><small>Special requests</small><p>${escapeHTML(request.notes || "No special requests provided.")}</p></div>`;
    showDialog($("#detail-dialog"));
  }

  function showCustomerDetails(email) {
    const customer = db.getCustomers().find(item => item.email === email);
    if (!customer) return;
    const history = getRequests().filter(item => String(item.email || "").toLowerCase() === String(email).toLowerCase()).sort((a,b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
    const rows = history.map(request => `<article class="recent-request-row"><span class="request-dot"></span><div class="recent-request-main"><strong>${escapeHTML(request.reference)} · ${escapeHTML(request.carName || "Vehicle")}</strong><small>${dateText(request.pickup,true)} – ${dateText(request.return,true)} · ${money(request.estimatedTotal)}</small></div><span class="status-pill ${statusClass(request.status)}">${escapeHTML(request.status)}</span></article>`).join("") || `<p class="inline-empty">No rental requests are recorded for this customer.</p>`;
    $("#detail-content").innerHTML = `<span class="admin-eyebrow">CUSTOMER PROFILE · LOCAL RECORD</span><h2 id="detail-title">${escapeHTML(customer.name)}</h2><div class="detail-data-grid"><div><small>Email</small><a href="mailto:${escapeHTML(customer.email)}">${escapeHTML(customer.email || "Not provided")}</a></div><div><small>Phone</small><a href="tel:${escapeHTML(customer.phone || "")}">${escapeHTML(customer.phone || "Not provided")}</a></div><div><small>Registered</small><strong>${dateText(customer.registeredAt,true)}</strong></div><div><small>Account status</small><strong>${escapeHTML(customer.status)}</strong></div><div><small>Total requests</small><strong>${customer.requestCount}</strong></div><div><small>Approved, active or completed</small><strong>${customer.rentals}</strong></div></div><div class="detail-notes"><small>Rental history</small><div class="activity-list">${rows}</div></div>`;
    showDialog($("#detail-dialog"));
  }

  function renderMaintenanceDialog() {
    const form = $("#maintenance-form");
    form.reset();
    form.elements.serviceDate.value = localToday();
    form.elements.status.value = "In progress";
    const cars = getFleet(true).filter(car => !car.archived);
    form.elements.vehicleId.innerHTML = cars.map(car => `<option value="${escapeHTML(car.id)}">${escapeHTML(car.make)} ${escapeHTML(car.model)}</option>`).join("");
    if (!cars.length) { showToast("Add a vehicle before logging maintenance.", true); return; }
    showDialog($("#maintenance-dialog"));
  }

  function renderPaymentDialog() {
    const form = $("#payment-form");
    form.reset();
    form.elements.date.value = localToday();
    const requests = getRequests();
    const payments = db.getPayments();
    const unrecorded = requests.filter(request => !payments.some(payment => payment.requestId === request.id));
    form.elements.requestId.innerHTML = unrecorded.map(request => `<option value="${escapeHTML(request.id)}">${escapeHTML(request.reference)} · ${escapeHTML(request.name || "Customer")} · ${money(request.estimatedTotal)}</option>`).join("") || `<option value="">No unrecorded rental requests</option>`;
    form.elements.amount.value = unrecorded[0]?.estimatedTotal || "";
    form.elements.amount.disabled = unrecorded.length === 0;
    form.elements.reference.disabled = unrecorded.length === 0;
    form.querySelector("button[type=submit]").disabled = unrecorded.length === 0;
    showDialog($("#payment-dialog"));
  }

  document.querySelectorAll(".admin-nav-link[data-view]").forEach(button => button.addEventListener("click", () => switchView(button.dataset.view)));
  document.querySelectorAll("[data-open-view]").forEach(button => button.addEventListener("click", () => switchView(button.dataset.openView)));
  $("#sidebar-toggle").addEventListener("click", () => {
    const open = $("#admin-sidebar").classList.toggle("is-open");
    $("#sidebar-toggle").setAttribute("aria-expanded",String(open));
  });
  $("#admin-sidebar").addEventListener("click", event => { if (event.target.closest(".admin-nav-link[data-view]")) $("#admin-sidebar").classList.remove("is-open"); });
  document.addEventListener("click", event => {
    if (!$("#admin-sidebar").classList.contains("is-open")) return;
    if (event.target.closest("#admin-sidebar") || event.target.closest("#sidebar-toggle")) return;
    $("#admin-sidebar").classList.remove("is-open");
    $("#sidebar-toggle").setAttribute("aria-expanded","false");
  });
  document.querySelectorAll("[data-quick-add]").forEach(button => button.addEventListener("click", () => populateVehicleDialog()));
  document.addEventListener("error", event => {
    const image = event.target;
    if (!(image instanceof HTMLImageElement) || !image.dataset.imageFallback) return;
    if (!image.dataset.fallbackAttempted) {
      image.dataset.fallbackAttempted = "true";
      image.src = image.dataset.imageFallback;
    } else {
      image.removeAttribute("src");
      image.classList.add("image-missing");
    }
  },true);
  document.querySelectorAll("[data-close-dialog]").forEach(button => button.addEventListener("click", () => closeDialog(button)));
  document.querySelectorAll("dialog").forEach(dialog => dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close(); }));
  $(".notice-dismiss").addEventListener("click", event => event.currentTarget.closest(".local-demo-notice").remove());

  $("#fleet-table-body").addEventListener("click", event => {
    const edit = event.target.closest("[data-edit-vehicle]");
    const archive = event.target.closest("[data-archive-vehicle]");
    const restore = event.target.closest("[data-restore-vehicle]");
    if (edit) populateVehicleDialog(getFleet(true).find(car => car.id === edit.dataset.editVehicle));
    if (archive) archiveVehicle(archive.dataset.archiveVehicle,true);
    if (restore) archiveVehicle(restore.dataset.restoreVehicle,false);
  });
  $("#fleet-search").addEventListener("input",renderFleet);
  $("#fleet-category-filter").addEventListener("change",renderFleet);
  $("#availability-filter").addEventListener("change",renderFleet);

  $("#requests-table-body").addEventListener("click", event => {
    const view = event.target.closest("[data-view-request]");
    const action = event.target.closest("[data-request-action]");
    if (view) showRequestDetails(view.dataset.viewRequest);
    if (action) setRequestStatus(action.dataset.requestId,action.dataset.requestAction);
  });
  $("#active-table-body").addEventListener("click", event => {
    const view = event.target.closest("[data-view-request]");
    const action = event.target.closest("[data-request-action]");
    if (view) showRequestDetails(view.dataset.viewRequest);
    if (action) setRequestStatus(action.dataset.requestId,action.dataset.requestAction);
  });
  $("#history-table-body").addEventListener("click", event => { const view = event.target.closest("[data-view-request]"); if (view) showRequestDetails(view.dataset.viewRequest); });
  ["#request-search","#request-status-filter","#request-sort"].forEach(selector => $(selector).addEventListener(selector === "#request-search" ? "input" : "change",renderRequests));
  ["#history-search","#history-status"].forEach(selector => $(selector).addEventListener(selector === "#history-search" ? "input" : "change",renderHistory));

  $("#customers-table-body").addEventListener("click", event => {
    const profileButton = event.target.closest("[data-view-customer]");
    if (profileButton) { showCustomerDetails(profileButton.dataset.viewCustomer); return; }
    const button = event.target.closest("[data-toggle-customer]");
    if (!button) return;
    const customers = db.getCustomers();
    const customer = customers.find(item => item.email === button.dataset.toggleCustomer);
    if (!customer) return;
    customer.status = customer.status === "Active" ? "Inactive" : "Active";
    if (db.saveCustomers(customers)) { log("Customer account updated", `${customer.name} · ${customer.status}`); renderCustomers(); }
  });
  $("#customer-search").addEventListener("input",renderCustomers);
  $("#customer-status-filter").addEventListener("change",renderCustomers);

  $("#record-payment-button").addEventListener("click",renderPaymentDialog);
  $("#payment-request").addEventListener("change",event => {
    const request = getRequests().find(item => item.id === event.target.value);
    if (request) $("#payment-form").elements.amount.value = request.estimatedTotal || "";
  });
  $("#payment-form").addEventListener("submit",event => {
    event.preventDefault();
    const form = event.currentTarget;
    const request = getRequests().find(item => item.id === form.elements.requestId.value);
    if (!request) { showToast("Select a rental request first.",true); return; }
    const payment = {id:`PAY-${Date.now()}`,requestId:request.id,requestReference:request.reference,customerName:request.name,vehicleName:request.carName,reference:form.elements.reference.value.trim(),method:form.elements.method.value,amount:Number(form.elements.amount.value),date:form.elements.date.value,refundAmount:Number(form.elements.refundAmount.value)||0,refundReference:form.elements.refundReference.value.trim(),verificationStatus:"Manual note · unverified",verified:false,source:"manual"};
    if (!payment.reference || payment.amount < 0 || payment.refundAmount < 0 || payment.refundAmount > payment.amount || !payment.date) { showToast("Enter a reference, valid amount, refund amount and date. Refund notes cannot exceed the payment note.",true); return; }
    const payments = db.getPayments();
    payments.unshift(payment);
    if (!db.savePayments(payments)) { showToast("Could not save payment note.",true); return; }
    request.paymentStatus = "Manual note · unverified";
    db.saveRequests(getRequests().map(item => item.id === request.id ? request : item));
    log("Manual payment note recorded", `${payment.reference} · ${money(payment.amount)} · not verified`);
    $("#payment-dialog").close();
    renderAll();
    showToast("Manual note saved; payment remains unverified.");
  });
  $("#payment-search").addEventListener("input",renderPayments);
  $("#payments-table-body").addEventListener("click",event => {
    const button = event.target.closest("[data-delete-payment]");
    if (!button || !window.confirm("Remove this manual payment note?")) return;
    const payments = db.getPayments().filter(item => item.id !== button.dataset.deletePayment);
    if (db.savePayments(payments)) { log("Payment note removed",button.dataset.deletePayment); renderAll(); }
  });

  $("#add-maintenance-button").addEventListener("click",renderMaintenanceDialog);
  $("#maintenance-form").addEventListener("submit",event => {
    event.preventDefault();
    const form = event.currentTarget;
    const car = getFleet(true).find(item => item.id === form.elements.vehicleId.value);
    if (!car) { showToast("Select a valid vehicle.",true); return; }
    const record = {id:`M-${Date.now()}`,vehicleId:car.id,vehicleName:`${car.make} ${car.model}`,title:form.elements.title.value.trim(),status:form.elements.status.value,serviceDate:form.elements.serviceDate.value,nextDate:form.elements.nextDate.value,expense:Number(form.elements.expense.value)||0,provider:form.elements.provider.value.trim(),notes:form.elements.notes.value.trim(),createdAt:new Date().toISOString()};
    const records = db.getMaintenance();
    records.unshift(record);
    if (!db.saveMaintenance(records)) { showToast("Could not save maintenance record.",true); return; }
    log(record.status === "In progress" ? "Vehicle marked under maintenance" : "Maintenance record added", `${record.vehicleName} · ${record.title}`);
    $("#maintenance-dialog").close();
    renderAll();
    showToast("Maintenance record saved.");
  });
  $("#maintenance-table-body").addEventListener("change",event => {
    const select = event.target.closest("[data-maintenance-status]");
    if (!select) return;
    const records = db.getMaintenance();
    const record = records.find(item => item.id === select.dataset.maintenanceStatus);
    if (!record) return;
    record.status = select.value;
    if (db.saveMaintenance(records)) { log("Maintenance status updated",`${record.vehicleName} · ${record.status}`); renderAll(); }
  });
  $("#maintenance-table-body").addEventListener("click",event => {
    const button = event.target.closest("[data-delete-maintenance]");
    if (!button || !window.confirm("Delete this maintenance record?")) return;
    const records = db.getMaintenance().filter(item => item.id !== button.dataset.deleteMaintenance);
    if (db.saveMaintenance(records)) { log("Maintenance record deleted",button.dataset.deleteMaintenance); renderAll(); }
  });
  $("#maintenance-search").addEventListener("input",renderMaintenance);
  $("#maintenance-filter").addEventListener("change",renderMaintenance);

  $("#reviews-table-body").addEventListener("change",event => {
    const select = event.target.closest("[data-review-status]");
    if (!select) return;
    const reviews = db.getReviews();
    const review = reviews.find(item => item.id === select.dataset.reviewStatus);
    if (review) { review.status = select.value; db.saveReviews(reviews); log("Review moderation updated",`${review.customerName || "Customer"} · ${review.status}`); renderReviews(); }
  });
  $("#reviews-table-body").addEventListener("click",event => {
    const button = event.target.closest("[data-delete-review]");
    if (!button || !window.confirm("Delete this feedback record?")) return;
    db.saveReviews(db.getReviews().filter(item => item.id !== button.dataset.deleteReview));
    log("Review removed",button.dataset.deleteReview);
    renderReviews();
  });

  $("#clear-notifications").addEventListener("click",() => {
    db.write("autoxAdminNotificationsReadAt",Date.now());
    renderNotifications();
    showToast("Notifications marked as read.");
  });
  $("#settings-form").addEventListener("submit",event => {
    event.preventDefault();
    const form = event.currentTarget;
    const settings = Object.fromEntries(["company","currency","location","contactEmail","contactPhone","rentalPolicy"].map(name => [name,form.elements[name].value.trim()]));
    if (!settings.company) { $("#settings-feedback").textContent = "Company name is required."; return; }
    const saved = db.saveSettings(settings);
    $("#settings-feedback").textContent = saved ? "Saved in this browser." : "Could not save these settings.";
    if (saved) { log("Workspace settings saved",settings.company); showToast("Settings saved locally."); }
  });
  $("#profile-form").addEventListener("submit",event => {
    event.preventDefault();
    const form = event.currentTarget;
    const profile = {...db.getProfile(),name:form.elements.name.value.trim(),email:form.elements.email.value.trim()};
    if (!profile.name) { $("#profile-feedback").textContent = "Enter a display name."; return; }
    const saved = db.saveProfile(profile);
    $("#profile-feedback").textContent = saved ? "Display profile saved locally." : "Could not save profile.";
    if (saved) { log("Admin display profile updated",profile.name); renderAll(); showToast("Profile display updated."); }
  });

  $("#report-range").addEventListener("change",() => window.AutoXReports.render({fleet:getFleet(),requests:getRequests(),payments:db.getPayments(),range:$("#report-range").value}));
  $("#export-report-button").addEventListener("click",() => window.AutoXReports.exportCSV(getRequests(),db.getPayments(),getFleet(true)));
  $("#print-report-button").addEventListener("click",() => window.print());
  $("[data-view=profile].profile-chip").addEventListener("click",() => switchView("profile"));
  $(".admin-nav-link[data-view=overview]").focus({preventScroll:true});
  window.addEventListener("autox:datachange",event => { if (event.detail?.key) renderAll(); });
  window.addEventListener("storage",event => { if (Object.values(db.keys).includes(event.key) || event.key === "autoxAdminNotificationsReadAt") renderAll(); });
  document.addEventListener("keydown",event => { if (event.key === "Escape") $("#admin-sidebar").classList.remove("is-open"); });

  renderAll();
})();
