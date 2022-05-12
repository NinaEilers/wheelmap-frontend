//const TTagPlugin = require('babel-plugin-ttag');
const withTranspileModules = require('next-transpile-modules');
//const webpack = require('webpack');
//const env = require('./src/lib/env');
const withSourceMaps = require('@zeit/next-source-maps');

let configuration = withSourceMaps(
  withTranspileModules({
    // Next.js doesn't transpile node_modules content by default.
    // We have to do this manually to make IE 11 users happy.
    transpileModules: [
      '@sozialhelden/twelve-factor-dotenv',
      '@elastic/apm-rum-core',
      '@elastic/apm-rum',
      'dotenv',
    ],
    webpack: config => {
      // Fixes npm packages that depend on `fs` module
      config.node = {
        fs: 'empty',
        dgram: 'empty',
        net: 'empty',
        tls: 'empty',
        child_process: 'empty',
        async_hooks: 'mock',
      };

      // if (process.env.NODE_ENV === 'production') {
      //   config.plugins.unshift(new ElasticAPMSourceMapPlugin({
      //     serviceName: 'wheelmap-react-frontend',
      //     serviceVersion: env.npm_package_version,
      //     serverURL: env.REACT_APP_ELASTIC_APM_SERVER_URL,
      //     publicPath: `${env.PUBLIC_URL}/_next/static/chunks`,
      //     secret: env.ELASTIC_APM_SECRET_TOKEN,
      //     logLevel: 'debug'
      //   }));
      // }

      return config;
    },
  })
);

// these options would be ignored above, so they needs to be extended manually
configuration = {
  ...configuration,
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
    ignoreDevErrors: true,
  },
  // Disabling file-system routing to always use custom server.
  // useFileSystemPublicRoutes: false,
};

module.exports = configuration;
