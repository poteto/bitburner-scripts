import { ROOT_NODE, FLEET_PREFIX } from './constants';

/** @param {string} hostname */
export const isHome = (hostname) => hostname === ROOT_NODE;
/** @param {string} hostname */
export const isFleet = (hostname) => hostname.startsWith(FLEET_PREFIX);
/** @param {string} hostname */
export const isOwned = (hostname) => isHome(hostname) || isFleet(hostname);
