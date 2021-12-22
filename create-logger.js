export default function createLogger(ns) {
    return function log(msg, level = 'info') {
        switch (level) {
            case 'info':
                ns.print(`[INFO] ${msg}`);
                break;
            case 'warning':
                ns.print(`[WARN] ${msg}`);
                break;
            case 'error':
                ns.print(`[ERR ] ${msg}`);
                break;
            case 'success':
                ns.print(`[ OK ] ${msg}`);
                break;
            default:
                throw new Error('Unhandled log level');
        }
    }
}