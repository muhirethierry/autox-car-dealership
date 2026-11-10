import { useSyncExternalStore } from "react";
import { dataService } from "../services/dataService.js";

const STORAGE_KEYS = [
  "autoxFleetAdminState","autoxRentalRequests","autoxPayments","autoxMaintenance",
  "autoxCustomers","autoxReviews","autoxAdminSettings","autoxAdminProfile",
  "autoxAdminActivity","autoxAdminNotificationsReadAt"
];

function snapshot() {
  try { return STORAGE_KEYS.map(key => `${key}:${localStorage.getItem(key) || ""}`).join("|"); }
  catch { return "storage-unavailable"; }
}

export function useAdminData() {
  useSyncExternalStore(dataService.subscribe,snapshot,snapshot);
  return {
    fleet:dataService.getFleet({includeArchived:true}),
    requests:dataService.getRequests(),
    payments:dataService.getPayments(),
    maintenance:dataService.getMaintenance(),
    reviews:dataService.getReviews(),
    customers:dataService.getCustomers(),
    settings:dataService.getSettings(),
    profile:dataService.getProfile(),
    activities:dataService.getActivities(),
    notificationsReadAt:Number(dataService.read("autoxAdminNotificationsReadAt",0)) || 0,
    saveVehicle:dataService.saveVehicle,
    archiveVehicle:dataService.archiveVehicle,
    saveRequests:dataService.saveRequests,
    savePayments:dataService.savePayments,
    saveMaintenance:dataService.saveMaintenance,
    saveReviews:dataService.saveReviews,
    saveCustomers:dataService.saveCustomers,
    saveSettings:dataService.saveSettings,
    saveProfile:dataService.saveProfile,
    logActivity:dataService.logActivity,
    write:dataService.write
  };
}
