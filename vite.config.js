import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        app: './index.htm',
      },
    },
  },
  server: {
    open: '/index.htm',
  },
})
