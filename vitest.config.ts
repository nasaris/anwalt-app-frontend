import { defineConfig } from 'vitest/config';

/** Nur Test-Abschnitt — keine Vite-Plugins, um Vite-/Vitest-Duplikat-Typkonflikte beim tsc zu vermeiden */
export default defineConfig({
  test: {
    environment: 'happy-dom',
    include: ['src/**/*.test.ts'],
  },
});
