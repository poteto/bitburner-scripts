import createLogger from './create-logger.js';

const INTERVAL = 1_000;

/** @param {NS} ns **/
export async function main(ns) {
    ns.tail();
    ns.disableLog('disableLog');
    ns.disableLog('sleep');

    const log = createLogger(ns);
    const symbols = ns.stock.getSymbols();

    const formatMoney = x => ns.nFormat(x, '($0.00a)');
    const report = sym => {
        log(`--- Report for ${sym} ---`);
        log(`  Ask       : ${ns.stock.getAskPrice(sym)}`);
        log(`  Bid       : ${ns.stock.getBidPrice(sym)}`);
        log(`  Forecast  : ${ns.stock.getForecast(sym)}`);
        log(`  Max Shares: ${ns.stock.getMaxShares(sym)}`);
        log(`  Volatility: ${ns.stock.getVolatility(sym)}`);
    }

    const bought = new Map();
    let totalSpent = 0;
    let totalGained = 0;

    while (true) {
        for (const sym of symbols) {
            if (ns.stock.getForecast(sym) > 0.5 && bought.has(sym) === false) {
                const askPrice = ns.stock.getAskPrice(sym);
                const maxShares = ns.stock.getMaxShares(sym);
                log(`Buying ${sym} long at ${formatMoney(askPrice)} for ${formatMoney(askPrice * maxShares)}`);
                bought.set(sym, { kind: 'Long', askPrice, volume: maxShares });
                totalSpent += (askPrice * maxShares);
            }
            if (bought.has(sym) === false) {
                continue;
            }
            const { kind, askPrice, volume } = bought.get(sym);
            if (ns.stock.getBidPrice(sym) > (askPrice * 1.01)) {
                const profit = ns.stock.getSaleGain(sym, volume, kind);
                log(`Selling ${sym}, profit: ${formatMoney(profit)}`);
                bought.delete(sym);
                totalGained += profit;
                await ns.sleep(INTERVAL);
            }
        }
        log(`Spent: ${formatMoney(totalSpent)}, gained: ${formatMoney(totalGained)}`);
        await ns.sleep(INTERVAL);
    }
}