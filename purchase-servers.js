import createLogger from './create-logger.js';
import { AGENT_SCRIPT } from './manhattan.js';

const FLEET_PREFIX = 'fleet-node';
const ROOT_NODE = 'home';
const INTERVAL = 12_000;

/** @param {NS} ns **/
export async function main(ns) {
    ns.tail();
    ns.disableLog('getServerMoneyAvailable');
    ns.disableLog('sleep');
    ns.disableLog('getServerMaxRam');
    ns.disableLog('deleteServer');
    ns.disableLog('purchaseServer');
    ns.disableLog('killall');

    const log = createLogger(ns);
    const insufficientFunds = cost => log(
        `Need: ${ns.nFormat(cost, '($0.00a)')}, have: ${ns.nFormat(ns.getServerMoneyAvailable(ROOT_NODE), '($0.00a)')}`,
        'warning'
    );
    const getExponent = x => Math.ceil(Math.log(x) / Math.log(2));

    const maxFleetRam = ns.getPurchasedServerMaxRam();
    const fleetLimit = ns.getPurchasedServerLimit();
    const firstMachineRam = Math.pow(2, getExponent(ns.getScriptRam(AGENT_SCRIPT)));

    while (ns.getPurchasedServers().length < fleetLimit) {
        const cost = ns.getPurchasedServerCost(firstMachineRam);
        while (ns.getServerMoneyAvailable(ROOT_NODE) < cost) {
            insufficientFunds(cost);
            await ns.sleep(INTERVAL);
        }
        ns.purchaseServer(`${FLEET_PREFIX}-${ns.getPurchasedServers().length}`, firstMachineRam);
    }

    while (true) {
        let lowestRam = Infinity;
        for (const server of ns.getPurchasedServers()) {
            const currentRam = ns.getServerMaxRam(server);
            if (currentRam < lowestRam) {
                lowestRam = currentRam;
            }
        }

        log(`Found lowest RAM: ${lowestRam}`);

        if (lowestRam === maxFleetRam) {
            log('Successfully maxed out fleet, exiting script', 'success');
            ns.exit();
        }

        for (const server of ns.getPurchasedServers()) {
            const currentRam = ns.getServerMaxRam(server);
            const nextRam = Math.pow(2, getExponent(lowestRam) + 1);
            if (currentRam !== lowestRam) {
                continue;
            }
            log(`Attempting to upgrade ${server} to ${nextRam}GB RAM`);
            const cost = ns.getPurchasedServerCost(nextRam);
            while (ns.getServerMoneyAvailable(ROOT_NODE) < cost) {
                insufficientFunds(cost);
                await ns.sleep(INTERVAL);
            }
            ns.killall(server);
            if (ns.deleteServer(server) === false) {
                throw new Error('Should never get here');
            }
            if (ns.purchaseServer(server, nextRam) === server) {
                log(`Upgraded ${server} to ${nextRam}GB RAM`, 'success');
            }
        }
    }
}