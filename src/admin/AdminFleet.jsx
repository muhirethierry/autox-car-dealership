import { useEffect, useMemo, useState } from "react";
import { money, statusClass } from "./adminUtils.js";
import AdminDialog from "./AdminDialog.jsx";
import AdminVehicleImage from "./AdminVehicleImage.jsx";
import { apiRequest } from "../services/apiClient.js";

const emptyVehicle={make:"",model:"",year:"",registration:"",category:"SUV",transmission:"Automatic",fuel:"Petrol",seats:5,dailyRate:"",weeklyRate:"",monthlyRate:"",available:true,description:"",image:""};
const makeId=(make,model)=>`${make}-${model}`.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");

function Field({label,name,value,onChange,type="text",required=true,min,step,options}){
  return <label className="full-label">{label}{options?<select name={name} value={value} onChange={onChange}>{options.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}</select>:<input name={name} type={type} value={value} onChange={onChange} required={required} min={min} step={step} />}</label>;
}

function VehicleDialog({vehicle,onClose,onSave,apiMode=false}) {
  const [draft,setDraft]=useState(vehicle||emptyVehicle),[error,setError]=useState("");
  const [busy,setBusy]=useState(false);
  const change=event=>{const {name,value}=event.target;setDraft(current=>({...current,[name]:["year","seats","dailyRate","weeklyRate","monthlyRate"].includes(name)?value:value}));};
  async function upload(event){
    const file=event.target.files?.[0];if(!file)return;
    if(!/^image\/(png|jpeg|webp)$/.test(file.type)||file.size>12*1024*1024){setError("Choose a JPG, PNG or WebP image smaller than 12 MB.");return;}
    try{setBusy(true);const bitmap=await createImageBitmap(file);const scale=Math.min(1,1000/Math.max(bitmap.width,bitmap.height));const canvas=document.createElement("canvas");canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));canvas.getContext("2d").drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close?.();setDraft(current=>({...current,image:canvas.toDataURL("image/jpeg",.78)}));setError("");}catch{setError("This image could not be opened.");}finally{setBusy(false);}
  }
  return <AdminDialog className="admin-dialog" onClose={onClose}><div className="dialog-heading"><div><span className="admin-eyebrow">FLEET INVENTORY</span><h2>{vehicle?"Edit vehicle":"Add vehicle"}</h2></div><button className="dialog-close" type="button" onClick={onClose} aria-label="Close">×</button></div><form onSubmit={event=>{event.preventDefault();onSave(draft,setError);}}><div className="vehicle-form-grid">
    <Field label="Brand" name="make" value={draft.make} onChange={change} />
    <Field label="Model" name="model" value={draft.model} onChange={change} />
    <Field label="Year" name="year" value={draft.year} onChange={change} type="number" min="1980" />
    <Field label="Registration number" name="registration" value={draft.registration} onChange={change} required={false} />
    <Field label="Category" name="category" value={draft.category} onChange={change} options={["SUV","Crossover","Sedan","Hatchback","Pickup","Minivan","Hybrid","Electric"].map(item=>({value:item,label:item}))} />
    <Field label="Transmission" name="transmission" value={draft.transmission} onChange={change} options={["Automatic","Manual","CVT"].map(item=>({value:item,label:item}))} />
    <Field label="Fuel type" name="fuel" value={draft.fuel} onChange={change} options={["Petrol","Diesel","Hybrid","Electric"].map(item=>({value:item,label:item}))} />
    <Field label="Seats" name="seats" value={draft.seats} onChange={change} type="number" min="1" />
    <Field label="Daily rate (RWF)" name="dailyRate" value={draft.dailyRate} onChange={change} type="number" min="1000" step="1000" />
    <Field label="Weekly rate (RWF)" name="weeklyRate" value={draft.weeklyRate} onChange={change} type="number" min="1000" step="1000" />
    <Field label="Monthly rate (RWF)" name="monthlyRate" value={draft.monthlyRate} onChange={change} type="number" min="1000" step="1000" />
    <Field label="Availability" name="available" value={String(draft.available!==false)} onChange={event=>setDraft(current=>({...current,available:event.target.value==="true"}))} options={[{value:"true",label:"Available"},{value:"false",label:"Unavailable"}]} />
    <label className="full-label full-span">Description<textarea name="description" rows="3" value={draft.description||""} onChange={change} /></label>
    <div className="image-upload-row full-span"><label className="full-label">Photo URL<input name="image" value={draft.image||""} onChange={change} placeholder="https://…" /></label><label className="full-label">Or upload a photo<input type="file" accept="image/png,image/jpeg,image/webp" onChange={upload} disabled={apiMode} /></label></div>
    {draft.image&&<img className="photo-preview" src={draft.image} alt="Vehicle preview" />}
  </div><p className="form-error" role="alert">{error}</p><p className="dialog-warning">{apiMode?"Fleet changes are saved to the shared database. Photo uploads wait until secure file storage is configured.":"Vehicle photos and fleet changes are saved in this browser only."}</p><div className="dialog-actions"><button className="secondary-action" type="button" onClick={onClose}>Cancel</button><button className="primary-action" type="submit" disabled={busy}>{busy?"Preparing photo…":"Save vehicle"}</button></div></form></AdminDialog>;
}

export default function AdminFleet({data,onToast,openNewToken=0}) {
  const [query,setQuery]=useState(""),[category,setCategory]=useState("all"),[availability,setAvailability]=useState("all"),[editing,setEditing]=useState(null),[adding,setAdding]=useState(false);
  const [apiFleet,setApiFleet]=useState(null);
  useEffect(()=>{let active=true;apiRequest("/admin/vehicles").then(result=>{if(active)setApiFleet(result.vehicles.map(vehicle=>({id:vehicle.id,apiManaged:true,make:vehicle.brand,model:vehicle.model,year:vehicle.year,registration:vehicle.registration||"",category:vehicle.category,type:vehicle.category,transmission:vehicle.transmission,fuel:vehicle.fuelType,seats:vehicle.seats,dailyRate:Number(vehicle.dailyRate),weeklyRate:Number(vehicle.weeklyRate),monthlyRate:Number(vehicle.monthlyRate),available:vehicle.status==="AVAILABLE",archived:vehicle.status==="ARCHIVED",maintenanceStatus:vehicle.status==="MAINTENANCE"?"In progress":"",description:vehicle.description,image:vehicle.imageUrl||"",fallbackImage:vehicle.imageUrl||""})));}).catch(()=>{});return()=>{active=false;};},[]);
  const fleet=apiFleet??data.fleet;
  useEffect(()=>{if(openNewToken)setAdding(true);},[openNewToken]);
  const categories=[...new Set(fleet.map(car=>car.category||car.type).filter(Boolean))].sort();
  const filtered=useMemo(()=>fleet.filter(car=>{
    const status=car.archived?"archived":car.maintenanceStatus?"maintenance":car.rentalActive?"rented":car.available?"available":"unavailable";
    return `${car.make} ${car.model} ${car.id} ${car.registration}`.toLowerCase().includes(query.trim().toLowerCase())&&(category==="all"||(car.category||car.type)===category)&&(availability==="all"||(availability==="archived"?car.archived:availability==="rented"?status==="rented":status===availability));
  }),[fleet,query,category,availability]);
  async function save(draft,setError){
    const make=String(draft.make||"").trim(),model=String(draft.model||"").trim(),existing=editing?.id;
    if(!make||!model){setError("Brand and model are required.");return;}
    if(!existing&&data.fleet.some(car=>`${car.make} ${car.model}`.toLowerCase()===`${make} ${model}`.toLowerCase())){setError("That make and model already exist in the fleet.");return;}
    const rates=[draft.dailyRate,draft.weeklyRate,draft.monthlyRate].map(Number);
    if(!rates.every(rate=>Number.isFinite(rate)&&rate>=1000)){setError("Enter daily, weekly and monthly rates of at least RWF 1,000.");return;}
    const car={...(editing||{}),...draft,id:existing||makeId(make,model),make,model,year:Number(draft.year)||"",registration:String(draft.registration||"").trim(),type:draft.category||"SUV",category:draft.category||"SUV",transmission:draft.transmission||"Automatic",fuel:draft.fuel||"Petrol",seats:Number(draft.seats)||5,dailyRate:rates[0],weeklyRate:rates[1],monthlyRate:rates[2],available:draft.available!==false,description:String(draft.description||"").trim()||`${make} ${model} rental vehicle. Contact AUTOX to confirm trip details.`,image:draft.image||editing?.image||editing?.fallbackImage||"",fallbackImage:editing?.fallbackImage||"https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1000&q=85",alt:`${make} ${model}`,tag:draft.category?.toUpperCase()||"SUV",createdAt:editing?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString(),status:"Active"};
    try{
      if(apiFleet!==null){
        const payload={brand:car.make,model:car.model,year:car.year||new Date().getFullYear(),registration:car.registration||null,category:car.category,transmission:car.transmission,fuelType:car.fuel,seats:car.seats,dailyRate:car.dailyRate,weeklyRate:car.weeklyRate,monthlyRate:car.monthlyRate,currency:"RWF",description:car.description,imageUrl:/^https?:\/\//i.test(car.image)?car.image:null,status:car.archived?"ARCHIVED":car.maintenanceStatus?"MAINTENANCE":car.available?"AVAILABLE":"UNAVAILABLE"};
        await apiRequest(existing?`/admin/vehicles/${encodeURIComponent(existing)}`:"/admin/vehicles",{method:existing?"PUT":"POST",body:existing?payload:{id:car.id,...payload}});
        const result=await apiRequest("/admin/vehicles");setApiFleet(result.vehicles.map(vehicle=>({id:vehicle.id,apiManaged:true,make:vehicle.brand,model:vehicle.model,year:vehicle.year,registration:vehicle.registration||"",category:vehicle.category,type:vehicle.category,transmission:vehicle.transmission,fuel:vehicle.fuelType,seats:vehicle.seats,dailyRate:Number(vehicle.dailyRate),weeklyRate:Number(vehicle.weeklyRate),monthlyRate:Number(vehicle.monthlyRate),available:vehicle.status==="AVAILABLE",archived:vehicle.status==="ARCHIVED",maintenanceStatus:vehicle.status==="MAINTENANCE"?"In progress":"",description:vehicle.description,image:vehicle.imageUrl||"",fallbackImage:vehicle.imageUrl||""})));
      }else if(!data.saveVehicle(car)){setError("Could not save the vehicle in this browser. Storage may be full.");return;}
      data.logActivity(existing?"Vehicle updated":"Vehicle added",`${make} ${model}`);onToast(existing?"Vehicle updated.":"Vehicle added to the fleet.");setEditing(null);setAdding(false);
    }catch(error){setError(error.message||"Could not save the vehicle.");}
  }
  async function archive(car,restore=false){if(!window.confirm(`${restore?"Restore":"Archive"} ${car.make} ${car.model}? ${restore?"It will appear in customer listings again.":"It will be hidden from customer listings."}`))return;try{if(car.apiManaged){await apiRequest(`/admin/vehicles/${encodeURIComponent(car.id)}/status`,{method:"PATCH",body:{status:restore?"AVAILABLE":"ARCHIVED"}});setApiFleet(current=>current.map(item=>item.id===car.id?{...item,archived:!restore,available:restore}:item));}else if(!data.archiveVehicle(car.id,!restore)){onToast("Could not save the fleet change.",true);return;}data.logActivity(restore?"Vehicle restored":"Vehicle archived",`${car.make} ${car.model}`);onToast(restore?"Vehicle restored.":"Vehicle archived.");}catch(error){onToast(error.message,true);}}
  return <section className="admin-view is-visible" aria-labelledby="fleet-title"><div className="page-heading"><div><span className="admin-eyebrow">INVENTORY CONTROL</span><h1 id="fleet-title">Fleet management</h1><p>Manage vehicle details, rental rates, photos and availability.</p></div><button className="primary-action" type="button" onClick={()=>setAdding(true)}><i className="fa-solid fa-plus" aria-hidden="true" />Add vehicle</button></div>
    <section className="panel table-panel"><div className="table-toolbar"><label className="admin-search"><i className="fa-solid fa-magnifying-glass" aria-hidden="true" /><input type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search by brand, model or registration" aria-label="Search vehicles" /></label><label className="admin-filter"><span className="sr-only">Vehicle category</span><select value={category} onChange={event=>setCategory(event.target.value)}><option value="all">All categories</option>{categories.map(item=><option key={item}>{item}</option>)}</select></label><label className="admin-filter"><span className="sr-only">Vehicle availability</span><select value={availability} onChange={event=>setAvailability(event.target.value)}><option value="all">All availability</option><option value="available">Available</option><option value="unavailable">Unavailable</option><option value="rented">Rented</option><option value="maintenance">Maintenance</option><option value="archived">Archived</option></select></label><span className="table-total">{filtered.length} vehicle{filtered.length===1?"":"s"}</span></div>
      <div className="table-scroll"><table><thead><tr><th>VEHICLE</th><th>ID / REGISTRATION</th><th>SPECIFICATIONS</th><th>DAILY</th><th>WEEKLY</th><th>MONTHLY</th><th>STATUS</th><th>ACTIONS</th></tr></thead><tbody>{filtered.map(car=>{const status=car.archived?"Archived":car.maintenanceStatus?"Maintenance":car.rentalActive?"Rented":car.available?"Available":"Unavailable";return <tr className={car.archived?"is-archived":""} key={car.id}><td><div className="car-cell"><AdminVehicleImage className="fleet-thumb" vehicle={car} /><span><strong>{car.make} {car.model}</strong><small>{car.year||"Year not set"} · {car.category||car.type}</small></span></div></td><td><strong className="vehicle-code">{car.id}</strong><small className="registration-number">{car.registration||"Registration not set"}</small></td><td><span className="vehicle-spec-line">{car.transmission||"Automatic"}</span><small className="registration-number">{car.fuel||"Fuel not set"} · {car.seats||5} seats</small></td><td>{money(car.dailyRate)}</td><td>{money(car.weeklyRate)}</td><td>{money(car.monthlyRate)}</td><td><span className={`status-pill ${statusClass(status)}`}>{status}</span></td><td><div className="row-actions"><button className="row-action" type="button" onClick={()=>setEditing(car)}>Edit</button>{car.archived?<button className="row-action" type="button" onClick={()=>archive(car,true)}>Restore</button>:<button className="row-action remove" type="button" onClick={()=>archive(car)}>Archive</button>}</div></td></tr>})}</tbody></table></div>{!filtered.length&&<div className="table-empty"><i className="fa-solid fa-car-side" aria-hidden="true" /><strong>No vehicles found</strong><p>Adjust the filters or add a vehicle to your fleet.</p></div>}</section>
    {(adding||editing)&&<VehicleDialog key={editing?.id||"new"} vehicle={editing} onClose={()=>{setAdding(false);setEditing(null);}} onSave={save} apiMode={apiFleet!==null} />}
  </section>;
}
