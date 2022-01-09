/**
 * @typedef { import('./bitburner.d').NS } NS
 * @typedef {{
 *  stat: 'hck' | 'com' | 'cha',
 * }} ScriptOptions
 */

import { calculateMean } from './utils';

const TARGET_BASE = 5_000;
const INTERVAL = 12_000;

/** @param {NS} ns */
export async function main(ns) {
  ns.tail();
  ns.disableLog('disableLog');
  ns.disableLog('sleep');

  /** @type {ScriptOptions} */
  const FLAGS = ns.flags([['stat', 'com']]);

  while (true) {
    for (const memberName of ns.gang.getMemberNames()) {
      const member = ns.gang.getMemberInformation(memberName);
      let shouldAscend = false;
      switch (FLAGS.stat) {
        case 'cha':
          if (member.cha_exp > TARGET_BASE) {
            shouldAscend = true;
          }
          if (member.task !== 'Train Charisma') {
            ns.gang.setMemberTask(member.name, 'Train Charisma');
          }
          break;
        case 'com':
          let meanExp = calculateMean([
            member.agi_exp,
            member.def_exp,
            member.dex_exp,
            member.str_exp,
          ]);
          if (meanExp > TARGET_BASE) {
            shouldAscend = true;
          }
          if (member.task !== 'Train Combat') {
            ns.gang.setMemberTask(member.name, 'Train Combat');
          }
          break;
        case 'hck':
          if (member.hack_exp > TARGET_BASE) {
            shouldAscend = true;
          }
          if (member.task !== 'Train Hacking') {
            ns.gang.setMemberTask(member.name, 'Train Hacking');
          }
          break;
        default:
          throw new Error(`Unknown flag value for stat: ${FLAGS.stat}`);
      }
      if (shouldAscend) {
        ns.gang.ascendMember(member.name);
      }
    }
    await ns.sleep(INTERVAL);
  }
}
