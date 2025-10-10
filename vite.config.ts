import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
  base: '/', // ✅ Always root for Vercel
  server: {
    port: 5173,
    open: true
  }
});
