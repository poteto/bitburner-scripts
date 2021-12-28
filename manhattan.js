/**
 * @typedef { import('./bitburner.d').NS } NS
 * @typedef { import('./bitburner.d').Server } Server
 *
 * @typedef {AGENT_GROW_SCRIPT | AGENT_HACK_SCRIPT | AGENT_WEAK_SCRIPT} AgentScript
 */

import createLogger from './create-logger.js';

const ROOT_NODE = 'home';
const FLEET_PREFIX = 'fleet-node';
const DISPATCH_INTERVAL = 500;
const LOOP_INTERVAL = 3_000;
const WEAK_AMOUNT = 0.05;
export const AGENT_GROW_SCRIPT = 'agent-grow.js';
export const AGENT_HACK_SCRIPT = 'agent-hack.js';
export const AGENT_WEAK_SCRIPT = 'agent-weak.js';
const AGENT_PAYLOAD = new Set([
  AGENT_GROW_SCRIPT,
  AGENT_HACK_SCRIPT,
  AGENT_WEAK_SCRIPT,
]);

/**
 * @param {number} start
 * @param {number} end
 * @returns {Generator<number>}
 */
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
  ns.disableLog('disableLog');
  ns.disableLog('getServerNumPortsRequired');
  ns.disableLog('scan');
  ns.disableLog('getServerUsedRam');
  ns.disableLog('getServerMaxRam');
  ns.disableLog('kill');
  ns.disableLog('killall');
  ns.disableLog('scp');
  ns.disableLog('exec');
  ns.disableLog('rm');
  ns.disableLog('getServerSecurityLevel');
  ns.disableLog('getServerMinSecurityLevel');
  ns.disableLog('getServerMoneyAvailable');
  ns.disableLog('getServerMaxMoney');
  ns.disableLog('sleep');
  ns.disableLog('nuke');
  ns.disableLog('brutessh');
  ns.disableLog('ftpcrack');
  ns.disableLog('relaysmtp');
  ns.disableLog('httpworm');
  ns.disableLog('sqlinject');

  const log = createLogger(ns);
  const currentHost = ns.getHostname();

  /** @param {number} n */
  const formatThreads = (n) => ns.nFormat(n, '0,0.00a');
  /** @param {number} n */
  const formatMoney = (n) => ns.nFormat(n, '($0.00a)');
  /** @param {number} n */
  const format2Decimals = (n) => ns.nFormat(n, '0,0.00');
  /** @param {number} n */
  const formatPercent = (n) => ns.nFormat(n, '000.0%');

  /**
   * @param {string} hostname
   * @returns {boolean}
   */
  const isHome = (hostname) => hostname === ROOT_NODE;
  /**
   * @param {string} hostname
   * @returns {boolean}
   */
  const isFleet = (hostname) => hostname.startsWith(FLEET_PREFIX);
  /**
   * @param {string} hostname
   * @returns {boolean}
   */
  const isOwned = (hostname) => isHome(hostname) || isFleet(hostname);

  /**
   * @param {string} hostname
   * @returns {number}
   */
  const getGrowThreads = (hostname) => {
    const moneyAvail = ns.getServerMoneyAvailable(hostname);
    const moneyMax = ns.getServerMaxMoney(hostname);
    const growRate = moneyMax / moneyAvail;
    if (moneyMax === moneyAvail) {
      return 0;
    }
    if (Math.abs(growRate) === Infinity) {
      return 20_000;
    }
    return Math.ceil(ns.growthAnalyze(hostname, growRate));
  };
  /**
   * @param {string} hostname
   * @returns {number}
   */
  const getHackThreads = (hostname) => {
    const moneyAvail = ns.getServerMoneyAvailable(hostname);
    const moneyMax = ns.getServerMaxMoney(hostname);
    if (moneyAvail === 0) {
      return 0;
    }
    return Math.ceil(moneyMax / (moneyAvail * ns.hackAnalyze(hostname)));
  };
  /**
   * @param {string} hostname
   * @returns {number}
   */
  const getWeakThreads = (hostname) =>
    Math.ceil(
      (ns.getServerSecurityLevel(hostname) -
        ns.getServerMinSecurityLevel(hostname)) /
        WEAK_AMOUNT
    );
  /** @param {number} growsRemaining */
  const weakensForGrow = (growsRemaining) =>
    Math.ceil(ns.growthAnalyzeSecurity(growsRemaining) / WEAK_AMOUNT);
  /** @param {number} hacksRemaining */
  const weakensForHack = (hacksRemaining) =>
    Math.ceil(ns.hackAnalyzeSecurity(hacksRemaining) / WEAK_AMOUNT);

  /**
   * @param {Server} destination
   * @returns {number}
   */
  const getGrowTime = (destination) =>
    Math.ceil(ns.getGrowTime(destination.hostname));
  /**
   * @param {Server} destination
   * @returns {number}
   */
  const getWeakTime = (destination) =>
    Math.ceil(ns.getWeakenTime(destination.hostname));
  /**
   * @param {Server} destination
   * @returns {number}
   */
  const getHackTime = (destination) =>
    Math.ceil(ns.getHackTime(destination.hostname));

  /** @param {Server} destination */
  const report = (destination) => {
    const moneyCurr = ns.getServerMoneyAvailable(destination.hostname);
    const moneyMax = ns.getServerMaxMoney(destination.hostname);
    const securityCurr = ns.getServerSecurityLevel(destination.hostname);
    const securityMin = ns.getServerMinSecurityLevel(destination.hostname);
    log(`--- Report for ${destination.hostname} ---`);
    log(
      `  Money   : (${formatPercent(moneyCurr / moneyMax)}) ${formatMoney(
        moneyCurr
      )} / ${formatMoney(moneyMax)}`
    );
    log(
      `  Security: (${formatPercent(
        securityMin / securityCurr
      )}) ${format2Decimals(securityCurr)} / ${format2Decimals(securityMin)}`
    );
  };

  /**
   * @param {string} hostname
   * @returns {boolean}
   */
  const tryNuke = (hostname) => {
    if (isOwned(hostname)) {
      return false;
    }

    const server = ns.getServer(hostname);
    const user = ns.getPlayer();

    if (user.hacking < server.requiredHackingSkill) {
      log(
        `Expected hacking level ${server.requiredHackingSkill} for ${server.hostname}, got: ${user.hacking}`,
        'warning'
      );
      return false;
    }

    if (server.sshPortOpen === false && ns.fileExists('BruteSSH.exe')) {
      ns.brutessh(server.hostname);
    }

    if (server.ftpPortOpen === false && ns.fileExists('FTPCrack.exe')) {
      ns.ftpcrack(server.hostname);
    }

    if (server.smtpPortOpen === false && ns.fileExists('relaySMTP.exe')) {
      ns.relaysmtp(server.hostname);
    }

    if (server.httpPortOpen === false && ns.fileExists('HTTPWorm.exe')) {
      ns.httpworm(server.hostname);
    }

    if (server.sqlPortOpen === false && ns.fileExists('SQLInject.exe')) {
      ns.sqlinject(server.hostname);
    }

    if (server.openPortCount >= ns.getServerNumPortsRequired(server.hostname)) {
      ns.nuke(server.hostname);
    }

    if (server.backdoorInstalled === false) {
      // ns.installBackdoor(server.hostname);
    }

    return ns.hasRootAccess(server.hostname);
  };
  /** @param {Set<string>} nukedHostnames */
  const installAgents = async (nukedHostnames) => {
    for (const server of getControlledServers(nukedHostnames)) {
      if (isHome(server.hostname)) {
        continue;
      }
      ns.killall(server.hostname);
      for (const script of AGENT_PAYLOAD) {
        ns.rm(script, server.hostname);
        await ns.scp(script, currentHost, server.hostname);
      }
    }
  };
  /**
   * @param {Set<string>} nukedHostnames
   * @param {Server} destination
   * @param {AgentScript} script
   */
  const killScriptOnAllServers = (nukedHostnames, destination, script) => {
    for (const server of getControlledServers(nukedHostnames)) {
      for (const process of ns.ps(server.hostname)) {
        if (process.filename === script) {
          process.args.splice(0, 1, destination.hostname);
          ns.kill(process.filename, server.hostname, ...process.args);
        }
      }
    }
  };
  const createTraversal = () => {
    const visited = new Set();
    const nukedHostnames = new Set();
    /**
     * @param {string} hostname
     * @param {number} depth
     * @returns {Set<string>}
     */
    return function traverse(hostname, depth = 0) {
      for (const nextHostname of ns.scan(hostname)) {
        if (isOwned(nextHostname) || visited.has(nextHostname)) {
          continue;
        }
        visited.add(nextHostname);
        if (tryNuke(nextHostname) === true) {
          nukedHostnames.add(nextHostname);
        }
        traverse(nextHostname, depth + 1);
      }
      return nukedHostnames;
    };
  };
  /**
   * @param {Set<string>} nukedHostnames
   * @returns {Server[]}
   */
  const getControlledServers = (nukedHostnames) =>
    [ROOT_NODE, ...nukedHostnames, ...ns.getPurchasedServers()]
      .map((hostname) => ns.getServer(hostname))
      .sort((a, b) => b.cpuCores * b.maxRam - a.cpuCores * a.maxRam);
  /**
   * @param {Set<string>} nukedHostnames
   * @returns {Server[]}
   */
  const getRankedDestinations = (nukedHostnames) => {
    const rankedDestinations = [];
    for (const hostname of nukedHostnames) {
      const server = ns.getServer(hostname);
      if (server.moneyMax === 0) {
        continue;
      }
      rankedDestinations.push(server);
    }
    return rankedDestinations.sort((a, b) => b.moneyMax - a.moneyMax);
  };

  /**
   * @param {Server} source
   * @param {Server} destination
   * @param {AgentScript} script
   * @param {{threadsNeeded: number, delay: number}} options
   * @returns {{threadsSpawned: number, threadsRemaining: number, ramUsed: number} | null}
   */
  const execScript = (
    source,
    destination,
    script,
    { threadsNeeded, delay }
  ) => {
    const scriptCost = ns.getScriptRam(script);
    const availRam =
      ns.getServerMaxRam(source.hostname) -
      ns.getServerUsedRam(source.hostname);
    const threadsAvail = Math.floor(availRam / scriptCost);
    if (threadsNeeded === 0 || threadsAvail === 0) {
      return null;
    }
    const threads = threadsAvail > threadsNeeded ? threadsNeeded : threadsAvail;
    const scriptArgs = [destination.hostname, delay.toString()];
    if (ns.exec(script, source.hostname, threads, ...scriptArgs) !== 0) {
      return {
        threadsSpawned: threads,
        threadsRemaining: threadsNeeded - threads,
        ramUsed: scriptCost * threads,
      };
    }
    return null;
  };
  /**
   * @param {Set<string>} nukedHostnames
   * @param {Server} destination
   * @returns {Promise<number>}
   */
  const dispatchWeak = async (nukedHostnames, destination) => {
    let weakensRemaining = getWeakThreads(destination.hostname);
    let longestTimeTaken = -Infinity;
    while (weakensRemaining > 0) {
      const currentTimeTaken = getWeakTime(destination);
      if (currentTimeTaken > longestTimeTaken) {
        longestTimeTaken = currentTimeTaken;
      }
      weakensRemaining = getWeakThreads(destination.hostname);
      if (weakensRemaining === 0) {
        break;
      }
      log(
        `Weakening ${destination.hostname} with ${formatThreads(
          weakensRemaining
        )} threads in ${ns.tFormat(currentTimeTaken)}`
      );
      for (const source of getControlledServers(nukedHostnames)) {
        if (weakensRemaining < 1) {
          break;
        }
        const res = execScript(source, destination, AGENT_WEAK_SCRIPT, {
          threadsNeeded: weakensRemaining,
          delay: 0,
        });
        if (res != null) {
          weakensRemaining = res.threadsRemaining;
        }
      }
      await ns.sleep(DISPATCH_INTERVAL);
    }
    return longestTimeTaken;
  };
  /**
   * @param {Set<string>} nukedHostnames
   * @param {Server} destination
   * @returns {Promise<number>}
   */
  const dispatchGrow = async (nukedHostnames, destination) => {
    let growsRemaining = getGrowThreads(destination.hostname);
    let weakensRemaining = weakensForGrow(growsRemaining);
    let longestTimeTaken = -Infinity;
    while (growsRemaining > 0) {
      const currentTimeTaken = Math.max(
        getGrowTime(destination),
        getWeakTime(destination)
      );
      if (currentTimeTaken > longestTimeTaken) {
        longestTimeTaken = currentTimeTaken;
      }
      growsRemaining = getGrowThreads(destination.hostname);
      weakensRemaining = weakensForGrow(growsRemaining);
      if (growsRemaining === 0) {
        break;
      }
      log(
        `Growing ${destination.hostname} with ${formatThreads(
          growsRemaining
        )} threads in ${ns.tFormat(currentTimeTaken)}`
      );
      for (const source of getControlledServers(nukedHostnames)) {
        if (growsRemaining < 1) {
          break;
        }
        const weakRes = execScript(source, destination, AGENT_WEAK_SCRIPT, {
          threadsNeeded: weakensRemaining,
          delay: 0,
        });
        if (weakRes != null) {
          weakensRemaining = weakRes.threadsRemaining;
        }
        const growRes = execScript(source, destination, AGENT_GROW_SCRIPT, {
          threadsNeeded: growsRemaining,
          delay: 0,
        });
        if (growRes != null) {
          growsRemaining = growRes.threadsRemaining;
        }
      }
      await ns.sleep(DISPATCH_INTERVAL);
    }
    return longestTimeTaken;
  };
  /**
   * @param {Set<string>} nukedHostnames
   * @param {Server} destination
   * @returns {Promise<number>}
   */
  const dispatchHack = async (nukedHostnames, destination) => {
    let hacksRemaining = getHackThreads(destination.hostname);
    let weakensRemaining = weakensForHack(hacksRemaining);
    let longestTimeTaken = -Infinity;
    while (hacksRemaining > 0) {
      const currentTimeTaken = Math.max(
        getHackTime(destination),
        getWeakTime(destination)
      );
      if (currentTimeTaken > longestTimeTaken) {
        longestTimeTaken = currentTimeTaken;
      }
      hacksRemaining = getHackThreads(destination.hostname);
      weakensRemaining = weakensForHack(hacksRemaining);
      if (hacksRemaining === 0) {
        break;
      }
      log(
        `Hacking ${destination.hostname} with ${formatThreads(
          hacksRemaining
        )} threads in ${ns.tFormat(currentTimeTaken)}`
      );
      for (const source of getControlledServers(nukedHostnames)) {
        if (hacksRemaining < 1) {
          break;
        }
        const weakRes = execScript(source, destination, AGENT_WEAK_SCRIPT, {
          threadsNeeded: weakensRemaining,
          delay: 0,
        });
        if (weakRes != null) {
          weakensRemaining = weakRes.threadsRemaining;
        }
        const hackRes = execScript(source, destination, AGENT_HACK_SCRIPT, {
          threadsNeeded: hacksRemaining,
          delay: 0,
        });
        if (hackRes != null) {
          hacksRemaining = hackRes.threadsRemaining;
        }
      }
      await ns.sleep(DISPATCH_INTERVAL);
    }
    return longestTimeTaken;
  };

  /**
   * Note: This is an infinite loop cycling through servers
   * @param {Set<string>} nukedHostnames
   */
  const orchestrateControlledServers = async (nukedHostnames) => {
    const rankedDestinations = getRankedDestinations(nukedHostnames);
    for (const destinationIdx of makeCycle(0, rankedDestinations.length - 1)) {
      const traverse = createTraversal();
      const newTraversedHostnames = traverse(currentHost);
      if (newTraversedHostnames.size !== nukedHostnames.size) {
        log(`New nukable servers detected`, 'warning');
        return;
      }
      const destination = rankedDestinations[destinationIdx];
      if (destination == null) {
        continue;
      }
      const moneyAvail = ns.getServerMoneyAvailable(destination.hostname);
      const moneyMax = ns.getServerMaxMoney(destination.hostname);
      const securityLevel = ns.getServerSecurityLevel(destination.hostname);
      const minSecurityLevel = ns.getServerMinSecurityLevel(
        destination.hostname
      );

      if (minSecurityLevel < securityLevel) {
        killScriptOnAllServers(nukedHostnames, destination, AGENT_GROW_SCRIPT);
        killScriptOnAllServers(nukedHostnames, destination, AGENT_HACK_SCRIPT);
        await dispatchWeak(nukedHostnames, destination);
        report(destination);
        continue;
      }

      if (minSecurityLevel === securityLevel) {
        killScriptOnAllServers(nukedHostnames, destination, AGENT_WEAK_SCRIPT);
      }

      if (moneyAvail < moneyMax) {
        killScriptOnAllServers(nukedHostnames, destination, AGENT_HACK_SCRIPT);
        await dispatchGrow(nukedHostnames, destination);
        report(destination);
      }

      if (moneyAvail === moneyMax) {
        killScriptOnAllServers(nukedHostnames, destination, AGENT_GROW_SCRIPT);
        await dispatchHack(nukedHostnames, destination);
        report(destination);
      }

      await ns.sleep(LOOP_INTERVAL);
    }
  };

  while (true) {
    const traverse = createTraversal();
    const nukedHostnames = traverse(currentHost);
    await installAgents(nukedHostnames);
    await orchestrateControlledServers(nukedHostnames);
    await ns.sleep(LOOP_INTERVAL);
  }
}
