/**
 * Greedy hacknet purchasing algorithm. Polls indefinitely until the script is killed.
 * This script will attempt to purchase the cheapest possible upgrade (new node, level,
 * RAM, core) and will fully deplenish your surplus money as and when the cheapest
 * upgrade can be purchased. If you are trying to build a surplus you should kill the
 * script and let it build up.
 *
 * @typedef { import('./bitburner.d').NS } NS
 */

import { ROOT_NODE } from './constants.js';
import createLogger from './create-logger.js';

const LEVEL_INCREMENT = 20;
const RAM_INCREMENT = 1;
const CORE_INCREMENT = 1;
const CACHE_INCREMENT = 1;
const INTERVAL = 1_000;

/** @param {NS} ns **/
export async function main(ns) {
  ns.tail();
  ns.disableLog('disableLog');
  ns.disableLog('getServerMoneyAvailable');
  ns.disableLog('sleep');

  const log = createLogger(ns);
  /** @param {number} cost */
  const insufficientFunds = async (cost) =>
    log(
      `Need: ${ns.nFormat(cost, '($0.00a)')}, have: ${ns.nFormat(
        ns.getServerMoneyAvailable(ROOT_NODE),
        '($0.00a)'
      )}`,
      'warning'
    );

  while (true) {
    const numNodes = ns.hacknet.numNodes();
    /** @type {{cost: number, name: string | null, index: number | null}} */
    let cheapest = {
      cost: Infinity,
      name: null,
      index: null,
    };

    if (numNodes === 0) {
      log(`Successfully purchased hacknet-node-0`, 'success');
      ns.hacknet.purchaseNode();
    }

    for (let index = 0; index < numNodes; index++) {
      const costs = {
        node: ns.hacknet.getPurchaseNodeCost(),
        level: ns.hacknet.getLevelUpgradeCost(index, LEVEL_INCREMENT),
        ram: ns.hacknet.getRamUpgradeCost(index, RAM_INCREMENT),
        core: ns.hacknet.getCoreUpgradeCost(index, CORE_INCREMENT),
        cache: ns.hacknet.getCacheUpgradeCost(index, CACHE_INCREMENT),
      };

      for (const [name, cost] of Object.entries(costs)) {
        if (cost < cheapest.cost) {
          cheapest.cost = cost;
          cheapest.name = name;
          cheapest.index = index;
        }
      }
    }

    if (cheapest.name != null && cheapest.index != null) {
      log(
        `Found cheapest upgrade: hacknet-node-${cheapest.index}, ${cheapest.name}`
      );
      while (ns.getServerMoneyAvailable(ROOT_NODE) < cheapest.cost) {
        await insufficientFunds(cheapest.cost);
        await ns.sleep(INTERVAL);
      }
      switch (cheapest.name) {
        case 'node':
          const nextNodeIndex = ns.hacknet.purchaseNode();
          if (nextNodeIndex !== -1) {
            log(
              `Successfully purchased hacknet-node-${nextNodeIndex}`,
              'success'
            );
          }
          break;
        case 'level':
          if (ns.hacknet.upgradeLevel(cheapest.index, LEVEL_INCREMENT)) {
            log(
              `Successfully upgraded hacknet-node-${cheapest.index} level`,
              'success'
            );
          }
          break;
        case 'ram':
          if (ns.hacknet.upgradeRam(cheapest.index, RAM_INCREMENT)) {
            log(
              `Successfully upgraded hacknet-node-${cheapest.index} RAM`,
              'success'
            );
          }
          break;
        case 'core':
          if (ns.hacknet.upgradeCore(cheapest.index, CORE_INCREMENT)) {
            log(
              `Successfully upgraded hacknet-node-${cheapest.index} cores`,
              'success'
            );
          }
          break;
        case 'cache':
          if (ns.hacknet.upgradeCache(cheapest.index, CACHE_INCREMENT)) {
            log(`Successfully upgraded hacknet-node-${cheapest.index} cache`);
          }
        default:
          throw new Error(
            `Unknown upgrade ${cheapest.name} for hacknet-node-${cheapest.index}`
          );
      }
    }

    // For now just get money if we're close to cap
    if (ns.hacknet.numHashes() + 4 >= ns.hacknet.hashCapacity()) {
      ns.hacknet.spendHashes('Sell for Money');
    }
  }
}
