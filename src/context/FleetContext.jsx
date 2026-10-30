import { createContext, useContext, useSyncExternalStore } from "react";
import { dataService } from "../services/dataService.js";

const FleetContext = createContext(null);
const subscribe = callback => dataService.subscribe(callback);
const getSnapshot = () => {
  try {
    return `${localStorage.getItem("autoxFleetAdminState") || ""}|${localStorage.getItem("autoxRentalRequests") || ""}|${localStorage.getItem("autoxMaintenance") || ""}`;
  } catch {
    return "storage-unavailable";
  }
};

export function FleetProvider({children}) {
  const snapshot = useSyncExternalStore(subscribe,getSnapshot,getSnapshot);
  const value = {snapshot,getFleet:dataService.getFleet,getRequests:dataService.getRequests,saveVehicle:dataService.saveVehicle,saveRequests:dataService.saveRequests};
  return <FleetContext.Provider value={value}>{children}</FleetContext.Provider>;
}

export function useFleet() {
  const context = useContext(FleetContext);
  if (!context) throw new Error("useFleet must be used inside FleetProvider.");
  return context;
}
