/**
 * @typedef { import('./bitburner.d').NS } NS
 * @typedef { import('./bitburner.d').Server } Server
 * @typedef {AGENT_GROW_SCRIPT | AGENT_HACK_SCRIPT | AGENT_WEAK_SCRIPT} AgentScript
 * @typedef {{force: boolean}} ScriptOptions
 */

import createLogger from './create-logger.js';
import {
  AGENT_GROW_SCRIPT,
  AGENT_HACK_SCRIPT,
  AGENT_WEAK_SCRIPT,
  FLEET_PREFIX,
  ROOT_NODE,
} from './constants';

const INTERVAL = 1_000;

/** @param {NS} ns **/
export async function main(ns) {
  ns.tail();
  ns.disableLog('disableLog');
  ns.disableLog('getServerMoneyAvailable');
  ns.disableLog('sleep');
  ns.disableLog('getServerMaxRam');
  ns.disableLog('deleteServer');
  ns.disableLog('purchaseServer');
  ns.disableLog('killall');

  /** @type {ScriptOptions} */
  const { force } = ns.flags([
    ['force', false], // Whether to forcefully upgrade servers
  ]);

  const log = createLogger(ns);
  /** @param {number} cost */
  const insufficientFunds = (cost) =>
    log(
      `Need: ${ns.nFormat(cost, '($0.00a)')}, have: ${ns.nFormat(
        ns.getServerMoneyAvailable(ROOT_NODE),
        '($0.00a)'
      )}`,
      'warning'
    );
  /** @param {number} n */
  const getExponent = (n) => Math.ceil(Math.log(n) / Math.log(2));
  /** @param {number} cost */
  const waitForMoney = async (cost) => {
    while (ns.getServerMoneyAvailable(ROOT_NODE) < cost) {
      insufficientFunds(cost);
      await ns.sleep(INTERVAL);
    }
  };
  /** @param {string} hostname */
  const waitForScripts = async (hostname) => {
    while (ns.ps(hostname).length > 0) {
      log(`Can't upgrade ${hostname} as there are scripts running`, 'warning');
      await ns.sleep(INTERVAL);
    }
  };

  const maxFleetRam = ns.getPurchasedServerMaxRam();
  const fleetLimit = ns.getPurchasedServerLimit();
  const biggestScript = Math.max(
    ns.getScriptRam(AGENT_GROW_SCRIPT),
    ns.getScriptRam(AGENT_HACK_SCRIPT),
    ns.getScriptRam(AGENT_WEAK_SCRIPT)
  );
  const firstMachineRam = Math.pow(2, getExponent(biggestScript));

  while (ns.getPurchasedServers().length < fleetLimit) {
    const nextServerName = `${FLEET_PREFIX}-${ns.getPurchasedServers().length}`;
    log(`Attempting to purchase ${nextServerName}`);
    await waitForMoney(ns.getPurchasedServerCost(firstMachineRam));
    if (ns.purchaseServer(nextServerName, firstMachineRam) === nextServerName) {
      log(`Succesfully purchased ${nextServerName}`, 'success');
    }
  }

  while (true) {
    let lowestRam = Infinity;
    for (const hostname of ns.getPurchasedServers()) {
      const currentRam = ns.getServerMaxRam(hostname);
      if (currentRam < lowestRam) {
        lowestRam = currentRam;
      }
    }

    log(`Found lowest RAM: ${lowestRam}`);

    if (lowestRam === maxFleetRam) {
      log('Successfully maxed out fleet, exiting script', 'success');
      ns.exit();
    }

    for (const hostname of ns.getPurchasedServers()) {
      const currentRam = ns.getServerMaxRam(hostname);
      const nextRam = Math.pow(2, getExponent(lowestRam) + 1);
      if (currentRam !== lowestRam) {
        continue;
      }
      log(`Attempting to upgrade ${hostname} to ${nextRam}GB RAM`);
      await waitForMoney(ns.getPurchasedServerCost(nextRam));
      if (force === true) {
        ns.killall(hostname);
      } else {
        await waitForScripts(hostname);
      }
      if (ns.deleteServer(hostname) === false) {
        throw new Error('Should never get here');
      }
      if (ns.purchaseServer(hostname, nextRam) === hostname) {
        log(`Successfully upgraded ${hostname} to ${nextRam}GB RAM`, 'success');
      }
    }
  }
}
