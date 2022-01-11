/**
 * @typedef { import('./bitburner.d').NS } NS
 * @typedef { import('./bitburner.d').Corporation } Corporation
 * @typedef { import('./bitburner.d').Warehouse } Warehouse
 * @typedef { import('./bitburner.d').Material } Material
 * @typedef { import('./bitburner.d').Product } Product
 */
 import { DivisionCode, DIVISION_OUTPUTS } from './constants.js';

 import createLogger from './create-logger.js';

 /** @param {NS} ns **/
 export async function main(ns) {
   ns.tail();
   const log = createLogger(ns);

   /** @type {Map<string, number>} */
   const mpRatios = new Map();

   /** @param {string} divName */
   const setPrice = (divName) => {
     const division = ns.corporation.getDivision(divName);
     division.cities.forEach((city) => {
       const office = ns.corporation.getOffice(divName, city);
       if (office != null) {
         //do product math here
         //dont know what current prices are so need to start at zero and store it
       }
     });
   };

   const corp = ns.corporation.getCorporation();
   if (corp == null) {
     throw new Error(
       `Couldn't get the corporation, are you sure you bought one?`
     );
   }
   for (const divisionType of Object.keys(DivisionCode)) {
     try {
       const division = ns.corporation.getDivision(divisionType);
       const outputs = DIVISION_OUTPUTS.get(division);
       for (const cityName of division.cities) {

       }
     } catch {
       continue;
     }
   }
 }
