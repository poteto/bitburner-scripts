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

    //storage place for current prices - how do I know what products I want to sell on each industry?

    //initiate price dictionary
    let priceDic = { 
        'Software': {
            'Aevum' : { 'AI Cores': 0 }, 
            'Chongqing' : { 'AI Cores': 0 }, 
            'Sector-12' : { 'AI Cores': 0 }, 
            'New Tokyo' : { 'AI Cores': 0 }, 
            'Ishima' : { 'AI Cores': 0 }, 
            'Volhaven' : { 'AI Cores': 0 }, 
        },
        'Agriculture': {
            'Aevum' : { 'Food': 0, 'Plants' : 0 }, 
            'Chongqing' : { 'Food': 0, 'Plants' : 0 },
            'Sector-12' : { 'Food': 0, 'Plants' : 0 },
            'New Tokyo' : { 'Food': 0, 'Plants' : 0 },
            'Ishima' : { 'Food': 0, 'Plants' : 0 }, 
            'Volhaven' : { 'Food': 0, 'Plants' : 0 },
        }, 
        'Chemical': {
            'Aevum' : { 'Chemicals': 0 }, 
            'Chongqing' : { 'Chemicals': 0 }, 
            'Sector-12' : { 'Chemicals': 0 }, 
            'New Tokyo' : { 'Chemicals': 0 }, 
            'Ishima' : { 'Chemicals': 0 },  
            'Volhaven' : { 'Chemicals': 0 }, 
        }, 
        'Fishing': {
            'Aevum' : { 'Food': 0 }, 
            'Chongqing' : { 'Food': 0 }, 
            'Sector-12' : { 'Food': 0 }, 
            'New Tokyo' : { 'Food': 0 }, 
            'Ishima' : { 'Food': 0 },  
            'Volhaven' : { 'Food': 0 }, 
        }, 
        'Utilities': {
            'Aevum' : { 'Water': 0 }, 
            'Chongqing' : { 'Water': 0 }, 
            'Sector-12' : { 'Water': 0 }, 
            'New Tokyo' : { 'Water': 0 }, 
            'Ishima' : { 'Water': 0 },  
            'Volhaven' : { 'Water': 0 }, 
        }, 
        'Energy': {
            'Aevum' : { 'Energy': 0 }, 
            'Chongqing' : { 'Energy': 0 }, 
            'Sector-12' : { 'Energy': 0 }, 
            'New Tokyo' : { 'Energy': 0 }, 
            'Ishima' : { 'Energy': 0 },  
            'Volhaven' : { 'Energy': 0 }, 
        }, 
        //extend for other businesses not implmented yet
    };

    



    /** @param {string} divName */
    const setPrice = (divName) => {
        log("Division Name: " + divName, 'info');
        const division = ns.corporation.getDivision(divName);
        division.cities.forEach(city => {
            const office = ns.corporation.getOffice(divName, city);
            if(office != null){
                //do product math here
                //dont know what current prices are so need to start at zero and store it
            }
        });

    };


    //start corp
    //do this manually by going to city hall - need to have a corp before we can start this script

    //Get Corp data
    const corp = ns.corporation.getCorporation();
    if(corp != null)
    {
        log('We have a corp : ' + corp.name + ' - ' + formatMoney(corp.funds) , 'info');
        
        //loop through divisions if we have them and check products for sale and set the prices
        while(true)
        {
            DIVISION_TYPES.forEach(setPrice);
            ns.sleep(60000); //sleep a minute before going through again
        }

    }
    else
    {
        log('Go to city hall, buy a corp then try this again.', 'info');
    }
    ns.exit();

}
