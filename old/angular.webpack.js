/**
 * Custom angular webpack configuration
 */
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
module.exports = (config, options, plugins) => {
  config.target = 'electron-renderer';

  if (options.fileReplacements) {
    for (let fileReplacement of options.fileReplacements) {
      if (fileReplacement.replace !== 'src/environments/environment.ts') {
        continue;
      }

      let fileReplacementParts = fileReplacement['with'].split('.');
      if (
        fileReplacementParts.length > 1 &&
        ['web'].indexOf(fileReplacementParts[1]) >= 0
      ) {
        config.target = 'web';
      }
      break;
    }
  }

  plugins = [new NodePolyfillPlugin()];

  return config;
};
