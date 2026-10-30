const LOCATIONS = ["Kigali City Centre", "Kigali International Airport", "Kigali Convention Centre"];

const localDate = date => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
const dayCount = (start,end) => start && end ? Math.ceil((new Date(`${end}T00:00:00`) - new Date(`${start}T00:00:00`))/86400000) : 0;
const formatMoney = amount => `RWF ${new Intl.NumberFormat("en-RW",{maximumFractionDigits:0}).format(amount || 0)}`;
const ratesFor = car => ({day:Number(car.dailyRate)||0,week:Number(car.weeklyRate)||Number(car.dailyRate)*6,month:Number(car.monthlyRate)||Math.round(Number(car.dailyRate)*25.5)});
const estimate = (car,days) => {
  const rates=ratesFor(car),months=Math.floor(days/30),remaining=days%30,weeks=Math.floor(remaining/7),daysLeft=remaining%7;
  return months*rates.month+weeks*rates.week+daysLeft*rates.day;
};

export default function VehicleDetails({car,initialLocation,dates,setDates,today,estimateText,onSubmit,onImageError}) {
  const rates=ratesFor(car);
  const returnMinimum=dates.pickup?localDate(new Date(new Date(`${dates.pickup}T00:00:00`).getTime()+86400000)):today;

  return <>
    <img className="dialog-image" src={car.image} onError={onImageError} alt={car.alt || `${car.make} ${car.model}`} />
    <div className="dialog-body">
      <span className="eyebrow">{car.type} · {car.seats || 5} seats</span>
      <h2 id="dialog-title">{car.make} {car.model}</h2>
      <span className={`availability-badge detail-availability ${car.available?"is-available":"is-unavailable"}`}><span className="availability-dot" />{car.available?"Available":"Not available"}</span>
      <section className="vehicle-specifications" aria-labelledby="specification-title">
        <h3 id="specification-title">Vehicle specifications</h3>
        <dl>
          <div><dt>Model</dt><dd>{car.make} {car.model}</dd></div>
          <div><dt>Vehicle type</dt><dd>{car.type}</dd></div>
          <div><dt>Passenger capacity</dt><dd>Up to {car.seats || 5} people</dd></div>
          <div><dt>Fuel</dt><dd>{car.fuel || "Not specified"}</dd></div>
          <div><dt>Transmission</dt><dd>{car.transmission || "Not specified"}</dd></div>
        </dl>
        <p>Exact vehicle trim and equipment are confirmed by our team before booking.</p>
      </section>
      <div className="dialog-price">Rental rates</div>
      <div className="rate-options dialog-rates">
        <div><strong>{formatMoney(rates.day)}</strong><span>per day</span></div>
        <div><strong>{formatMoney(rates.week)}</strong><span>per week</span></div>
        <div><strong>{formatMoney(rates.month)}</strong><span>per month</span></div>
      </div>
      <p>{car.description}</p>
      {estimateText}
      {car.available ? <form className="rental-request-form" id="rental-request-form" onSubmit={onSubmit}>
        <h3 className="form-section-title">Your contact details</h3>
        <div className="renter-fields">
          <label htmlFor="renter-name">Full name<input id="renter-name" name="full-name" autoComplete="name" placeholder="Name for the booking" required /></label>
          <label htmlFor="renter-email">Email address<input id="renter-email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></label>
          <label htmlFor="renter-phone">Phone or WhatsApp<input id="renter-phone" name="phone" type="tel" autoComplete="tel" placeholder="+250..." required /></label>
        </div>
        <h3 className="form-section-title">Your trip details</h3>
        <div className="request-dates">
          <label htmlFor="request-pickup">Pickup date<input id="request-pickup" name="pickup" type="date" min={today} value={dates.pickup} onChange={event=>setDates(current=>({pickup:event.target.value,return:current.return&&current.return>event.target.value?current.return:localDate(new Date(new Date(`${event.target.value}T00:00:00`).getTime()+86400000))}))} required /></label>
          <label htmlFor="request-pickup-time">Pickup time<input id="request-pickup-time" name="pickup-time" type="time" defaultValue="09:00" required /></label>
          <label htmlFor="request-return">Return date<input id="request-return" name="return" type="date" min={returnMinimum} value={dates.return} onChange={event=>setDates(current=>({...current,return:event.target.value}))} required /></label>
          <label htmlFor="request-return-time">Return time<input id="request-return-time" name="return-time" type="time" defaultValue="09:00" required /></label>
        </div>
        <div className="renter-fields trip-fields">
          <label htmlFor="request-pickup-location">Pickup location<select id="request-pickup-location" name="pickup-location" defaultValue={initialLocation}>{LOCATIONS.map(location=><option key={location}>{location}</option>)}</select></label>
          <label htmlFor="request-return-location">Return location<select id="request-return-location" name="return-location" defaultValue={initialLocation}>{LOCATIONS.map(location=><option key={location}>{location}</option>)}</select></label>
          <label htmlFor="request-passengers">Number of passengers<select id="request-passengers" name="passengers">{Array.from({length:Math.max(1,Number(car.seats)||5)},(_,i)=><option key={i} value={i+1}>{i+1} passenger{i===0?"":"s"}</option>)}</select></label>
        </div>
        <label className="notes-field" htmlFor="renter-notes">Special requests or trip details<textarea id="renter-notes" name="notes" rows="3" placeholder="Share any questions, luggage needs, or pickup instructions." /></label>
        <p className="request-note">This prepares an email enquiry. Your rental is confirmed only after our team checks availability and replies. Please do not include payment details here.</p>
        <button className="btn btn-full" type="submit">Send rental request <span>→</span></button>
      </form> : <div className="availability-message">This car is currently marked as unavailable. Please choose another vehicle or contact our team to check again later.</div>}
    </div>
  </>;
}
