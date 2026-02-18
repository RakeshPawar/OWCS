import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/owcs-viewer.ts'),
      name: 'OWCSViewer',
      fileName: 'owcs-viewer',
      formats: ['es'],
    },
    outDir: 'packages/ui/dist',
    sourcemap: true,
    rollupOptions: {
      external: ['@owcs/api'],
    },
  },
});
