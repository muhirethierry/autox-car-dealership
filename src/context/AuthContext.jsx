import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { apiRequest } from "../services/apiClient.js";

const AuthContext = createContext({authenticated:false,loading:true,mode:"api"});

export function AuthProvider({children}) {
  const [user,setUser]=useState(null),[loading,setLoading]=useState(true);
  useEffect(()=>{let active=true;apiRequest("/auth/me").then(result=>{if(active)setUser(result.user);}).catch(()=>{if(active)setUser(null);}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[]);
  const signIn=useCallback(async credentials=>{const result=await apiRequest("/auth/login",{method:"POST",body:credentials});setUser(result.user);return result.user;},[]);
  const signUp=useCallback(async profile=>{const result=await apiRequest("/auth/signup",{method:"POST",body:profile});setUser(result.user);return result.user;},[]);
  const signOut=useCallback(async()=>{await apiRequest("/auth/logout",{method:"POST"});setUser(null);},[]);
  return <AuthContext.Provider value={{user,loading,authenticated:Boolean(user),mode:"api",signIn,signUp,signOut}}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
