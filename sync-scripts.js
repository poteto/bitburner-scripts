/** @typedef { import('./bitburner.d').NS } NS */

import createLogger from './create-logger.js';

const REPO_URL =
  'https://api.github.com/repos/poteto/bitburner-scripts/git/trees/main?recursive=1';
const REPO_TXT = 'repo.json.txt';

/** @param {NS} ns **/
export async function main(ns) {
  ns.tail();
  ns.disableLog('disableLog');
  ns.disableLog('wget');

  const log = createLogger(ns);
  const { branch } = ns.flags([['branch', 'main']]);

  if ((await ns.wget(REPO_URL, 'repo.json.txt')) === false) {
    log(`Couldn't get repo manifest`, 'error');
    ns.exit();
  }

  const repo = JSON.parse(ns.read(REPO_TXT));
  for (const file of repo.tree) {
    if (file.type !== 'blob' || file.path.endsWith('.js') === false) {
      continue;
    }
    const url = `https://raw.githubusercontent.com/poteto/bitburner-scripts/${branch}/${file.path}`;
    if (await ns.wget(url, file.path)) {
      log(`Successfully synced ${file.path} (${file.sha})`);
    } else {
      log(`Couldn't get ${file.path} (${file.sha})`);
    }
  }
}
