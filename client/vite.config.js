import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current directory
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    define: {
      // This makes environment variables available to the app
      'process.env': env
    },
    server: {
      port: 3000,
    },
    // Explicitly define which env vars to expose to the client
    envPrefix: ['VITE_', 'REACT_APP_'], // Support both prefixes during migration
  }
})