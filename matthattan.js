import createLogger from './create-logger.js';

/**
 * Recursively traverses reachable servers beginning from the current host, opening ports as 
 * needed and nuking if possible. If the server was successfully nuked, we copy over the 
 * AGENT_SCRIPT which makes use of the nuked server to hack the most efficient server.
 */

const ROOT_NODE = 'home';
const FLEET_PREFIX = 'fleet-node';
export const AGENT_SCRIPT = 'agent-allinone.js';

/** @param {NS} ns **/
export async function main(ns) {
	ns.tail();
	ns.disableLog('getServerNumPortsRequired');
	ns.disableLog('scan');
	ns.disableLog('getServerUsedRam');
	ns.disableLog('getServerMaxRam');
	ns.disableLog('killall');
	ns.disableLog('scp');
	ns.disableLog('exec');
	ns.disableLog('rm');
	ns.disableLog('getServerSecurityLevel');
	ns.disableLog('kill');

	const log = createLogger(ns);
	const currentHost = ns.getHostname();
	const formatMoney = x => ns.nFormat(x, '($0.00a)');

	const isHome = node => node === ROOT_NODE;
	const tryNuke = (node) => {
		if (isHome(node)) {
			return false;
		}
		const user = ns.getPlayer();
		const server = ns.getServer(node);

		if (user.hacking < server.requiredHackingSkill) {
			log(`Expected hacking level ${server.requiredHackingSkill} for ${node}, got: ${user.hacking}`, 'warning');
			return false;
		}

		// if (server.backdoorInstalled === false) {
		// 	ns.installBackdoor(node);
		// }

		if (server.sshPortOpen === false && ns.fileExists('BruteSSH.exe')) {
			ns.brutessh(node);
		}

		if (server.ftpPortOpen === false && ns.fileExists('FTPCrack.exe')) {
			ns.ftpcrack(node);
		}

		if (server.smtpPortOpen === false && ns.fileExists('relaySMTP.exe')) {
			ns.relaysmtp(node);
		}

		if (server.httpPortOpen === false && ns.fileExists('HTTPWorm.exe')) {
			ns.httpworm(node);
		}

		if (server.sqlPortOpen === false && ns.fileExists('SQLInject.exe')) {
			ns.sqlinject(node);
		}

		if (server.openPortCount >= ns.getServerNumPortsRequired(node)) {
			ns.nuke(node);
		}

		return ns.hasRootAccess(node);
	}
	const pointAgentAtTarget = async (node, target) => {
		ns.kill(AGENT_SCRIPT, node, target);
		if (!isHome(node)) {
			ns.killall(node);
			ns.rm(AGENT_SCRIPT, node);
			await ns.scp(AGENT_SCRIPT, node);
		}

		const serverUsedRam = ns.getServerUsedRam(node);
		const serverMaxRam = ns.getServerMaxRam(node);
		const availableRam = serverMaxRam - serverUsedRam;
		const threads = Math.max(Math.floor(availableRam / ns.getScriptRam(AGENT_SCRIPT)), 1);
		const scriptArgs = [target];

		if (ns.exec(AGENT_SCRIPT, node, threads, ...scriptArgs) === 0) {
			ns.toast(`Failed to execute ${AGENT_SCRIPT} on: ${node}`, 'error');
		} else {
			ns.toast(`Executing ${AGENT_SCRIPT} on: ${node}`, 'success');
		}
	}

	const visited = new Set();
	const nuked = new Set();
	const traverse = (node, depth = 0) => {
		const scannedNodes = ns.scan(node).filter(nextNode => nextNode !== ROOT_NODE && !nextNode.startsWith(FLEET_PREFIX));
		if (scannedNodes.length) {
			log(`Found: ${scannedNodes} at depth: ${depth}`);
		}
		for (const nextNode of scannedNodes) {
			if (visited.has(nextNode)) {
				log(`Already traversed, skipping: ${nextNode}`, 'warning');
				continue;
			}
			log(`Traversing: ${nextNode}`);
			visited.add(nextNode);
			if (tryNuke(nextNode) === true) {
				nuked.add(nextNode);
				traverse(nextNode, depth + 1);
			} else {
				log(`Couldn't nuke: ${nextNode}`);
			}
		}
	}

	traverse(currentHost);
	log(`Nuked: ${[...nuked]}`, 'success');
	await ns.write('nuked.txt', [...nuked], 'w');

	const listOfTargetsSorted = () => {
		const sortedTargets = [];
		for (const nukedNode of nuked) {
			const node = ns.getServer(nukedNode);
			sortedTargets.push(node);
		}
		return sortedTargets.sort((a, b) => b.moneyMax - a.moneyMax).slice(0, 24);
	}

	const arraySortedTargets = listOfTargetsSorted();
	const arraySortedTargets2 = [];
	let useFirst = true;
	const fleet = [...nuked, ...ns.getPurchasedServers(), 'home']
		.map(node => ns.getServer(node))
		.sort((a, b) => (a.serverMaxRam > b.serverMaxRam) ? 1 : -1);

	log(`List of targets length : ${arraySortedTargets.length}`, 'success');

	for (const node of fleet) {
		if (useFirst) {
			const hostTemp = arraySortedTargets.shift();
			await pointAgentAtTarget(node.hostname, hostTemp.hostname);
			arraySortedTargets2.push(hostTemp);
		}
		else {
			const hostTemp = arraySortedTargets2.pop();
			await pointAgentAtTarget(node.hostname, hostTemp.hostname);
			arraySortedTargets.push(hostTemp);
		}

		if (arraySortedTargets.length == 0) {
			useFirst = false;
		}

		if (arraySortedTargets2.length == 0) {
			useFirst = true;
		}
	}
}