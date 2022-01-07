/** 
 * @typedef { import('./bitburner.d').NS } NS 
 * @typedef { import('./bitburner.d').Corporation } Corporation
 * @typedef { import('./bitburner.d').Warehouse } Warehouse
 * @typedef { import('./bitburner.d').Material } Material
 * @typedef { import('./bitburner.d').Product } Product
 * @typedef {{
 *  start: number,
 *  end: number,
 *  order: 'asc' | 'desc',
 *  strategy: 'efficiency' | 'maxmoney',
 *  force: boolean
 * }} ScriptOptions
 */
 import {
    CITY_NAMES,
    DIVISION_TYPES
  } from './constants.js';

import createLogger from './create-logger.js';
import formatTable from './format-table.js';

/** @param {NS} ns **/
export async function main(ns) {
    ns.tail();
    ns.disableLog('disableLog');
    ns.disableLog('scp');
    ns.disableLog('exec');
    ns.disableLog('rm');
    ns.disableLog('sleep');
  
    /** @type {ScriptOptions} */
    const FLAGS = ns.flags([
      ['start', 0], // Which index to start picking targets
      ['end', Infinity], // Which index to end picking targets
      ['order', 'desc'], // What order to sort targets
      ['strategy', 'efficiency'], // What strategy to use when sorting targets
      ['force', false], // Whether to killall when running the script
    ]);
    const log = createLogger(ns);
    const HAS_FORMULAS = ns.fileExists('Formulas.exe');
  
    /** @param {number} n */
    const formatThreads = (n) => ns.nFormat(n, '0,0.0a');
    /** @param {number} n */
    const formatMoney = (n) => ns.nFormat(n, '($0.00a)');
    /** @param {number} n */
    const format2Decimals = (n) => ns.nFormat(n, '0,0.00');
    /** @param {number} n */
    const formatPercent = (n) => ns.nFormat(n, '000.0%');


    //start corp
    //do this manually by going to city hall - need to have a corp before we can start this script

    //Get Corp data
    const corp = ns.corporation.getCorporation();
    if(corp != null)
    {
        log('We have a corp : ' + corp.name, 'info');
    }
    ns.exit();

}
