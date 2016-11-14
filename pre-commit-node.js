'use strict';

/*
SETUP
-----

global git hooks setup
  - git config --global init.templatedir '~/.git-templates'
  - mkdir -p ~/.git-templates/hooks
  - create ~/.git-templates/hooks/pre-commit file and populate it with pre-commit-node bash file
    - make file executable
        chmod a+x ~/.git-templates/hooks/pre-commit-node
    - reinitialise each relevant git hub repo that should use the pre-commit hook
        git init
        the git-init.sh bash script can be executed in a parent directory to reinitialise all child folders that have a .git folder
    - ENVIRONMENT VARIABLES
      - If DISABLE_GIT_PRECOMMIT_RUN_TESTS is defined then tests will not be run
      - If DISABLE_GIT_PRECOMMIT_RUN_LINT is defined then lint will not be run
*/

// need the git add  on meta and package, test env variables

const fs = require('fs'),
  exec = require('child_process').exec;

const metaDataPath = './deploy/metadata.json',
  packageJsonPath = './package.json';

var version;
var pckage;

logMessage('starting');

if (!fs.existsSync(packageJsonPath)) {
  logMessage('completed');
  return;
}

pckage = loadPackageJson();

if (!pckage) {
  logMessage('completed');
  return;
}

runTests()
  .then(runLint)
  .then(updateMetaData)
  .then(updatePackageJson)
  .then(function() {
    logMessage('completed');
    process.exit(0);
  })
  .catch(function(err) {
    logMessage('Something went wrong: ' + err);
    process.exit(1);
  });

function runTests() {
  return new Promise(function(resolve, reject) {
      if (process.env.DISABLE_GIT_PRECOMMIT_RUN_TESTS) {
        return resolve();
      }

      if (pckage.scripts !== undefined && pckage.scripts.test) {

        logMessage('running tests');

        exec(pckage.scripts.test, function(error, stdout, stderr) {
          if (error) {
            logMessage('an error occurred while running tests: ' + error);
            return reject();
          }

          resolve();
        });
      }
  });
}

function runLint() {
  return new Promise(function(resolve, reject) {
    if (process.env.DISABLE_GIT_PRECOMMIT_RUN_LINT) {
      return resolve();
    }

    if (pckage.scripts !== undefined && pckage.scripts.lint) {
      logMessage('running lint');

      exec(pckage.scripts.lint, function(error, stdout, stderr) {
        if (error) {
          logMessage('an error occurred while running lint: ' + error);
          return reject();
        }

        resolve();
      });
    }
  });
}

function updateMetaData() {
  return new Promise(function(resolve, reject) {
    if (fs.existsSync(metaDataPath)) {

      try {
        var metaData = require(metaDataPath);
        metaData.version = getNewVersion(metaData.version);
        fs.writeFileSync(metaDataPath, JSON.stringify(metaData, null, 2));
        logMessage('updated meta data version number to: ' + metaData.version);
        version = metaData.version;

        exec('git add ' + metaDataPath, function(error, stdout, stderr) {
          if (error) {
            logMessage('an error occurred while trying to git add ' + metaDataPath + ': ' + error);
            return reject();
          }

          resolve();
        });
      }
      catch (err) {
        logMessage('Something went wrong while updating metadata version');
        reject();
      }
    }
    else {
      resolve();
    }
  });
}

function updatePackageJson() {
  return new Promise(function(resolve, reject) {

      try {
        pckage.version = version || getNewVersion(pckage.version);
        fs.writeFileSync(packageJsonPath, JSON.stringify(pckage, null, 2));
        logMessage('updated package.json version number to: ' + pckage.version);

        exec('git add ' + packageJsonPath, function(error, stdout, stderr) {
          if (error) {
            logMessage('an error occurred while trying to git add ' + packageJsonPath + ': ' + error);
            return reject();
          }

          resolve();
        });
      }
      catch (err) {
        logMessage('Something went wrong while updating package.json version');
        reject();
      }
  });
}

function getNewVersion(version) {
  var versionParts = version.split('.');
  versionParts[versionParts.length - 1] = (parseInt(versionParts[versionParts.length - 1]) + 1).toString();
  return versionParts.join('.');
}

function loadPackageJson() {
  try {
    return require(packageJsonPath);
  }
  catch (err) {
    return undefined;
  }

}

function logMessage(message) {
  console.log('** pre-commit: ' + message + ' **');
}