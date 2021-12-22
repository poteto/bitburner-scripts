export default function createLogger(ns) {
	return function log(msg, level = 'info') {
		switch (level) {
			case 'info':
				ns.print(`[INFO] ${msg}`);
				break;
			case 'warning':
				ns.print(`[WARN] ${msg}`);
				break;
			case 'error':
				ns.print(`[ERR ] ${msg}`);
				break;
			case 'success':
				ns.print(`[ OK ] ${msg}`);
				break;
			default:
				throw new Error('Unhandled log level');
		}
	}
}

/** @param {NS} ns **/
export async function main(ns) {
	ns.disableLog('getServerSecurityLevel');
	ns.disableLog('getServerMinSecurityLevel');
	ns.disableLog('getServerMoneyAvailable');
	ns.disableLog('getServerMaxMoney');

	const log = createLogger(ns);
	const formatMoney = x => ns.nFormat(x, '($0.00a)');
	const formatSecurity = x => ns.nFormat(x, '0.00');

	const [node, threads] = ns.args;
	const nodeStats = {
		get currentMoney() { return ns.getServerMoneyAvailable(node) },
		get maxMoney() { return ns.getServerMaxMoney(node) },
		get currentSecurity() { return ns.getServerSecurityLevel(node) },
		get minSecurity() { return ns.getServerMinSecurityLevel(node) }
	}

	while (true) {
		while (nodeStats.currentMoney < nodeStats.maxMoney) {
			await ns.grow(node, { threads });
			log(`Money   : ${formatMoney(nodeStats.currentMoney)} (Max: ${formatMoney(nodeStats.maxMoney)})`);
			while (nodeStats.currentSecurity > nodeStats.minSecurity) {
				await ns.weaken(node, { threads });
				log(`Security: ${formatSecurity(nodeStats.currentSecurity)} (Min: ${formatSecurity(nodeStats.minSecurity)})`);
			}
		}
		await ns.hack(node, { threads });
	}
}