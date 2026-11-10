const adapter = () => {
  if (!window.AutoXData) throw new Error("AUTOX browser data adapter has not loaded.");
  return window.AutoXData;
};

export const dataService = {
  getFleet:options => adapter().getFleet(options),
  saveVehicle:vehicle => adapter().saveVehicle(vehicle),
  archiveVehicle:(id,archived) => adapter().archiveVehicle(id,archived),
  getRequests:() => adapter().getRequests(),
  saveRequests:requests => adapter().saveRequests(requests),
  getPayments:() => adapter().getPayments(),
  savePayments:payments => adapter().savePayments(payments),
  getMaintenance:() => adapter().getMaintenance(),
  saveMaintenance:records => adapter().saveMaintenance(records),
  getReviews:() => adapter().getReviews(),
  saveReviews:reviews => adapter().saveReviews(reviews),
  getCustomers:() => adapter().getCustomers(),
  saveCustomers:customers => adapter().saveCustomers(customers),
  getSettings:() => adapter().getSettings(),
  saveSettings:settings => adapter().saveSettings(settings),
  getProfile:() => adapter().getProfile(),
  saveProfile:profile => adapter().saveProfile(profile),
  getActivities:() => adapter().getActivities(),
  logActivity:(action,detail) => adapter().logActivity(action,detail),
  read:(key,fallback) => adapter().read(key,fallback),
  write:(key,value) => adapter().write(key,value),
  subscribe(listener) {
    const update = event => listener(event);
    window.addEventListener("autox:datachange",update);
    window.addEventListener("storage",update);
    return () => {
      window.removeEventListener("autox:datachange",update);
      window.removeEventListener("storage",update);
    };
  }
};
