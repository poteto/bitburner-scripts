/**
 * @typedef { import('./bitburner.d').NS } NS
 */

import { GangUpgradeType } from './constants';

const INTERVAL = 12_000;

/** @param {NS} ns */
export async function main(ns) {
  ns.tail();
  ns.disableLog('disableLog');
  ns.disableLog('sleep');

  while (true) {
    const equipment = ns.gang
      .getEquipmentNames()
      .map((name) => {
        return {
          name,
          cost: ns.gang.getEquipmentCost(name),
          type: ns.gang.getEquipmentType(name),
        };
      })
      .sort((a, b) => a.cost - b.cost);

    for (const memberName of ns.gang.getMemberNames()) {
      const member = ns.gang.getMemberInformation(memberName);
      const upgrades = new Set(member.upgrades);
      const augmentations = new Set(member.augmentations);
      outer: for (const item of equipment) {
        switch (item.type) {
          case GangUpgradeType.Armor:
          case GangUpgradeType.Vehicle:
          case GangUpgradeType.Weapon:
          case GangUpgradeType.Rootkit:
            if (upgrades.has(item.name)) {
              continue outer;
            }
            break;
          case GangUpgradeType.Augmentation:
            if (augmentations.has(item.name)) {
              continue outer;
            }
            break;
          default:
            throw new Error(`Unknown item type ${item.type} for ${item.name}`);
        }
        ns.gang.purchaseEquipment(member.name, item.name);
      }
    }
    await ns.sleep(INTERVAL);
  }
}
