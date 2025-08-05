const nextConfig = {
  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };

      config.plugins.push(
        new webpack.ProvidePlugin({
          process: 'process/browser',
        })
      );

      config.externals = [...(config.externals || []), {
        '@injectivelabs/sdk-ts': 'commonjs @injectivelabs/sdk-ts',
        '@injectivelabs/token-metadata': 'commonjs @injectivelabs/token-metadata',
      }];
    }

    config.resolve.alias = {
      ...config.resolve.alias,
      '@injectivelabs/token-metadata': false,
      '@injectivelabs/sdk-ts': false,
    };

    config.experiments = {
      ...config.experiments,
      topLevelAwait: true,
    };

    return config;
  },

  transpilePackages: [
    '@certusone/wormhole-sdk',
    '@coinbase/onchainkit',
  ],
};

module.exports = nextConfig;
