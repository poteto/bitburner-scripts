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

export const CITY_NAMES = [
  'Aevum',
  'Chongqing',
  'Sector-12',
  'New Tokyo',
  'Ishima',
  'Volhaven',
];
/** @enum {string} */
export const Division = {
  Agriculture: 'Agriculture',
  Chemical: 'Chemical',
  Computer: 'Computer',
  Energy: 'Energy',
  Fishing: 'Fishing',
  Food: 'Food',
  Healthcare: 'Healthcare',
  Mining: 'Mining',
  Pharmaceutical: 'Pharmaceutical',
  RealEstate: 'RealEstate',
  Robotics: 'Robotics',
  Software: 'Software',
  Tobacco: 'Tobacco',
  Utilities: 'Utilities',
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
export const DIVISION_OUTPUTS = new Map();
DIVISION_OUTPUTS.set(Division.Agriculture, [Material.Plants, Material.Food]);
DIVISION_OUTPUTS.set(Division.Chemical, [Material.Chemicals]);
DIVISION_OUTPUTS.set(Division.Computer, [Material.Hardware]);
DIVISION_OUTPUTS.set(Division.Energy, [Material.Energy]);
DIVISION_OUTPUTS.set(Division.Fishing, [Material.Food]);
DIVISION_OUTPUTS.set(Division.Food, [Material.Nothing]);
DIVISION_OUTPUTS.set(Division.Healthcare, [Material.Nothing]);
DIVISION_OUTPUTS.set(Division.Mining, [Material.Metal]);
DIVISION_OUTPUTS.set(Division.Pharmaceutical, [Material.Drugs]);
DIVISION_OUTPUTS.set(Division.RealEstate, [Material.Nothing]);
DIVISION_OUTPUTS.set(Division.Robotics, [Material.Robots]);
DIVISION_OUTPUTS.set(Division.Software, [Material['AI Cores']]);
DIVISION_OUTPUTS.set(Division.Tobacco, [Material.Nothing]);
DIVISION_OUTPUTS.set(Division.Utilities, [Material.Water]);
