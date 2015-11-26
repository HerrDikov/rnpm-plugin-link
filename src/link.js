const path = require('path');
const log = require('npmlog');

const registerDependencyAndroid = require('./android/registerNativeModule');
const registerDependencyIOS = require('./ios/registerNativeModule');
const copyAssetsAndroid = require('./android/copyAssets');

/**
 * Returns an array of dependencies that should be linked/checked.
 */
const getProjectDependencies = () => {
  const pjson = require(path.join(process.cwd(), './package.json'));
  return Object.keys(pjson.dependencies).filter(name => name !== 'react-native');
};

/**
 * Updates project and linkes all dependencies to it
 *
 * If optional argument [packageName] is provided, it's the only one that's checked
 */
module.exports = function link(config, args) {
  const project = config.getProjectConfig();

  if (!project) {
    log.error('ERRPACKAGEJSON', `No package found. Are you sure it's a React Native project?`);
    return;
  }

  const packageName = args[0];
  const dependencies = packageName ? [packageName] : getProjectDependencies();

  dependencies
    .forEach(name => {
      const dependencyConfig = config.getDependencyConfig(name);

      if (!dependencyConfig) {
        return log.warn('ERRINVALIDPROJ', `Project ${name} is not a react-native library`);
      }

      if (project.android && dependencyConfig.android) {
        log.info(`Linking ${name} android dependency`);
        registerDependencyAndroid(name, dependencyConfig.android, project.android);
      }

      if (project.ios && dependencyConfig.ios) {
        log.info(`Linking ${name} ios dependency`);
        registerDependencyIOS(dependencyConfig.ios, project.ios);
      }

      if (project.android && dependencyConfig.assets.length > 0) {
        log.info(`Copying assets from ${name} to android project`);
        copyAssetsAndroid(dependencyConfig.assets, project.android.assetsPath);
      }
    });
};
