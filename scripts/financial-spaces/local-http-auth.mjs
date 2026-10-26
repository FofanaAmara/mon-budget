import http from 'node:http';

const upstreamPrefix = '__Secure-neon-auth';
const localPrefix = 'mes-finances-local-neon-auth';

/** Browser-facing HTTP cookies exist only in the loopback development gateway. */
export function localAuthSetCookie(value) {
  const separator = value.indexOf('=');
  const name = value.slice(0, separator);
  if (separator < 0 || !(name === upstreamPrefix || name.startsWith(upstreamPrefix + '.'))) return value;
  return localPrefix + value.slice(upstreamPrefix.length)
    .replace(/;\s*Secure(?=;|$)/gi, '')
    .replace(/;\s*Domain=[^;]*/gi, '');
}

/** Prefer only this profile's cookies; never silently reuse another HTTPS session. */
export function upstreamAuthCookies(value = '') {
  return value.split(';').map(part => part.trim()).filter(Boolean).flatMap(part => {
    const separator = part.indexOf('=');
    const name = part.slice(0, separator);
    if (name === upstreamPrefix || name.startsWith(upstreamPrefix + '.')) return [];
    if (name === localPrefix || name.startsWith(localPrefix + '.'))
      return [upstreamPrefix + part.slice(localPrefix.length)];
    return [part];
  }).join('; ');
}

/** Not imported by the application: dev.mjs alone owns this loopback server. */
export function startLocalHttpAuthGateway({ onError, onListening, port = 3002, upstreamPort = 3003 }) {
  const sockets = new Set();
  const headersFor = req => ({ ...req.headers, cookie: upstreamAuthCookies(req.headers.cookie) });
  const allowed = req => ['localhost:3002', '127.0.0.1:3002'].includes(req.headers.host);
  const server = http.createServer((req, res) => {
    if (!allowed(req)) { res.writeHead(400); res.end('Invalid local host'); return; }
    const upstream = http.request({ hostname: '127.0.0.1', port: upstreamPort, path: req.url,
      method: req.method, headers: headersFor(req) }, response => {
      const headers = { ...response.headers };
      if (headers['set-cookie']) headers['set-cookie'] = headers['set-cookie'].map(localAuthSetCookie);
      res.writeHead(response.statusCode ?? 502, headers);
      response.on('error', () => res.destroy());
      response.pipe(res);
    });
    upstream.on('error', () => {
      if (!res.headersSent) res.writeHead(502, { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' });
      res.end('Local development server unavailable');
    });
    req.on('aborted', () => upstream.destroy());
    req.pipe(upstream);
  });
  // Forward Next's development WebSocket without changing its origin or payload.
  server.on('upgrade', (req, socket, head) => {
    if (!allowed(req)) { socket.destroy(); return; }
    const upstream = http.request({ hostname: '127.0.0.1', port: upstreamPort, path: req.url,
      headers: headersFor(req) });
    upstream.on('upgrade', (response, upstreamSocket, upstreamHead) => {
      socket.write(`HTTP/1.1 ${response.statusCode} ${response.statusMessage}\r\n`);
      for (let i = 0; i < response.rawHeaders.length; i += 2)
        socket.write(`${response.rawHeaders[i]}: ${response.rawHeaders[i + 1]}\r\n`);
      socket.write('\r\n');
      if (upstreamHead.length) socket.write(upstreamHead);
      if (head.length) upstreamSocket.write(head);
      socket.on('error', () => upstreamSocket.destroy());
      upstreamSocket.on('error', () => socket.destroy());
      socket.on('close', () => upstreamSocket.destroy());
      upstreamSocket.on('close', () => socket.destroy());
      socket.pipe(upstreamSocket).pipe(socket);
    });
    upstream.on('response', response => { response.resume(); socket.destroy(); });
    upstream.on('error', () => socket.destroy());
    upstream.end();
  });
  server.on('connection', socket => { sockets.add(socket); socket.on('close', () => sockets.delete(socket)); });
  server.on('error', onError);
  server.once('listening', () => onListening?.(server.address().port));
  server.listen(port, '127.0.0.1');
  return { close() { server.close(); for (const socket of sockets) socket.destroy(); } };
}
