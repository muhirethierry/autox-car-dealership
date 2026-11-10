import { useEffect, useState } from "react";

const placeholder=label=>`data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 360"><rect width="600" height="360" fill="#e9edf2"/><path d="M60 235h480l-28-61c-10-21-27-35-51-40l-91-19H224l-65 25c-19 7-31 20-38 39l-20 56Z" fill="#132741"/><path d="m190 172 39-41h132l52 41H190Z" fill="#aebdcd"/><circle cx="174" cy="250" r="38" fill="#34465d"/><circle cx="432" cy="250" r="38" fill="#34465d"/><text x="300" y="330" text-anchor="middle" fill="#708095" font-family="Arial,sans-serif" font-size="18">${String(label).replace(/[&<>]/g,"")}</text></svg>`)}`;

export default function AdminVehicleImage({vehicle,className="",loading="lazy"}) {
  const primary=vehicle.image||vehicle.fallbackImage||"";
  const [src,setSrc]=useState(primary),[usedFallback,setUsedFallback]=useState(false);
  useEffect(()=>{setSrc(vehicle.image||vehicle.fallbackImage||"");setUsedFallback(false);},[vehicle.image,vehicle.fallbackImage]);
  return <img className={className} src={src} alt={`${vehicle.make} ${vehicle.model}`} loading={loading} onError={()=>{
    if(!usedFallback&&vehicle.fallbackImage&&src!==vehicle.fallbackImage){setSrc(vehicle.fallbackImage);setUsedFallback(true);return;}
    setSrc(placeholder(`${vehicle.make} ${vehicle.model}`));setUsedFallback(true);
  }} />;
}
