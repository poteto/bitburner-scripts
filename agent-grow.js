/**
 * @typedef { import('./bitburner.d').NS } NS
 */

/** @param {NS} ns **/
export async function main(ns) {
  const [targetHostname, delay] = ns.args;
  ns.print(`[INFO] Current time: ${new Date().toISOString()}`);
  if (delay > 0) {
    await ns.sleep(Number(delay));
  }
  await ns.grow(targetHostname.toString());
}
