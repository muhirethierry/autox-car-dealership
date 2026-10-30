import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

const root = process.cwd();

export default defineConfig({
  plugins:[react()],
  publicDir:resolve(root,"public"),
  build:{
    rollupOptions:{
      input:{
        home:resolve(root,"index.html"),
        login:resolve(root,"login.html"),
        signup:resolve(root,"signup.html"),
        admin:resolve(root,"admin.html")
      }
    }
  }
});
