// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
})


export default defineConfig({
  plugins: [react()],
  base: '/Car_consumables_React/', // ⭐ 본인 리포지토리 이름으로 수정
});
