/**
 * WB Config - Simple configuration
 */
const config = {
  debug: false,
  logLevel: 'info',
  // John (2026-08-15): "if we turn on autoinject which we will most of the
  // time, then we don't need anything but semantic html to show the added
  // features... autoinject should be true for all our demos... favoring
  // semantic html at all times" -- this is the actual selling point of the
  // framework (plain <table>/<article>/<button> gets real behavior with zero
  // extra markup), so it's now the default a page gets unless it explicitly
  // opts OUT via WB.init({ autoInject: false }). init() in wb.js/wb-lazy.js
  // always writes its resolved value here, so an explicit opt-out still
  // works exactly the same way an opt-in used to.
  autoInject: true
};

export function getConfig(key) {
  return config[key];
}

export function setConfig(key, value) {
  config[key] = value;
}

export default { get: getConfig, set: setConfig };
