/**
 * @typedef { import('./bitburner.d').NS } NS
 * @typedef { import('./bitburner.d').Corporation } Corporation
 * @typedef { import('./bitburner.d').Office } Warehouse
 * @typedef {{division: keyof typeof DivisionCode}} ScriptOptions
 */

import createLogger from './create-logger.js';
import { DivisionCode, EmployeeJob } from './constants.js';

const JOBS_TO_HIRE = new Set([
  EmployeeJob.ops,
  EmployeeJob.eng,
  EmployeeJob.biz,
  EmployeeJob.mgm,
]);
const INTERVAL = 12_000;

/** @param {NS} ns **/
export async function main(ns) {
  ns.tail();
  ns.disableLog('disableLog');

  const log = createLogger(ns);

  /** @type {ScriptOptions} */
  const FLAGS = ns.flags([['division', 'so']]);
  const divisionName = DivisionCode[FLAGS.division];

  if (divisionName == null) {
    throw new Error(`Unknown division code: ${FLAGS.division}`);
  }

  while (true) {
    for (const cityName of ns.corporation.getDivision(divisionName).cities) {
      const office = ns.corporation.getOffice(divisionName, cityName);
      if (office.size === office.employees.length) {
        log(
          `Upgrading office ${cityName} from ${office.size} to ${
            office.size + JOBS_TO_HIRE.size
          }`,
          'success'
        );
        ns.corporation.upgradeOfficeSize(
          divisionName,
          cityName,
          JOBS_TO_HIRE.size
        );
        ns.corporation.buyCoffee(divisionName, cityName);
      }
      for (const jobName of JOBS_TO_HIRE) {
        const newEmployee = ns.corporation.hireEmployee(divisionName, cityName);
        if (newEmployee == null) {
          continue;
        }
        await ns.corporation.assignJob(
          divisionName,
          cityName,
          newEmployee.name,
          jobName
        );
        log(
          `Hired ${newEmployee.name} in ${cityName} with job: ${jobName}`,
          'success'
        );
      }
    }
    await ns.sleep(INTERVAL);
  }
}
