/**
 * @typedef { import('./bitburner.d').NS } NS
 * @typedef {{division: keyof typeof DivisionCode}} ScriptOptions
 */

import createLogger from './create-logger.js';
import { DivisionCode, EmployeeJob } from './constants.js';

const JOBS_TO_HIRE = [
  EmployeeJob.ops,
  EmployeeJob.eng,
  EmployeeJob.biz,
  EmployeeJob.mgm,
];
const INTERVAL = 3_000;

/** @param {NS} ns **/
export async function main(ns) {
  ns.tail();
  ns.disableLog('disableLog');
  ns.disableLog('sleep');

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
            office.size + JOBS_TO_HIRE.length
          }`,
        );
        ns.corporation.upgradeOfficeSize(
          divisionName,
          cityName,
          JOBS_TO_HIRE.length
        );
      }
      const unassignedEmployeeNames = office.employees.filter(
        (employeeName) =>
          ns.corporation.getEmployee(divisionName, cityName, employeeName)
            .pos === EmployeeJob.uns
      );
      for (let ii = 0; ii < unassignedEmployeeNames.length; ii++) {
        const employeeName = unassignedEmployeeNames[ii];
        const jobName = JOBS_TO_HIRE[ii % JOBS_TO_HIRE.length];
        await ns.corporation.assignJob(
          divisionName,
          cityName,
          employeeName,
          jobName
        );
        log(
          `Assigning ${employeeName} in ${cityName} from unassigned to ${jobName}`
        );
      }
      for (const jobName of JOBS_TO_HIRE) {
        const newEmployee = ns.corporation.hireEmployee(divisionName, cityName);
        if (newEmployee == null) {
          break;
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
