/**
 * Extremely basic self hacking script. 
 * 
 * TODO make this better
 */

/** @param {NS} ns **/
export async function main(ns) {
	const [node, threads] = ns.args;
	while (true) {
		const serverSecurityLevel = ns.getServerSecurityLevel(node);
		const serverMaxMoney = ns.getServerMaxMoney(node);
		const serverMoneyAvail = ns.getServerMoneyAvailable(node);

		if (serverSecurityLevel > 10) {
			await ns.weaken(node, { threads });
		}

		if ((serverMoneyAvail / serverMaxMoney) < 0.5) {
			await ns.grow(node, { threads });
		}

		await ns.hack(node, { threads });
	}
}