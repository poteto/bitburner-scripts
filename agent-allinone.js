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

/** @param {NS} ns **/
export async function main(ns) {
  ns.disableLog('disableLog');
  ns.disableLog('getServerSecurityLevel');
  ns.disableLog('getServerMinSecurityLevel');
  ns.disableLog('getServerMoneyAvailable');
  ns.disableLog('getServerMaxMoney');

  const log = createLogger(ns);
  /** @param {number} n */
  const formatMoney = (n) => ns.nFormat(n, '($0.00a)');
  /** @param {number} n */
  const formatSecurity = (n) => ns.nFormat(n, '0.00');

  const [node] = ns.args;
  const nodeStats = {
    get currentMoney() {
      return ns.getServerMoneyAvailable(node.toString());
    },
    get maxMoney() {
      return ns.getServerMaxMoney(node.toString());
    },
    get currentSecurity() {
      return ns.getServerSecurityLevel(node.toString());
    },
    get minSecurity() {
      return ns.getServerMinSecurityLevel(node.toString());
    },
  };

  while (true) {
    while (nodeStats.currentMoney < nodeStats.maxMoney) {
      while (nodeStats.currentSecurity > nodeStats.minSecurity) {
        await ns.weaken(node.toString());
        log(
          `Security: ${formatSecurity(
            nodeStats.currentSecurity
          )} (Min: ${formatSecurity(nodeStats.minSecurity)})`
        );
      }
      await ns.grow(node.toString());
      log(
        `Money   : ${formatMoney(nodeStats.currentMoney)} (Max: ${formatMoney(
          nodeStats.maxMoney
        )})`
      );
      while (nodeStats.currentSecurity > nodeStats.minSecurity) {
        await ns.weaken(node.toString());
        log(
          `Security: ${formatSecurity(
            nodeStats.currentSecurity
          )} (Min: ${formatSecurity(nodeStats.minSecurity)})`
        );
      }
    }
    await ns.hack(node.toString());
  }
}
