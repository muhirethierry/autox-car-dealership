/* AUTOX browser data adapter. Replace this adapter with authenticated API calls for production. */
(() => {
  const keys = {
    fleet:"autoxFleetAdminState",
    requests:"autoxRentalRequests",
    payments:"autoxPayments",
    maintenance:"autoxMaintenance",
    customers:"autoxCustomers",
    reviews:"autoxReviews",
    settings:"autoxAdminSettings",
    profile:"autoxAdminProfile",
    activity:"autoxAdminActivity"
  };

  function read(key, fallback) {
    try {
      const stored = localStorage.getItem(key);
      return stored === null ? fallback : JSON.parse(stored);
    } catch (error) {
      console.warn(`AUTOX data for ${key} could not be read.`, error);
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      window.dispatchEvent(new CustomEvent("autox:datachange", {detail:{key}}));
      return true;
    } catch (error) {
      console.error(`AUTOX data for ${key} could not be saved.`, error);
      return false;
    }
  }

  const readList = key => {
    const value = read(key, []);
    return Array.isArray(value) ? value : [];
  };

  function readFleetState() {
    const value = read(keys.fleet, {});
    return {
      overrides:value && typeof value.overrides === "object" && !Array.isArray(value.overrides) ? value.overrides : {},
      additions:Array.isArray(value?.additions) ? value.additions : [],
      removedIds:Array.isArray(value?.removedIds) ? value.removedIds : [],
      archivedIds:Array.isArray(value?.archivedIds) ? value.archivedIds : []
    };
  }

  function getFleet({includeArchived = false} = {}) {
    const state = readFleetState();
    const archived = new Set([...state.removedIds, ...state.archivedIds]);
    const defaults = Array.isArray(window.AUTOX_FLEET_DEFAULTS) ? window.AUTOX_FLEET_DEFAULTS : [];
    const base = defaults.map(vehicle => ({...vehicle, ...(state.overrides?.[vehicle.id] || {})}));
    const known = new Set(base.map(vehicle => vehicle.id));
    const cars = base.concat((state.additions || []).filter(vehicle => vehicle?.id && !known.has(vehicle.id)));
    const maintenance = getMaintenance();
    const activeRequests = getRequests().filter(request => request.status === "Active");
    return cars.filter(vehicle => includeArchived || (!archived.has(vehicle.id) && vehicle.status !== "Archived")).map(vehicle => {
      const activeMaintenance = maintenance.find(record => record.vehicleId === vehicle.id && (record.status === "In progress" || (record.status === "Scheduled" && record.serviceDate && record.serviceDate <= new Date().toISOString().slice(0,10))));
      const activeRental = activeRequests.some(request => request.carId === vehicle.id);
      const dailyRate = Math.max(0, Number(vehicle.dailyRate) || 0);
      return {
        ...vehicle,
        id:vehicle.id,
        year:vehicle.year || "",
        registration:vehicle.registration || "",
        category:vehicle.category || vehicle.type || "Other",
        dailyRate,
        weeklyRate:Number(vehicle.weeklyRate) || dailyRate * 6,
        monthlyRate:Number(vehicle.monthlyRate) || Math.round(dailyRate * 25.5),
        available:activeMaintenance || activeRental ? false : vehicle.available !== false,
        maintenanceStatus:activeMaintenance ? activeMaintenance.status : "",
        rentalActive:activeRental,
        archived:archived.has(vehicle.id) || vehicle.status === "Archived"
      };
    });
  }

  function saveFleetState(state) {
    return write(keys.fleet, {
      overrides:state?.overrides && typeof state.overrides === "object" && !Array.isArray(state.overrides) ? state.overrides : {},
      additions:Array.isArray(state?.additions) ? state.additions : [],
      removedIds:Array.isArray(state?.removedIds) ? state.removedIds : [],
      archivedIds:Array.isArray(state?.archivedIds) ? state.archivedIds : []
    });
  }

  function saveVehicle(vehicle) {
    const state = readFleetState();
    const defaultVehicle = (window.AUTOX_FLEET_DEFAULTS || []).some(item => item.id === vehicle.id);
    if (defaultVehicle) state.overrides[vehicle.id] = {...state.overrides[vehicle.id], ...vehicle};
    else {
      const index = state.additions.findIndex(item => item.id === vehicle.id);
      if (index < 0) state.additions.push(vehicle);
      else state.additions[index] = {...state.additions[index], ...vehicle};
    }
    state.removedIds = (state.removedIds || []).filter(id => id !== vehicle.id);
    state.archivedIds = (state.archivedIds || []).filter(id => id !== vehicle.id);
    return write(keys.fleet, state);
  }

  function archiveVehicle(id, archived = true) {
    const state = readFleetState();
    state.archivedIds = archived ? [...new Set([...state.archivedIds, id])] : state.archivedIds.filter(item => item !== id);
    return write(keys.fleet, state);
  }

  function getRequests() {
    return readList(keys.requests).map(request => ({
      ...request,
      reference:request.reference || request.id || `AX-${String(request.createdAt || "").replace(/\D/g, "").slice(-8) || "REQUEST"}`,
      status:request.status === "Confirmed" ? "Approved" : request.status || "Pending",
      paymentStatus:request.paymentStatus || "Unrecorded"
    }));
  }

  function saveRequests(requests) { return write(keys.requests, requests); }
  function getPayments() { return readList(keys.payments); }
  function savePayments(payments) { return write(keys.payments, payments); }
  function getMaintenance() { return readList(keys.maintenance); }
  function saveMaintenance(records) { return write(keys.maintenance, records); }
  function getReviews() { return readList(keys.reviews); }
  function saveReviews(reviews) { return write(keys.reviews, reviews); }
  function getSettings() { return read(keys.settings, {currency:"RWF", company:"AUTOX Rentals", location:"Kigali, Rwanda", contactEmail:"hello@autox.example", contactPhone:"+250 788 000 000", rentalPolicy:"Requests are subject to availability and team confirmation."}); }
  function saveSettings(settings) { return write(keys.settings, settings); }
  function getProfile() { return read(keys.profile, {name:"AutoX Admin", email:"", role:"Super Admin"}); }
  function saveProfile(profile) { return write(keys.profile, profile); }
  function getActivities() { return readList(keys.activity); }

  function logActivity(action, detail) {
    const activities = getActivities();
    activities.unshift({id:`ACT-${Date.now()}`, action, detail, createdAt:new Date().toISOString()});
    return write(keys.activity, activities.slice(0, 250));
  }

  function getCustomers() {
    const requests = getRequests();
    const saved = readList(keys.customers);
    const byEmail = new Map();
    for (const request of [...requests].reverse()) {
      const email = String(request.email || "").trim().toLowerCase();
      if (!email) continue;
      const existing = byEmail.get(email);
      const savedCustomer = saved.find(customer => String(customer.email || "").toLowerCase() === email);
      byEmail.set(email, {
        id:savedCustomer?.id || `C-${email}`,
        name:request.name || existing?.name || "Customer",
        email:request.email,
        phone:request.phone || existing?.phone || "",
        registeredAt:existing?.registeredAt || request.createdAt || new Date().toISOString(),
        status:savedCustomer?.status || "Active",
        requestCount:(existing?.requestCount || 0) + 1,
        rentals:requests.filter(item => String(item.email || "").toLowerCase() === email && ["Approved", "Active", "Completed"].includes(item.status)).length
      });
    }
    return [...byEmail.values()];
  }

  function saveCustomers(customers) { return write(keys.customers, customers); }

  window.AutoXData = {
    keys, read, write, getFleet, saveFleetState, saveVehicle, archiveVehicle, getRequests, saveRequests,
    getPayments, savePayments, getMaintenance, saveMaintenance, getReviews,
    saveReviews, getSettings, saveSettings, getProfile, saveProfile,
    getActivities, logActivity, getCustomers, saveCustomers
  };
})();
