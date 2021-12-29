/**
 * Recursively traverses reachable servers beginning from the current host, opening ports as
 * needed and nuking if possible. If the server was successfully nuked, we copy over the
 * AGENT_SCRIPT which makes use of the nuked server to hack the most efficient server.
 *
 * @typedef { import('./bitburner.d').NS } NS
 * @typedef { import('./bitburner.d').Server } Server
 * @typedef {AGENT_GROW_SCRIPT | AGENT_HACK_SCRIPT | AGENT_WEAK_SCRIPT} AgentScript
 */

import createLogger from './create-logger.js';

const ROOT_NODE = 'home';
const FLEET_PREFIX = 'fleet-node';
export const AGENT_GROW_SCRIPT = 'agent-grow.js';
export const AGENT_HACK_SCRIPT = 'agent-hack.js';
export const AGENT_WEAK_SCRIPT = 'agent-weak.js';
/** @type {Set<AgentScript>} */
const AGENT_PAYLOAD = new Set([
  AGENT_GROW_SCRIPT,
  AGENT_HACK_SCRIPT,
  AGENT_WEAK_SCRIPT,
]);
const INTERVAL = 3_000;

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
  ns.disableLog('getServerMinSecurityLevel');
  ns.disableLog('getServerMaxMoney');
  ns.disableLog('getServerMoneyAvailable');
  ns.disableLog('kill');
  ns.disableLog('nuke');
  ns.disableLog('brutessh');
  ns.disableLog('ftpcrack');
  ns.disableLog('relaysmtp');
  ns.disableLog('httpworm');
  ns.disableLog('sqlinject');
  ns.disableLog('sleep');

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

    if (
      ns.getServer(node).openPortCount >= ns.getServerNumPortsRequired(node)
    ) {
      ns.nuke(server.hostname);
    }

    if (server.backdoorInstalled === false) {
      // ns.installBackdoor(hostname);
    }

    return ns.hasRootAccess(node);
  };
  /**
   * @param {string} node
   * @param {string} target
   * @param {AgentScript} script
   */
  const execScript = (node, target, script) => {
    const availableRam = ns.getServerMaxRam(node) - ns.getServerUsedRam(node);
    const threadsAvailable = Math.floor(availableRam / ns.getScriptRam(script));
    if (threadsAvailable === 0) {
      return 0;
    }
    const scriptArgs = [target, '0'];
    return ns.exec(script, node, threadsAvailable, ...scriptArgs);
  };

  /** @param {Server} server */
  const installAgents = async ({ hostname }) => {
    for (const script of AGENT_PAYLOAD) {
      ns.scriptKill(script, hostname);
      if (isHome(hostname)) {
        continue;
      }
      ns.rm(script, hostname);
      await ns.scp(script, currentHost, hostname);
    }
  };
  /**
   * @param {string} node
   * @param {string} target
   */
  const pointAgentAtTarget = (node, target) => {
    if (
      ns.getServerSecurityLevel(target) > ns.getServerMinSecurityLevel(target)
    ) {
      if (execScript(node, target, AGENT_WEAK_SCRIPT) !== 0) {
        log(`Weakening ${target} with ${node}`);
      }
    }

    if (ns.getServerMoneyAvailable(target) < ns.getServerMaxMoney(target)) {
      if (execScript(node, target, AGENT_GROW_SCRIPT) !== 0) {
        log(`Growing ${target} with ${node}`);
      }
    }

    if (ns.getServerMoneyAvailable(target) === ns.getServerMaxMoney(target)) {
      if (execScript(node, target, AGENT_HACK_SCRIPT) !== 0) {
        log(`Hacking ${target} with ${node}`);
      }
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
  const getSortedTargets = () => {
    const sortedTargets = [];
    for (const nukedNode of nuked) {
      const node = ns.getServer(nukedNode);
      if (node.moneyMax === 0) {
        continue;
      }
      sortedTargets.push(node);
    }
    return sortedTargets.sort((a, b) => b.moneyMax - a.moneyMax);
  };

  traverse(currentHost);
  const sortedTargets = getSortedTargets();
  const stack = [];
  let useFirst = true;
  const fleet = [...nuked, ...ns.getPurchasedServers(), ROOT_NODE]
    .map((node) => ns.getServer(node))
    .sort((a, b) => {
      if (isHome(a.hostname)) {
        return -1;
      }
      if (isHome(b.hostname)) {
        return 1;
      }
      return b.cpuCores * b.maxRam > a.cpuCores * a.maxRam ? 1 : -1;
    });
  for (const node of fleet) {
    await installAgents(node);
  }

  while (true) {
    for (const node of fleet) {
      if (useFirst) {
        const nextTarget = sortedTargets.shift();
        if (nextTarget == null) {
          continue;
        }
        pointAgentAtTarget(node.hostname, nextTarget.hostname);
        stack.push(nextTarget);
      } else {
        const nextTarget = stack.pop();
        if (nextTarget == null) {
          continue;
        }
        pointAgentAtTarget(node.hostname, nextTarget.hostname);
        sortedTargets.push(nextTarget);
      }

      if (sortedTargets.length === 0) {
        useFirst = false;
      }

      if (stack.length === 0) {
        useFirst = true;
      }
    }
    await ns.sleep(INTERVAL);
  }
}
