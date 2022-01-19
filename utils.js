/**
 * @typedef { import('./bitburner.d').NS } NS
 * @typedef { import('./bitburner.d').Server } Server
 * @typedef { import('./bitburner.d').Player } Player
 */

import { ROOT_NODE, FLEET_PREFIX } from './constants';

/** @param {string} hostname */
export function isHome(hostname) {
  return hostname === ROOT_NODE;
}
/** @param {string} hostname */
export function isFleet(hostname) {
  return hostname.startsWith(FLEET_PREFIX);
}
/** @param {string} hostname */
export function isOwned(hostname) {
  return isHome(hostname) || isFleet(hostname);
}

/** @param {number[]} values */
export function calculateMean(values) {
  return values.reduce((acc, curr) => acc + curr, 0) / values.length;
}

/**
 * @param {NS} ns
 * @param {Server[]} controlledServers
 * @param {{ force: boolean, payload: Set<String> }} opts
 */
export const installAgents = async (ns, controlledServers, opts) => {
  for (const server of controlledServers) {
    if (isHome(server.hostname)) {
      if (opts.force) {
        for (const script of opts.payload) {
          ns.scriptKill(script, ROOT_NODE);
        }
      }
      continue;
    }
    for (const script of opts.payload) {
      if (opts.force) {
        ns.scriptKill(script, server.hostname);
      }
      ns.rm(script, server.hostname);
      await ns.scp(script, ROOT_NODE, server.hostname);
    }
  }
};

/**
 * @param {NS} ns
 * @param {Player} player
 */
export function createTraversal(ns, player) {
  const visited = new Set();
  const nukedHostnames = new Set();
  /**
   * @param {string} hostname
   * @param {number} depth
   * @returns {Set<string>}
   */
  return function traverse(hostname, depth = 0) {
    for (const nextHostname of ns.scan(hostname)) {
      if (isOwned(nextHostname) || visited.has(nextHostname)) {
        continue;
      }
      visited.add(nextHostname);
      if (tryNuke(ns, nextHostname, player) === true) {
        nukedHostnames.add(nextHostname);
      }
      traverse(nextHostname, depth + 1);
    }
    return nukedHostnames;
  };
}

/**
 * @param {NS} ns
 * @param {string} hostname
 * @param {Player} player
 * @returns {boolean}
 */
function tryNuke(ns, hostname, player) {
  if (isOwned(hostname)) {
    return false;
  }

  const server = ns.getServer(hostname);

  if (player.hacking < server.requiredHackingSkill) {
    return false;
  }

  if (server.sshPortOpen === false && ns.fileExists('BruteSSH.exe')) {
    ns.brutessh(server.hostname);
  }

  if (server.ftpPortOpen === false && ns.fileExists('FTPCrack.exe')) {
    ns.ftpcrack(server.hostname);
  }

  if (server.smtpPortOpen === false && ns.fileExists('relaySMTP.exe')) {
    ns.relaysmtp(server.hostname);
  }

  if (server.httpPortOpen === false && ns.fileExists('HTTPWorm.exe')) {
    ns.httpworm(server.hostname);
  }

  if (server.sqlPortOpen === false && ns.fileExists('SQLInject.exe')) {
    ns.sqlinject(server.hostname);
  }

  if (
    ns.getServer(server.hostname).openPortCount >=
    ns.getServerNumPortsRequired(server.hostname)
  ) {
    ns.nuke(server.hostname);
  }

  if (server.backdoorInstalled === false) {
    // ns.installBackdoor(server.hostname);
  }

  return ns.hasRootAccess(server.hostname);
}
