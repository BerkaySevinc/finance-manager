
const DAY_IN_YEAR = 365.2425;
const DAY_IN_MONTH = DAY_IN_YEAR / 12;
const WEEK_IN_YEAR = DAY_IN_YEAR / 7;
const WEEK_IN_MONTH = WEEK_IN_YEAR / 12;


const periodsPerYear = {
    daily: DAY_IN_YEAR,
    weekly: WEEK_IN_YEAR,
    monthly: 12,
    yearly: 1
};


function simulate(
    startPrincipal,
    contrib,
    annualRatePercent,
    compoundType,
    contribPeriod,
    targetObj,
    isAnnualPercentEffective = false,
    fxOptions = {},
    startSimulation = null
) {

    if (targetObj.type === 'time' && targetObj.val > 1200) return buildEmptyResult();

    if (startSimulation != null && targetObj.period == null) targetObj.period = startSimulation.targetPeriod;

    console.log('\n\n\n\n')
    console.log(startSimulation?.targetPeriod)
    console.log(targetObj)
    console.log('\n\n\n\n')


    const {
        isFxAccount = false,

        foreignContribution = 0,

        fxAnnualRatePercent = 0, // annual % change of the exchange rate (e.g. foreign currency appreciation vs TRY)

        fxAnnualInflationPercent = 0, // annual inflation rate in the foreign country (%)

        autoAdjustContribByFx = false, // keep contributions real-constant relative to FX + inflation

    } = fxOptions;

    const startFxRate = startSimulation?.fx?.finalFxRate ?? fxOptions?.startFxRate ?? 1;

    // Start Simulation Settings
    const startFxRateIndex = startSimulation?.fx?.finalFxRateIndex ?? 1;
    const startInflationIndex = startSimulation?.fx?.finalInflationRate ?? 1;

    const hasPeriod = targetObj.period != null;




    // Monthly Local Contribution
    let monthlyContribution = convertContributionToPeriod(contrib, contribPeriod, 'monthly');

    // Monthly Foreign Contribution
    let monthlyForeignContribution = convertContributionToPeriod(foreignContribution, contribPeriod, 'monthly');

    // Monthly Contribution (FX mode)
    let runningLocalContribution = 0;
    let runningForeignContribution = 0;
    let runningLocalContributionInForeign = 0;
    let runningForeignContributionInLocal = 0;

    let runningTotalContribution = monthlyContribution;
    let runningTotalContributionInForeign = 0;
    if (isFxAccount && (monthlyContribution > 0 || foreignContribution > 0)) {

        runningLocalContribution = monthlyContribution;
        runningForeignContribution = monthlyForeignContribution;

        runningLocalContributionInForeign = monthlyContribution / startFxRate * startFxRateIndex;
        runningForeignContributionInLocal = monthlyForeignContribution * startFxRate / startFxRateIndex;

        // Adjust contribution for inflation (to keep it constant in real terms)
        if (autoAdjustContribByFx) {

            runningLocalContribution *= startFxRateIndex * startInflationIndex;
            runningForeignContributionInLocal *= startFxRateIndex * startInflationIndex;

            runningForeignContribution *= startInflationIndex;
            runningLocalContributionInForeign *= startInflationIndex;
        }

        runningTotalContribution = runningLocalContribution + runningForeignContributionInLocal;
        runningTotalContributionInForeign = runningLocalContributionInForeign + runningForeignContribution;
    }
    const startTotalContribution = startSimulation ? convertContributionToPeriod(startSimulation.startContribution, startSimulation.contributionPeriod, 'monthly') : runningTotalContribution;
    const startTotalContributionInForeign = startSimulation ? convertContributionToPeriod(startSimulation.startContributionForeign, startSimulation.contributionPeriod, 'monthly') : runningTotalContributionInForeign;



    const fxAnnualInflationRate = fxAnnualInflationPercent / 100;
    const fxAnnualRateDecimal = fxAnnualRatePercent / 100;

    const compoundPeriod = periodsPerYear[compoundType];

    let realAnnualNominalPercent;
    let yearlyEffectivePercent;
    let yearlyEffectiveRate;
    if (!isAnnualPercentEffective) {

        realAnnualNominalPercent = annualRatePercent;
        const realAnnualNominalRate = realAnnualNominalPercent / 100;

        yearlyEffectiveRate =
            compoundPeriod === 1
                ? realAnnualNominalRate
                : Math.pow(1 + realAnnualNominalRate / compoundPeriod, compoundPeriod) - 1;

        yearlyEffectivePercent =
            compoundPeriod === 1
                ? realAnnualNominalPercent
                : yearlyEffectiveRate * 100;
    }
    else {

        yearlyEffectivePercent = annualRatePercent;
        yearlyEffectiveRate = annualRatePercent / 100;

        realAnnualNominalPercent = getNominalYearlyRate(annualRatePercent, compoundType);
    }

    const localInflationAnnualPercent = ((1 + fxAnnualRateDecimal) * (1 + fxAnnualInflationRate) - 1) * 100;
    const foreignInflationAnnualPercent = fxAnnualInflationPercent;


    const localNominalAnnualRate = calculateLocalNominalReturnFromForeignReal(yearlyEffectiveRate, fxAnnualRateDecimal, fxAnnualInflationRate);
    const fxNominalAnnualRate = calculateLocalNominalReturnFromForeignReal(yearlyEffectiveRate, 0, fxAnnualInflationRate);

    const localNominalMonthlyGrowthRate = getPeriodRateFromYearly(localNominalAnnualRate, 'monthly') + 1;
    const fxNominalMonthlyGrowthRate = getPeriodRateFromYearly(fxNominalAnnualRate, 'monthly') + 1;

    const localNominalUncompoundedAnnualPercent = getNominalYearlyRate(localNominalAnnualRate * 100, compoundType);
    const fxNominalUncompoundedAnnualPercent = getNominalYearlyRate(fxNominalAnnualRate * 100, compoundType);



    const options = {

        yearlyRealRate: yearlyEffectiveRate,

        yearlyLocalNominalRate: localNominalAnnualRate,
        yearlyForeignNominalRate: fxNominalAnnualRate,

        currentFxRateIndex: startFxRateIndex,
        currentInflationIndex: startInflationIndex,
    };



    let currentFxRateIndex = startFxRateIndex;
    let currentFxRate = startFxRate;
    const fxMonthlyFactor = Math.pow(1 + fxAnnualRateDecimal, 1 / 12);

    let currentFxInflationIndex = startInflationIndex;
    const fxInflationMonthlyFactor = Math.pow(1 + fxAnnualInflationRate, 1 / 12);


    let periodIncomeNominalRate =
        hasPeriod
            ? getPeriodIncomeRate(options, targetObj.period, false, false, false)
            : 0;
    let periodRealIncomeRate =
        hasPeriod
            ? getPeriodIncomeRate(options, targetObj.period, false, true, false)
            : 0;
    let periodRealIncomeFirstDaysRate =
        hasPeriod
            ? getPeriodIncomeRate(options, targetObj.period, false, true, true)
            : 0;


    let periodForeignIncomeNominalRate =
        hasPeriod
            ? getPeriodIncomeRate(options, targetObj.period, true, false, false)
            : 0;
    let periodForeignRealIncomeRate =
        hasPeriod
            ? getPeriodIncomeRate(options, targetObj.period, true, true, false)
            : 0;


    let monthlyIncomeNominalRate = getPeriodIncomeRate(options, 'monthly', false, false, false);
    let monthlyIncomeNominalFirstDaysRate = getPeriodIncomeRate(options, 'monthly', false, false, true);
    let monthlyRealIncomeRate = getPeriodIncomeRate(options, 'monthly', false, true, false);
    let monthlyRealIncomeFirstDaysRate = getPeriodIncomeRate(options, 'monthly', false, true, true);

    let monthlyForeignIncomeNominalRate = getPeriodIncomeRate(options, 'monthly', true, false, false);
    let monthlyForeignIncomeNominalFirstDaysRate = getPeriodIncomeRate(options, 'monthly', true, false, true);
    let monthlyForeignRealIncomeRate = getPeriodIncomeRate(options, 'monthly', true, true, false);
    let monthlyForeignRealIncomeFirstDaysRate = getPeriodIncomeRate(options, 'monthly', true, true, true);




    let currentBalance = startSimulation?.finalPrincipal ?? startPrincipal;
    let currentForeignBalance = currentBalance / startFxRate;

    let totalInvestmentNominal = startSimulation?.finalTotalInvestmentNominal ?? startPrincipal;
    let totalInvestmentNominalForeign = totalInvestmentNominal / startFxRate;
    let totalInvestmentFirstDays = totalInvestmentNominal / (startFxRateIndex * startInflationIndex);




    const createTimeline = (timeline, isForeign, rate, isPeriod = false) => {

        if (isPeriod && !hasPeriod) return null;

        const targetBalance = !isForeign ? currentBalance : currentForeignBalance;

        if (timeline == null) return [targetBalance * rate];

        return [
            ...(timeline).slice(0, -1),
            targetBalance * rate
        ];

    };

    // Time Series Data
    const timeline = startSimulation?.balanceTimeline ?? [currentBalance];


    const periodIncomeNominalTimeline = createTimeline(startSimulation?.periodIncomeNominalTimeline, false, periodIncomeNominalRate, true);
    const periodRealIncomeTimeline = createTimeline(startSimulation?.fx?.periodRealIncomeTimeline, false, periodRealIncomeRate, true);
    const periodRealIncomeFirstDaysTimeline = createTimeline(startSimulation?.fx?.periodRealIncomeFirstDaysTimeline, false, periodRealIncomeFirstDaysRate, true);

    const periodForeignIncomeNominalTimeline = createTimeline(startSimulation?.fx?.periodForeignIncomeNominalTimeline, true, periodForeignIncomeNominalRate, true);
    const periodForeignRealIncomeTimeline = createTimeline(startSimulation?.fx?.periodForeignRealIncomeTimeline, true, periodForeignRealIncomeRate, true);

    const monthlyIncomeNominalTimeline = createTimeline(startSimulation?.monthlyIncomeNominalTimeline, false, monthlyIncomeNominalRate);
    const monthlyIncomeNominalFirstDaysTimeline = createTimeline(startSimulation?.fx?.monthlyIncomeNominalFirstDaysTimeline, false, monthlyIncomeNominalFirstDaysRate);
    const monthlyRealIncomeTimeline = createTimeline(startSimulation?.fx?.monthlyRealIncomeTimeline, false, monthlyRealIncomeRate);
    const monthlyRealIncomeFirstDaysTimeline = createTimeline(startSimulation?.fx?.monthlyRealIncomeFirstDaysTimeline, false, monthlyRealIncomeFirstDaysRate);

    const monthlyForeignIncomeNominalTimeline = createTimeline(startSimulation?.fx?.monthlyForeignIncomeNominalTimeline, true, monthlyForeignIncomeNominalRate);
    const monthlyForeignIncomeNominalFirstDaysTimeline = createTimeline(startSimulation?.fx?.monthlyForeignIncomeNominalFirstDaysTimeline, true, monthlyForeignIncomeNominalFirstDaysRate);
    const monthlyForeignRealIncomeTimeline = createTimeline(startSimulation?.fx?.monthlyForeignRealIncomeTimeline, true, monthlyForeignRealIncomeRate);
    const monthlyForeignRealIncomeFirstDaysTimeline = createTimeline(startSimulation?.fx?.monthlyForeignRealIncomeFirstDaysTimeline, true, monthlyForeignRealIncomeFirstDaysRate);



    const fxRateTimeline = startSimulation?.fx?.fxRateTimeline ?? [startFxRate];
    const fxRateIndexTimeline = startSimulation?.fx?.fxRateIndexTimeline ?? [startFxRateIndex];

    const fxInflationIndexTimeline = startSimulation?.fx?.fxInflationIndexTimeline ?? [startInflationIndex];

    const balanceFirstDaysTimeline = startSimulation?.fx?.balanceFirstDaysTimeline ?? [currentBalance / (startFxRateIndex * startInflationIndex)];
    const foreignBalanceTimeline = startSimulation?.fx?.foreignBalanceTimeline ?? [currentForeignBalance];

    const contributionTimeline = startSimulation?.fx?.contributionTimeline ?? [0];
    const foreignContributionTimeline = startSimulation?.fx?.foreignContributionTimeline ?? [0];

    const totalInvestmentNominalTimeline = startSimulation?.totalInvestmentNominalTimeline ?? [totalInvestmentNominal];
    const totalInvestmentNominalForeignTimeline = startSimulation?.fx?.totalInvestmentNominalForeignTimeline ?? [totalInvestmentNominalForeign];

    const totalInvestmentFirstDaysTimeline = startSimulation?.fx?.totalInvestmentFirstDaysTimeline ?? [totalInvestmentFirstDays];






    let months = 0;
    while (months <= 1200) {

        if (checkGoal(currentBalance, months, periodRealIncomeFirstDaysRate, targetObj, currentFxRateIndex, currentFxInflationIndex)) return buildResult();

        months++;

        currentBalance *= localNominalMonthlyGrowthRate;

        if (!isFxAccount) {

            // Monthly Contribution
            currentBalance += monthlyContribution;

            totalInvestmentNominal += monthlyContribution;
        }
        else {

            // Apply monthly FX and inflation factors
            currentFxRateIndex *= fxMonthlyFactor;
            currentFxRate *= fxMonthlyFactor;
            currentFxInflationIndex *= fxInflationMonthlyFactor;


            currentForeignBalance *= fxNominalMonthlyGrowthRate;

            // Monthly Contribution
            if (runningTotalContribution > 0) {

                // Adjust contribution for inflation (to keep it constant in real terms)
                if (autoAdjustContribByFx) {

                    runningLocalContribution *= fxMonthlyFactor * fxInflationMonthlyFactor;
                    runningForeignContributionInLocal *= fxMonthlyFactor * fxInflationMonthlyFactor;

                    runningForeignContribution *= fxInflationMonthlyFactor;
                    runningLocalContributionInForeign *= fxInflationMonthlyFactor;

                    runningTotalContribution = runningLocalContribution + runningForeignContributionInLocal;
                    runningTotalContributionInForeign = runningLocalContributionInForeign + runningForeignContribution;
                }


                currentBalance += runningTotalContribution
                currentForeignBalance += runningTotalContributionInForeign;

                totalInvestmentNominal += runningTotalContribution;
                totalInvestmentNominalForeign += runningTotalContributionInForeign;
                totalInvestmentFirstDays += runningTotalContribution / (currentFxRateIndex * currentFxInflationIndex);

                // Timeline recordings
                contributionTimeline.push(runningTotalContribution)
                foreignContributionTimeline.push(runningTotalContributionInForeign)
            }

            // Real income rate decreases with inflation (to calculate relative to day-one purchasing power)
            if (hasPeriod) {

                periodRealIncomeFirstDaysRate /= (fxMonthlyFactor * fxInflationMonthlyFactor);
            }

            monthlyIncomeNominalFirstDaysRate /= (fxMonthlyFactor * fxInflationMonthlyFactor);
            monthlyRealIncomeFirstDaysRate /= (fxMonthlyFactor * fxInflationMonthlyFactor);

            monthlyForeignIncomeNominalFirstDaysRate /= fxInflationMonthlyFactor;
            monthlyForeignRealIncomeFirstDaysRate /= fxInflationMonthlyFactor;


            // Timeline recordings
            fxRateTimeline.push(currentFxRate);
            fxRateIndexTimeline.push(currentFxRateIndex);
            fxInflationIndexTimeline.push(currentFxInflationIndex);

            balanceFirstDaysTimeline.push(currentBalance / (currentFxRateIndex * currentFxInflationIndex));
            foreignBalanceTimeline.push(currentForeignBalance);

            totalInvestmentNominalForeignTimeline.push(totalInvestmentNominalForeign);
            totalInvestmentFirstDaysTimeline.push(totalInvestmentFirstDays);

            if (hasPeriod) {

                periodRealIncomeTimeline.push(currentBalance * periodRealIncomeRate);
                periodRealIncomeFirstDaysTimeline.push(currentBalance * periodRealIncomeFirstDaysRate);

                periodForeignIncomeNominalTimeline.push(currentForeignBalance * periodForeignIncomeNominalRate);
                periodForeignRealIncomeTimeline.push(currentForeignBalance * periodForeignRealIncomeRate);

            }

            monthlyIncomeNominalFirstDaysTimeline.push(currentBalance * monthlyIncomeNominalFirstDaysRate);
            monthlyRealIncomeTimeline.push(currentBalance * monthlyRealIncomeRate);
            monthlyRealIncomeFirstDaysTimeline.push(currentBalance * monthlyRealIncomeFirstDaysRate);

            monthlyForeignIncomeNominalTimeline.push(currentForeignBalance * monthlyForeignIncomeNominalRate);
            monthlyForeignIncomeNominalFirstDaysTimeline.push(currentForeignBalance * monthlyForeignIncomeNominalFirstDaysRate);
            monthlyForeignRealIncomeTimeline.push(currentForeignBalance * monthlyForeignRealIncomeRate);
            monthlyForeignRealIncomeFirstDaysTimeline.push(currentForeignBalance * monthlyForeignRealIncomeFirstDaysRate);
        }


        // Timeline recording
        timeline.push(currentBalance);

        totalInvestmentNominalTimeline.push(totalInvestmentNominal);

        if (hasPeriod) {

            periodIncomeNominalTimeline.push(currentBalance * periodIncomeNominalRate);
        }

        monthlyIncomeNominalTimeline.push(currentBalance * monthlyIncomeNominalRate);
    }

    if (months > 1200) return buildEmptyResult();


    return buildResult();

    function buildResult() {

        const totalMonths = (startSimulation?.totalMonths ?? 0) + months;

        const initialPrincipal = startSimulation?.startPrincipal ?? startPrincipal;
        const initialPrincipalForeign = startSimulation != null ? (startSimulation.startPrincipal / startSimulation.fx.startFxRate) : (startPrincipal / startFxRate);


        const finalBalanceFirstDays = balanceFirstDaysTimeline[balanceFirstDaysTimeline.length - 1];

        const finalPeriodIncomeNominal = hasPeriod ? periodIncomeNominalTimeline[periodIncomeNominalTimeline.length - 1] : null;
        const finalPeriodRealIncome = hasPeriod ? periodRealIncomeTimeline[periodRealIncomeTimeline.length - 1] : null;
        const finalPeriodRealIncomeFirstDays = hasPeriod ? periodRealIncomeFirstDaysTimeline[periodRealIncomeFirstDaysTimeline.length - 1] : null;

        const finalPeriodForeignIncomeNominal = hasPeriod ? periodForeignIncomeNominalTimeline[periodForeignIncomeNominalTimeline.length - 1] : null;
        const finalPeriodForeignRealIncome = hasPeriod ? periodForeignRealIncomeTimeline[periodForeignRealIncomeTimeline.length - 1] : null;

        const finalMonthlyIncomeNominal = monthlyIncomeNominalTimeline[monthlyIncomeNominalTimeline.length - 1];
        const finalMonthlyIncomeNominalFirstDays = monthlyIncomeNominalFirstDaysTimeline[monthlyIncomeNominalFirstDaysTimeline.length - 1];
        const finalMonthlyRealIncome = monthlyRealIncomeTimeline[monthlyRealIncomeTimeline.length - 1];
        const finalMonthlyRealIncomeFirstDays = monthlyRealIncomeFirstDaysTimeline[monthlyRealIncomeFirstDaysTimeline.length - 1];

        const finalMonthlyForeignIncomeNominal = monthlyForeignIncomeNominalTimeline[monthlyForeignIncomeNominalTimeline.length - 1];
        const finalMonthlyForeignIncomeNominalFirstDays = monthlyForeignIncomeNominalFirstDaysTimeline[monthlyForeignIncomeNominalFirstDaysTimeline.length - 1];
        const finalMonthlyForeignRealIncome = monthlyForeignRealIncomeTimeline[monthlyForeignRealIncomeTimeline.length - 1];
        const finalMonthlyForeignRealIncomeFirstDays = monthlyForeignRealIncomeFirstDaysTimeline[monthlyForeignRealIncomeFirstDaysTimeline.length - 1];

        const finalDailyIncomeNominal = currentBalance * getPeriodIncomeRate(options, 'daily', false, false, false);
        const finalWeeklyIncomeNominal = currentBalance * getPeriodIncomeRate(options, 'weekly', false, false, false);
        const finalYearlyIncomeNominal = currentBalance * getPeriodIncomeRate(options, 'yearly', false, false, false);


        const result = {

            totalMonths,

            realAnnualNominalPercent,
            realAnnualEffectivePercent: yearlyEffectivePercent,

            compoundPeriod: compoundType,

            startPrincipal: initialPrincipal,
            startPrincipalForeign: initialPrincipalForeign,

            startContribution: convertContributionToPeriod(startTotalContribution, 'monthly', contribPeriod),
            startContributionForeign: convertContributionToPeriod(startTotalContributionInForeign, 'monthly', contribPeriod),
            contributionPeriod: contribPeriod,

            targetType: targetObj.type,
            targetDuration: targetObj.type === 'time' ? targetObj.val : null,
            targetPeriod: targetObj.period,
            targetValueFirstDays: targetObj.type !== 'time' ? targetObj.val : null,
            targetValueForeignFirstDays: targetObj.type !== 'time' ? targetObj.val / startFxRate * startFxRateIndex : null,

            balanceTimeline: timeline,
            finalPrincipal: currentBalance,

            totalInvestmentNominalTimeline,
            finalTotalInvestmentNominal: totalInvestmentNominal,

            periodIncomeNominalTimeline,
            finalPeriodIncomeNominal,

            monthlyIncomeNominalTimeline,
            finalMonthlyIncomeNominal,

            finalDailyIncomeNominal,
            finalWeeklyIncomeNominal,
            finalYearlyIncomeNominal,

            fx: {

                isFxAccount,

                localInflationAnnualPercent,
                foreignInflationAnnualPercent,

                localNominalAnnualPercent: localNominalAnnualRate * 100,
                fxNominalAnnualPercent: fxNominalAnnualRate * 100,

                localNominalUncompoundedAnnualPercent,
                fxNominalUncompoundedAnnualPercent,



                startFxRate: startSimulation?.fx?.startFxRate ?? startFxRate,
                fxRateTimeline,
                finalFxRate: currentFxRate,
                fxRateIndexTimeline,
                finalFxRateIndex: currentFxRateIndex,

                fxInflationIndexTimeline,
                finalInflationRate: currentFxInflationIndex,



                balanceFirstDaysTimeline,
                finalBalanceFirstDays,

                foreignBalanceTimeline,
                finalPrincipal: currentForeignBalance,



                totalInvestmentNominalForeignTimeline,
                finalTotalInvestmentNominalForeign: totalInvestmentNominalForeign,

                totalInvestmentFirstDaysTimeline,
                finalTotalInvestmentFirstDays: totalInvestmentFirstDays,



                contributionTimeline,
                finalContribution: runningTotalContribution,

                foreignContributionTimeline,
                finalForeignContribution: runningTotalContributionInForeign,



                periodRealIncomeTimeline,
                finalPeriodRealIncome,

                periodRealIncomeFirstDaysTimeline,
                finalPeriodRealIncomeFirstDays,



                periodForeignIncomeNominalTimeline,
                finalPeriodForeignIncomeNominal,

                periodForeignRealIncomeTimeline,
                finalPeriodForeignRealIncome,



                monthlyIncomeNominalFirstDaysTimeline,
                finalMonthlyIncomeNominalFirstDays,

                monthlyRealIncomeTimeline,
                finalMonthlyRealIncome,

                monthlyRealIncomeFirstDaysTimeline,
                finalMonthlyRealIncomeFirstDays,



                monthlyForeignIncomeNominalTimeline,
                finalMonthlyForeignIncomeNominal,

                monthlyForeignIncomeNominalFirstDaysTimeline,
                finalMonthlyForeignIncomeNominalFirstDays,

                monthlyForeignRealIncomeTimeline,
                finalMonthlyForeignRealIncome,

                monthlyForeignRealIncomeFirstDaysTimeline,
                finalMonthlyForeignRealIncomeFirstDays,
            }
        };

        console.log("fx değişim: " + fxAnnualRatePercent)
        console.log(result)
        console.log(contributionTimeline)
        console.log(foreignContributionTimeline)
        console.log("\n\n")
        console.log("Hedef Tl: " + targetObj.val)
        console.log(monthlyIncomeNominalTimeline.slice(monthlyIncomeNominalTimeline.length - 3).map(d => d.toFixed(0)))
        console.log(monthlyIncomeNominalFirstDaysTimeline.slice(monthlyIncomeNominalFirstDaysTimeline.length - 3).map(d => d.toFixed(0)))
        console.log(monthlyRealIncomeTimeline.slice(monthlyRealIncomeTimeline.length - 3).map(d => d.toFixed(0)))
        console.log(monthlyRealIncomeFirstDaysTimeline.slice(monthlyRealIncomeFirstDaysTimeline.length - 3).map(d => d.toFixed(0)))
        console.log("\n\n")
        console.log("Hedef $: " + result.targetValueForeignFirstDays)
        console.log(monthlyForeignIncomeNominalTimeline.slice(monthlyForeignIncomeNominalTimeline.length - 3).map(d => d.toFixed(0)));
        console.log(monthlyForeignIncomeNominalFirstDaysTimeline.slice(monthlyForeignIncomeNominalFirstDaysTimeline.length - 3).map(d => d.toFixed(0)))
        console.log(monthlyForeignRealIncomeTimeline.slice(monthlyForeignRealIncomeTimeline.length - 3).map(d => d.toFixed(0)));
        console.log(monthlyForeignRealIncomeFirstDaysTimeline.slice(monthlyForeignRealIncomeFirstDaysTimeline.length - 3).map(d => d.toFixed(0)));
        console.log("\n\n")
        console.log("\n\n")
        console.log("\n\n");


        return result;
    }

    function buildEmptyResult() {

        return {
            totalMonths: Infinity,

            realAnnualNominalPercent,
            realAnnualEffectivePercent: yearlyEffectiveRate * 100,
        };
    }

}



function mergeSimulationResults(r1, r2) {
    if (!r1 || !r2) return r1 || r2;

    const result = {};

    const keys = new Set([
        ...Object.keys(r1),
        ...Object.keys(r2)
    ]);

    for (const key of keys) {
        const v1 = r1[key];
        const v2 = r2[key];

        // Special case for totalMonths
        if (key === 'totalMonths') {
            result.totalMonths = (r1.totalMonths || 0) + (r2.totalMonths || 0);
            continue;
        }

        // start* → from the first simulation
        if (key.startsWith('start')) {
            result[key] = v1;
            continue;
        }

        // final* → from the second simulation
        if (key.startsWith('final')) {
            result[key] = v2;
            continue;
        }

        // Array → concat
        if (Array.isArray(v1) && Array.isArray(v2)) {
            result[key] = concatTimelines(v1, v2);
            continue;
        }

        // Nested object → recursive merge
        if (isPlainObject(v1) && isPlainObject(v2)) {
            result[key] = mergeSimulationResults(v1, v2);
            continue;
        }

        // Fallback: prefer the second value
        result[key] = v2 !== undefined ? v2 : v1;
    }

    return result;
}
function concatTimelines(a, b) {
    if (!a.length) return b;
    if (!b.length) return a;

    // The first element of the second timeline is always trimmed to avoid duplication
    return a.concat(b.slice(1));
}

function isPlainObject(val) {
    return (
        typeof val === 'object' &&
        val !== null &&
        !Array.isArray(val)
    );
}


function checkGoal(balance, months, rate, target, currentFxRateIndex = 1, currentFxInflationIndex = 1) {

    if (target.type === 'time') return months >= target.val;

    else if (target.type === 'principal') return balance / (currentFxRateIndex * currentFxInflationIndex) >= target.val;

    else return balance * rate >= target.val;
}






function getPeriodRateFromYearly(annualIncomeRate, period) {

    const n = periodsPerYear[period];

    const periodIncomeRate = Math.pow(1 + annualIncomeRate, 1 / n) - 1;

    return periodIncomeRate;
}





function getPeriodIncomeRate(options, period, isForeign = false, isReal = false, isFirstDays = false) {

    const {
        yearlyRealRate = 1,

        yearlyLocalNominalRate = 1,
        yearlyForeignNominalRate = 1,

        currentFxRateIndex = 1,
        currentInflationIndex = 1,

    } = options;


    const n = periodsPerYear[period];
    if (!n) throw new Error('Geçersiz period');

    const targetIncomeRate =
        isReal
            ? yearlyRealRate
            : isForeign
                ? yearlyForeignNominalRate
                : yearlyLocalNominalRate;


    const periodIncomeRate = Math.pow(1 + targetIncomeRate, 1 / n) - 1;

    if (!isFirstDays) return periodIncomeRate;

    if (isForeign) return periodIncomeRate / currentInflationIndex;
    else return periodIncomeRate / (currentFxRateIndex * currentInflationIndex);
}






function convertContributionToPeriod(amount, fromPeriod, toPeriod) {

    if (amount === 0 || amount == null || fromPeriod === toPeriod) return amount;

    // 1. Convert to monthly first
    let monthlyAmount;

    switch (fromPeriod) {
        case 'daily':
            monthlyAmount = amount * DAY_IN_MONTH;
            break;
        case 'weekly':
            monthlyAmount = amount * WEEK_IN_MONTH;
            break;
        case 'yearly':
            monthlyAmount = amount / 12;
            break;
        case 'monthly':
        default:
            monthlyAmount = amount;
    }

    // 2. Convert from monthly to the target period
    switch (toPeriod) {
        case 'daily':
            return monthlyAmount / DAY_IN_MONTH;
        case 'weekly':
            return monthlyAmount / WEEK_IN_MONTH;
        case 'yearly':
            return monthlyAmount * 12;
        case 'monthly':
        default:
            return monthlyAmount;
    }
}














function getEffectiveAnnualRate(nominalRatePercent, compoundType) {

    const r = nominalRatePercent / 100;

    let n;
    switch (compoundType) {
        case 'daily': n = DAY_IN_YEAR; break;
        case 'weekly': n = WEEK_IN_YEAR; break;
        case 'monthly': n = 12; break;
        case 'yearly': n = 1; break;
        default: n = 1;
    }

    return (Math.pow(1 + r / n, n) - 1) * 100;
}








function calculateAnnualGrowth(startDate, endDate, startRate, endRate) {
    // 1. Normalize both dates to midnight (00:00) to eliminate time-of-day differences
    const d1 = new Date(startDate);
    d1.setHours(0, 0, 0, 0);

    const d2 = new Date(endDate);
    d2.setHours(0, 0, 0, 0);

    // 2. Calculate the day difference
    const diffMs = d2 - d1;
    const daysPassed = Math.round(diffMs / (1000 * 60 * 60 * 24));

    // 3. Convert day difference to years
    const yearsPassed = daysPassed / 365.2425;

    // 4. Safety checks
    // Return 0 if same day (daysPassed = 0) or invalid start rate
    if (daysPassed <= 0 || startRate <= 0) return 0;

    // 5. CAGR formula: (End / Start) ^ (1 / Years) - 1
    const growthRate = Math.pow((endRate / startRate), (1 / yearsPassed)) - 1;

    return growthRate;
}

function calculateAnnualGrowthByMonthDiff(startDate, endDate, startRate, endRate) {

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Calculate month difference
    const monthsDiff = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());

    // Convert to years
    const yearsPassed = monthsDiff / 12;

    // Safety check
    if (yearsPassed <= 0 || startRate <= 0) return 0;

    // Compound Annual Growth Rate (CAGR)
    const annualGrowth = Math.pow(endRate / startRate, 1 / yearsPassed) - 1;

    return annualGrowth;
}




function getNominalYearlyRate(effectiveYearlyPercent, period) {

    const n = periodsPerYear[period];
    if (!n) throw new Error('Geçersiz period');

    if (n === 1) return effectiveYearlyPercent;

    const rEff = effectiveYearlyPercent / 100;

    const nominal =
        n * (Math.pow(1 + rEff, 1 / n) - 1);

    return nominal * 100;
}