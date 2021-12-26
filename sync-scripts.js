import createLogger from "./create-logger.js";

const IGNORE = new Set(["LICENSE", ".prettierrc.json"]);
const REPO_URL =
  "https://api.github.com/repos/poteto/bitburner-scripts/git/trees/main?recursive=1";
const REPO_TXT = "repo.json.txt";

/** @param {NS} ns **/
export async function main(ns) {
  ns.tail();
  ns.disableLog("disableLog");
  ns.disableLog("wget");

  const log = createLogger(ns);

  await ns.wget(REPO_URL, "repo.json.txt");
  if (ns.fileExists(REPO_TXT) === false) {
    log(`Couldn't get repo manifest`, "error");
    ns.exit();
  }

  const repo = JSON.parse(ns.read(REPO_TXT));
  for (const file of repo.tree) {
    if (IGNORE.has(file.path)) {
      continue;
    }
    const url = `https://raw.githubusercontent.com/poteto/bitburner-scripts/main/${file.path}`;
    if (await ns.wget(url, file.path)) {
      log(`Successfully synced ${file.path} (${file.sha})`);
    } else {
      log(`Couldn't get ${file.path} (${file.sha})`);
    }
  }
}
