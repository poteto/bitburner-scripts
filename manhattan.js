/**
 * Recursively traverses reachable servers beginning from the current host, opening ports as 
 * needed and nuking if possible. If the server was successfully nuked, we copy over the 
 * SELF_OWN_SCRIPT which makes use of the nuked server to hack itself.
 */

const ROOT_NODE = 'home';
const SELF_OWN_SCRIPT = 'self0wn.js';

function createLogger(ns) {
	return function log(msg, level = 'info') {
		switch (level) {
			case 'info':
				ns.print(`[INFO] ${msg}`);
				break;
			case 'warn':
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
	ns.tail();
	ns.disableLog('getServerNumPortsRequired');
	ns.disableLog('scan');
	ns.disableLog('getServerUsedRam');
	ns.disableLog('getServerMaxRam');
	ns.disableLog('killall');
	ns.disableLog('scp');

	const log = createLogger(ns);
	const currentHost = ns.getHostname();

	const isHome = node => node === ROOT_NODE;
	const tryNuke = (node) => {
		if (isHome(node)) {
			return false;
		}
		const user = ns.getPlayer();
		const server = ns.getServer(node);

		if (user.hacking < server.requiredHackingSkill) {
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

		ns.nuke(node);
		return ns.hasRootAccess(node);
	}
	const self0wn = async node => {
		ns.killall(node);
		ns.rm(SELF_OWN_SCRIPT, node);
		await ns.scp(SELF_OWN_SCRIPT, node);

		const serverUsedRam = ns.getServerUsedRam(node);
		const serverMaxRam = ns.getServerMaxRam(node);
		const availableRam = serverMaxRam - serverUsedRam;
		const threads = Math.floor(availableRam / ns.getScriptRam(SELF_OWN_SCRIPT));

		if (ns.exec(SELF_OWN_SCRIPT, node, threads, node, threads) === 0) {
			ns.toast(`Failed to execute ${SELF_OWN_SCRIPT} on: ${node}`, 'error');
		} else {
			ns.toast(`Executing ${SELF_OWN_SCRIPT} on: ${node}`, 'success');
		}
	}

	const visited = new Set();
	const nuked = new Set();
	const traverse = async (node, depth = 0) => {
		const scannedNodes = ns.scan(node).filter(nextNode => nextNode !== ROOT_NODE);
		if (scannedNodes.length) {
			log(`Found: ${scannedNodes} at depth: ${depth}`);
		}
		for (const nextNode of scannedNodes) {
			if (visited.has(nextNode)) {
				log(`Already traversed, skipping: ${nextNode}`, 'warn');
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

	for (const nukedNode of nuked) {
		await self0wn(nukedNode);
	}
}