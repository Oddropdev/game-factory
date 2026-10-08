import { defineConfig } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.dirname(fileURLToPath(import.meta.url));
export default defineConfig({
  root,
  base: './',
  build: {
    outDir: path.resolve(root, '../../playtest-dist/3d'),
    emptyOutDir: true,
    sourcemap: false,
    target: 'es2022'
  }
});
