/**
 * @typedef { import('./bitburner.d').NS } NS
 * @typedef {{
 *  stat: 'hck' | 'com' | 'cha',
 * }} ScriptOptions
 */

import createLogger from './create-logger.js';

/** @param {NS} ns */
export async function main(ns) {
  ns.tail();

  const log = createLogger(ns);
  /** @type {ScriptOptions} */
  const FLAGS = ns.flags([['stat', 'com']]);

  for (const memberName of ns.gang.getMemberNames()) {
    const member = ns.gang.getMemberInformation(memberName);
    log(memberName);
    for (const [key, value] of Object.entries(member)) {
      log(`  ${key}: ${value}`);
    }
  }
}
