

function formatMoney(amount, foreign = false) {

    if (!foreign) return formatMoneyLocal(amount);
    else return formatForeignMoney(amount);
}


function formatPercent(value) {

    const absValue = Math.abs(value);

    amount = Number(value);

    return '%' + (absValue < 10 ? smartFixed(amount, 2)
        : absValue < 100 ? smartFixed(amount, 1)
            : smartRound(amount));
}


function formatFxRate(amount) {

    amount = Number(amount);

    const resultAmount = amount < 10 ? smartFixed(amount, 2)
        : amount < 100 ? smartFixed(amount, 1)
            : smartRound(amount)

    const hasFraction = resultAmount % 1 !== 0;

    return new Intl.NumberFormat('tr-TR', {
        style: 'currency', currency: 'TRY',
        minimumFractionDigits: hasFraction ? 2 : 0,
        maximumFractionDigits: 2
    }).format(resultAmount);
}



function formatMoneyLocal(amount) {

    amount = amount ?? 0;

    const resultAmount = smartRound(amount);
    const hasFraction = resultAmount % 1 !== 0;

    return new Intl.NumberFormat('tr-TR', {
        style: 'currency', currency: 'TRY',
        minimumFractionDigits: hasFraction ? 2 : 0,
        maximumFractionDigits: 2
    }).format(resultAmount);

}

function formatForeignMoney(amount) {

    amount = amount ?? 0;

    const symbol = getExchangeConfig().symbol;

    const resultAmount = smartRound(amount);
    const hasFraction = resultAmount % 1 !== 0;


    const formattedNumber = new Intl.NumberFormat('tr-TR', {
        minimumFractionDigits: hasFraction ? 2 : 0,
        maximumFractionDigits: 2
    }).format(resultAmount);

    // 4. Combine with symbol (e.g. "₺1.250")
    return `${symbol}${formattedNumber}`;
}



function convertToTargetMoney(amount, rate = null) {

    const currentRate = (rate ?? getExchangeConfig().rate) || 1;

    // Fall back to 1 if rate is 0 or negative to prevent errors
    return amount / (currentRate <= 0 ? 1 : currentRate);
}

function convertToBaseMoney(amount, rate = null) {
    // Same logic: use the parameter if provided
    const currentRate = (rate ?? getExchangeConfig().rate) || 1;

    return amount * currentRate;
}



function smartFixed(num, maxDecimals = 2) {
    return Number(num.toFixed(maxDecimals)).toString();
}


function smartRound(value) {
    if (value === 0) return 0;

    const amount = Number(value);
    const absValue = Math.abs(amount);

    if (absValue < 1) return smartFixed(amount, 2);

    if (absValue < 10) return smartFixed(amount, 1);

    if (value < 100) return Math.round(amount);

    const magnitude = Math.floor(Math.log10(amount));
    const precisionPower = Math.max(0, magnitude - 2);
    const precision = Math.pow(10, precisionPower);

    return Math.round(amount / precision) * precision;
}








function cleanNumber(amount) {

    return Number(amount.toFixed(2));
}