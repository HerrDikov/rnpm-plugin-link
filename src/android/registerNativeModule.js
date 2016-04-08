const readFile = require('./fs').readFile;
const writeFile = require('./fs').writeFile;
const compose = require('lodash').flowRight;
const getReactVersion = require('../getReactNativeVersion');
const getPrefix = require('./getPrefix');
const pollParams = require('../pollParams');

const applyPatch = (filePath, patch) =>
  compose(writeFile(filePath), patch, readFile(filePath));

function registerModule(name, androidConfig, params, projectConfig) {
  const prefix = getPrefix(getReactVersion(projectConfig.folder));
  const makeSettingsPatch = require(`./patches/makeSettingsPatch`);
  const makeBuildPatch = require(`./patches/makeBuildPatch`);
  const makeMainActivityPatch = require(`./${prefix}/makeMainActivityPatch`);

  const performSettingsGradlePatch = applyPatch(
    projectConfig.settingsGradlePath,
    makeSettingsPatch.apply(null, arguments)
  );

  const performBuildGradlePatch = applyPatch(
    projectConfig.buildGradlePath,
    makeBuildPatch(name)
  );

  const performMainActivityPatch = applyPatch(
    projectConfig.mainActivityPath,
    makeMainActivityPatch(androidConfig, params)
  );

  compose(
    performSettingsGradlePatch,
    performBuildGradlePatch,
    performMainActivityPatch
  )();

  return true;
}

module.exports = function registerNativeAndroidModule(name, androidConfig, params, projectConfig) {
  const isInstalled = compose(
    (content) => ~content.indexOf(`:${name}`),
    readFile(projectConfig.buildGradlePath)
  );

  if (isInstalled(name)) {
    return false;
  }

  return pollParams(params).then(answers => registerModule(name, androidConfig, answers, projectConfig));
};
