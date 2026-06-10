import { startHttpServer } from './server/http.js';

export { startHttpServer };

if (import.meta.main) {
  startHttpServer();
}
