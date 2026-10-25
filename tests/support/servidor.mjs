// Sobe o servidor local em porta livre para os testes de navegador e de headers.
import { createSiteServer } from '../../scripts/serve.mjs';

export async function startSite() {
  const server = createSiteServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  return {
    origin: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}
