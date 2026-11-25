import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {execFile} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {defineConfig} from 'vite';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'serve-vercel-zip-download',
        apply: 'serve',
        configureServer(server) {
          server.middlewares.use('/pulseway-vercel.zip', (_req, res) => {
            const tmpZip = path.join(os.tmpdir(), `pulseway-vercel-${Date.now()}.zip`);
            const pyScript = `
import os, sys, zipfile
root, out = sys.argv[1], sys.argv[2]
exclude_dirs = {'node_modules', 'dist', '.git', '.aistudio', '.vercel'}
exclude_files = {'.DS_Store', 'bun.lock'}
with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as zf:
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in exclude_dirs]
        for fname in filenames:
            if fname in exclude_files:
                continue
            if fname.startswith('.env') and fname != '.env.example':
                continue
            full = os.path.join(dirpath, fname)
            rel = os.path.relpath(full, root)
            zf.write(full, rel)
`;
            execFile('python3', ['-c', pyScript, rootDir, tmpZip], (err) => {
              if (err || !fs.existsSync(tmpZip)) {
                res.statusCode = 500;
                res.end('Failed to create zip archive');
                return;
              }
              const stat = fs.statSync(tmpZip);
              res.setHeader('Content-Type', 'application/zip');
              res.setHeader('Content-Disposition', 'attachment; filename="pulseway-vercel.zip"');
              res.setHeader('Content-Length', String(stat.size));
              res.setHeader('Cache-Control', 'no-store');
              const stream = fs.createReadStream(tmpZip);
              stream.on('close', () => {
                fs.rmSync(tmpZip, {force: true});
              });
              stream.pipe(res);
            });
          });
        },
      },
      // Copies src/assets into dist/ so root-relative URLs like
      // "/src/assets/images/..." (e.g. generate_image output) still resolve
      // in production builds. Do not remove.
      {
        name: 'copy-unbundled-src-assets',
        apply: 'build',
        closeBundle(error?: Error): void {
          if (error) {
            return;
          }
          const distDir = path.resolve(rootDir, 'dist');
          const srcAssets = path.resolve(rootDir, 'src/assets');
          const distAssets = path.resolve(distDir, 'src/assets');
          if (fs.existsSync(distDir) && fs.existsSync(srcAssets)) {
            fs.cpSync(srcAssets, distAssets, {recursive: true, force: true});
          }
        },
      },
    ],
    resolve: {
      alias: {
        '@': rootDir,
      },
    },
    define: {
      'process.env.GOOGLE_MAPS_API_KEY': JSON.stringify(
        process.env.VITE_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || ''
      ),
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
