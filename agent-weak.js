/** @param {NS} ns **/
export async function main(ns) {
    const [node, threads] = ns.args;
    ns.print(`[INFO] Current time: ${new Date().toISOString()}`);
    await ns.weaken(node, { threads });
}