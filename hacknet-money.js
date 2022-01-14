/** @typedef { import('./bitburner.d').NS } NS */

const INTERVAL = 50;

/** @param {NS} ns **/
export async function main(ns) {
  ns.tail();
  ns.disableLog('disableLog');
  ns.disableLog('sleep');

  while (true) {
    ns.hacknet.spendHashes('Sell for Money');
    await ns.sleep(INTERVAL);
  }
}
