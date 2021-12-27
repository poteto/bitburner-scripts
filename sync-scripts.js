/**
 * @typedef { import('./bitburner.d').NS } NS
 * @typedef {{path: string, mode: string, type: 'tree' | 'blob', sha: string, url: string}} File
 * @typedef {{sha: string, url: string, tree: File[], truncated: boolean}} Repo
 * @typedef {{branch: string, watch: boolean}} ScriptOptions
 * */

import createLogger from './create-logger.js';

const INTERVAL = 12_000;

/** @param {NS} ns **/
export async function main(ns) {
  ns.tail();
  ns.disableLog('disableLog');
  ns.disableLog('wget');

  const log = createLogger(ns);
  /** @type {ScriptOptions} */
  const { branch, watch } = ns.flags([
    ['branch', 'main'], // which branch to pull from
    ['watch', false], // enable watch mode
  ]);

  /**
   * @param {string} branch
   * @param {string} manifestName
   * @returns {Promise<Repo | null>}
   */
  const fetchRepo = async (branch, manifestName) => {
    const repoUrl = `https://api.github.com/repos/poteto/bitburner-scripts/git/trees/${branch}?recursive=1`;
    if (await ns.wget(repoUrl, manifestName)) {
      return JSON.parse(ns.read(manifestName));
    }
    return null;
  };
  /**
   * @param {Repo} repo
   * @param {string} branch
   */
  const fetchFiles = async (repo, branch) => {
    for (const file of repo.tree) {
      if (file.type !== 'blob' || file.path.endsWith('.js') === false) {
        continue;
      }
      const fileUrl = `https://raw.githubusercontent.com/poteto/bitburner-scripts/${branch}/${file.path}`;
      if (await ns.wget(fileUrl, file.path)) {
        log(`Successfully synced ${file.path} (${file.sha})`);
        continue;
      }
      log(`Couldn't get ${file.path}`, 'error');
    }
  };

  while (true) {
    const repo = await fetchRepo(branch, 'repo.json.txt');
    if (repo == null) {
      log(`Couldn't get repo manifest`, 'error');
      return ns.exit();
    }
    await fetchFiles(repo, branch);
    if (watch === false) {
      return ns.exit();
    }
    await ns.sleep(INTERVAL);
  }
}
