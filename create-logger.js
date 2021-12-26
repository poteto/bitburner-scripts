/**
 * @typedef { import('./bitburner.d').NS } NS
 * @typedef {'info' | 'warning' | 'error' | 'success'} LogLevel
 */

/** @param {NS} ns */
export default function createLogger(ns) {
  /** @type {{level: LogLevel | null, msg: string | null}} */
  let lastLog = { level: null, msg: null };
  /**
   * @param {string} msg
   * @param {LogLevel} level
   */
  return function log(msg, level = 'info') {
    if (level === lastLog.level && msg === lastLog.msg) {
      return;
    }
    switch (level) {
      case 'info':
        ns.print(`[INFO] ${msg}`);
        break;
      case 'warning':
        ns.print(`[WARN] ${msg}`);
        break;
      case 'error':
        ns.print(`[ERR ] ${msg}`);
        break;
      case 'success':
        ns.print(`[ OK ] ${msg}`);
        break;
      default:
        throw new Error('Unhandled log level');
    }
    lastLog = { level, msg };
  };
}
