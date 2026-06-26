import { defineConfig } from 'vite';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export default defineConfig({
  publicDir: 'public',
  server: {
    port: 6001,
  },
  build: {
    target: 'es2022'
  },
  plugins: [
    {
      name: 'serve-wasm',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/sql-wasm.wasm') {
            const filePath = join(process.cwd(), 'public', 'sql-wasm.wasm');
            if (existsSync(filePath)) {
              res.setHeader('Content-Type', 'application/wasm');
              res.end(readFileSync(filePath));
              return;
            }
          }
          next();
        });
      }
    }
  ]
});
