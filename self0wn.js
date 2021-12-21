/**
 * Extremely basic self hacking script. 
 * 
 * TODO make this better
 */

/** @param {NS} ns **/
export async function main(ns) {
	const [node, threads] = ns.args;
	while (true) {
		if (ns.getServerSecurityLevel(node) > ns.getServerMinSecurityLevel(node)) {
			await ns.weaken(node, { threads });
		}

		if (ns.getServerMoneyAvailable(node) < ns.getServerMaxMoney(node)) {
			await ns.grow(node, { threads });
		}

		await ns.hack(node, { threads });
	}
}