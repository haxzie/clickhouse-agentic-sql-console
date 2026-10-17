import { existsSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Where `pnpm build` leaves the console, resolved from this module. */
export const WEB_DIST = resolve(dirname(fileURLToPath(import.meta.url)), '../../../web/dist');

/**
 * The built console's directory as `serveStatic` wants it: a path relative to
 * the working directory, which is why it is computed at call time rather than
 * baked in — the API is started from the repo root and from `apps/api`.
 *
 * Returns null when there is no build to serve.
 */
export function webAppRoot(): string | null {
  if (!existsSync(resolve(WEB_DIST, 'index.html'))) {
    return null;
  }

  return relative(process.cwd(), WEB_DIST);
}
