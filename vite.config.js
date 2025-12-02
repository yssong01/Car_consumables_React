// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// 여기 repo 이름은 GitHub에 올린 저장소 이름으로!
export default defineConfig({
  plugins: [react()],
  base: "/Car_consumables_React/", // yssong01/Car_consumables_React 라면 이렇게
});
