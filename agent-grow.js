/** @param {NS} ns **/
export async function main(ns) {
    const [node, delay] = ns.args;
    ns.print(`[INFO] Current time: ${new Date().toISOString()}`);
    if (delay > 0) {
        await ns.sleep(delay);
    }
    await ns.grow(node);
}