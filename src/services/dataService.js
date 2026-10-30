const adapter = () => {
  if (!window.AutoXData) throw new Error("AUTOX browser data adapter has not loaded.");
  return window.AutoXData;
};

export const dataService = {
  getFleet:options => adapter().getFleet(options),
  saveVehicle:vehicle => adapter().saveVehicle(vehicle),
  getRequests:() => adapter().getRequests(),
  saveRequests:requests => adapter().saveRequests(requests),
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
