const vehicles = window.AutoXData.getFleet();

const $ = (selector, root = document) => root.querySelector(selector);
const grid = $("#cars-grid");
const searchInput = $("#search-input");
const typeFilter = $("#type-filter");
const sortSelect = $("#sort-select");
const pickupLocation = $("#pickup-location");
const pickupDate = $("#pickup-date");
const returnDate = $("#return-date");
let selectedVehicle = null;
let toastTimer;

function makeVehiclePlaceholder(label) {
  const safeLabel = label.replace(/[&<>"']/g, character => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", "\"":"&quot;", "'":"&apos;"
  })[character]);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 520"><rect width="900" height="520" fill="#e8edf2"/><path d="M0 390h900v130H0z" fill="#d8e0e8"/><path d="m170 350 55-100c14-25 35-40 66-44l221-24c37-4 71 7 99 34l93 91 65 20c26 8 43 30 43 57v39H112v-31c0-24 17-45 41-52z" fill="#132741"/><path d="m282 247 228-24c24-3 43 4 62 21l65 63H233l43-48c2-3 4-7 6-12z" fill="#b8c8d8"/><circle cx="260" cy="420" r="52" fill="#26394f"/><circle cx="260" cy="420" r="25" fill="#eef1f4"/><circle cx="680" cy="420" r="52" fill="#26394f"/><circle cx="680" cy="420" r="25" fill="#eef1f4"/><text x="450" y="490" text-anchor="middle" fill="#526376" font-family="Arial,sans-serif" font-size="20">${safeLabel}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

document.addEventListener("error", event => {
  const image = event.target;
  if (!(image instanceof HTMLImageElement) || !image.dataset.fallback) return;

  const vehicle = vehicles.find(car => car.id === image.dataset.vehicleImage);
  if (!image.dataset.fallbackAttempted) {
    image.dataset.fallbackAttempted = "true";
    image.src = image.dataset.fallback;
    if (vehicle) vehicle.image = image.dataset.fallback;
    return;
  }

  if (!image.dataset.placeholderAttempted) {
    image.dataset.placeholderAttempted = "true";
    image.src = makeVehiclePlaceholder(image.alt || "AutoX vehicle");
    if (vehicle) vehicle.image = image.src;
  }
}, true);

const heroVideo = $("#hero-video");
const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
function syncHeroVideoMotion() {
  if (motionPreference.matches) heroVideo.pause();
  else heroVideo.play().catch(() => {});
}
syncHeroVideoMotion();
motionPreference.addEventListener?.("change", syncHeroVideoMotion);

function localDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const today = new Date();
const todayString = localDateString(today);
pickupDate.min = todayString;
returnDate.min = todayString;

function formatMoney(amount) {
  return `RWF ${new Intl.NumberFormat("en-RW", {maximumFractionDigits:0}).format(amount)}`;
}

function rentalRates(car) {
  return {
    day: car.dailyRate,
    week: Number(car.weeklyRate) || car.dailyRate * 6,
    month: Number(car.monthlyRate) || Math.round(car.dailyRate * 25.5)
  };
}

function estimateRentalTotal(car, days) {
  const rates = rentalRates(car);
  const months = Math.floor(days / 30);
  const remainingDays = days % 30;
  const weeks = Math.floor(remainingDays / 7);
  const singleDays = remainingDays % 7;
  return months * rates.month + weeks * rates.week + singleDays * rates.day;
}

function rentalDays(start, end) {
  if (!start || !end) return 0;
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  return Math.ceil((endDate - startDate) / 86400000);
}

function renderCars() {
  const query = searchInput.value.trim().toLowerCase();
  let filtered = vehicles.filter(car => {
    const matchesText = `${car.make} ${car.model} ${car.type}`.toLowerCase().includes(query);
    const matchesType = typeFilter.value === "all" || car.type === typeFilter.value;
    return matchesText && matchesType;
  });
  if (sortSelect.value === "price-low") filtered.sort((a,b) => a.dailyRate - b.dailyRate);
  if (sortSelect.value === "price-high") filtered.sort((a,b) => b.dailyRate - a.dailyRate);
  $("#inventory-count").textContent = filtered.length;
  $("#empty-state").hidden = filtered.length > 0;
  grid.innerHTML = filtered.map(car => `
    <article class="car">
      <div class="car-image-wrap"><button class="car-image-link" type="button" data-photo="${car.id}" aria-label="Expand photo of ${car.make} ${car.model}"><img src="${car.image}" data-vehicle-image="${car.id}" data-fallback="${car.fallbackImage}" alt="${car.alt}" loading="lazy"></button><span class="car-tag">${car.tag}</span><span class="availability-badge ${car.available ? "is-available" : "is-unavailable"}"><span class="availability-dot"></span>${car.available ? "Available" : "Not available"}</span></div>
      <div class="car-body">
        <div class="car-title-row"><h3>${car.make} ${car.model}</h3><span class="car-year">${car.type}</span></div>
        <p class="car-subtitle">${car.seats} seats · ${car.fuel} · ${car.transmission}</p>
        <div class="car-specs"><span>${car.seats} seats</span><span>${car.fuel}</span><span>${car.transmission}</span></div>
        <div class="rate-options" aria-label="Estimated rental rates">
          <div><strong>${formatMoney(rentalRates(car).day)}</strong><span>per day</span></div>
          <div><strong>${formatMoney(rentalRates(car).week)}</strong><span>per week</span></div>
          <div><strong>${formatMoney(rentalRates(car).month)}</strong><span>per month</span></div>
        </div>
        <p class="rate-note">Weekly covers 7 days; monthly covers 30 days.</p>
        <button class="details-button rental-card-cta" data-details="${car.id}">${car.available ? "VIEW &amp; BOOK" : "VIEW DETAILS"} &#8599;</button>
      </div>
    </article>`).join("");
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("visible"), 2800);
}

function updateReturnDateMinimum() {
  if (!pickupDate.value) return;
  const nextDay = new Date(`${pickupDate.value}T00:00:00`);
  nextDay.setDate(nextDay.getDate() + 1);
  const nextDayString = localDateString(nextDay);
  returnDate.min = nextDayString;
  if (returnDate.value && returnDate.value < nextDayString) returnDate.value = nextDayString;
}

function updateBookingSummary() {
  const days = rentalDays(pickupDate.value, returnDate.value);
  const summary = $("#booking-summary");
  if (days > 0) {
    summary.textContent = `${days} rental day${days === 1 ? "" : "s"} · Pickup at ${pickupLocation.value}. Choose a car below to request it.`;
  } else {
    summary.textContent = "Choose your dates to see your trip estimate.";
  }
}

pickupDate.addEventListener("change", () => { updateReturnDateMinimum(); updateBookingSummary(); });
returnDate.addEventListener("change", updateBookingSummary);
pickupLocation.addEventListener("change", updateBookingSummary);

$("#booking-form").addEventListener("submit", event => {
  event.preventDefault();
  updateReturnDateMinimum();
  if (rentalDays(pickupDate.value, returnDate.value) < 1) {
    showToast("Please choose a return date after your pickup date.");
    return;
  }
  updateBookingSummary();
  $("#fleet").scrollIntoView({behavior:"smooth"});
});

function openVehicle(id) {
  const car = vehicles.find(item => item.id === id);
  if (!car) return;
  selectedVehicle = car;
  const earliestReturn = pickupDate.value ? new Date(`${pickupDate.value}T00:00:00`) : new Date();
  earliestReturn.setDate(earliestReturn.getDate() + 1);
  const days = rentalDays(pickupDate.value, returnDate.value);
  const rates = rentalRates(car);
  const estimate = days > 0 ? `<div class="rental-total"><span>${days}-day estimate using available day, week, and month packages</span><strong>Estimated total: ${formatMoney(estimateRentalTotal(car, days))}</strong></div>` : `<div class="rental-total"><span>Choose dates to see a trip estimate</span><strong>From ${formatMoney(rates.day)} per day</strong></div>`;
  const locations = ["Kigali City Centre","Kigali International Airport","Kigali Convention Centre"];
  const pickupOptions = locations.map(location => `<option value="${location}" ${pickupLocation.value === location ? "selected" : ""}>${location}</option>`).join("");
  const returnOptions = locations.map(location => `<option value="${location}" ${pickupLocation.value === location ? "selected" : ""}>${location}</option>`).join("");
  const passengerOptions = Array.from({length:car.seats}, (_, index) => `<option value="${index + 1}">${index + 1} passenger${index === 0 ? "" : "s"}</option>`).join("");
  const requestMarkup = car.available ? `
      <form class="rental-request-form" id="rental-request-form">
        <h3 class="form-section-title">Your contact details</h3>
        <div class="renter-fields">
          <label for="renter-name">Full name<input id="renter-name" name="full-name" autocomplete="name" placeholder="Name for the booking" required></label>
          <label for="renter-email">Email address<input id="renter-email" name="email" type="email" autocomplete="email" placeholder="you@example.com" required></label>
          <label for="renter-phone">Phone or WhatsApp<input id="renter-phone" name="phone" type="tel" autocomplete="tel" placeholder="+250..." required></label>
        </div>
        <h3 class="form-section-title">Your trip details</h3>
        <div class="request-dates">
          <label for="request-pickup">Pickup date<input id="request-pickup" name="pickup" type="date" min="${todayString}" value="${pickupDate.value}" required></label>
          <label for="request-pickup-time">Pickup time<input id="request-pickup-time" name="pickup-time" type="time" value="09:00" required></label>
          <label for="request-return">Return date<input id="request-return" name="return" type="date" min="${localDateString(earliestReturn)}" value="${returnDate.value}" required></label>
          <label for="request-return-time">Return time<input id="request-return-time" name="return-time" type="time" value="09:00" required></label>
        </div>
        <div class="renter-fields trip-fields">
          <label for="request-pickup-location">Pickup location<select id="request-pickup-location" name="pickup-location">${pickupOptions}</select></label>
          <label for="request-return-location">Return location<select id="request-return-location" name="return-location">${returnOptions}</select></label>
          <label for="request-passengers">Number of passengers<select id="request-passengers" name="passengers">${passengerOptions}</select></label>
        </div>
        <label class="notes-field" for="renter-notes">Special requests or trip details<textarea id="renter-notes" name="notes" rows="3" placeholder="Share any questions, luggage needs, or pickup instructions."></textarea></label>
        <p class="request-note">This prepares an email enquiry. Your rental is confirmed only after our team checks availability and replies. Please do not include payment details here.</p>
        <button class="btn btn-full" type="submit">Send rental request <span>&#8594;</span></button>
      </form>` : `<div class="availability-message">This car is currently marked as unavailable. Please choose another vehicle or contact our team to check again later.</div>`;
  $("#dialog-content").innerHTML = `
    <img class="dialog-image" src="${car.image}" data-vehicle-image="${car.id}" data-fallback="${car.fallbackImage}" alt="${car.alt}">
    <div class="dialog-body">
      <span class="eyebrow">${car.type} · ${car.seats} seats</span>
      <h2 id="dialog-title">${car.make} ${car.model}</h2>
      <span class="availability-badge detail-availability ${car.available ? "is-available" : "is-unavailable"}"><span class="availability-dot"></span>${car.available ? "Available" : "Not available"}</span>
      <section class="vehicle-specifications" aria-labelledby="specification-title"><h3 id="specification-title">Vehicle specifications</h3><dl><div><dt>Model</dt><dd>${car.make} ${car.model}</dd></div><div><dt>Vehicle type</dt><dd>${car.type}</dd></div><div><dt>Passenger capacity</dt><dd>Up to ${car.seats} people</dd></div><div><dt>Fuel</dt><dd>${car.fuel}</dd></div><div><dt>Transmission</dt><dd>${car.transmission}</dd></div></dl><p>Exact vehicle trim and equipment are confirmed by our team before booking.</p></section>
      <div class="dialog-price">Rental rates</div>
      <div class="rate-options dialog-rates"><div><strong>${formatMoney(rates.day)}</strong><span>per day</span></div><div><strong>${formatMoney(rates.week)}</strong><span>per week</span></div><div><strong>${formatMoney(rates.month)}</strong><span>per month</span></div></div>
      <p>${car.description}</p>
      ${estimate}
      ${requestMarkup}
    </div>`;
  $("#vehicle-dialog").showModal();
}

grid.addEventListener("click", event => {
  const photo = event.target.closest("[data-photo]");
  if (photo) {
    const car = vehicles.find(item => item.id === photo.dataset.photo);
    if (car) {
      const image = $("#photo-dialog-image");
      image.src = car.image;
      image.dataset.vehicleImage = car.id;
      image.dataset.fallback = car.fallbackImage;
      delete image.dataset.fallbackAttempted;
      delete image.dataset.placeholderAttempted;
      image.alt = car.alt;
      $("#photo-dialog").showModal();
    }
    return;
  }
  const details = event.target.closest("[data-details]");
  if (details) openVehicle(details.dataset.details);
});

function updateRentalEstimate() {
  if (!selectedVehicle) return;
  const start = $("#request-pickup").value;
  const end = $("#request-return").value;
  const days = rentalDays(start, end);
  const total = days > 0
    ? `<span>${days}-day estimate using day, week, and month packages</span><strong>Estimated total: ${formatMoney(estimateRentalTotal(selectedVehicle, days))}</strong>`
    : `<span>Choose dates to see a trip estimate</span><strong>From ${formatMoney(rentalRates(selectedVehicle).day)} per day</strong>`;
  $(".rental-total").innerHTML = total;
}

$("#dialog-content").addEventListener("change", event => {
  if (event.target.id === "request-pickup") {
    const nextDay = new Date(`${event.target.value}T00:00:00`);
    nextDay.setDate(nextDay.getDate() + 1);
    const returnInput = $("#request-return");
    returnInput.min = localDateString(nextDay);
    if (returnInput.value && returnInput.value < returnInput.min) returnInput.value = returnInput.min;
  }
  if (event.target.id === "request-pickup" || event.target.id === "request-return") updateRentalEstimate();
});

$("#dialog-content").addEventListener("submit", event => {
  if (event.target.id !== "rental-request-form") return;
  event.preventDefault();
  const form = event.target;
  const pickupValue = form.elements.namedItem("pickup").value;
  const returnValue = form.elements.namedItem("return").value;
  if (rentalDays(pickupValue, returnValue) < 1) {
    showToast("Return date must be after pickup date.");
    return;
  }
  const days = rentalDays(pickupValue, returnValue);
  const subject = `AutoX rental request - ${selectedVehicle.make} ${selectedVehicle.model}`;
  const rentalRecord = {
    id: `AX-${Date.now().toString(36).toUpperCase()}`,
    reference: `AX-${Date.now().toString(36).toUpperCase()}`,
    carId: selectedVehicle.id,
    carName: `${selectedVehicle.make} ${selectedVehicle.model}`,
    dailyRate: rentalRates(selectedVehicle).day,
    estimatedTotal: estimateRentalTotal(selectedVehicle, days),
    pickup: pickupValue,
    return: returnValue,
    pickupTime: form.elements["pickup-time"].value,
    returnTime: form.elements["return-time"].value,
    pickupLocation: form.elements["pickup-location"].value,
    returnLocation: form.elements["return-location"].value,
    passengers: form.elements.passengers.value,
    name: form.elements["full-name"].value.trim(),
    email: form.elements.email.value.trim(),
    phone: form.elements.phone.value.trim(),
    notes: form.elements.notes.value.trim(),
    status: "Pending",
    paymentStatus: "Unrecorded",
    createdAt: new Date().toISOString()
  };
  try {
    const requests = window.AutoXData.getRequests();
    requests.unshift(rentalRecord);
    window.AutoXData.saveRequests(requests);
  } catch (error) {
    showToast("Your email is ready, but this browser could not save the request for the admin dashboard.");
  }
  const body = [
    `Car: ${selectedVehicle.make} ${selectedVehicle.model}`,
    `Estimated daily rate: ${formatMoney(rentalRates(selectedVehicle).day)}`,
    `Estimated weekly package: ${formatMoney(rentalRates(selectedVehicle).week)}`,
    `Estimated monthly package: ${formatMoney(rentalRates(selectedVehicle).month)}`,
    `Estimated rental total: ${formatMoney(estimateRentalTotal(selectedVehicle, days))} for ${days} days`,
    `Pickup: ${pickupValue} at ${form.elements["pickup-time"].value}`,
    `Return: ${returnValue} at ${form.elements["return-time"].value}`,
    `Pickup location: ${form.elements["pickup-location"].value}`,
    `Return location: ${form.elements["return-location"].value}`,
    `Passengers: ${form.elements.passengers.value}`,
    `Name: ${form.elements["full-name"].value}`,
    `Email: ${form.elements.email.value}`,
    `Phone: ${form.elements.phone.value}`,
    `Special requests: ${form.elements.notes.value || "None"}`,
    "Please confirm availability and the final rental terms."
  ].join("\n");
  window.location.href = `mailto:hello@autox.example?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
});

$("#vehicle-dialog").addEventListener("click", event => {
  if (event.target === event.currentTarget || event.target.closest("[data-close-dialog]")) event.currentTarget.close();
});
$("#photo-dialog").addEventListener("click", event => {
  if (event.target === event.currentTarget || event.target.closest("[data-close-photo]")) event.currentTarget.close();
});

searchInput.addEventListener("input", renderCars);
typeFilter.addEventListener("change", renderCars);
sortSelect.addEventListener("change", renderCars);

const menuToggle = $("#menu-toggle");
const navigation = $("#navigation");
function closeMenu() {
  navigation.classList.remove("show");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Open navigation menu");
  menuToggle.innerHTML = "&#9776;";
}
menuToggle.addEventListener("click", () => {
  const open = navigation.classList.toggle("show");
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
  menuToggle.textContent = open ? "×" : "☰";
});
navigation.addEventListener("click", event => { if (event.target.closest("a")) closeMenu(); });
document.addEventListener("keydown", event => { if (event.key === "Escape") closeMenu(); });

$("#current-year").textContent = new Date().getFullYear();
renderCars();
updateBookingSummary();
