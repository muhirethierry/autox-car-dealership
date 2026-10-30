import { createContext, useContext } from "react";

const AuthContext = createContext({authenticated:false,mode:"frontend-only"});

export function AuthProvider({children}) {
  // UI forms are not authentication. A trusted backend session is required before enabling admin access.
  return <AuthContext.Provider value={{authenticated:false,mode:"frontend-only"}}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
