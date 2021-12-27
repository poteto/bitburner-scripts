/**
 * Recursively traverses reachable servers beginning from the current host, opening ports as
 * needed and nuking if possible. If the server was successfully nuked, we copy over the
 * AGENT_SCRIPT which makes use of the nuked server to hack the most efficient server.
 *
 * @typedef { import('./bitburner.d').NS } NS
 */

import createLogger from './create-logger.js';

const ROOT_NODE = 'home';
const FLEET_PREFIX = 'fleet-node';
export const AGENT_SCRIPT = 'agent-allinone.js';

/** @param {NS} ns **/
export async function main(ns) {
  ns.tail();
  ns.disableLog('disableLog');
  ns.disableLog('getServerNumPortsRequired');
  ns.disableLog('scan');
  ns.disableLog('getServerUsedRam');
  ns.disableLog('getServerMaxRam');
  ns.disableLog('killall');
  ns.disableLog('scp');
  ns.disableLog('exec');
  ns.disableLog('rm');
  ns.disableLog('getServerSecurityLevel');
  ns.disableLog('kill');
  ns.disableLog('nuke');
  ns.disableLog('brutessh');
  ns.disableLog('ftpcrack');
  ns.disableLog('relaysmtp');
  ns.disableLog('httpworm');
  ns.disableLog('sqlinject');

  const log = createLogger(ns);
  const currentHost = ns.getHostname();

  /**
   * @param {string} hostname
   * @returns {boolean}
   */
  const isHome = (hostname) => hostname === ROOT_NODE;
  /**
   * @param {string} hostname
   * @returns {boolean}
   */
  const isFleet = (hostname) => hostname.startsWith(FLEET_PREFIX);
  /**
   * @param {string} hostname
   * @returns {boolean}
   */
  const isOwned = (hostname) => isHome(hostname) || isFleet(hostname);

  /** @param {string} node */
  const tryNuke = (node) => {
    if (isOwned(node)) {
      return false;
    }
    const user = ns.getPlayer();
    const server = ns.getServer(node);

    if (user.hacking < server.requiredHackingSkill) {
      log(
        `Expected hacking level ${server.requiredHackingSkill} for ${node}, got: ${user.hacking}`,
        'warning'
      );
      return false;
    }

    if (server.sshPortOpen === false && ns.fileExists('BruteSSH.exe')) {
      ns.brutessh(node);
    }

    if (server.ftpPortOpen === false && ns.fileExists('FTPCrack.exe')) {
      ns.ftpcrack(node);
    }

    if (server.smtpPortOpen === false && ns.fileExists('relaySMTP.exe')) {
      ns.relaysmtp(node);
    }

    if (server.httpPortOpen === false && ns.fileExists('HTTPWorm.exe')) {
      ns.httpworm(node);
    }

    if (server.sqlPortOpen === false && ns.fileExists('SQLInject.exe')) {
      ns.sqlinject(node);
    }

    if (server.openPortCount >= ns.getServerNumPortsRequired(node)) {
      ns.nuke(node);
    }

    if (server.backdoorInstalled === false) {
      // ns.installBackdoor(hostname);
    }

    return ns.hasRootAccess(node);
  };
  /**
   * @param {string} node
   * @param {string} target
   */
  const pointAgentAtTarget = async (node, target) => {
    ns.kill(AGENT_SCRIPT, node, target);
    if (!isHome(node)) {
      ns.killall(node);
      ns.rm(AGENT_SCRIPT, node);
      await ns.scp(AGENT_SCRIPT, currentHost, node);
    }

    const serverUsedRam = ns.getServerUsedRam(node);
    const serverMaxRam = ns.getServerMaxRam(node);
    const availableRam = serverMaxRam - serverUsedRam;
    const threads = Math.max(
      Math.floor(availableRam / ns.getScriptRam(AGENT_SCRIPT)),
      1
    );
    const scriptArgs = [target];

    if (ns.exec(AGENT_SCRIPT, node, threads, ...scriptArgs) === 0) {
      log(`Failed to execute ${AGENT_SCRIPT} on: ${node}`, 'error');
    } else {
      log(`Executing ${AGENT_SCRIPT} on: ${node}`, 'success');
    }
  };

  /** @type {Set<string>} */
  const visited = new Set();
  /** @type {Set<string>} */
  const nuked = new Set();
  /**
   * @param {string} node
   * @param {number} depth
   */
  const traverse = (node, depth = 0) => {
    for (const nextNode of ns.scan(node)) {
      if (isOwned(nextNode) || visited.has(nextNode)) {
        continue;
      }
      visited.add(nextNode);
      if (tryNuke(nextNode) === true) {
        nuked.add(nextNode);
      }
      traverse(nextNode, depth + 1);
    }
  };

  traverse(currentHost);

  const listOfTargetsSorted = () => {
    const sortedTargets = [];
    for (const nukedNode of nuked) {
      const node = ns.getServer(nukedNode);
      sortedTargets.push(node);
    }
    return sortedTargets.sort((a, b) => b.moneyMax - a.moneyMax);
  };

  const arraySortedTargets = listOfTargetsSorted();
  const arraySortedTargets2 = [];
  let useFirst = true;
  const fleet = [...nuked, ...ns.getPurchasedServers(), ROOT_NODE]
    .map((node) => ns.getServer(node))
    .sort((a, b) => b.cpuCores * b.maxRam - a.cpuCores * a.maxRam);

  for (const node of fleet) {
    if (useFirst) {
      const hostTemp = arraySortedTargets.shift();
      if (hostTemp == null) {
        continue;
      }
      await pointAgentAtTarget(node.hostname, hostTemp.hostname);
      arraySortedTargets2.push(hostTemp);
    } else {
      const hostTemp = arraySortedTargets2.pop();
      if (hostTemp == null) {
        continue;
      }
      await pointAgentAtTarget(node.hostname, hostTemp.hostname);
      arraySortedTargets.push(hostTemp);
    }

    if (arraySortedTargets.length === 0) {
      useFirst = false;
    }

    if (arraySortedTargets2.length === 0) {
      useFirst = true;
    }
  }
}
