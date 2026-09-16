import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
                    'vendor-charts':   ['recharts'],
                    'vendor-maps':     ['leaflet', 'react-leaflet', 'react-leaflet-cluster'],
                    'vendor-react':    ['react', 'react-dom', 'react-router-dom'],
                },
            },
        },
    },
})
