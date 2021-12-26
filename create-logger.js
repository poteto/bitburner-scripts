export default function createLogger(ns) {
  let lastLog = { level: null, msg: null };
  return function log(msg, level = "info") {
    if (level === lastLog.level && msg === lastLog.msg) {
      return;
    }
    switch (level) {
      case "info":
        ns.print(`[INFO] ${msg}`);
        break;
      case "warning":
        ns.print(`[WARN] ${msg}`);
        break;
      case "error":
        ns.print(`[ERR ] ${msg}`);
        break;
      case "success":
        ns.print(`[ OK ] ${msg}`);
        break;
      default:
        throw new Error("Unhandled log level");
    }
    lastLog = { level, msg };
  };
}
