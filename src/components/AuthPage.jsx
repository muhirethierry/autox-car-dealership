import { useEffect, useState } from "react";

const validEmail = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const iconPaths = {
  envelope: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></>,
  lock: <><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/><path d="M12 14v3"/></>,
  eye: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z"/><circle cx="12" cy="12" r="2.5"/></>,
  eyeOff: <><path d="m3 3 18 18M10.6 6.2A10.9 10.9 0 0 1 12 6c6.5 0 10 6 10 6a16 16 0 0 1-3.1 3.7M6.2 6.2C3.5 8 2 12 2 12s3.5 6 10 6c.7 0 1.4-.1 2-.2"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></>,
  shield: <><path d="M12 3 20 6v5c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6l8-3Z"/><path d="m9 12 2 2 4-4"/></>,
  pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
  arrow: <><path d="M4 12h15M13 6l6 6-6 6"/></>,
  user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>
};

function AuthIcon({name,className=""}) {
  if (name === "google") return <span className={`auth-icon google-mark ${className}`} aria-hidden="true">G</span>;
  return <svg className={`auth-icon ${className}`} viewBox="0 0 24 24" aria-hidden="true">{iconPaths[name]}</svg>;
}

function Field({id,label,name,type="text",placeholder,autoComplete,icon,minLength,error,showPassword,onToggle,required=true}) {
  const shownType=type==="password"&&showPassword?"text":type;
  return <>
    <label className="field-label" htmlFor={id}>{label}</label>
    <div className="input-wrap" aria-invalid={Boolean(error)}>
      <AuthIcon name={icon} className="field-icon" />
      <input id={id} name={name} type={shownType} autoComplete={autoComplete} placeholder={placeholder} minLength={minLength} aria-describedby={`${id}-error`} aria-invalid={Boolean(error)} required={required} />
      {type==="password"&&<button className="password-toggle" type="button" onClick={onToggle} aria-label={showPassword?"Hide password":"Show password"} aria-pressed={Boolean(showPassword)}><AuthIcon name={showPassword?"eyeOff":"eye"} /></button>}
    </div>
    <span className="field-error" id={`${id}-error`}>{error}</span>
  </>;
}

export default function AuthPage({mode}) {
  const signup=mode==="signup";
  const [visible,setVisible]=useState({}),[errors,setErrors]=useState({}),[status,setStatus]=useState({message:"",state:""});
  useEffect(()=>{
    document.body.className="auth-page";
    document.title=signup?"Create account | AUTOX Car Rental":"Sign in | AUTOX Car Rental";
  },[signup]);
  const toggle=id=>setVisible(current=>({...current,[id]:!current[id]}));
  function submit(event) {
    event.preventDefault();
    const form=event.currentTarget,values=new FormData(form),next={};
    const email=String(values.get("email")||"");
    const password=String(values.get("password")||"");
    if(signup&&String(values.get("name")||"").trim().length<2)next["signup-name"]="Enter your full name.";
    if(!email.trim())next[`${mode}-email`]="Enter your email address.";
    else if(!validEmail(email))next[`${mode}-email`]="Enter a valid email address.";
    if(password.length<8)next[`${mode}-password`]=signup?"Use at least 8 characters for your password.":"Password must be at least 8 characters.";
    if(signup){const confirmation=String(values.get("confirm-password")||"");if(!confirmation)next["signup-confirm-password"]="Confirm your password.";else if(confirmation!==password)next["signup-confirm-password"]="The passwords do not match.";}
    setErrors(next);
    if(Object.keys(next).length){setStatus({message:"Please review the highlighted fields.",state:"error"});document.getElementById(Object.keys(next)[0])?.focus();return;}
    setStatus({message:signup?"Your details look valid, but account creation is not connected yet. No account was created and nothing was saved.":"Your details look valid, but sign-in is not connected yet. Nothing was sent or saved.",state:"info"});
  }
  function action(kind) {
    const messages={google:"Google sign-in is not configured yet. No sign-in was attempted.",forgot:"Password reset is not available until AUTOX authentication is connected."};
    setStatus({message:messages[kind]||"",state:"info"});
  }

  return <main className={`auth-layout ${signup?"signup-layout":""}`}>
    <section className="auth-story" aria-label="AUTOX Car Rental">
      <a className="brand-lockup" href="index.html" aria-label="AUTOX Car Rental home"><img src="assets/autox-logo.svg" width="210" height="54" alt="AUTOX Rentals · Kigali" /></a>
      <div className="story-copy"><span className="story-kicker"><span />{signup?"YOUR NEXT DRIVE STARTS HERE":"THE ROAD IS YOURS"}</span><h1>{signup?<>Make room for<br /><em>the open road.</em></>:<>Arrive in style.<br /><em>Go your own way.</em></>}</h1><p>{signup?"Create your AUTOX account and get ready for the journeys ahead.":"Your next great drive is waiting. Sign in to pick up where your journey left off."}</p></div>
      <div className="story-footer"><AuthIcon name="pin" /> Made for the journeys that start in Kigali</div>
    </section>
    <section className={`auth-card ${signup?"signup-card":""}`} aria-labelledby={`${mode}-title`}>
      <div className="card-topline"><span className="card-kicker">{signup?"JOIN AUTOX":"WELCOME BACK"}</span><span className="secure-mark"><AuthIcon name="shield" /> PRIVATE &amp; SECURE</span></div>
      <h2 id={`${mode}-title`}>{signup?"Create your account":"Sign in to AUTOX"}</h2>
      <p className="card-intro">{signup?"A few details, then you’re ready to plan your next drive.":"Enter your account details to continue."}</p>
      <form id={`${mode}-form`} data-auth-form={mode} noValidate onSubmit={submit} onChange={()=>{if(status.message)setStatus({message:"",state:""});}}>
        <fieldset className="auth-fields">
          {signup&&<Field id="signup-name" label="Full name" name="name" placeholder="Your full name" autoComplete="name" icon="user" minLength={2} error={errors["signup-name"]} />}
          <Field id={`${mode}-email`} label="Email address" name="email" type="email" placeholder="you@example.com" autoComplete="email" icon="envelope" error={errors[`${mode}-email`]} />
          <Field id={`${mode}-password`} label="Password" name="password" type="password" placeholder={signup?"At least 8 characters":"Enter your password"} autoComplete={signup?"new-password":"current-password"} icon="lock" minLength={8} error={errors[`${mode}-password`]} showPassword={visible[`${mode}-password`]} onToggle={()=>toggle(`${mode}-password`)} />
          {signup?<Field id="signup-confirm-password" label="Confirm password" name="confirm-password" type="password" placeholder="Enter your password again" autoComplete="new-password" icon="lock" error={errors["signup-confirm-password"]} showPassword={visible["signup-confirm-password"]} onToggle={()=>toggle("signup-confirm-password")} />:<div className="form-options"><label className="remember-option"><input type="checkbox" name="remember" /><span className="custom-check" aria-hidden="true" /><span>Remember me</span></label><button className="inline-link" type="button" data-auth-action="forgot" onClick={()=>action("forgot")}>Forgot password?</button></div>}
          <button className={`primary-button ${signup?"signup-submit":""}`} type="submit"><span>{signup?"Create account":"Sign in"}</span><AuthIcon name="arrow" /></button>
          {!signup&&<><div className="separator"><span>OR CONTINUE WITH</span></div><button className="google-button" type="button" data-auth-action="google" onClick={()=>action("google")}><AuthIcon name="google" /><span>Continue with Google</span></button></>}
        </fieldset>
        <p className="auth-status" data-state={status.state||undefined} id={`${mode}-status`} role="status" aria-live="polite">{status.message}</p>
      </form>
      <p className="signup-prompt">{signup?"Already have an account?":"New to AUTOX?"} <a href={signup?"login.html":"signup.html"}>{signup?"Sign in":"Create an account"}</a></p>
      <p className="card-footnote"><AuthIcon name="lock" /> {signup?"Account creation is not connected yet. Your details are not stored.":"Your details stay private. Authentication is not connected yet."}</p>
    </section>
  </main>;
}
