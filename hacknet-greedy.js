/**
 * Greedy hacknet purchasing algorithm. Polls indefinitely until the script is killed.
 */

const INTERVAL = 10_000;

function createLogger(ns) {
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
    ns.tail();
    ns.disableLog('getServerMoneyAvailable');
    ns.disableLog('sleep');

    const log = createLogger(ns);
    const insufficientFunds = async (cost) => log(
        `Need: ${ns.nFormat(cost, '($0.00a)')}, have: ${ns.nFormat(ns.getServerMoneyAvailable('home'), '($0.00a)')}`,
        'warning'
    );

    while (true) {
        let cheapest = {
            cost: Infinity,
            name: null,
            index: null,
        }

        for (let index = 0; index < ns.hacknet.numNodes(); index++) {
            const costs = {
                node: ns.hacknet.getPurchaseNodeCost(),
                level: ns.hacknet.getLevelUpgradeCost(index, 10),
                ram: ns.hacknet.getRamUpgradeCost(index, 2),
                core: ns.hacknet.getCoreUpgradeCost(index, 1),
            };

            for (const [name, cost] of Object.entries(costs)) {
                if (cost < cheapest.cost) {
                    cheapest.cost = cost;
                    cheapest.name = name;
                    cheapest.index = index;
                }
            }
        }

        if (cheapest.name != null && cheapest.index != null) {
            log(`Found cheapest upgrade: hacknet-node-${cheapest.index}, ${cheapest.name}`);
            while (ns.getServerMoneyAvailable('home') < cheapest.cost) {
                await insufficientFunds(cheapest.cost);
                await ns.sleep(INTERVAL);
            }
            switch (cheapest.name) {
                case 'node':
                    if (ns.hacknet.purchaseNode() === true) {
                        log(`Successfully purchased hacknet-node-${index}`, 'success');
                    }
                    break;
                case 'level':
                    if (ns.hacknet.upgradeLevel(cheapest.index, 10)) {
                        log(`Successfully upgraded hacknet-node-${cheapest.index} level`, 'success');
                    }
                    break;
                case 'ram':
                    if (ns.hacknet.upgradeRam(cheapest.index, 2)) {
                        log(`Successfully upgraded hacknet-node-${cheapest.index} RAM`, 'success');
                    }
                    break;
                case 'core':
                    if (ns.hacknet.upgradeCore(cheapest.index, 1)) {
                        log(`Successfully upgraded hacknet-node-${cheapest.index} cores`, 'success');
                    }
                    break;
                default:
                    throw new Error(`Unknown upgrade ${cheapest.name} for hacknet-node-${cheapest.node}`)
            }
        }
    }
}
