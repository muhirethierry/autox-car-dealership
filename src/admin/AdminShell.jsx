import React from "react";
import { VIEWS } from "./adminUtils.js";
import { useAuth } from "../context/AuthContext.jsx";

export function AdminShell({active,onNavigate,data,children}) {
  const {signOut}=useAuth();
  const [sidebarOpen,setSidebarOpen]=React.useState(false);
  const [noticeVisible,setNoticeVisible]=React.useState(true);
  const section=VIEWS.flatMap(group=>group.items).find(item=>item[0]===active);
  const firstName=(data.profile.name||"Admin").trim().split(/\s+/)[0]||"Admin";
  return <div className="admin-shell">
    <aside className={`admin-sidebar ${sidebarOpen?"is-open":""}`} id="admin-sidebar">
      <a className="admin-brand" href="index.html"><img src="assets/autox-logo.svg" alt="AUTOX Rentals · Kigali" width="187" height="48" /></a>
      <nav className="admin-nav" aria-label="Admin navigation">{VIEWS.map(group=><div className="admin-nav-group" key={group.group}><p className={`sidebar-label ${group.group!=="MAIN"?"nav-group-label":""}`}>{group.group}</p>{group.items.map(([id,label,icon,badge])=><button key={id} className={`admin-nav-link ${active===id?"is-active":""}`} type="button" aria-current={active===id?"page":undefined} onClick={()=>{setSidebarOpen(false);onNavigate(id);}}><i className={`fa-solid ${icon}`} aria-hidden="true" />{label}{badge&&<span className={`nav-count ${badge==="pending"||badge==="notifications"?"nav-count-gold":""}`}>{badge==="fleet"?data.fleet.filter(car=>!car.archived).length:badge==="customers"?data.customers.length:badge==="pending"?data.requests.filter(item=>item.status==="Pending").length:data.notifications.filter(item=>!item.read).length}</span>}</button>)}</div>)}
        <a className="admin-nav-link sidebar-exit" href="index.html"><i className="fa-solid fa-arrow-right-from-bracket" aria-hidden="true" />Exit dashboard</a>
      </nav>
      <div className="sidebar-bottom"><span className="sidebar-avatar">{firstName.slice(0,1).toUpperCase()}</span><span><strong>{data.profile.name||"AutoX Admin"}</strong><small>Local workspace</small></span><a href="index.html" aria-label="Open public rental site"><i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true" /></a></div>
    </aside>
    <main className="admin-main">
      <header className="admin-topbar"><button className="sidebar-toggle" type="button" aria-label="Toggle dashboard menu" aria-expanded={sidebarOpen} aria-controls="admin-sidebar" onClick={()=>setSidebarOpen(open=>!open)}><i className="fa-solid fa-bars" aria-hidden="true" /></button><div className="breadcrumb"><span>Workspace</span><i className="fa-solid fa-chevron-right" aria-hidden="true" /><strong>{section?.[1]||"Overview"}</strong></div><div className="topbar-actions"><span className="workspace-status"><i /> API session</span><a className="view-site-link" href="index.html" target="_blank" rel="noopener">View rental site <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true" /></a><button className="profile-chip" type="button" onClick={()=>onNavigate("profile")}><span className="profile-chip-avatar">{firstName.slice(0,1).toUpperCase()}</span><span>{firstName}</span><i className="fa-solid fa-chevron-down" aria-hidden="true" /></button><button className="admin-logout" type="button" aria-label="Log out" onClick={async()=>{try{await signOut();location.assign("/login.html");}catch(error){alert(error.message);}}}>Log out</button></div></header>
      <div className="admin-content">{noticeVisible&&<div className="local-demo-notice"><i className="fa-solid fa-circle-info" aria-hidden="true" /><p><strong>Prototype status.</strong> Admin access uses a server session and vehicles, bookings, and customer accounts can use MariaDB. Payments stay unverified until a provider confirms them; settings, reviews, some activity records, and demo data still use this browser.</p><button type="button" className="notice-dismiss" aria-label="Dismiss notice" onClick={()=>setNoticeVisible(false)}>×</button></div>}{children}</div>
    </main>
    {sidebarOpen&&<button className="admin-sidebar-scrim" type="button" aria-label="Close dashboard menu" onClick={()=>setSidebarOpen(false)} />}
  </div>;
}
