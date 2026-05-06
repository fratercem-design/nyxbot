function timestamp() {
  return new Date().toISOString();
}

function log(message) {
  console.log(`[${timestamp()}] ${message}`);
}

function error(message) {
  console.error(`[${timestamp()}] ERROR: ${message}`);
}

function info(message) {
  log(`INFO: ${message}`);
}

module.exports = { log, error, info };
