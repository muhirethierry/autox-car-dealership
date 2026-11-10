import { useEffect, useState } from "react";
import { dateText, money, isVerified } from "./adminUtils.js";
import AdminVehicleImage from "./AdminVehicleImage.jsx";
import { apiRequest } from "../services/apiClient.js";

function MonthlyChart({rows,label="requests",color="#d9aa36",moneyAxis=false}) {
  const width=560,height=160,pad=24,max=Math.max(1,...rows.map(item=>item.value));
  const points=rows.map((item,index)=>({x:pad+index*(width-2*pad)/Math.max(1,rows.length-1),y:height-pad-(item.value/max)*(height-2*pad)}));
  if(!rows.some(item=>item.value))return <div className="chart-empty">No {label} recorded in this period.</div>;
  return <svg className="report-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Monthly ${label} chart`}>
    {[0,.5,1].map((fraction,index)=><g key={index}><line x1={pad} x2={width-pad} y1={pad+fraction*(height-2*pad)} y2={pad+fraction*(height-2*pad)} /><text x={1} y={pad+fraction*(height-2*pad)+3}>{moneyAxis?`${Math.round(max*(1-fraction)/1000)}k`:Math.round(max*(1-fraction))}</text></g>)}
    {rows.length>1&&<polyline points={points.map(point=>`${point.x},${point.y}`).join(" ")} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
    {points.map((point,index)=><g key={rows[index].key}><circle cx={point.x} cy={point.y} r="4" fill={color}><title>{rows[index].label}: {moneyAxis?money(rows[index].value):rows[index].value}</title></circle><text textAnchor="middle" x={point.x} y={height-3}>{rows[index].label}</text></g>)}
  </svg>;
}

export default function AdminOverview({data,onNavigate,onQuickAdd}) {
  const [apiData,setApiData]=useState(null);
  useEffect(()=>{let active=true;Promise.all([apiRequest("/admin/vehicles"),apiRequest("/admin/bookings"),apiRequest("/admin/customers"),apiRequest("/admin/payments")]).then(([fleetResult,bookingResult,customerResult,paymentResult])=>{if(!active)return;const fleet=fleetResult.vehicles.map(vehicle=>({id:vehicle.id,make:vehicle.brand,model:vehicle.model,year:vehicle.year,category:vehicle.category,dailyRate:Number(vehicle.dailyRate),available:vehicle.status==="AVAILABLE",archived:vehicle.status==="ARCHIVED",maintenanceStatus:vehicle.status==="MAINTENANCE"?"In progress":"",rentalActive:false,image:vehicle.imageUrl||"",fallbackImage:vehicle.imageUrl||""}));const requests=bookingResult.bookings.map(booking=>({id:booking.id,reference:booking.reference,carId:booking.vehicleId,carName:`${booking.vehicle.brand} ${booking.vehicle.model}`,name:`${booking.customer.firstName} ${booking.customer.lastName}`.trim(),email:booking.customer.email,phone:booking.customer.phone||"",pickup:booking.pickupAt.slice(0,10),return:booking.returnAt.slice(0,10),estimatedTotal:Number(booking.totalAmount),status:booking.status[0]+booking.status.slice(1).toLowerCase(),createdAt:booking.createdAt}));const payments=paymentResult.payments.map(payment=>({amount:Number(payment.amount),date:payment.createdAt,verified:payment.status==="VERIFIED",verificationStatus:payment.status==="VERIFIED"?"Verified":"Pending · unverified"}));setApiData({fleet,requests,customers:customerResult.customers,payments});}).catch(()=>{});return()=>{active=false;};},[]);
  const requests=apiData?.requests??data.requests,payments=apiData?.payments??data.payments,customers=apiData?.customers??data.customers;
  const active=requests.filter(item=>item.status==="Active");
  const pending=requests.filter(item=>item.status==="Pending");
  const revenue=payments.filter(isVerified).reduce((sum,payment)=>sum+(Number(payment.amount)||0),0);
  const operational=(apiData?.fleet??data.fleet).filter(car=>!car.archived);
  const activeVehicleIds=new Set(active.map(item=>item.carId).filter(Boolean));
  const available=operational.filter(car=>car.available&&!activeVehicleIds.has(car.id)).length;
  const maintenance=operational.filter(car=>car.maintenanceStatus).length;
  const rented=apiData?activeVehicleIds.size:operational.filter(car=>car.rentalActive).length;
  const now=new Date();
  const months=Array.from({length:6},(_,index)=>{const month=new Date(now.getFullYear(),now.getMonth()-5+index,1);return {key:`${month.getFullYear()}-${month.getMonth()}`,label:month.toLocaleDateString("en-GB",{month:"short"}),month};});
  const monthKey=value=>{const date=new Date(value);return Number.isNaN(date.getTime())?"":`${date.getFullYear()}-${date.getMonth()}`;};
  const requestMonths=months.map(item=>({...item,value:requests.filter(request=>monthKey(request.createdAt)===item.key).length}));
  const revenueMonths=months.map(item=>({...item,value:payments.filter(payment=>isVerified(payment)&&monthKey(payment.date||payment.paidAt)===item.key).reduce((sum,payment)=>sum+(Number(payment.amount)||0),0)}));
  const recentRequests=[...requests].sort((a,b)=>String(b.createdAt||"").localeCompare(String(a.createdAt||""))).slice(0,5);
  const additions=(apiData?.fleet??data.fleet).filter(car=>car.createdAt).sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt))).slice(0,4);
  const recentCars=additions.length?additions:operational.slice(-4).reverse();
  const values=[
    ["Total vehicles",operational.length,"Registered fleet","fa-car-side","navy-icon"],
    ["Available vehicles",available,"Ready to book","fa-circle-check","green-icon"],
    ["Currently rented",active.length,"Active rentals","fa-key","blue-icon"],
    ["Under maintenance",maintenance,"Unavailable for booking","fa-screwdriver-wrench","red-icon"],
    ["Rental requests",requests.length,"All request statuses","fa-clipboard","gold-icon"],
    ["Pending requests",pending.length,"Needs a response","fa-hourglass-half","gold-icon"],
    ["Active rentals",active.length,"Currently on the road","fa-road","blue-icon"],
    ["Total customers",customers.length,"Registered customer accounts","fa-users","navy-icon"],
    ["Verified revenue",money(revenue),"Verified payment records only","fa-coins","green-icon"]
  ];
  const availabilityTotal=Math.max(1,operational.length);
  const availabilityStyle={background:`conic-gradient(#4c9a7c 0 ${available/availabilityTotal*100}%, #6785b2 ${available/availabilityTotal*100}% ${(available+rented)/availabilityTotal*100}%, #d5a93c ${(available+rented)/availabilityTotal*100}% ${(available+rented+maintenance)/availabilityTotal*100}%, #cfd5dc ${(available+rented+maintenance)/availabilityTotal*100}% 100%)`};
  return <section className="admin-view is-visible" aria-labelledby="overview-title">
    <div className="page-heading"><div><span className="admin-eyebrow">AUTOX RENTALS <span>·</span> KIGALI</span><h1 id="overview-title">Good day, <span>{(data.profile.name||"Admin").trim().split(/\s+/)[0]}</span></h1><p>Here is your rental operations overview.</p></div><span className="date-chip"><i className="fa-regular fa-calendar" aria-hidden="true" />{new Date().toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short",year:"numeric"})}</span></div>
    <div className="metric-grid">{values.map(([title,value,sub,icon,color])=><article className={`metric-card ${title==="Verified revenue"?"metric-revenue":""}`} key={title}><span className={`metric-icon ${color}`}><i className={`fa-solid ${icon}`} aria-hidden="true" /></span><span className="metric-label">{title}</span><strong>{value}</strong><small>{sub}</small>{title==="Verified revenue"&&<em>Demo data only</em>}</article>)}</div>
    <div className="overview-grid chart-grid">
      <section className="panel chart-panel"><div className="panel-heading"><div><h2>Revenue overview</h2><p>Verified transactions only · RWF</p></div><span className="chart-period">Last 6 months</span></div><div className="chart-canvas"><MonthlyChart rows={revenueMonths} label="verified revenue" moneyAxis color="#4c9a7c" /></div><p className="chart-footnote">No verified payment provider is connected. Manual and demo payment notes are excluded.</p></section>
      <section className="panel chart-panel"><div className="panel-heading"><div><h2>Fleet availability</h2><p>Current operational status</p></div></div><div className="availability-chart"><div className="availability-donut" style={availabilityStyle}><span><strong>{available}</strong><small>available</small></span></div><div className="availability-legend">{[["Available",available,"#4c9a7c"],["Rented",rented,"#6785b2"],["Maintenance",maintenance,"#d5a93c"],["Unavailable",Math.max(0,operational.length-available-rented-maintenance),"#cfd5dc"]].map(([name,count,color])=><span key={name}><i style={{"--legend-color":color}} /><span>{name}</span><b>{count}</b></span>)}</div></div></section>
      <section className="panel chart-panel"><div className="panel-heading"><div><h2>Monthly rental requests</h2><p>Request volume · last 6 months</p></div></div><div className="chart-canvas compact-chart"><MonthlyChart rows={requestMonths} label="rental requests" /></div></section>
      <section className="panel recent-panel"><div className="panel-heading"><div><h2>Recent requests</h2><p>Latest customer enquiries</p></div><button className="text-action" type="button" onClick={()=>onNavigate("requests")}>View all <i className="fa-solid fa-arrow-right" aria-hidden="true" /></button></div><div className="recent-request-list">{recentRequests.length?recentRequests.map(request=><article className="recent-request-row" key={request.id}><span className="request-dot" /><div className="recent-request-main"><strong>{request.name||"Customer"}</strong><small>{request.carName||"Vehicle"} · {dateText(request.pickup)}</small></div><span className={`status-pill ${`status-${String(request.status||"pending").toLowerCase()}`}`}>{request.status}</span></article>):<div className="inline-empty">New rental enquiries will appear here.</div>}</div></section>
    </div>
    <div className="overview-lower-grid"><section className="panel added-panel"><div className="panel-heading"><div><h2>Recently added vehicles</h2><p>Latest fleet updates</p></div><button className="text-action" type="button" onClick={()=>onNavigate("fleet")}>Manage fleet <i className="fa-solid fa-arrow-right" aria-hidden="true" /></button></div><div className="recent-vehicles-list">{recentCars.length?recentCars.map(car=><article className="recent-vehicle-row" key={car.id}><AdminVehicleImage vehicle={car} /><span><strong>{car.make} {car.model}</strong><small>{car.category||car.type} · {car.createdAt?`Added ${dateText(car.createdAt,true)}`:"Core fleet"}</small></span><b>{money(car.dailyRate)}<small>/ day</small></b></article>):<div className="inline-empty">Your fleet is empty.</div>}</div></section><section className="panel activity-panel"><div className="panel-heading"><div><h2>Recent activity</h2><p>Dashboard action log</p></div></div><div className="activity-list">{data.activities.slice(0,6).map(item=><article className="activity-row" key={item.id}><span className="activity-icon"><i className="fa-regular fa-circle-check" aria-hidden="true" /></span><div><strong>{item.action}</strong><small>{item.detail}</small></div><time>{dateText(item.createdAt)}</time></article>)}{!data.activities.length&&<div className="inline-empty">Important dashboard actions will be recorded here.</div>}</div></section></div>
    <section className="quick-actions"><div><h2>Quick actions</h2><p>Common fleet and booking tasks.</p></div><button className="secondary-action" type="button" onClick={()=>onNavigate("requests")}><i className="fa-regular fa-clipboard" aria-hidden="true" />Review requests</button><button className="secondary-action" type="button" onClick={()=>onNavigate("maintenance")}><i className="fa-solid fa-screwdriver-wrench" aria-hidden="true" />Log maintenance</button><button className="primary-action" type="button" onClick={onQuickAdd}><i className="fa-solid fa-plus" aria-hidden="true" />Add vehicle</button></section>
  </section>;
}
