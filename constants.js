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
  Weapon: 'Weapon',
  Armor: 'Armor',
  Vehicle: 'Vehicle',
  Rootkit: 'Rootkit',
  Augmentation: 'Augmentation',
};

/** @enum {string} */
export const DivisionCode = {
  ag: 'Agriculture',
  ch: 'Chemical',
  co: 'Computer',
  en: 'Energy',
  fi: 'Fishing',
  fo: 'Food',
  he: 'Healthcare',
  mi: 'Mining',
  ph: 'Pharmaceutical',
  re: 'Real Estate',
  ro: 'Robotics',
  so: 'Software',
  to: 'Tobacco',
  ut: 'Utilities',
};
/** @enum {string} */
export const Material = {
  'AI Cores': 'AI Cores',
  'Real Estate': 'Real Estate',
  Chemicals: 'Chemicals',
  Drugs: 'Drugs',
  Energy: 'Energy',
  Food: 'Food',
  Hardware: 'Hardware',
  Metal: 'Metal',
  Plants: 'Plants',
  Robots: 'Robots',
  Water: 'Water',
  Nothing: 'Nothing',
};
/** @enum {string} */
export const EmployeeJob = {
  rnd: 'Research & Development',
  biz: 'Business',
  eng: 'Engineer',
  mgm: 'Management',
  ops: 'Operations',
  trn: 'Training',
  uns: 'Unassigned',
};

export const DIVISION_OUTPUTS = new Map();
DIVISION_OUTPUTS.set(DivisionCode.ag, [Material.Plants, Material.Food]);
DIVISION_OUTPUTS.set(DivisionCode.ch, [Material.Chemicals]);
DIVISION_OUTPUTS.set(DivisionCode.co, [Material.Hardware]);
DIVISION_OUTPUTS.set(DivisionCode.en, [Material.Energy]);
DIVISION_OUTPUTS.set(DivisionCode.fi, [Material.Food]);
DIVISION_OUTPUTS.set(DivisionCode.fo, [Material.Nothing]);
DIVISION_OUTPUTS.set(DivisionCode.he, [Material.Nothing]);
DIVISION_OUTPUTS.set(DivisionCode.mi, [Material.Metal]);
DIVISION_OUTPUTS.set(DivisionCode.ph, [Material.Drugs]);
DIVISION_OUTPUTS.set(DivisionCode.re, [Material.Nothing]);
DIVISION_OUTPUTS.set(DivisionCode.ro, [Material.Robots]);
DIVISION_OUTPUTS.set(DivisionCode.so, [Material['AI Cores']]);
DIVISION_OUTPUTS.set(DivisionCode.to, [Material.Nothing]);
DIVISION_OUTPUTS.set(DivisionCode.ut, [Material.Water]);
