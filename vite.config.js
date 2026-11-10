import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

const root = process.cwd();

export default defineConfig({
  plugins:[react()],
  publicDir:resolve(root,"public"),
  server:{proxy:{"/api":{target:"http://127.0.0.1:4000",changeOrigin:false}}},
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
