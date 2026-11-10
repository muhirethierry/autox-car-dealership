import { useEffect, useMemo, useState } from "react";
import { dateText, duration, money, statusClass, today } from "./adminUtils.js";
import AdminDialog from "./AdminDialog.jsx";
import { apiRequest } from "../services/apiClient.js";

function DetailsDialog({request,history,onClose}) {
  if(!request)return null;
  const items=[["Customer",request.name||"Customer"],["Customer history",`${history.length} request${history.length===1?"":"s"}`],["Email",request.email||"Not provided"],["Phone",request.phone||"Not provided"],["Vehicle",request.carName||"Vehicle"],["Rental period",`${dateText(request.pickup,true)} – ${dateText(request.return,true)}`],["Pickup",`${request.pickupLocation||"—"} · ${request.pickupTime||""}`],["Return",`${request.returnLocation||"—"} · ${request.returnTime||""}`],["Duration",`${duration(request.pickup,request.return)} days`],["Estimated total",money(request.estimatedTotal)],["Payment",request.paymentStatus||"Unrecorded"],["Passengers",request.passengers||"Not specified"]];
  return <AdminDialog className="detail-dialog" onClose={onClose}><button className="dialog-close" type="button" onClick={onClose} aria-label="Close">×</button><span className="admin-eyebrow">RENTAL REQUEST</span><h2>{request.reference}</h2><div className="detail-status"><span className={`status-pill ${statusClass(request.status)}`}>{request.status}</span></div><div className="detail-data-grid">{items.map(([label,value])=><div key={label}><small>{label}</small><strong>{value}</strong></div>)}</div><div className="detail-notes"><small>Special requests</small><p>{request.notes||"No special requests provided."}</p></div></AdminDialog>;
}

function RequestActions({request,onStatus,onDetails}) {
  return <div className="request-action-cell"><span className={`status-pill ${statusClass(request.status)}`}>{request.status}</span><div className="row-actions"><button className="row-action" type="button" onClick={onDetails}>Details</button>{request.status==="Pending"&&<><button className="row-action" type="button" onClick={()=>onStatus(request,"Approved")}>Approve</button><button className="row-action remove" type="button" onClick={()=>onStatus(request,"Rejected")}>Reject</button></>}{request.status==="Approved"&&<><button className="row-action" type="button" onClick={()=>onStatus(request,"Active")}>Start</button><button className="row-action remove" type="button" onClick={()=>onStatus(request,"Cancelled")}>Cancel</button></>}{request.status==="Active"&&<button className="row-action" type="button" onClick={()=>onStatus(request,"Completed")}>Return</button>}</div></div>;
}

function RequestTable({requests,data,onStatus,onDetails,activeOnly=false}) {
  if(activeOnly)return <div className="panel table-panel"><div className="table-scroll"><table><thead><tr><th>CUSTOMER</th><th>VEHICLE</th><th>PICKUP</th><th>EXPECTED RETURN</th><th>DURATION</th><th>STATUS</th><th>ACTIONS</th></tr></thead><tbody>{requests.map(request=>{const overdue=request.return&&request.return<today();return <tr key={request.id}><td><strong>{request.name||"Customer"}</strong><small className="registration-number">{request.phone||request.email||""}</small></td><td><strong>{request.carName||"Vehicle"}</strong><small className="registration-number">{request.reference}</small></td><td>{dateText(request.pickup,true)}</td><td><span className={overdue?"overdue-text":""}>{dateText(request.return,true)}{overdue?" · OVERDUE":""}</span></td><td>{duration(request.pickup,request.return)} days</td><td><span className={`status-pill ${overdue?"status-overdue":"status-active"}`}>{overdue?"Overdue":"Active"}</span></td><td><div className="row-actions"><button className="row-action" type="button" onClick={()=>onDetails(request)}>Details</button><button className="row-action" type="button" onClick={()=>onStatus(request,"Completed")}>Mark returned</button></div></td></tr>;})}</tbody></table></div>{!requests.length&&<div className="table-empty"><i className="fa-solid fa-key" aria-hidden="true" /><strong>No active rentals</strong><p>Approve a request and start the rental to track it here.</p></div>}</div>;
  return <div className="table-scroll"><table className="requests-table"><thead><tr><th>REFERENCE / CUSTOMER</th><th>VEHICLE / DATES</th><th>PICKUP</th><th>DURATION / TOTAL</th><th>PAYMENT</th><th>STATUS / ACTION</th></tr></thead><tbody>{requests.map(request=>{
    const payment=data.payments.find(item=>item.requestId===request.id),verified=payment?.verificationStatus==="Verified"&&payment?.verified===true;
    return <tr key={request.id}><td><div className="customer-cell"><strong>{request.reference}</strong><small>{request.name||"Customer"} · <a href={`mailto:${encodeURIComponent(request.email||"")}`}>{request.email||"No email"}</a></small><small>{request.phone||"No phone"}</small></div></td><td><div className="request-car"><strong>{request.carName||"Vehicle"}</strong><small>{dateText(request.pickup,true)} – {dateText(request.return,true)}</small></div></td><td><strong>{request.pickupLocation||"—"}</strong><small className="registration-number">{request.pickupTime||"Time not set"}</small></td><td><strong>{duration(request.pickup,request.return)} day{duration(request.pickup,request.return)===1?"":"s"}</strong><small className="registration-number">Estimate {money(request.estimatedTotal)}</small></td><td><span className={`payment-label ${verified?"payment-verified":""}`}>{verified?"Verified":payment?"Manual note":"Unrecorded"}</span></td><td><RequestActions request={request} onStatus={onStatus} onDetails={()=>onDetails(request)} /></td></tr>;
  })}</tbody></table></div>;
}

export default function AdminBookings({view,data,onToast}) {
  const [query,setQuery]=useState(""),[status,setStatus]=useState("all"),[sort,setSort]=useState("newest"),[detail,setDetail]=useState(null);
  const [apiBookings,setApiBookings]=useState(null);
  useEffect(()=>{let active=true;apiRequest("/admin/bookings").then(result=>{if(active)setApiBookings(result.bookings.map(booking=>({id:booking.id,apiId:booking.id,reference:booking.reference,carId:booking.vehicleId,carName:`${booking.vehicle.brand} ${booking.vehicle.model}`,name:`${booking.customer.firstName} ${booking.customer.lastName}`.trim(),email:booking.customer.email,phone:booking.customer.phone||"",pickup:booking.pickupAt.slice(0,10),return:booking.returnAt.slice(0,10),pickupLocation:booking.pickupLocation,estimatedTotal:Number(booking.totalAmount),dailyRate:Number(booking.dailyRate),status:booking.status[0]+booking.status.slice(1).toLowerCase(),paymentStatus:booking.paymentStatus,notes:booking.notes||"",createdAt:booking.createdAt})));}).catch(()=>{if(active)setApiBookings(null);});return()=>{active=false;};},[]);
  const requests=apiBookings??data.requests;
  const rows=useMemo(()=>{
    let result=requests.filter(request=>`${request.reference} ${request.name} ${request.email} ${request.phone} ${request.carName}`.toLowerCase().includes(query.trim().toLowerCase()));
    if(view==="requests"&&status!=="all")result=result.filter(request=>request.status===status);
    if(view==="history")result=result.filter(request=>["Completed","Cancelled","Rejected"].includes(request.status)&&(status==="all"||request.status===status));
    if(view==="active")result=result.filter(request=>request.status==="Active");
    result.sort((a,b)=>sort==="oldest"?String(a.createdAt||"").localeCompare(String(b.createdAt||"")):sort==="pickup"?String(a.pickup||"").localeCompare(String(b.pickup||"")):String(b.createdAt||"").localeCompare(String(a.createdAt||"")));
    return result;
  },[requests,query,status,sort,view]);
  async function update(request,next){
    if(request.apiId){
      try{await apiRequest(`/admin/bookings/${encodeURIComponent(request.apiId)}/status`,{method:"PATCH",body:{status:next.toUpperCase()}});setApiBookings(current=>current.map(item=>item.apiId===request.apiId?{...item,status:next,updatedAt:new Date().toISOString()}:item));onToast(`Request marked ${next.toLowerCase()}.`);}catch(error){onToast(error.message,true);}return;
    }
    if(["Approved","Active"].includes(next)){
      const overlap=data.requests.some(other=>other.id!==request.id&&other.carId===request.carId&&["Approved","Active"].includes(other.status)&&other.pickup<request.return&&request.pickup<other.return);
      const service=data.maintenance.some(item=>item.vehicleId===request.carId&&["Scheduled","In progress"].includes(item.status)&&item.serviceDate>=request.pickup&&item.serviceDate<request.return);
      const car=data.fleet.find(item=>item.id===request.carId);
      if(overlap||service){onToast("This vehicle has an overlapping approved booking or maintenance date.",true);return;}
      if(next==="Approved"&&(!car||car.archived||car.maintenanceStatus||(!car.available&&!car.rentalActive))){onToast("This vehicle is unavailable. Check the fleet and maintenance status first.",true);return;}
      if(next==="Active"&&request.pickup&&request.pickup>today()){onToast("A rental cannot start before its pickup date.",true);return;}
    }
    const updated=requests.map(item=>item.id===request.id?{...item,status:next,updatedAt:new Date().toISOString()}:item);
    if(!data.saveRequests(updated)){onToast("Could not save the booking update.",true);return;}
    data.logActivity(`Booking ${next.toLowerCase()}`,`${request.reference} · ${request.name||"Customer"} · ${request.carName||"Vehicle"}`);
    onToast(`Request marked ${next.toLowerCase()}.`);
  }
  const heading={requests:["CUSTOMER ENQUIRIES","Rental requests","Review each enquiry, check for date conflicts, then move it forward."],active:["ON THE ROAD","Active rentals","Track current trips, due dates and overdue returns."],history:["PAST TRANSACTIONS","Rental history","Completed, cancelled and declined rental requests."]}[view];
  const history=requests.filter(item=>item.email&&detail?.email&&item.email.toLowerCase()===detail.email.toLowerCase());
  return <section className="admin-view is-visible"><div className="page-heading"><div><span className="admin-eyebrow">{heading[0]}</span><h1>{heading[1]}</h1><p>{heading[2]}</p></div>{view==="requests"&&<span className="request-total-chip">{requests.length} request{requests.length===1?"":"s"}</span>}</div>
    {view==="active"?<RequestTable requests={rows} data={data} onStatus={update} onDetails={setDetail} activeOnly />:<section className="panel table-panel">{view!=="active"&&<div className="table-toolbar"><label className="admin-search"><i className="fa-solid fa-magnifying-glass" aria-hidden="true" /><input type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder={view==="history"?"Search customer or vehicle":"Search reference, customer or vehicle"} /></label>{view==="requests"&&<label className="admin-filter"><select value={status} onChange={event=>setStatus(event.target.value)}><option value="all">All statuses</option>{["Pending","Approved","Rejected","Active","Completed","Cancelled"].map(item=><option key={item}>{item}</option>)}</select></label>}{view==="history"&&<label className="admin-filter"><select value={status} onChange={event=>setStatus(event.target.value)}><option value="all">All outcomes</option>{["Completed","Cancelled","Rejected"].map(item=><option key={item}>{item}</option>)}</select></label>}<label className="admin-filter"><select aria-label="Sort requests" value={sort} onChange={event=>setSort(event.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="pickup">Pickup date</option></select></label></div>}
      {rows.length?<RequestTable requests={rows} data={data} onStatus={update} onDetails={setDetail} />:<div className="table-empty"><i className={`fa-solid ${view==="history"?"fa-clock-rotate-left":"fa-clipboard"}`} aria-hidden="true" /><strong>{view==="history"?"No history to show":"No rental requests yet"}</strong><p>{view==="history"?"Completed and cancelled rentals will be listed here.":"Website enquiries appear here when submitted in this browser."}</p></div>}</section>}
    <DetailsDialog request={detail} history={history} onClose={()=>setDetail(null)} />
  </section>;
}
