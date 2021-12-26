const TARGET_COUNT = 12;
const TARGET_LEVEL = 80;
const TARGET_RAM = 16;
const TARGET_CORES = 8;
const INTERVAL = 10_000;

function createLogger(ns) {
  return function log(msg, level = "info") {
    switch (level) {
      case "info":
        ns.print(`[INFO] ${msg}`);
        break;
      case "warning":
        ns.print(`[WARN] ${msg}`);
        break;
      case "error":
        ns.print(`[ERR ] ${msg}`);
        break;
      case "success":
        ns.print(`[ OK ] ${msg}`);
        break;
      default:
        throw new Error("Unhandled log level");
    }
  };
}

async function getHomeMoney(ns) {
  return ns.getServerMoneyAvailable("home");
}

/** @param {NS} ns **/
export async function main(ns) {
  ns.tail();
  ns.disableLog("disableLog");
  ns.disableLog("getServerMoneyAvailable");
  ns.disableLog("sleep");

  const log = createLogger(ns);
  const insufficientFunds = async (cost) =>
    log(
      `Need: ${ns.nFormat(cost, "($0.00a)")}, have: ${ns.nFormat(
        await getHomeMoney(ns),
        "($0.00a)"
      )}`,
      "warning"
    );

  while (ns.hacknet.numNodes() < TARGET_COUNT) {
    log(`Attempting to purchase hacknet-node-${ns.hacknet.numNodes() + 1}...`);
    const cost = ns.hacknet.getPurchaseNodeCost();
    if ((await getHomeMoney(ns)) < cost) {
      await insufficientFunds(cost);
      await ns.sleep(INTERVAL);
    }
    ns.hacknet.purchaseNode();
  }

  log(`Successfully purchased ${TARGET_COUNT} hacknet nodes`, "success");

  for (let i = 0; i < TARGET_COUNT; i++) {
    if (i >= ns.hacknet.numNodes()) {
      break;
    }
    while (ns.hacknet.getNodeStats(i).level <= TARGET_LEVEL) {
      log(`Attempting to upgrade hacknet-node-${i}: level`);
      const cost = ns.hacknet.getLevelUpgradeCost(i, 10);
      while ((await getHomeMoney(ns)) < cost) {
        await insufficientFunds(cost);
        await ns.sleep(INTERVAL);
      }
      ns.hacknet.upgradeLevel(i, 10);
    }
  }

  log(
    `Successfully upgraded all hacknet nodes to level ${TARGET_LEVEL}`,
    "success"
  );

  for (let i = 0; i < TARGET_COUNT; i++) {
    if (i >= ns.hacknet.numNodes()) {
      break;
    }
    while (ns.hacknet.getNodeStats(i).ram < TARGET_RAM) {
      log(`Attempting to upgrade hacknet-node-${i}: RAM`);
      const cost = ns.hacknet.getRamUpgradeCost(i, 2);
      while ((await getHomeMoney(ns)) < cost) {
        await insufficientFunds(cost);
        await ns.sleep(INTERVAL);
      }
      ns.hacknet.upgradeRam(i, 2);
    }
  }

  log(
    `Successfully upgraded all hacknet nodes' ${TARGET_RAM}gb of RAM`,
    "success"
  );

  for (let i = 0; i < TARGET_COUNT; i++) {
    if (i >= ns.hacknet.numNodes()) {
      break;
    }
    while (ns.hacknet.getNodeStats(i).cores < TARGET_CORES) {
      log(`Attempting to upgrade hacknet-node-${i}: cores`);
      const cost = ns.hacknet.getCoreUpgradeCost(i, 1);
      while ((await getHomeMoney(ns)) < cost) {
        await insufficientFunds(cost);
        await ns.sleep(INTERVAL);
      }
      ns.hacknet.upgradeCore(i, 1);
    }
  }

  log(
    `Successfully upgraded all hacknet nodes to ${TARGET_CORES} cores`,
    "success"
  );
}
