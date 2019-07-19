const dotenvConfig = require('dotenv').config();
const pick = require('lodash/pick');
if (dotenvConfig.error) {
  throw dotenvConfig.error;
}
console.log('Parsed .env config:', dotenvConfig.parsed);
console.log('Node version:', process.version);

const apm = require('../lib/apm/ServerSide');
const nextjs = require('next');
const path = require('path');
const express = require('express');
const proxy = require('http-proxy-middleware');
const cache = require('express-cache-headers');
const compression = require('compression');
const querystring = require('querystring');

const router = require('../app/router');
const registerHealthChecks = require('./healthChecks');

const port = parseInt(process.env.PORT, 10) || 3000;
const dev = process.env.NODE_ENV !== 'production';
const app = nextjs({ dir: path.join(__dirname, '..'), dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();
  server.use(cache(3600));
  server.use(compression());

  // TODO: Deploy new native apps that bring their own localizations and remove this redirect
  server.use(
    ['/beta/i18n/*'],
    proxy({
      target: 'http://classic.wheelmap.org',
      changeOrigin: true,
    })
  );

  server.get(/\/beta/, (req, res) => {
    res.redirect(`${req.originalUrl.replace(/\/beta\/?/, '/')}`);
  });

  // Old urls from the classic rails app
  // First capturing group represents optional locale
  server.get(
    [
      /(\/[a-zA-Z_-]+)?\/map\/.+/,
      /(\/[a-zA-Z_-]+)?\/community_support\/new.*/,
      /(\/[a-zA-Z_-]+)?\/api\/docs.*/,
    ],
    (req, res) => {
      res.redirect(`http://classic.wheelmap.org${req.originalUrl}`);
    }
  );

  server.get([/(\/[a-zA-Z_-]+)?\/embed.*/], (req, res) => {
    const extendedQueryString = querystring.stringify({
      ...req.query,
      embedded: true,
    });
    res.redirect(`/?${extendedQueryString}`);
  });

  server.get('/:lang?/map', (req, res) => {
    const lang = req.param('lang');

    res.redirect(`/${lang ? `?locale=${lang}` : ''}`);
  });

  // Defines a filtered set of environment variables to the client.
  server.get('/clientEnv.js', (req, res) => {
    const envAndDotEnv = { ...dotenvConfig.parsed, ...process.env };
    const filteredEnvObject = JSON.stringify(
      pick(
        envAndDotEnv,
        Object.keys(envAndDotEnv).filter(
          k =>
            k.match(/^REACT_APP_/) || k === 'npm_package_version' || k === 'npm_config_node_version'
        )
      )
    );
    res.setHeader('Cache-Control', 'max-age=300');
    res.send(`window.env = ${filteredEnvObject};`);
  });

  server.get('*', (req, res, next) => {
    const match = router.match(req.path);

    if (!match) {
      return next();
    }

    app.render(req, res, '/main', { ...match.params, ...req.query, routeName: match.route.name });
  });

  // changeOrigin: overwrite host with target host (needed to proxy to cloudflare)
  server.use(
    ['/api/*', '/nodes/*'],
    proxy({
      target: process.env.REACT_APP_LEGACY_API_BASE_URL,
      changeOrigin: true,
    })
  );

  registerHealthChecks(server);

  // Fallback for routes not found.
  server.get('*', (req, res) => {
    handle(req, res);
  });

  // Start server.
  server.listen(port, error => {
    if (error) throw error;

    console.log(`> Ready on http://localhost:${port}`);
  });
});
