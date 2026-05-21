import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // Outputs built files into Spring Boot's static resource directory.
    // 'mvn clean package' runs this automatically via frontend-maven-plugin.
    outDir: '../src/main/resources/static',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    proxy: {
      // During development, proxy /api calls to the Spring Boot server
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
