import { env } from './config/env.js';
import { startHttpServer } from './server/http.js';

export { startHttpServer };

if (import.meta.main) {
  startHttpServer(env.port, env.host);
}
