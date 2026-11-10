import { useEffect, useRef } from "react";

export default function AdminDialog({className,onClose,children}) {
  const dialog=useRef(null),close=useRef(onClose);
  close.current=onClose;
  useEffect(()=>{
    const node=dialog.current;
    if(!node)return;
    if(!node.open)node.showModal();
    const cancel=event=>{event.preventDefault();close.current?.();};
    node.addEventListener("cancel",cancel);
    return()=>{node.removeEventListener("cancel",cancel);if(node.open)node.close();};
  },[]);
  return <dialog ref={dialog} className={className} onClick={event=>{if(event.target===event.currentTarget)close.current?.();}}>{children}</dialog>;
}
