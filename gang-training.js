/**
 * @typedef { import('./bitburner.d').NS } NS
 * @typedef {{
 *  stat: 'hck' | 'com' | 'cha',
 * }} ScriptOptions
 */

import createLogger from './create-logger.js';

const TARGET_XP = 5_000;
const INTERVAL = 12_000;

/** @param {NS} ns */
export async function main(ns) {
  ns.tail();
  ns.disableLog('disableLog');
  ns.disableLog('sleep');

  const log = createLogger(ns);
  /** @type {ScriptOptions} */
  const FLAGS = ns.flags([['stat', 'com']]);

  while (true) {
    for (const memberName of ns.gang.getMemberNames()) {
      const member = ns.gang.getMemberInformation(memberName);
      switch (FLAGS.stat) {
        case 'cha':
          if (member.cha_exp > TARGET_XP) {
            ns.gang.ascendMember(member.name);
          }
          if (member.task !== 'Train Charisma') {
            ns.gang.setMemberTask(member.name, 'Train Charisma');
          }
          break;
        case 'com':
          let sum = 0;
          for (const stat of [
            member.agi_exp,
            member.def_exp,
            member.dex_exp,
            member.str_exp,
          ]) {
            sum += stat;
          }
          const mean = sum / 4;
          if (mean > TARGET_XP) {
            ns.gang.ascendMember(member.name);
          }
          if (member.task !== 'Train Combat') {
            ns.gang.setMemberTask(member.name, 'Train Combat');
          }
          break;
        case 'hck':
          if (member.hack_exp > TARGET_XP) {
            ns.gang.ascendMember(member.name);
          }
          if (member.task !== 'Train Hacking') {
            ns.gang.setMemberTask(member.name, 'Train Hacking');
          }
          break;
        default:
          throw new Error(`Unknown flag value for stat: ${FLAGS.stat}`);
      }
    }
    await ns.sleep(INTERVAL);
  }
}
