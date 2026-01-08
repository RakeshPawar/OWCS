const ModuleFederationPlugin = require('webpack/lib/container/ModuleFederationPlugin');

module.exports = {
  output: {
    uniqueName: 'userComponents',
    publicPath: 'auto'
  },
  optimization: {
    runtimeChunk: false
  },
  plugins: [
    new ModuleFederationPlugin({
      name: 'userComponents',
      library: { type: 'module' },
      filename: 'remoteEntry.js',
      exposes: {
        './UserCard': './examples/angular/user-card.component.ts',
        './AnotherComponent': './examples/angular/another.component.ts'
      },
      shared: {
        '@angular/core': { singleton: true, strictVersion: true },
        '@angular/common': { singleton: true, strictVersion: true }
      }
    })
  ]
};
