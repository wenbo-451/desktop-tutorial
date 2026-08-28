import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const port = Number(process.env.PORT || 5173);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };

const server = http.createServer(async (request, response) => {
  const urlPath = request.url === '/' ? '/index.html' : request.url;
  const safePath = normalize(urlPath).replace(/^\.\.(\/|\\|$)/, '');
  const filePath = join(process.cwd(), safePath);
  try {
    const body = await readFile(filePath);
    response.writeHead(200, { 'Content-Type': types[extname(filePath)] || 'application/octet-stream' });
    response.end(body);
  } catch {
    response.writeHead(404);
    response.end('Not found');
  }
});

server.listen(port, '0.0.0.0', () => console.log(`Anki AI Card Maker running at http://localhost:${port}`));
