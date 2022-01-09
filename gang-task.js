/**
 * @typedef { import('./bitburner.d').NS } NS
 * @typedef {{ task: keyof GANG_TASKS }} ScriptOptions
 */

import { GANG_TASKS } from './constants';

/** @param {NS} ns */
export async function main(ns) {
  ns.tail();
  ns.disableLog('disableLog');

  /** @type {ScriptOptions} */
  const FLAGS = ns.flags([['task', 'tw']]);

  for (const memberName of ns.gang.getMemberNames()) {
    ns.gang.setMemberTask(memberName, GANG_TASKS[FLAGS.task]);
  }
}
