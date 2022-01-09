/**
 * @typedef { import('./bitburner.d').NS } NS
 * @typedef {{ task: keyof GANG_TASKS }} ScriptOptions
 */

import { GANG_TASKS } from './constants';

/** @param {NS} ns */
export async function main(ns) {
  /** @type {ScriptOptions} */
  const FLAGS = ns.flags([['task', 'tw']]);
  for (const memberName of ns.gang.getMemberNames()) {
    if (ns.gang.setMemberTask(memberName, GANG_TASKS[FLAGS.task])) {
      ns.tprint(`Set ${memberName} to ${GANG_TASKS[FLAGS.task]}`);
    } else {
      ns.tprint(`Couldn't set ${memberName} to ${GANG_TASKS[FLAGS.task]}`);
    }
  }
}
