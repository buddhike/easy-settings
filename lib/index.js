const R = require('ramda');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

let readFile = promisify(fs.readFile);

async function load(filename, options = {}) {
  let base = JSON.parse(await readFile(filename, 'utf8'));
  let env = {};
  if (options.envName) {
    let baseFilename = path.basename(filename);
    env = JSON.parse(await readFile(
      path.join(path.dirname(filename), `${options.envName.toLowerCase()}-${baseFilename}`), 'utf8'));
  }

  let secrets = options.secrets || {};
  if (options.secretsFile) {
    secrets = JSON.parse(await readFile(options.secretsFile));
  }

  module.exports.settings = expandSecrets(R.mergeDeepRight(base, env), secrets);
}

function expandSecrets(settingsObj, secrets) {
  R.forEach(k => {
    let value = R.prop(k, settingsObj);
    if (R.is(String, value)) {
      let p = /({\s*?((\w|[0-9]|-|_)*?)\s*?})/gi;
      let tokens = [];
      let matches = p.exec(value);
      while (matches) {
        tokens.push({ token: matches[1], key: matches[2] });
        matches = p.exec(value);
      }

      for (let m of tokens) {
        let secret = secrets[m.key];
        if (!secret) {
          throw new Error(`secret ${m.token} is not found`);
        }
        value = value.replace(m.token, secret);
      }
      settingsObj[k] = value;
    } else if (R.is(Object, value)) {
      settingsObj[k] = expandSecrets(value, secrets);
    }
  }, R.keys(settingsObj));
  return settingsObj;
}

module.exports = { load };
