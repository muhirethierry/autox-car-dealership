import { useEffect, useMemo, useRef, useState } from "react";
import { useFleet } from "../context/FleetContext.jsx";
import VehicleDetails from "../components/VehicleDetails.jsx";

const LOCATIONS = ["Kigali City Centre","Kigali International Airport","Kigali Convention Centre"];
const CATEGORIES = ["SUV","Crossover","Sedan","Hatchback","Pickup","Minivan","Hybrid","Electric"];
const localDate = date => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
const dayCount = (start,end) => start && end ? Math.ceil((new Date(`${end}T00:00:00`) - new Date(`${start}T00:00:00`))/86400000) : 0;
const formatMoney = amount => `RWF ${new Intl.NumberFormat("en-RW",{maximumFractionDigits:0}).format(amount || 0)}`;
const ratesFor = car => ({day:Number(car.dailyRate)||0,week:Number(car.weeklyRate)||Number(car.dailyRate)*6,month:Number(car.monthlyRate)||Math.round(Number(car.dailyRate)*25.5)});
function estimate(car,days) {
  const rates=ratesFor(car), months=Math.floor(days/30), remaining=days%30, weeks=Math.floor(remaining/7), daysLeft=remaining%7;
  return months*rates.month+weeks*rates.week+daysLeft*rates.day;
}
function placeholder(label) {
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 520"><rect width="900" height="520" fill="#e8edf2"/><path d="M0 390h900v130H0z" fill="#d8e0e8"/><path d="m170 350 55-100c14-25 35-40 66-44l221-24c37-4 71 7 99 34l93 91 65 20c26 8 43 30 43 57v39H112v-31c0-24 17-45 41-52z" fill="#132741"/><path d="m282 247 228-24c24-3 43 4 62 21l65 63H233l43-48c2-3 4-7 6-12z" fill="#b8c8d8"/><circle cx="260" cy="420" r="52" fill="#26394f"/><circle cx="260" cy="420" r="25" fill="#eef1f4"/><circle cx="680" cy="420" r="52" fill="#26394f"/><circle cx="680" cy="420" r="25" fill="#eef1f4"/><text x="450" y="490" text-anchor="middle" fill="#526376" font-family="Arial,sans-serif" font-size="20">${label.replace(/[&<>]/g,"")}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function VehicleCard({car,onDetails,onPhoto}) {
  const [image,setImage]=useState(car.image),[fallbackTried,setFallbackTried]=useState(false);
  useEffect(()=>{setImage(car.image);setFallbackTried(false);},[car.image]);
  const onError=()=>{
    if(!fallbackTried && car.fallbackImage){setImage(car.fallbackImage);setFallbackTried(true);return;}
    setImage(placeholder(car.alt || `${car.make} ${car.model}`));
  };
  const rates=ratesFor(car);
  return <article className="car">
    <div className="car-image-wrap"><button className="car-image-link" type="button" onClick={()=>onPhoto(car)} aria-label={`Expand photo of ${car.make} ${car.model}`}><img src={image} onError={onError} alt={car.alt || `${car.make} ${car.model}`} loading="lazy" /></button><span className="car-tag">{car.tag || String(car.type).toUpperCase()}</span><span className={`availability-badge ${car.available ? "is-available" : "is-unavailable"}`}><span className="availability-dot" />{car.available ? "Available" : "Not available"}</span></div>
    <div className="car-body"><div className="car-title-row"><h3>{car.make} {car.model}</h3><span className="car-year">{car.type}</span></div><p className="car-subtitle">{car.seats || 5} seats · {car.fuel || "Fuel not set"} · {car.transmission || "Automatic"}</p><div className="car-specs"><span>{car.seats || 5} seats</span><span>{car.fuel || "Fuel not set"}</span><span>{car.transmission || "Automatic"}</span></div>
      <div className="rate-options" aria-label="Estimated rental rates"><div><strong>{formatMoney(rates.day)}</strong><span>per day</span></div><div><strong>{formatMoney(rates.week)}</strong><span>per week</span></div><div><strong>{formatMoney(rates.month)}</strong><span>per month</span></div></div><p className="rate-note">Weekly covers 7 days; monthly covers 30 days.</p><button className="details-button rental-card-cta" type="button" onClick={()=>onDetails(car)}>{car.available ? "VIEW & BOOK" : "VIEW DETAILS"} ↗</button>
    </div>
  </article>;
}

export default function Home() {
  const {getFleet}=useFleet();
  const fleet=getFleet();
  const [query,setQuery]=useState(""),[type,setType]=useState("all"),[sort,setSort]=useState("featured");
  const [pickupLocation,setPickupLocation]=useState(LOCATIONS[0]);
  const [pickup,setPickup]=useState(""),[returnDate,setReturnDate]=useState("");
  const [menuOpen,setMenuOpen]=useState(false),[selected,setSelected]=useState(null),[photo,setPhoto]=useState(null),[toast,setToast]=useState("");
  const [requestDates,setRequestDates]=useState({pickup:"",return:""});
  const vehicleDialog=useRef(null),photoDialog=useRef(null),heroVideo=useRef(null),toastTimer=useRef();
  const today=localDate(new Date());
  const returnMinimum=pickup?localDate(new Date(new Date(`${pickup}T00:00:00`).getTime()+86400000)):today;
  const days=dayCount(pickup,returnDate);
  const filtered=useMemo(()=>{
    let rows=fleet.filter(car=>`${car.make} ${car.model} ${car.type}`.toLowerCase().includes(query.trim().toLowerCase())&&(type==="all"||car.type===type));
    if(sort==="price-low") rows=rows.toSorted((a,b)=>a.dailyRate-b.dailyRate);
    if(sort==="price-high") rows=rows.toSorted((a,b)=>b.dailyRate-a.dailyRate);
    return rows;
  },[fleet,query,type,sort]);
  useEffect(()=>{document.title="AutoX Rentals - Your Kigali trip, your way";},[]);
  useEffect(()=>{
    const video=heroVideo.current,preference=window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync=()=>{if(preference.matches)video?.pause();else video?.play().catch(()=>{});};
    sync();preference.addEventListener?.("change",sync);return ()=>preference.removeEventListener?.("change",sync);
  },[]);
  useEffect(()=>{if(selected&&vehicleDialog.current&&!vehicleDialog.current.open)vehicleDialog.current.showModal();},[selected]);
  useEffect(()=>{if(photo&&photoDialog.current&&!photoDialog.current.open)photoDialog.current.showModal();},[photo]);
  useEffect(()=>()=>clearTimeout(toastTimer.current),[]);
  const notify=message=>{setToast(message);clearTimeout(toastTimer.current);toastTimer.current=setTimeout(()=>setToast(""),2800);};
  const openCar=car=>{setSelected(car);setRequestDates({pickup,return:returnDate});};
  const activeDays=dayCount(requestDates.pickup,requestDates.return);
  const estimateText=selected?(activeDays>0?<div className="rental-total"><span>{activeDays}-day estimate using available day, week, and month packages</span><strong>Estimated total: {formatMoney(estimate(selected,activeDays))}</strong></div>:<div className="rental-total"><span>Choose dates to see a trip estimate</span><strong>From {formatMoney(ratesFor(selected).day)} per day</strong></div>):null;

  function submitBooking(event) {
    event.preventDefault();
    if(days<1){notify("Please choose a return date after your pickup date.");return;}
    document.querySelector("#fleet")?.scrollIntoView({behavior:"smooth"});
  }
  function submitRequest(event) {
    event.preventDefault();
    const form=event.currentTarget,pickupValue=form.elements.pickup.value,returnValue=form.elements.return.value;
    if(dayCount(pickupValue,returnValue)<1){notify("Return date must be after pickup date.");return;}
    const car=selected;if(!car)return;
    const duration=dayCount(pickupValue,returnValue),rates=ratesFor(car),reference=`AX-${Date.now().toString(36).toUpperCase()}`;
    const request={id:reference,reference,carId:car.id,carName:`${car.make} ${car.model}`,dailyRate:rates.day,estimatedTotal:estimate(car,duration),pickup:pickupValue,return:returnValue,pickupTime:form.elements["pickup-time"].value,returnTime:form.elements["return-time"].value,pickupLocation:form.elements["pickup-location"].value,returnLocation:form.elements["return-location"].value,passengers:form.elements.passengers.value,name:form.elements["full-name"].value.trim(),email:form.elements.email.value.trim(),phone:form.elements.phone.value.trim(),notes:form.elements.notes.value.trim(),status:"Pending",paymentStatus:"Unrecorded",createdAt:new Date().toISOString()};
    try{const requests=window.AutoXData.getRequests();requests.unshift(request);if(!window.AutoXData.saveRequests(requests))notify("Your email is ready, but this browser could not save the request for the admin dashboard.");}catch{notify("Your email is ready, but this browser could not save the request for the admin dashboard.");}
    const body=[`Car: ${car.make} ${car.model}`,`Estimated daily rate: ${formatMoney(rates.day)}`,`Estimated weekly package: ${formatMoney(rates.week)}`,`Estimated monthly package: ${formatMoney(rates.month)}`,`Estimated rental total: ${formatMoney(estimate(car,duration))} for ${duration} days`,`Pickup: ${pickupValue} at ${form.elements["pickup-time"].value}`,`Return: ${returnValue} at ${form.elements["return-time"].value}`,`Pickup location: ${form.elements["pickup-location"].value}`,`Return location: ${form.elements["return-location"].value}`,`Passengers: ${form.elements.passengers.value}`,`Name: ${request.name}`,`Email: ${request.email}`,`Phone: ${request.phone}`,`Special requests: ${request.notes||"None"}`,"Please confirm availability and the final rental terms."].join("\n");
    window.location.href=`mailto:hello@autox.example?subject=${encodeURIComponent(`AutoX rental request - ${car.make} ${car.model}`)}&body=${encodeURIComponent(body)}`;
  }
  function closeMenu(){setMenuOpen(false);}
  function showPhoto(car){setPhoto({car,src:car.image,usedFallback:false});}

  return <>
    <header className="site-header"><a className="logo" href="#home" aria-label="AutoX Rentals home"><img src="assets/autox-logo.svg" width="187" height="48" alt="AUTOX Rentals · Kigali" /></a><button className="menu-toggle" id="menu-toggle" type="button" aria-label={menuOpen?"Close navigation menu":"Open navigation menu"} aria-expanded={menuOpen} aria-controls="navigation" onClick={()=>setMenuOpen(open=>!open)}>{menuOpen?"×":"☰"}</button><nav id="navigation" className={menuOpen?"show":""} aria-label="Main navigation" onClick={closeMenu}><a href="#booking">Book a car</a><a href="#fleet">Our fleet</a><a href="#how-it-works">How it works</a><a href="#contact">Contact</a><a className="nav-login" href="login.html">Login</a></nav></header>
    <main>
      <section className="hero rental-hero" id="home"><video className="hero-video" id="hero-video" ref={heroVideo} autoPlay muted loop playsInline preload="metadata" poster="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=2000&q=90" aria-hidden="true" tabIndex="-1"><source src="assets/autox-hero.mp4" type="video/mp4" /></video><div className="hero-content"><span className="eyebrow">AUTOX RENTALS · KIGALI</span><h1>More freedom.<br /><span>Every mile.</span></h1><p>Find the right car for your Rwanda trip. Clear daily rates, a simple pickup, and help from our local team.</p><div className="hero-actions"><a className="btn" href="#booking">Find your car <span>↗</span></a><a className="text-link" href="#fleet">Explore the fleet</a></div><div className="hero-proof"><span>Pickup across Kigali</span><span>Flexible rental periods</span></div></div><div className="hero-note"><span className="note-dot" /> Your journey starts here</div></section>
      <section className="booking-section" id="booking" aria-labelledby="booking-title"><form className="booking-form" id="booking-form" onSubmit={submitBooking}><div className="booking-heading"><span className="eyebrow">PLAN YOUR TRIP</span><h2 id="booking-title">Where are you headed?</h2></div><label className="booking-field location-field" htmlFor="pickup-location"><span>Pickup location</span><select id="pickup-location" value={pickupLocation} onChange={event=>setPickupLocation(event.target.value)} required>{LOCATIONS.map(location=><option key={location}>{location}</option>)}</select></label><label className="booking-field" htmlFor="pickup-date"><span>Pickup date</span><input id="pickup-date" type="date" min={today} value={pickup} onChange={event=>{setPickup(event.target.value);if(returnDate&&returnDate<=event.target.value)setReturnDate(localDate(new Date(new Date(`${event.target.value}T00:00:00`).getTime()+86400000)));}} required /></label><label className="booking-field" htmlFor="return-date"><span>Return date</span><input id="return-date" type="date" min={returnMinimum} value={returnDate} onChange={event=>setReturnDate(event.target.value)} required /></label><button className="btn booking-submit" type="submit">Browse available cars <span>→</span></button></form><p className="booking-summary" id="booking-summary" aria-live="polite">{days>0?`${days} rental day${days===1?"":"s"} · Pickup at ${pickupLocation}. Choose a car below to request it.`:"Choose your dates to see your trip estimate."}</p></section>
      <section className="inventory-section rental-fleet" id="fleet"><div className="section-heading"><div><span className="eyebrow">THE AUTOX FLEET</span><h2>A car for every kind of trip.</h2><p>From city drives to scenic weekends, find your perfect fit. Sample rates and availability; our team confirms your final quote.</p></div><div className="inventory-count"><strong id="inventory-count">{filtered.length}</strong><span>cars in our fleet</span></div></div><div className="inventory-toolbar"><label className="search-box"><span aria-hidden="true">⌕</span><input id="search-input" type="search" placeholder="Search make or model..." aria-label="Search rental cars" value={query} onChange={event=>setQuery(event.target.value)} /></label><label className="select-wrap"><span className="sr-only">Vehicle type</span><select id="type-filter" value={type} onChange={event=>setType(event.target.value)}><option value="all">All vehicle types</option>{CATEGORIES.map(category=><option key={category} value={category}>{category}</option>)}</select></label><label className="select-wrap"><span className="sr-only">Sort cars</span><select id="sort-select" value={sort} onChange={event=>setSort(event.target.value)}><option value="featured">Featured first</option><option value="price-low">Daily rate: low to high</option><option value="price-high">Daily rate: high to low</option></select></label></div><div className="cars" id="cars-grid" aria-live="polite">{filtered.map(car=><VehicleCard key={car.id} car={car} onDetails={openCar} onPhoto={showPhoto} />)}</div>{filtered.length===0&&<p className="empty-state" id="empty-state">No cars match your search. Try a different make or vehicle type.</p>}</section>
      <section className="promise-section rental-how" id="how-it-works"><div className="promise-intro"><span className="eyebrow">RENTING, MADE SIMPLE</span><h2>Your trip.<br />Your keys.<br /><span>Your way.</span></h2><p>We make getting on the road straightforward, from choosing your car to returning it after your trip.</p></div><div className="promise-grid"><article className="promise-card"><span className="promise-icon">01</span><h3>Choose your car</h3><p>Pick a vehicle that suits your plans and see its daily rate upfront.</p></article><article className="promise-card"><span className="promise-icon">02</span><h3>Request your dates</h3><p>Send our team your pickup location and dates. We will confirm availability.</p></article><article className="promise-card"><span className="promise-icon">03</span><h3>Pick up and go</h3><p>Meet us at your selected Kigali location, review the car, and start your drive.</p></article><article className="promise-card"><span className="promise-icon">04</span><h3>Local support</h3><p>Our Kigali team is here to help during your rental.</p></article></div></section>
      <section className="rental-info" aria-label="Rental information"><article><span className="info-mark">01</span><h3>Transparent daily rates</h3><p>See the listed rental rate before you send a request. Our team will confirm the final quote and any applicable fees.</p></article><article><span className="info-mark">02</span><h3>Flexible pickup</h3><p>Choose Kigali City Centre, Kigali International Airport, or Kigali Convention Centre when you request your car.</p></article><article><span className="info-mark">03</span><h3>Made for Rwanda</h3><p>Choose a comfortable city car or a capable SUV for the road ahead. Ask us about the best fit for your route.</p></article></section>
      <section className="contact-section" id="contact"><div><span className="eyebrow">READY WHEN YOU ARE</span><h2>Let the road<br />take you somewhere.</h2><p>Have a question about a car, pickup, or your trip? Talk to our Kigali rental team.</p></div><div className="contact-actions"><a className="btn" href="mailto:hello@autox.example?subject=AutoX%20rental%20enquiry">Email our team <span>↗</span></a><a className="contact-detail" href="tel:+250788000000">Call us<strong>+250 788 000 000</strong></a><span className="contact-detail">Find us<strong>Kigali, Rwanda</strong></span></div></section>
    </main>
    <footer><a className="logo" href="#home" aria-label="AutoX Rentals home"><img src="assets/autox-logo.svg" width="187" height="48" alt="AUTOX Rentals · Kigali" /></a><p>Good trips start with the right car.</p><small>© <span id="current-year">{new Date().getFullYear()}</span> AutoX Rentals. Drive safe, wherever you are headed.</small><a className="admin-footer-link" href="admin.html">Admin dashboard</a></footer>
    <dialog className="vehicle-dialog rental-dialog" id="vehicle-dialog" ref={vehicleDialog} onClose={()=>setSelected(null)} onClick={event=>{if(event.target===event.currentTarget)vehicleDialog.current.close();}}><button className="dialog-close icon-button" type="button" onClick={()=>vehicleDialog.current?.close()} aria-label="Close rental details">×</button>{selected&&<VehicleDetails car={selected} initialLocation={pickupLocation} dates={requestDates} setDates={setRequestDates} today={today} estimateText={estimateText} onSubmit={submitRequest} onImageError={event=>{event.currentTarget.src=event.currentTarget.dataset.fallback || placeholder(selected.alt);event.currentTarget.dataset.fallback="";}} />}</dialog>
    <dialog className="photo-dialog" id="photo-dialog" ref={photoDialog} aria-label="Expanded vehicle photo" onClick={event=>{if(event.target===event.currentTarget)photoDialog.current.close();}}><button className="photo-dialog-close" type="button" onClick={()=>photoDialog.current?.close()} aria-label="Close expanded photo">×</button>{photo&&<img src={photo.src} alt={photo.car.alt || `${photo.car.make} ${photo.car.model}`} onError={()=>{setPhoto(current=>current&&!current.usedFallback?{...current,src:current.car.fallbackImage,usedFallback:true}:current?{...current,src:placeholder(current.car.alt),usedFallback:true}:null);}} />}</dialog>
    <div className={`toast ${toast?"visible":""}`} id="toast" role="status" aria-live="polite">{toast}</div>
  </>;
}

