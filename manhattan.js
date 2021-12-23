import createLogger from './create-logger.js';

/**
 * Recursively traverses reachable servers beginning from the current host, opening ports as 
 * needed and nuking if possible. If the server was successfully nuked, we copy over the 
 * AGENT_SCRIPT which makes use of the nuked server to hack the most efficient server.
 */

const ROOT_NODE = 'home';
const FLEET_PREFIX = 'fleet-node';
const INTERVAL = 12_000;
export const AGENT_GROW_SCRIPT = 'agent-grow.js';
export const AGENT_HACK_SCRIPT = 'agent-hack.js';
export const AGENT_WEAK_SCRIPT = 'agent-weak.js';

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
	ns.disableLog('getServerMinSecurityLevel');
	ns.disableLog('getServerMoneyAvailable');
	ns.disableLog('getServerMaxMoney');
	ns.disableLog('sleep');

	const log = createLogger(ns);
	const currentHost = ns.getHostname();
	const formatMoney = x => ns.nFormat(x, '($0.00a)');
	const formatInt = x => ns.nFormat(x, '0,0');
	const format2Decimals = x => ns.nFormat(x, '0,0.00');
	const isHome = hostname => hostname === ROOT_NODE;
	const isOwnedFleet = hostname => hostname.startsWith(FLEET_PREFIX);
	const isOwned = hostname => isHome(hostname) || isOwnedFleet(hostname);

	const getGrowThreads = (hostname) => {
		const moneyAvail = ns.getServerMoneyAvailable(target.hostname);
		const moneyMax = ns.getServerMaxMoney(target.hostname);
		const growRate = moneyMax / moneyAvail;
		if (Math.abs(growRate) === Infinity) {
			return 1;
		}
		return Math.ceil(ns.growthAnalyze(hostname, moneyMax / moneyAvail));
	}
	const getHackThreads = (hostname) => {
		const moneyAvail = ns.getServerMoneyAvailable(hostname);
		const moneyMax = ns.getServerMaxMoney(hostname);
		return Math.ceil(moneyMax / (moneyAvail * ns.hackAnalyze(hostname)));
	}
	const getWeakThreads = (hostname) => Math.ceil((ns.getServerSecurityLevel(hostname) - ns.getServerMinSecurityLevel(hostname)) / 0.05);

	const tryNuke = (hostname) => {
		if (isOwned(hostname)) {
			return false;
		}
		const user = ns.getPlayer();
		const server = ns.getServer(hostname);

		if (user.hacking < server.requiredHackingSkill) {
			log(`Expected hacking level ${server.requiredHackingSkill} for ${hostname}, got: ${user.hacking}`, 'warning');
			return false;
		}

		if (server.sshPortOpen === false && ns.fileExists('BruteSSH.exe')) {
			ns.brutessh(hostname);
		}

		if (server.ftpPortOpen === false && ns.fileExists('FTPCrack.exe')) {
			ns.ftpcrack(hostname);
		}

		if (server.smtpPortOpen === false && ns.fileExists('relaySMTP.exe')) {
			ns.relaysmtp(hostname);
		}

		if (server.httpPortOpen === false && ns.fileExists('HTTPWorm.exe')) {
			ns.httpworm(hostname);
		}

		if (server.sqlPortOpen === false && ns.fileExists('SQLInject.exe')) {
			ns.sqlinject(hostname);
		}

		if (server.openPortCount >= ns.getServerNumPortsRequired(hostname)) {
			ns.nuke(hostname);
		}

		if (server.backdoorInstalled === false) {
			log(`${server.hostname} can be backdoored`, 'warning');
			// ns.installBackdoor(hostname);
		}

		return ns.hasRootAccess(hostname);
	}
	const installAgents = async (controlledServers) => {
		const payload = [AGENT_GROW_SCRIPT, AGENT_HACK_SCRIPT, AGENT_WEAK_SCRIPT];
		for (const server of controlledServers) {
			ns.killall(server.hostname);
			for (const script of payload) {
				ns.rm(script, server.hostname);
				await ns.scp(script, server.hostname);
			}
		}
	}

	const visited = new Set();
	const nuked = new Set();
	const traverse = (hostname, depth = 0) => {
		const scannedHostnames = ns.scan(hostname).filter(nextHostname => isOwned(nextHostname) === false);
		if (scannedHostnames.length) {
			log(`Found: ${scannedHostnames} at depth: ${depth}`);
		}
		for (const nextHostname of scannedHostnames) {
			if (visited.has(nextHostname)) {
				log(`Already traversed, skipping: ${nextHostname}`, 'warning');
				continue;
			}
			log(`Traversing: ${nextHostname}`);
			visited.add(nextHostname);
			if (tryNuke(nextHostname) === true) {
				nuked.add(nextHostname);
				traverse(nextHostname, depth + 1);
			} else {
				log(`Couldn't nuke: ${nextHostname}`);
			}
		}
	}

	traverse(currentHost);
	log(`Nuked: ${[...nuked]}`, 'success');
	await ns.write('nuked.txt', [...nuked], 'w');

	const determineBestHackTarget = () => {
		const bestTarget = {
			efficiency: -Infinity,
			hostname: '',
		};
		for (const nukedNode of nuked) {
			const server = ns.getServer(nukedNode);
			const timeSpent = ns.getHackTime(server.hostname) + ns.getWeakenTime(server.hostname) + ns.getGrowTime(server.hostname);
			const hackEfficiency = server.moneyMax / timeSpent;
			log(`${server.hostname} has effiency of: ${formatMoney(hackEfficiency)}`);
			if (hackEfficiency > bestTarget.efficiency) {
				bestTarget.efficiency = hackEfficiency;
				bestTarget.hostname = server.hostname;
			}
		}
		if (bestTarget.hostname === '') {
			throw new Error(`Couldn't find the best hack target`);
		}
		return bestTarget;
	}

	const target = determineBestHackTarget();
	log(`Found best hack target: ${target.hostname} with efficiency of ${formatMoney(target.efficiency)}`, 'success');

	const execScript = (source, destination, script, threadsNeeded) => {
		const scriptCost = ns.getScriptRam(script);
		const availRam = ns.getServerMaxRam(source.hostname) - ns.getServerUsedRam(source.hostname);
		const threadsAvail = Math.floor(availRam / scriptCost);
		const threads = Math.max(threadsAvail > threadsNeeded ? threadsNeeded : threadsAvail, 1);
		const scriptArgs = [destination.hostname, threads];
		if (ns.exec(script, source.hostname, threads, ...scriptArgs) !== 0) {
			return threadsNeeded - threads;
		} else {
			return null;
		}
	}
	const dispatch = async (controlledServers, destination, script, threadsRemaining) => {
		let weakensRemaining = 0;
		const reduceSecurityToMinimum = async () => {
			weakensRemaining = getWeakThreads(destination.hostname);
			while (weakensRemaining > 0) {
				log(`Weakening ${destination.hostname} with ${weakensRemaining} threads`);
				for (const source of controlledServers) {
					if (weakensRemaining < 1) {
						break;
					}
					const newWeakensRemaining = execScript(source, destination, AGENT_WEAK_SCRIPT, weakensRemaining);
					if (newWeakensRemaining == null) {
						continue;
					}
					weakensRemaining = newWeakensRemaining;
				}
				await ns.sleep(INTERVAL);
			}
		};
		while (threadsRemaining > 0) {
			await reduceSecurityToMinimum();
			if (script === AGENT_GROW_SCRIPT) {
				log(`Growing ${destination.hostname} with ${threadsRemaining} threads`);
			}
			if (script === AGENT_HACK_SCRIPT) {
				log(`Hacking ${destination.hostname} with ${threadsRemaining} threads`);
			}
			for (const source of controlledServers) {
				if (threadsRemaining < 1) {
					break;
				}
				const newThreadsRemaining = execScript(source, destination, script, threadsRemaining);
				if (newThreadsRemaining == null) {
					continue;
				}
				threadsRemaining = newThreadsRemaining;
			}
			await ns.sleep(INTERVAL);
		}
	};

	const report = (target) => {
		log(`--- REPORT for ${target.hostname} ---`);
		log(`moneyAvail  : ${formatMoney(ns.getServerMoneyAvailable(target.hostname))}`);
		log(`moneyMax    : ${formatMoney(ns.getServerMaxMoney(target.hostname))}`);
		log(`currSecurity: ${format2Decimals(ns.getServerSecurityLevel(target.hostname))}`);
		log(`minSecurity : ${format2Decimals(ns.getServerMinSecurityLevel(target.hostname))}`);
		log(`growThreads : ${formatInt(getGrowThreads(target.hostname))}`);
		log(`weakThreads : ${formatInt(getWeakThreads(target.hostname))}`);
		log(`hackThreads : ${formatInt(getHackThreads(target.hostname))}`);
	}

	const controlledServers = [...nuked, ...ns.getPurchasedServers()].map(hostname => ns.getServer(hostname));
	await installAgents(controlledServers);

	while (true) {
		report(target);
		await dispatch(controlledServers, target, AGENT_GROW_SCRIPT, getGrowThreads(target.hostname));
		await dispatch(controlledServers, target, AGENT_HACK_SCRIPT, getHackThreads(target.hostname));
		await ns.sleep(INTERVAL);
	}
}