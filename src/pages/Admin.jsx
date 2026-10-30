import { useCallback } from "react";
import source from "../../legacy/admin.html?raw";
import LegacyPage from "../components/LegacyPage.jsx";

export default function Admin() {
  const load = useCallback(async () => {
    await import("../../admin-reports.js");
    await import("../../admin.js");
  },[]);
  return <LegacyPage source={source} title="AUTOX Admin · Rental operations" bodyClass="admin-page" loadPage={load} />;
}
