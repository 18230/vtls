const http = require('http');
const net = require('net');

/**
 * 读取并校验端口配置，避免平台环境变量异常时启动一个不可访问的实例。
 */
function readPort(name, fallback) {
  const value = process.env[name] || fallback;
  const port = Number(value);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`${name} must be a valid TCP port`);
  }

  return port;
}

/**
 * 保留原始 Header 顺序转发 WebSocket 握手，避免代理层改变 Xray 需要的握手内容。
 */
function serializeUpgradeRequest(req) {
  const lines = [`${req.method} ${req.url} HTTP/${req.httpVersion}`];

  for (let index = 0; index < req.rawHeaders.length; index += 2) {
    lines.push(`${req.rawHeaders[index]}: ${req.rawHeaders[index + 1]}`);
  }

  return `${lines.join('\r\n')}\r\n\r\n`;
}

const publicPort = readPort('PORT', '8080');
const xrayPort = readPort('XRAY_PORT', '10000');
const wsPath = process.env.WS_PATH || '/vless';

const server = http.createServer((req, res) => {
  if (req.url === '/' || req.url === '/health') {
    res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('ok\n');
    return;
  }

  res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
  res.end('not found\n');
});

server.on('upgrade', (req, socket, head) => {
  const requestUrl = new URL(req.url, 'http://127.0.0.1');

  if (requestUrl.pathname !== wsPath) {
    socket.destroy();
    return;
  }

  const upstream = net.connect(xrayPort, '127.0.0.1');

  upstream.once('connect', () => {
    upstream.write(serializeUpgradeRequest(req));
    if (head.length > 0) {
      upstream.write(head);
    }
    socket.pipe(upstream).pipe(socket);
  });

  upstream.once('error', () => {
    socket.destroy();
  });

  socket.once('error', () => {
    upstream.destroy();
  });
});

server.listen(publicPort, '0.0.0.0', () => {
  console.log(`listening on ${publicPort}, proxying ${wsPath} to ${xrayPort}`);
});
