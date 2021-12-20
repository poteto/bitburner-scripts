/**
 * Extremely basic self hacking script. 
 * 
 * TODO make this better
 */

/** @param {NS} ns **/
export async function main(ns) {
	const serverName = ns.args[0];
	while (true) {
		const serverSecurityLevel = ns.getServerSecurityLevel(serverName);
		const serverMaxMoney = ns.getServerMaxMoney(serverName);
		const serverMoneyAvail = ns.getServerMoneyAvailable(serverName);

		if (serverSecurityLevel > 10) {
			await ns.weaken(serverName, 1);
		}

		if (serverMoneyAvail / serverMaxMoney < 0.5) {
			await ns.grow(serverName, 1);
		}

		await ns.hack(serverName, Infinity);
	}
}