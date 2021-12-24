import createLogger from './create-logger.js';

/**
 * Recursively traverses reachable servers beginning from the current host, opening ports as 
 * needed and nuking if possible. If the server was successfully nuked, we copy over the 
 * AGENT_SCRIPT which makes use of the nuked server to hack the most efficient server.
 */

const ROOT_NODE = 'home';
const FLEET_PREFIX = 'fleet-node';
const INTERVAL = 500;
const WEAK_AMOUNT = 0.05;
export const AGENT_GROW_SCRIPT = 'agent-grow.js';
export const AGENT_HACK_SCRIPT = 'agent-hack.js';
export const AGENT_WEAK_SCRIPT = 'agent-weak.js';
const AGENT_PAYLOAD = new Set([AGENT_GROW_SCRIPT, AGENT_HACK_SCRIPT, AGENT_WEAK_SCRIPT]);

function* makeCycle(start, end) {
	let ii = start;
	while (true) {
		if (ii > end) {
			ii = start;
		}
		yield ++ii;
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
	const format2Decimals = x => ns.nFormat(x, '0,0.00');

	const isHome = hostname => hostname === ROOT_NODE;
	const isOwnedFleet = hostname => hostname.startsWith(FLEET_PREFIX);
	const isOwned = hostname => isHome(hostname) || isOwnedFleet(hostname);

	const getGrowThreads = (hostname) => {
		const moneyAvail = ns.getServerMoneyAvailable(hostname);
		const moneyMax = ns.getServerMaxMoney(hostname);
		const growRate = moneyMax / moneyAvail;
		if (Math.abs(growRate) === Infinity) {
			return 10_000;
		}
		return Math.ceil(ns.growthAnalyze(hostname, growRate) * 5);
	}
	const getHackThreads = (hostname) => {
		const moneyAvail = ns.getServerMoneyAvailable(hostname);
		const moneyMax = ns.getServerMaxMoney(hostname);
		return Math.ceil(moneyMax / (moneyAvail * ns.hackAnalyze(hostname)) * 5);
	}
	const getWeakThreads = (hostname) =>
		Math.ceil((ns.getServerSecurityLevel(hostname) - ns.getServerMinSecurityLevel(hostname)) / WEAK_AMOUNT);
	const efficiencyFor = hostname =>
		ns.getServerMaxMoney(hostname) / (ns.getHackTime(hostname) + ns.getWeakenTime(hostname) + ns.getGrowTime(hostname));

	const getGrowTime = destination => Math.ceil(ns.getGrowTime(destination.hostname));
	const getWeakTime = destination => Math.ceil(ns.getWeakenTime(destination.hostname));
	const getHackTime = destination => Math.ceil(ns.getHackTime(destination.hostname));

	const report = (destination) => {
		log(`--- REPORT for ${destination.hostname} ---`);
		log(`moneyAvail  : ${formatMoney(ns.getServerMoneyAvailable(destination.hostname))}`);
		log(`moneyMax    : ${formatMoney(ns.getServerMaxMoney(destination.hostname))}`);
		log(`currSecurity: ${format2Decimals(ns.getServerSecurityLevel(destination.hostname))}`);
		log(`minSecurity : ${format2Decimals(ns.getServerMinSecurityLevel(destination.hostname))}`);
	}

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
		for (const server of controlledServers) {
			if (isHome(server.hostname)) {
				continue;
			}
			ns.killall(server.hostname);
			for (const script of AGENT_PAYLOAD) {
				ns.rm(script, server.hostname);
				await ns.scp(script, server.hostname);
			}
		}
	}
	const killScriptOnAllServers = (controlledServers, script) => {
		for (const server of controlledServers) {
			for (const process of ns.ps(server.hostname)) {
				if (process.filename === script) {
					ns.kill(process.filename, server.hostname, ...process.args);
				}
			}
		}
	}
	const killOtherScriptsOnHome = (home) => {
		for (const process of ns.ps(home.hostname)) {
			if (AGENT_PAYLOAD.has(process.filename)) {
				ns.kill(process.filename, home.hostname, ...process.args);
			}
		}
	}
	const visited = new Set();
	const nukedTargets = new Set();
	const traverse = (hostname, depth = 0) => {
		const scannedHostnames = ns
			.scan(hostname)
			.filter(nextHostname => isOwned(nextHostname) === false);
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
				nukedTargets.add(nextHostname);
			} else {
				log(`Couldn't nuke: ${nextHostname}`);
			}
			traverse(nextHostname, depth + 1);
		}
	}

	const execScript = (source, destination, script, { threadsNeeded, delay }) => {
		const scriptCost = ns.getScriptRam(script);
		const availRam = ns.getServerMaxRam(source.hostname) - ns.getServerUsedRam(source.hostname);
		const threadsAvail = Math.floor(availRam / scriptCost);
		if (threadsAvail === 0) {
			return null;
		}
		const threads = Math.max(threadsAvail > threadsNeeded ? threadsNeeded : threadsAvail, 1);
		const scriptArgs = [destination.hostname, delay];
		if (ns.exec(script, source.hostname, threads, ...scriptArgs) !== 0) {
			return {
				threadsSpawned: threads,
				threadsRemaining: threadsNeeded - threads,
				ramUsed: scriptCost * threads,
			};
		}
		return null;
	}
	const dispatchWeak = async (controlledServers, destination) => {
		let weakensRemaining = getWeakThreads(destination.hostname);
		let longestTimeTaken = -Infinity;
		while (weakensRemaining > 0) {
			const currentTimeTaken = getWeakTime(destination);
			if (currentTimeTaken > longestTimeTaken) {
				longestTimeTaken = currentTimeTaken;
			}
			weakensRemaining = getWeakThreads(destination.hostname);
			log(`Weakening ${destination.hostname} with ${weakensRemaining} threads in ${ns.tFormat(currentTimeTaken)}`);
			for (const source of controlledServers) {
				if (weakensRemaining < 1) {
					break;
				}
				const res = execScript(source, destination, AGENT_WEAK_SCRIPT, {
					threadsNeeded: weakensRemaining,
					delay: 0
				});
				if (res != null) {
					weakensRemaining = res.threadsRemaining;
				}
			}
			await ns.sleep(INTERVAL);
		}
		return longestTimeTaken;
	}
	const dispatchGrow = async (controlledServers, destination) => {
		let growsRemaining = getGrowThreads(destination.hostname);
		let weakensRemaining = Math.ceil(ns.growthAnalyzeSecurity(growsRemaining) / WEAK_AMOUNT);
		let longestTimeTaken = -Infinity;
		while (growsRemaining > 0) {
			const currentTimeTaken = Math.max(getGrowTime(destination), getWeakTime(destination));
			if (currentTimeTaken > longestTimeTaken) {
				longestTimeTaken = currentTimeTaken;
			}
			log(`Growing ${destination.hostname} with ${growsRemaining} threads in ${ns.tFormat(currentTimeTaken)}`);
			for (const source of controlledServers) {
				if (growsRemaining < 1) {
					break;
				}
				const growRes = execScript(source, destination, AGENT_GROW_SCRIPT, {
					threadsNeeded: growsRemaining,
					delay: 0
				});
				if (growRes != null) {
					growsRemaining = growRes.threadsRemaining;
				}
				const weakRes = execScript(source, destination, AGENT_WEAK_SCRIPT, {
					threadsNeeded: weakensRemaining,
					delay: 0
				});
				if (weakRes != null) {
					weakensRemaining = weakRes.threadsRemaining;
				}
			}
			await ns.sleep(INTERVAL);
		}
		return longestTimeTaken;
	}
	const dispatchHack = async (controlledServers, destination) => {
		let hacksRemaining = getHackThreads(destination.hostname);
		let weakensRemaining = Math.ceil(ns.hackAnalyzeSecurity(hacksRemaining) / WEAK_AMOUNT);
		let longestTimeTaken = -Infinity;
		while (hacksRemaining > 0) {
			const currentTimeTaken = Math.max(getHackTime(destination), getWeakTime(destination));
			if (currentTimeTaken > longestTimeTaken) {
				longestTimeTaken = currentTimeTaken;
			}
			log(`Hacking ${destination.hostname} with ${hacksRemaining} threads in ${ns.tFormat(currentTimeTaken)}`);
			for (const source of controlledServers) {
				if (hacksRemaining < 1) {
					break;
				}
				const hackRes = execScript(source, destination, AGENT_HACK_SCRIPT, {
					threadsNeeded: hacksRemaining,
					delay: 0
				});
				if (hackRes != null) {
					hacksRemaining = hackRes.threadsRemaining;
				}
				const weakRes = execScript(source, destination, AGENT_WEAK_SCRIPT, {
					threadsNeeded: weakensRemaining,
					delay: 0
				});
				if (weakRes != null) {
					weakensRemaining = weakRes.threadsRemaining;
				}
			}
			await ns.sleep(INTERVAL);
		}
		return longestTimeTaken;
	}

	traverse(currentHost);
	log(`Nuked: ${Array.from(nukedTargets)}`, 'success');
	await ns.write('nuked.txt', Array.from(nukedTargets), 'w');

	const sortedTargets = Array.from(nukedTargets)
		.filter(hostname => ns.getServerMaxMoney(hostname) > 0)
		.sort((a, b) => ns.getServerMaxMoney(b) - ns.getServerMaxMoney(a))
		.map(hostname => ns.getServer(hostname));
	const controlledServers = [ROOT_NODE, ...nukedTargets, ...ns.getPurchasedServers()]
		.map(hostname => ns.getServer(hostname))
		.sort((a, b) => b.maxRam - a.maxRam);
	await installAgents(controlledServers);
	killOtherScriptsOnHome(ns.getServer(ROOT_NODE));

	// Note: This is an infinite loop cycling through the top n servers
	for (const targetIndex of makeCycle(0, sortedTargets.length - 1)) {
		const target = sortedTargets[targetIndex];
		if (target == null) {
			continue;
		}
		report(target);
		const moneyAvail = ns.getServerMoneyAvailable(target.hostname);
		const moneyMax = ns.getServerMaxMoney(target.hostname);
		const securityLevel = ns.getServerSecurityLevel(target.hostname);
		const minSecurityLevel = ns.getServerMinSecurityLevel(target.hostname);

		if (minSecurityLevel < securityLevel) {
			await dispatchWeak(controlledServers, target);
			report(target);
			continue;
		}

		if (minSecurityLevel === securityLevel) {
			killScriptOnAllServers(controlledServers, AGENT_WEAK_SCRIPT);
		}

		if (moneyAvail < moneyMax) {
			await dispatchGrow(controlledServers, target);
			report(target);
		}

		if (moneyAvail === moneyMax) {
			killScriptOnAllServers(controlledServers, AGENT_GROW_SCRIPT);
			await dispatchHack(controlledServers, target);
			report(target);
		}

		await ns.sleep(INTERVAL);
	}
}