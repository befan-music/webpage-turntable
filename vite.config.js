import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'path';

/**
 * Serves the Vercel functions in /api during `vite dev`, so the last.fm
 * widget works locally with the key from .env.local (never bundled).
 */
function devApi(env) {
  return {
    name: 'dev-api',
    apply: 'serve',
    configureServer(server) {
      Object.assign(process.env, env);
      server.middlewares.use('/api/now-playing', async (req, res) => {
        const { default: handler } = await server.ssrLoadModule('/api/now-playing.js');
        handler(req, res);
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // '' prefix: load non-VITE_ vars too — they stay server-side in devApi
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [devApi(env)],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    build: {
      outDir: 'dist',
    },
  };
});
