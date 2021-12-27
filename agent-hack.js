/** @typedef { import('./bitburner.d').NS } NS */

/** @param {NS} ns **/
export async function main(ns) {
  const [targetHostname, delay] = ns.args;
  ns.print(`[INFO] Started at: ${new Date().toLocaleString()}`);
  if (delay > 0) {
    await ns.sleep(Number(delay));
  }
  await ns.hack(targetHostname.toString());
}
