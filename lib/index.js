import fs from 'fs';

let localConfig = {};

const localSettingsFile = `${process.cwd()}/.localsettings`;
const access = fs.accessSync(localSettingsFile);

if (access === fs.F_OK) {
  const content = fs.readFileSync(localSettingsFile, { encoding: 'utf8' });
  localConfig = JSON.parse(content);
}

function resolveProperty(object, names) {
  if (!object) {
    throw new Error('a valid object is required');
  }

  if (Array.isArray(names) === false) {
    throw new Error('names should be an array');
  }

  let name = names.shift();
  let value = object[name];

  if (value && names.length > 0) {
    return resolveProperty(value, names);
  }

  return value;
}

function resolvePrivateSetting(name) {
  let properties = name.split('_');
  return resolveProperty(localConfig, properties);
}

export default function(name, defaultValue){
  let value = process.env[name] || resolvePrivateSetting(name) || defaultValue;
  if (!value) {
    throw new Error(`secure setting ${name} is not specified.`);
  }
  return value;
}
