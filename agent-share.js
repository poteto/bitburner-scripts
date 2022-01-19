/** @typedef { import('./bitburner.d').NS } NS */

/** @param {NS} ns **/
export async function main(ns) {
  ns.print(`[INFO] Started at: ${new Date().toLocaleString()}`);
  while (true) {
    await ns.share();
  }
}
