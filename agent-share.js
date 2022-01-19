/** @typedef { import('./bitburner.d').NS } NS */

/** @param {NS} ns **/
export async function main(ns) {
  const [targetHostname, instanceId] = ns.args;
  ns.print(
    `[INFO] Started instance ${instanceId} at: ${new Date().toLocaleString()}`
  );
  while (true) {
    await ns.share();
  }
}
