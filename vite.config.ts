import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'production-csp-only',
      apply: 'serve',
      transformIndexHtml(html) {
        return html.replace(
          /<meta\s+http-equiv="Content-Security-Policy"[^>]*>/,
          '',
        );
      },
    },
  ],
  base: './',
  test: { include: ['tests/**/*.test.ts'] },
});
