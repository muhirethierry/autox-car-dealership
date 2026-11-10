export const VIEWS = [
  {group:"MAIN",items:[["overview","Overview","fa-chart-pie"],["fleet","Fleet Management","fa-car-side","fleet"],["requests","Rental Requests","fa-clipboard","pending"],["active","Active Rentals","fa-key"],["history","Rental History","fa-clock-rotate-left"]]},
  {group:"CUSTOMERS & FINANCE",items:[["customers","Customers","fa-users","customers"],["payments","Payments","fa-credit-card"],["reports","Revenue & Reports","fa-chart-column"]]},
  {group:"OPERATIONS",items:[["maintenance","Vehicle Maintenance","fa-screwdriver-wrench"],["reviews","Reviews & Feedback","fa-star"],["notifications","Notifications","fa-bell","notifications"]]},
  {group:"SYSTEM",items:[["settings","Settings","fa-sliders"],["profile","Admin Profile","fa-user"]]}
];

export const money = value => `RWF ${new Intl.NumberFormat("en-RW",{maximumFractionDigits:0}).format(Number(value)||0)}`;
export const dateText = (value,year=false) => {
  if (!value) return "Not set";
  const date = new Date(`${String(value).slice(0,10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? "Not set" : date.toLocaleDateString("en-GB",{day:"numeric",month:"short",...(year?{year:"numeric"}:{})});
};
export const today = () => {
  const now=new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
};
export const duration = (start,end) => start&&end ? Math.max(0,Math.round((new Date(`${end}T00:00:00`)-new Date(`${start}T00:00:00`))/86400000)) : 0;
export const statusClass = status => `status-${String(status||"pending").toLowerCase().replace(/[^a-z]+/g,"-")}`;
export const escapeText = value => String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
export const isVerified = payment => payment?.verificationStatus === "Verified" && payment?.verified === true;

export function getNotifications({requests,maintenance,readAt}) {
  const items=[];
  const add=(id,title,detail,date,kind)=>items.push({id,title,detail,date,kind,read:new Date(date||0).getTime()<=readAt});
  const now=today();
  const after=(days)=>{const date=new Date(`${now}T00:00:00`);date.setDate(date.getDate()+days);return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;};
  for(const request of requests){
    if(request.status==="Pending")add(`request-${request.id}`,`New rental request · ${request.reference}`,`${request.name||"Customer"} requested ${request.carName||"a vehicle"}.`,request.createdAt,"request");
    if(request.status==="Active"&&request.return&&request.return<now)add(`overdue-${request.id}`,`Overdue return · ${request.reference}`,`${request.carName||"Vehicle"} was due back ${dateText(request.return,true)}.`,request.return,"overdue");
    else if(request.status==="Active"&&request.return&&duration(now,request.return)<=2)add(`return-${request.id}`,`Upcoming return · ${request.reference}`,`${request.carName||"Vehicle"} is due ${dateText(request.return,true)}.`,request.return,"return");
    if(request.status==="Approved")add(`approved-${request.id}`,`Booking approved · ${request.reference}`,`${request.carName||"Vehicle"} is booked for ${request.name||"the customer"}.`,request.updatedAt||request.createdAt,"booking");
    if(request.status==="Cancelled")add(`cancelled-${request.id}`,`Booking cancelled · ${request.reference}`,`${request.carName||"Vehicle"} for ${request.name||"the customer"} was cancelled.`,request.updatedAt||request.createdAt,"booking");
  }
  for(const record of maintenance){
    if(record.status==="In progress")add(`maintenance-${record.id}`,"Vehicle in maintenance",`${record.vehicleName||"Vehicle"}: ${record.title}.`,record.createdAt||record.serviceDate,"maintenance");
    if(record.nextDate&&record.nextDate>=now&&record.nextDate<=after(7))add(`service-${record.id}`,`Service reminder · ${record.vehicleName||"Vehicle"}`,`${record.title} is scheduled by ${dateText(record.nextDate,true)}.`,record.nextDate,"maintenance");
  }
  return items.sort((a,b)=>new Date(b.date||0)-new Date(a.date||0));
}
