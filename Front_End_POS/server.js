const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const port = Number(process.env.PORT) || 8080;
const host = process.env.HOST || '0.0.0.0';
const browserDist = path.join(__dirname, 'dist', 'pos-mini-cafe', 'browser');
const indexFile = path.join(browserDist, 'index.html');

if (!fs.existsSync(indexFile)) {
  console.error(`Build output not found at ${indexFile}. Run "npm run build" before "npm start".`);
  process.exit(1);
}

app.get('/health', (_req, res) => {
  res.status(200).send('ok');
});

app.use(
  express.static(browserDist, {
    index: false,
    maxAge: '1y',
    immutable: true,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('index.html')) {
        res.setHeader('Cache-Control', 'no-cache');
      }
    }
  })
);

app.use('/api', (_req, res) => {
  res.status(404).json({
    message: 'API is not served by this frontend deployment. Check the production apiUrl.'
  });
});

app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    next();
    return;
  }

  res.setHeader('Cache-Control', 'no-cache');
  res.sendFile(indexFile);
});

app.use((_req, res) => {
  res.status(404).send('Not found');
});

app.listen(port, host, () => {
  console.log(`POS Mini Cafe frontend listening on ${host}:${port}`);
});
