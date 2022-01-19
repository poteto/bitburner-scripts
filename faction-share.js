/**
 * @typedef { import('./bitburner.d').NS } NS
 * @typedef { import('./bitburner.d').Server } Server
 * @typedef {{
 *  force: boolean
 * }} ScriptOptions
 */

import { AGENT_SHARE_SCRIPT, ROOT_NODE } from './constants.js';
import { createTraversal, installAgents } from './utils.js';

const AGENT_PAYLOAD = new Set([AGENT_SHARE_SCRIPT]);

/** @param {NS} ns **/
export async function main(ns) {
  ns.tail();
  ns.disableLog('disableLog');
  ns.disableLog('getServerNumPortsRequired');
  ns.disableLog('scan');
  ns.disableLog('getServerUsedRam');
  ns.disableLog('getServerMaxRam');
  ns.disableLog('kill');
  ns.disableLog('killall');
  ns.disableLog('scp');
  ns.disableLog('exec');
  ns.disableLog('rm');
  ns.disableLog('sleep');
  ns.disableLog('nuke');
  ns.disableLog('brutessh');
  ns.disableLog('ftpcrack');
  ns.disableLog('relaysmtp');
  ns.disableLog('httpworm');
  ns.disableLog('sqlinject');

  /** @type {ScriptOptions} */
  const FLAGS = ns.flags([
    ['force', false], // Whether to killall when running the script
  ]);

  /**
   * @param {Set<string>} nukedHostnames
   * @returns {Server[]}
   */
  const getControlledServers = (nukedHostnames) =>
    [ROOT_NODE, ...nukedHostnames, ...ns.getPurchasedServers()].map(
      (hostname) => ns.getServer(hostname)
    );

  const player = ns.getPlayer();
  const traverse = createTraversal(ns, player);
  const nukedHostnames = traverse(ROOT_NODE);
  const controlledServers = getControlledServers(nukedHostnames);
  await installAgents(ns, controlledServers, {
    force: FLAGS.force,
    payload: AGENT_PAYLOAD,
  });
  for (const controlledServer of controlledServers) {
    ns.exec(AGENT_SHARE_SCRIPT, controlledServer.hostname);
  }
}
