/**
 * @typedef { import('./bitburner.d').NS } NS
 * @typedef { import('./bitburner.d').Server } Server
 * @typedef {AGENT_GROW_SCRIPT | AGENT_HACK_SCRIPT | AGENT_WEAK_SCRIPT} AgentScript
 * @typedef {{
 *  start: number,
 *  end: number,
 *  order: 'asc' | 'desc',
 *  percent: number
 * }} ScriptOptions
 */

import {
  AGENT_GROW_SCRIPT,
  AGENT_HACK_SCRIPT,
  AGENT_WEAK_SCRIPT,
  AGENT_PAYLOAD,
  ROOT_NODE,
  WEAK_AMOUNT,
} from './constants.js';
import createLogger from './create-logger.js';
import formatTable from './format-table.js';
import { isHome, isOwned } from './utils.js';

const DISPATCH_INTERVAL = 50;
const LOOP_INTERVAL = 50;
const DEFAULT_GROW_THREADS = 10_000;
const DEFAULT_HACK_THREADS = 10_000;

/**
 * @param {number} start
 * @param {number} end
 * @returns {Generator<number>}
 */
function* makeCycle(start, end) {
  let ii = start;
  while (true) {
    if (start === end) {
      yield start;
    }
    if (ii > end) {
      ii = start;
    }
    yield ii++;
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

  /** @type {ScriptOptions} */
  const FLAGS = ns.flags([
    ['start', 0], // Which index to start picking targets
    ['end', Infinity], // Which index to end picking targets
    ['order', 'asc'], // What order to sort targets
    ['percent', 0.5], // What percent to hack servers to
  ]);
  const log = createLogger(ns);
  const hasFormulas = ns.fileExists('Formulas.exe');

  /** @param {number} n */
  const formatThreads = (n) => ns.nFormat(n, '0,0.0a');
  /** @param {number} n */
  const formatMoney = (n) => ns.nFormat(n, '($0.00a)');
  /** @param {number} n */
  const format2Decimals = (n) => ns.nFormat(n, '0,0.00');
  /** @param {number} n */
  const formatPercent = (n) => ns.nFormat(n, '000.0%');

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
    return Math.abs(growRate) === Infinity
      ? DEFAULT_GROW_THREADS
      : Math.ceil(ns.growthAnalyze(hostname, growRate));
  };
  /**
   * @param {string} hostname
   * @returns {number}
   */
  const getHackThreads = (hostname) => {
    const moneyAvail = ns.getServerMoneyAvailable(hostname);
    if (moneyAvail === 0) {
      return 0;
    }
    const threads = Math.ceil(FLAGS.percent / ns.hackAnalyze(hostname));
    return Math.abs(threads) === Infinity ? DEFAULT_HACK_THREADS : threads;
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

  /**
   * @param {string} reportType
   * @param {Server} destination
   */
  const report = (reportType, destination) => {
    const moneyCurr = ns.getServerMoneyAvailable(destination.hostname);
    const moneyMax = ns.getServerMaxMoney(destination.hostname);
    const securityCurr = ns.getServerSecurityLevel(destination.hostname);
    const securityMin = ns.getServerMinSecurityLevel(destination.hostname);
    log(`--- ${reportType} Report for ${destination.hostname} ---`);
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

    if (
      ns.getServer(server.hostname).openPortCount >=
      ns.getServerNumPortsRequired(server.hostname)
    ) {
      ns.nuke(server.hostname);
    }

    if (server.backdoorInstalled === false) {
      // ns.installBackdoor(server.hostname);
    }

    return ns.hasRootAccess(server.hostname);
  };
  /** @param {Server[]} controlledServers */
  const installAgents = async (controlledServers) => {
    for (const server of controlledServers) {
      if (isHome(server.hostname)) {
        continue;
      }
      for (const script of AGENT_PAYLOAD) {
        ns.rm(script, server.hostname);
        await ns.scp(script, ROOT_NODE, server.hostname);
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
      .sort((a, b) => {
        if (isHome(a.hostname)) {
          return -1;
        }
        if (isHome(b.hostname)) {
          return 1;
        }
        return b.cpuCores * b.maxRam > a.cpuCores * a.maxRam ? 1 : -1;
      });
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
    return rankedDestinations.sort((a, b) =>
      FLAGS.order === 'desc' ? b.moneyMax - a.moneyMax : a.moneyMax - b.moneyMax
    );
  };

  /**
   * @param {Server} source
   * @param {Server} destination
   * @param {AgentScript} script
   * @param {{threadsNeeded: number, instanceId: string}} options
   * @returns {{threadsSpawned: number, threadsRemaining: number, ramUsed: number} | null}
   */
  const execScript = (
    source,
    destination,
    script,
    { threadsNeeded, instanceId }
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
    let id = Number(instanceId);
    for (const process of ns.ps(source.hostname)) {
      const [prevHostname, prevId] = process.args;
      if (
        process.filename !== script ||
        destination.hostname !== prevHostname
      ) {
        continue;
      }
      // Only a single instance of a script for a given set of args can be run at a time. To get
      // around this, bump instanceId by 1.
      const newId = Number(prevId) + 1;
      if (newId > Number(id)) {
        id = newId;
      }
    }
    if (
      ns.exec(
        script,
        source.hostname,
        threads,
        destination.hostname,
        id.toString()
      ) !== 0
    ) {
      return {
        threadsSpawned: threads,
        threadsRemaining: threadsNeeded - threads,
        ramUsed: scriptCost * threads,
      };
    }
    return null;
  };
  /**
   * @param {Server[]} controlledServers
   * @param {Server} destination
   * @returns {Promise<number>}
   */
  const dispatchWeak = async (controlledServers, destination) => {
    let weakensRemaining = getWeakThreads(destination.hostname);
    let longestTimeTaken = -Infinity;
    while (weakensRemaining > 0) {
      const currentTimeTaken = getWeakTime(destination);
      if (currentTimeTaken > longestTimeTaken) {
        longestTimeTaken = currentTimeTaken;
      }
      log(
        `  ↳ Weakening ${destination.hostname} with ${formatThreads(
          weakensRemaining
        )} threads in ${ns.tFormat(currentTimeTaken)}`,
        'success'
      );
      for (const source of controlledServers) {
        const res = execScript(source, destination, AGENT_WEAK_SCRIPT, {
          threadsNeeded: weakensRemaining,
          instanceId: '0',
        });
        if (res != null) {
          weakensRemaining = res.threadsRemaining;
          if (weakensRemaining < 1) {
            break;
          }
        }
      }
      await ns.sleep(DISPATCH_INTERVAL);
    }
    return longestTimeTaken;
  };
  /**
   * @param {Server[]} controlledServers
   * @param {Server} destination
   * @returns {Promise<number>}
   */
  const dispatchGrow = async (controlledServers, destination) => {
    const timeTaken = getGrowTime(destination);
    let growsRemaining = getGrowThreads(destination.hostname);
    let threadsSpawned = 0;
    for (const source of controlledServers) {
      const res = execScript(source, destination, AGENT_GROW_SCRIPT, {
        threadsNeeded: growsRemaining,
        instanceId: '0',
      });
      if (res != null) {
        growsRemaining = res.threadsRemaining;
        threadsSpawned += res.threadsSpawned;
        if (growsRemaining < 1) {
          break;
        }
      }
    }
    log(
      `  ↳ Growing ${destination.hostname} with ${formatThreads(
        threadsSpawned
      )} threads in ${ns.tFormat(timeTaken)}`,
      'success'
    );
    return timeTaken;
  };
  /**
   * @param {Server[]} controlledServers
   * @param {Server} destination
   * @returns {Promise<number>}
   */
  const dispatchHack = async (controlledServers, destination) => {
    const timeTaken = getHackTime(destination);
    let hacksRemaining = getHackThreads(destination.hostname);
    let threadsSpawned = 0;
    for (const source of controlledServers) {
      const res = execScript(source, destination, AGENT_HACK_SCRIPT, {
        threadsNeeded: hacksRemaining,
        instanceId: '0',
      });
      if (res != null) {
        hacksRemaining = res.threadsRemaining;
        threadsSpawned += res.threadsSpawned;
        if (hacksRemaining < 1) {
          break;
        }
      }
    }
    log(
      `  ↳ Hacking ${destination.hostname} with ${formatThreads(
        threadsSpawned
      )} threads in ${ns.tFormat(timeTaken)}`,
      'success'
    );
    return timeTaken;
  };

  /**
   * Note: This is an infinite loop cycling through servers
   * @param {Server[]} controlledServers
   * @param {Server[]} rankedDestinations
   */
  const orchestrateControlledServers = async (
    controlledServers,
    rankedDestinations
  ) => {
    const cycleEnd =
      FLAGS.end === Infinity
        ? rankedDestinations.length - 1
        : Math.min(FLAGS.end, rankedDestinations.length - 1);
    for (const destinationIdx of makeCycle(FLAGS.start, cycleEnd)) {
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
        report('WEAK', destination);
        await dispatchWeak(controlledServers, destination);
      }

      if (moneyAvail < moneyMax) {
        report('GROW', destination);
        await dispatchGrow(controlledServers, destination);
      }

      if (moneyAvail === moneyMax) {
        report('HACK', destination);
        await dispatchHack(controlledServers, destination);
      }

      await ns.sleep(LOOP_INTERVAL);
    }
  };
  /**
   * @param {Server} destination
   * @param {boolean} hasFormulas
   */
  const getEstimatedGrowTime = (destination, hasFormulas) => {
    if (hasFormulas) {
      const player = ns.getPlayer();
      const mockServer = Object.assign({}, destination);
      mockServer.moneyAvailable = destination.moneyMax * FLAGS.percent;
      mockServer.hackDifficulty = destination.minDifficulty;
      return ns.formulas.hacking.growTime(mockServer, player);
    }
    return getGrowTime(destination);
  };
  /**
   * @param {Server} destination
   * @param {boolean} hasFormulas
   */
  const getEstimatedHackTime = (destination, hasFormulas) => {
    if (hasFormulas) {
      const player = ns.getPlayer();
      const mockServer = Object.assign({}, destination);
      mockServer.hackDifficulty = destination.minDifficulty;
      mockServer.moneyAvailable = destination.moneyMax;
      return ns.formulas.hacking.hackTime(mockServer, player);
    }
    return getWeakTime(destination);
  };
  /**
   * @param {Server} destination
   * @param {boolean} hasFormulas
   */
  const getEstimatedWeakTime = (destination, hasFormulas) => {
    if (hasFormulas) {
      const player = ns.getPlayer();
      const mockServer = Object.assign({}, destination);
      mockServer.hackDifficulty = destination.baseDifficulty;
      return ns.formulas.hacking.weakenTime(mockServer, player);
    }
    return getWeakTime(destination);
  };
  /** @param {Server} destination */
  const getGrowPercent = (destination) =>
    ns.formulas.hacking.growPercent(destination, 1, ns.getPlayer());
  /**
   * @param {Server} destination
   * @param {boolean} hasFormulas
   */
  const getEstimatedEfficiency = (destination, hasFormulas) => {
    const hackTime = getEstimatedHackTime(destination, hasFormulas);
    const growTime = getEstimatedGrowTime(destination, hasFormulas);
    const weakTime = getEstimatedWeakTime(destination, hasFormulas);
    let growPercent = 0;
    if (hasFormulas) {
      growPercent = getGrowPercent(destination);
    } else {
      growPercent = destination.serverGrowth / 100;
    }
    return (
      (destination.moneyMax * growPercent) /
      ((hackTime + growTime + weakTime) / 1_000)
    );
  };

  const traverse = createTraversal();
  const nukedHostnames = traverse(ROOT_NODE);
  const controlledServers = getControlledServers(nukedHostnames);
  const rankedDestinations = getRankedDestinations(nukedHostnames);
  ns.tprint(
    '\n' +
      formatTable({
        headers: [
          'INDEX',
          'HOSTNAME',
          'MAX MONEY',
          'GROW RATE',
          'EST. HACK TIME',
          'EST. GROW TIME',
          'EST. WEAKEN TIME',
          'EST. EFFICIENCY',
        ],
        rows: rankedDestinations.map((destination, index) => [
          `${ns.nFormat(index, '00')}`,
          destination.hostname,
          `${formatMoney(destination.moneyMax)}`,
          `${destination.serverGrowth}`,
          `${ns.tFormat(getEstimatedHackTime(destination, hasFormulas))}`,
          `${ns.tFormat(getEstimatedGrowTime(destination, hasFormulas))}`,
          `${ns.tFormat(getEstimatedWeakTime(destination, hasFormulas))}`,
          `${formatMoney(getEstimatedEfficiency(destination, hasFormulas))}/s`,
        ]),
        columnLengths: [6, 25, 10, 10, 30, 30, 30, 15],
      })
  );
  await installAgents(controlledServers);
  await orchestrateControlledServers(controlledServers, rankedDestinations);
}
