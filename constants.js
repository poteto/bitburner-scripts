export const ROOT_NODE = 'home';
export const FLEET_PREFIX = 'fleet-node';

export const AGENT_GROW_SCRIPT = 'agent-grow.js';
export const AGENT_HACK_SCRIPT = 'agent-hack.js';
export const AGENT_WEAK_SCRIPT = 'agent-weak.js';
export const AGENT_PAYLOAD = new Set([
  AGENT_GROW_SCRIPT,
  AGENT_HACK_SCRIPT,
  AGENT_WEAK_SCRIPT,
]);

export const WEAK_AMOUNT = 0.05;

export const GANG_TASKS = {
  u: 'Unassigned',
  mp: 'Mug People',
  dd: 'Deal Drugs',
  sc: 'Strongarm Civilians',
  rc: 'Run a Con',
  ar: 'Armed Robbery',
  tia: 'Traffic Illegal Arms',
  tb: 'Threaten & Blackmail',
  ht: 'Human Trafficking',
  t: 'Terrorism',
  vj: 'Vigilante Justice',
  tco: 'Train Combat',
  th: 'Train Hacking',
  tch: 'Train Charisma',
  tw: 'Territory Warfare',
};

/** @enum {string} */
export const GangUpgradeType = {
  Weapon: 'w',
  Armor: 'a',
  Vehicle: 'v',
  Rootkit: 'r',
  Augmentation: 'g',
};
