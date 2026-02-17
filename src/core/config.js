/**
 * WB Config - Simple configuration
 */
const config = {
  debug: false,
  logLevel: 'info',
  autoInject: true // Enable implicit behavior injection based on element type
};

export function getConfig(key) {
  return config[key];
}

export function setConfig(key, value) {
  config[key] = value;
}

export default { get: getConfig, set: setConfig };
