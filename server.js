const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8000;
const HOST = process.env.HOST || 'localhost';
const PUBLIC_DIR = path.join(__dirname, 'public');

const mime = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.ico': 'image/x-icon'
};

function send404(res) {
  res.statusCode = 404;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.end('404 Not Found');
}

const server = http.createServer((req, res) => {
  try {
    const safeSuffix = path.normalize(decodeURIComponent(req.url)).replace(/^\.+/, '');
    let filePath = path.join(PUBLIC_DIR, safeSuffix);

    if (filePath.endsWith(path.sep)) filePath = path.join(filePath, 'index.html');

    fs.stat(filePath, (err, stats) => {
      if (err) {
        const dirIndex = path.join(filePath, 'index.html');
        fs.stat(dirIndex, (dirErr, dirStats) => {
          if (dirErr) {
            send404(res);
            return;
          }
          serveFile(dirIndex, res);
        });
        return;
      }

      if (stats.isDirectory()) {
        const index = path.join(filePath, 'index.html');
        fs.stat(index, (iErr, iStats) => {
          if (iErr) return send404(res);
          serveFile(index, res);
        });
        return;
      }

      serveFile(filePath, res);
    });
  } catch (e) {
    send404(res);
  }
});

function serveFile(filePath, res) {
  const ext = path.extname(filePath).toLowerCase();
  const type = mime[ext] || 'application/octet-stream';
  res.statusCode = 200;
  res.setHeader('Content-Type', type + (type.startsWith('text/') ? '; charset=utf-8' : ''));
  const stream = fs.createReadStream(filePath);
  stream.on('error', () => send404(res));
  stream.pipe(res);
}

server.listen(PORT, HOST, () => {
  console.log(`Serving ./public at http://${HOST}:${PORT}/`);
});
