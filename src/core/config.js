/**
 * WB Config - Simple configuration
 */
const config = {
  debug: false,
  logLevel: 'info',
  // Off by default — semantic HTML stays semantic until a page opts in via
  // WB.init({ autoInject: true }). init() in wb.js/wb-lazy.js now always
  // writes its resolved value here (previously only ever wrote `true`,
  // never `false`, so this module default silently won regardless of what
  // callers passed or omitted).
  autoInject: false
};

export function getConfig(key) {
  return config[key];
}

export function setConfig(key, value) {
  config[key] = value;
}

export default { get: getConfig, set: setConfig };
