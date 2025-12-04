import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // './' yapmak, projenin hangi klasörde olursa olsun (domain.com/stajyer-asistanı/ gibi)
  // asset'leri (css, js) doğru bulmasını sağlar.
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
})