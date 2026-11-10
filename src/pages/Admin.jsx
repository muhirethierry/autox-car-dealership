import { Navigate } from "react-router";
import AdminApp from "../admin/AdminApp.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function Admin() {
  const {authenticated,loading,user}=useAuth();
  if(loading)return <main className="admin-auth-gate" aria-live="polite">Checking administrator session…</main>;
  if(!authenticated)return <Navigate to="/login.html" replace />;
  if(!["MANAGER","SUPER_ADMIN"].includes(user?.role))return <main className="admin-auth-gate"><h1>Administrator access required</h1><p>Your account does not have an administrator role.</p><button onClick={()=>location.assign("/index.html")}>Return to AUTOX</button></main>;
  return <AdminApp />;
}
