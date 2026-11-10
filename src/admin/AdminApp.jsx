import { useEffect, useRef, useState } from "react";
import { useAdminData } from "./useAdminData.js";
import { AdminShell } from "./AdminShell.jsx";
import AdminOverview from "./AdminOverview.jsx";
import AdminFleet from "./AdminFleet.jsx";
import AdminBookings from "./AdminBookings.jsx";
import AdminCustomers from "./AdminCustomers.jsx";
import AdminOperations from "./AdminOperations.jsx";
import AdminSettings from "./AdminSettings.jsx";
import { getNotifications } from "./adminUtils.js";

const validViews=new Set(["overview","fleet","requests","active","history","customers","payments","reports","maintenance","reviews","notifications","settings","profile"]);

export default function AdminApp() {
  const data=useAdminData();
  const [active,setActive]=useState(()=>validViews.has(location.hash.slice(1))?location.hash.slice(1):"overview");
  const [toast,setToast]=useState(null),[quickAddToken,setQuickAddToken]=useState(0);
  const toastTimer=useRef(0);
  useEffect(()=>{
    document.body.className="admin-page";
    document.title="AUTOX Admin · Rental operations";
    const sync=()=>setActive(validViews.has(location.hash.slice(1))?location.hash.slice(1):"overview");
    window.addEventListener("hashchange",sync);
    return()=>{document.body.className="";window.removeEventListener("hashchange",sync);clearTimeout(toastTimer.current);};
  },[]);
  function navigate(view){if(!validViews.has(view))return;setActive(view);history.replaceState(null,"",`${location.pathname}#${view}`);window.scrollTo({top:0,behavior:"smooth"});}
  function notify(message,isError=false){setToast({message,isError});clearTimeout(toastTimer.current);toastTimer.current=setTimeout(()=>setToast(null),2800);}
  let content;
  if(active==="overview")content=<AdminOverview data={data} onNavigate={navigate} onQuickAdd={()=>{navigate("fleet");setQuickAddToken(token=>token+1);}}/>;
  else if(active==="fleet")content=<AdminFleet key="fleet" data={data} onToast={notify} openNewToken={quickAddToken}/>;
  else if(["requests","active","history"].includes(active))content=<AdminBookings key={active} view={active} data={data} onToast={notify}/>;
  else if(active==="customers")content=<AdminCustomers data={data} onToast={notify}/>;
  else if(["payments","reports","maintenance","reviews","notifications"].includes(active))content=<AdminOperations key={active} view={active} data={data} onToast={notify}/>;
  else content=<AdminSettings key={active} view={active} data={data} onToast={notify}/>;
  const shellData={...data,notifications:getNotifications({requests:data.requests,maintenance:data.maintenance,readAt:data.notificationsReadAt})};
  return <><AdminShell active={active} onNavigate={navigate} data={shellData}>{content}</AdminShell><div className={`admin-toast ${toast?"show":""} ${toast?.isError?"is-error":""}`} role="status" aria-live="polite">{toast?.message||""}</div></>;
}
