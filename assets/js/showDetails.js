


function showProjectionDetails(simulation, isInflationMode) {

    if (simulation.totalMonths === Infinity || simulation.totalMonths === 0) return;

    document.querySelector('#detail-modal .dashboard-main-grid-results').style.display = 'flex';
    document.querySelector('#detail-modal .dashboard-main-grid-today').style.display = 'none';

    document.body.classList.add('modal-open');
    modal.style.display = 'flex';




    // Simulation Data
    const finalAmount = simulation.finalPrincipal;
    const totalInvested = simulation.finalTotalInvestmentNominal;
    const totalInterest = finalAmount - totalInvested;
    const yieldRate = (totalInterest / totalInvested) * 100;

    const balanceTimeline = simulation.balanceTimeline;

    const period = simulation.targetPeriod ?? 'monthly';
    const periodIncomeTimeline = simulation.targetType === 'income' ? simulation.periodIncomeNominalTimeline : simulation.monthlyIncomeNominalTimeline;


    const nominalYearlyRate = simulation.realAnnualNominalPercent;
    const effectiveYearlyRate = simulation.realAnnualEffectivePercent;
    const isCompounded = nominalYearlyRate !== effectiveYearlyRate;


    // Header
    document.querySelector('#detail-modal .modal-header').style.display = 'none';


    // Top Summary
    createStartSummary(document.querySelector('#display-summary'), simulation, isInflationMode, false);


    // Render charts
    document.getElementById('chart-title-growth').innerText = isInflationMode ? "Toplam Varlık (Reel)" : "Toplam Varlık";
    createLineChartMoney(document.getElementById("chart-growth"), colorPrincipal, balanceTimeline);

    document.getElementById('chart-title-interest').innerText = `${getPeriodText2(period)} Getiri${isInflationMode ? ' (Reel)' : ''}`;
    createLineChartMoney(document.getElementById("chart-interest"), colorIncome, periodIncomeTimeline);

    createDonutChartInvestInterest(document.getElementById("modal-donut-canvas"), finalAmount, totalInvested, true, true);


    // Portfolio Info
    document.getElementById('sum-invested').innerText = formatMoney(smartRound(totalInvested));
    document.getElementById('sum-interest').innerText = formatMoney(smartRound(totalInterest));

    document.getElementById('sum-interest-pct').innerText = `%${yieldRate > 10 ? smartRound(yieldRate) : yieldRate.toFixed(1)}`;
    document.getElementById('effective-interest').innerText =
        !isCompounded
            ? `%${smartFixed(effectiveYearlyRate, 1)}`
            : `%${smartFixed(nominalYearlyRate, 1)} ➜ %${smartFixed(effectiveYearlyRate, 1)}`;


    // Income Projections (income from the final balance reached)
    document.getElementById('pasive-title-real').innerText = "Pasif Gelir";

    document.getElementById('inc-daily').innerText = formatMoney(simulation.finalDailyIncomeNominal);
    document.getElementById('inc-monthly').innerText = formatMoney(simulation.finalMonthlyIncomeNominal);



    adjustTodayModal();

    modalContent.style.opacity = 1;
}





function showProjectionTodayDetails(header, simulation, inflationMode, isForeign = false, labelStartDate = null, passedMonths = null) {

    if (simulation.totalMonths === Infinity || simulation.totalMonths === 0) return;

    const isInflationMode = inflationMode !== 'none';



    document.querySelector('#detail-modal .dashboard-main-grid-results').style.display = 'none';
    document.querySelector('#detail-modal .dashboard-main-grid-today').style.display = 'flex';

    document.body.classList.add('modal-open');
    modal.style.display = 'flex';

    const todaysMoneyTabBtn = document.querySelector('.tab-btn2[data-tab="todaysMoney"]');
    todaysMoneyTabBtn.style.display = !isInflationMode ? 'none' : 'block';


    const moneyFormatter = (amount) => formatMoney(amount, isForeign);
    const percentFormatter = (amount) => formatPercent(amount);
    const fxRateFormatter = (amount) => formatFxRate(amount);






    // Simulation Data
    const totalMonths = simulation.totalMonths;

    const todayIndex = Math.min(passedMonths, totalMonths);
    const isCompleted = passedMonths >= totalMonths;

    const todayLabel = isCompleted ? "Son Ay" : "Bu Ay";

    const nominalYearlyRate = simulation.realAnnualNominalPercent;
    const effectiveYearlyRate = simulation.realAnnualEffectivePercent;
    const isCompounded = nominalYearlyRate !== effectiveYearlyRate;

    const inflationPercent = !isForeign ? simulation.fx.localInflationAnnualPercent : simulation.fx.foreignInflationAnnualPercent;

    const fxRateIndexTimeline = simulation.fx.fxRateIndexTimeline;
    const fxInflationIndexTimeline = simulation.fx.fxInflationIndexTimeline;

    const currentFxRate = simulation.fx.fxRateTimeline[todayIndex] ?? 1;
    const currentFxRateIndex = fxRateIndexTimeline[todayIndex] ?? 1;
    const currentFxInflationIndex = fxInflationIndexTimeline[todayIndex] ?? 1;

    const localNominalRate = simulation.fx.localNominalAnnualPercent;
    const fxNominalRate = simulation.fx.fxNominalAnnualPercent;
    const resultNominalRate = !isForeign ? localNominalRate : fxNominalRate;

    const resultNominalUncompoundedRate = !isForeign ? simulation.fx.localNominalUncompoundedAnnualPercent : simulation.fx.fxNominalUncompoundedAnnualPercent;


    const isContribution = simulation.startContribution !== 0;
    const contribPeriod = simulation.contributionPeriod ?? 'monthly';

    const startPeriodContrib = !isContribution ? null : !isForeign ? simulation.startContribution : simulation.startContributionForeign;
    const startMonthlyContrib = !isContribution ? null : convertContributionToPeriod(startPeriodContrib, contribPeriod, 'monthly');

    const todayMonthlyContributionNominalTimeline =
        !isContribution
            ? null
            : !isForeign ? simulation.fx.contributionTimeline : simulation.fx.foreignContributionTimeline;
    const todayMonthlyContributionNominal =
        !isContribution
            ? 0 : todayMonthlyContributionNominalTimeline[todayIndex + 1] ?? 0;

    const todayMonthlyRealContribution =
        !isContribution
            ? 0 : (todayIndex === 0 ? startMonthlyContrib : todayMonthlyContributionNominalTimeline[todayIndex]) ?? 0;

    const todayContributionNominal = convertContributionToPeriod(todayMonthlyContributionNominal, 'monthly', contribPeriod);
    const monthlyContribTodayText = todayMonthlyContributionNominal > 0 ? `${moneyFormatter(todayMonthlyContributionNominal)} / ${getPeriodText('monthly')}` : 'Yok';
    const periodContribTodayText = todayMonthlyContributionNominal > 0 ? `${moneyFormatter(todayContributionNominal)} / ${getPeriodText(contribPeriod)}` : 'Yok';

    const monthlyRealContribTodayText = todayMonthlyContributionNominal > 0 ? `${moneyFormatter(todayMonthlyRealContribution)} / ${getPeriodText('monthly')}` : 'Yok';




    const timelineNominal = !isForeign ? simulation.balanceTimeline : simulation.fx.foreignBalanceTimeline;

    const todayBalanceNominal = timelineNominal[todayIndex];
    const todayInvestmentNominal = !isForeign ? simulation.totalInvestmentNominalTimeline[todayIndex] : simulation.fx.totalInvestmentNominalForeignTimeline[todayIndex];
    const todayInterestNominal = todayBalanceNominal - todayInvestmentNominal;

    const monthlyIncomeNominal = !isForeign ? simulation.monthlyIncomeNominalTimeline : simulation.fx.monthlyForeignIncomeNominalTimeline;
    const monthlyIncomeReal = !isForeign ? simulation.fx.monthlyRealIncomeTimeline : simulation.fx.monthlyForeignRealIncomeTimeline;

    const periodIncomeNominal = !isForeign ? simulation.periodIncomeNominalTimeline : simulation.fx.periodForeignIncomeNominalTimeline;
    const periodIncomeReal = !isForeign ? simulation.fx.periodRealIncomeTimeline : simulation.fx.periodForeignRealIncomeTimeline;

    const period = simulation.targetPeriod ?? 'monthly';
    const periodIncomeNominalTimeline = simulation.targetPeriod != null ? periodIncomeNominal : monthlyIncomeNominal;
    const periodIncomeRealTimeline = simulation.targetPeriod != null ? periodIncomeReal : monthlyIncomeReal;


    const isTargetTime = simulation.targetType === 'time';
    const isTargetIncome = simulation.targetType === 'income';

    let todayTargetText;
    if (isTargetTime) {

        todayTargetText = formatTimeOrCheckType2(simulation.totalMonths);
    }
    else {
        let todayTargetVal = simulation.targetValueFirstDays * currentFxRateIndex * currentFxInflationIndex;
        if (isForeign) todayTargetVal /= currentFxRate;

        todayTargetText =
            simulation.targetType === 'principal'
                ? moneyFormatter(todayTargetVal)
                : `${moneyFormatter(todayTargetVal)} / ${getPeriodText(simulation.targetPeriod)}`
    }


    const inflationTotalTimeline =
        !isInflationMode ? null :
            !isForeign
                ? simulation.fx.fxInflationIndexTimeline.map((v, i) => ((v * simulation.fx.fxRateIndexTimeline[i]) - 1) * 100)
                : simulation.fx.fxInflationIndexTimeline.map(v => (v - 1) * 100);






    const balanceFirstDaysTimeline = simulation.balanceFirstDaysTimeline;
    const balanceNominalTimeline = simulation.balanceTimeline;

    const finalAmountFirstDays = simulation.fx.finalBalanceFirstDays;
    const finalAmountNominal = simulation.finalPrincipal;

    const totalInvestedFirstDays = simulation.fx.finalTotalInvestmentFirstDays;
    const totalInterestFirstDays = finalAmountFirstDays - totalInvestedFirstDays;
    const yieldRateFirstDays = (totalInterestFirstDays / totalInvestedFirstDays) * 100;

    const totalInvestedNominal = simulation.finalTotalInvestmentNominal;
    const totalInterestNominal = finalAmountNominal - totalInvestedNominal;
    const yieldRateNominal = (totalInterestNominal / totalInvestedNominal) * 100;



    // Header
    document.getElementById('modal-rate-title').innerText = header;
    document.querySelector('#detail-modal .modal-header').style.display = 'flex';

    // Top Summary
    createStartSummary(document.querySelector('#display-summary'), simulation, isInflationMode, isForeign);


    // Today Summary
    // createThisMonthSummary(document.querySelector('#display-summary-today'), simulation, todayIndex, isInflationMode, isForeign);



    // EXPECTED LEVEL THIS MONTH

    // Balance and Income Charts
    createLineChartMoney(document.getElementById("chart-growth-today"), colorPrincipal, timelineNominal, labelStartDate, true, todayIndex, todayLabel, null, moneyFormatter);
    createLineChartMoney(document.getElementById("chart-monthly-income-today"), colorIncome, monthlyIncomeNominal, labelStartDate, true, todayIndex, todayLabel, null, moneyFormatter);

    // Donut
    createDonutChartInvestInterest(document.getElementById("modal-donut-canvas-today"), todayBalanceNominal, todayInvestmentNominal, true, true, moneyFormatter);
    document.getElementById('sum-invested-today').innerText = moneyFormatter(todayInvestmentNominal);
    document.getElementById('sum-interest-today').innerText = moneyFormatter(todayInterestNominal);

    // Duration
    document.getElementById('time-passed-today').innerText = formatTimeOrText(todayIndex, '0');
    document.getElementById('time-left-today').innerText = formatTimeOrText(simulation.totalMonths - todayIndex, '0');


    // Compounding Period
    document.getElementById('compound-period-today').innerText = getPeriodText2(simulation.compoundPeriod);

    // Effective Annual Return
    document.getElementById('title-interest-compounded-today').innerText = !isCompounded ? 'Yıllık Getiri' : 'Efektif Yıllık Getiri';

    document.getElementById('interest-compounded-today').innerText =
        (
            !isCompounded
                ? `%${smartFixed(effectiveYearlyRate, 1)}`
                : `%${smartFixed(nominalYearlyRate, 1)} ➜ %${smartFixed(effectiveYearlyRate, 1)}`
        )
        + (isInflationMode ? ' Reel' : '');

    // Inflation & Nominal Return
    if (!isInflationMode) {

        document.getElementById('enf-summary-today').style.display = 'none';
        document.getElementById('yearly-interest-summary-today').style.borderBottomLeftRadius = '';
        document.getElementById('yearly-interest-summary-today').style.borderBottomRightRadius = '';

        document.querySelector('#today-metric-list').style.justifyContent = 'space-evenly';
        document.querySelectorAll('#today-metric-list h4').forEach(h4 => {
            h4.style.marginBottom = '0.75rem';
        });
    }
    else {
        document.getElementById('enf-summary-today').style.display = 'grid';
        document.getElementById('yearly-interest-summary-today').style.borderBottomLeftRadius = 0;
        document.getElementById('yearly-interest-summary-today').style.borderBottomRightRadius = 0;

        document.querySelector('#today-metric-list').style.justifyContent = 'space-between';
        document.querySelectorAll('#today-metric-list h4').forEach(h4 => {
            h4.style.marginBottom = '0.5rem';
        });

        document.getElementById('enf-rate-today').innerText = percentFormatter(inflationPercent);

        document.getElementById('target-nominal-income-today').innerText =
            (
                !isCompounded
                    ? `%${smartFixed(resultNominalRate, 1)}`
                    : `%${smartFixed(resultNominalUncompoundedRate, 1)} ➜ %${smartFixed(resultNominalRate, 1)}`
            )
            + ' Nominal';
    }

    // Contribution
    document.getElementById('contrib-today').innerText = monthlyContribTodayText;

    // Target
    // if (isTargetTime) {

    //     document.getElementById('item-target-today').style.display = 'none';
    // }
    // else {
    document.getElementById('item-target-today').style.display = 'block';

    document.getElementById('title-target-today').innerText =
        (isTargetTime ?
            'Süre'
            : simulation.targetType === 'principal'
                ? 'Anapara'
                : 'Getiri'
        ) + ' Hedefi';

    const targetToday = document.getElementById('target-today');
    targetToday.innerText = todayTargetText;
    // targetToday.classList.remove('highlight-blue', 'highlight-green');
    // targetToday.classList.add(isTargetTime ? 'highlight-blue' : 'highlight-green');
    // }




    // EXPECTED INCOME THIS MONTH

    // Income Target Summary
    if (!isTargetIncome) {

        document.getElementById("target-income-today-section").style.display = 'none';
    }
    else {

        document.getElementById("target-income-today-section").style.display = 'grid';


        const resultTargetFirstDays = !isForeign ? simulation.targetValueFirstDays : simulation.targetValueForeignFirstDays;
        const targetFirstDaysText = `${moneyFormatter(resultTargetFirstDays)} / ${getPeriodText(simulation.targetPeriod)}`;

        document.getElementById("target-start-income-today").innerText = targetFirstDaysText;

        document.getElementById("target-income-today").innerText = todayTargetText;

        let resultTargetFinal = !isForeign ? simulation.targetValueFirstDays : simulation.targetValueForeignFirstDays;
        resultTargetFinal *= !isForeign ? (simulation.fx.finalFxRateIndex * simulation.fx.finalInflationRate) : simulation.fx.finalInflationRate;

        const targetFinalText = `${moneyFormatter(resultTargetFinal)} / ${getPeriodText(simulation.targetPeriod)}`

        document.getElementById("target-final-income-today").innerText = targetFinalText;
    }

    // Income Charts
    const periodNominalTitle = `${getPeriodText2(period)} Getiri (Nominal)`;
    document.getElementById("chart-title-income1-today").innerText = periodNominalTitle;
    createLineChartMoney(document.getElementById("chart-income1-today"), colorIncome, periodIncomeNominalTimeline, labelStartDate, true, todayIndex, todayLabel, null, moneyFormatter);

    const periodRealTitle = `${getPeriodText2(period)} Getiri (Reel)`;
    document.getElementById("chart-title-income2-today").innerText = periodRealTitle;
    createLineChartMoney(document.getElementById("chart-income2-today"), colorIncome, periodIncomeRealTimeline, labelStartDate, true, todayIndex, todayLabel, null, moneyFormatter);

    // Income Summary
    createTodayIncomeSummary(document.querySelector('#display-summary-income-today'), simulation, todayIndex, isForeign, false);
    createTodayIncomeSummary(document.querySelector('#display-summary-income-real-today'), simulation, todayIndex, isForeign, true);



    // EXPECTED CONTRIBUTION THIS MONTH
    if (!isInflationMode || !isContribution) {

        document.getElementById("contrib-section").style.display = 'none';
    }
    else {

        document.getElementById("contrib-section").style.display = 'flex';


        // Monthly Contribution
        if (isContribution) {

            // Monthly Contribution
            let monthlyContribChartTimeline = [...todayMonthlyContributionNominalTimeline];
            monthlyContribChartTimeline[0] = null;

            createLineChartMoney(document.getElementById("chart-contrib-today"), colorContrib, monthlyContribChartTimeline, labelStartDate, true, todayIndex + 1, todayLabel, null, moneyFormatter);

            document.getElementById("start-contrib-today").innerText = `${moneyFormatter(startMonthlyContrib)} / ${getPeriodText('monthly')}`;
            document.getElementById("today-contrib-today").innerText = monthlyContribTodayText;

            if (contribPeriod === 'monthly') {

                toggleHorizontalCard(document.getElementById("contrib-section"), false, 0);
            }
            else {
                toggleHorizontalCard(document.getElementById("contrib-section"), true);

                // Period Contribution
                const periodContribTitle = `${getPeriodText2(contribPeriod)} Katkı`;
                document.getElementById("chart-title-period-contrib-today").innerText = periodContribTitle;

                let periodContribChartTimeline = monthlyContribChartTimeline.map(v => convertContributionToPeriod(v, 'monthly', contribPeriod));

                createLineChartMoney(document.getElementById("chart-period-contrib-today"), colorContrib, periodContribChartTimeline, labelStartDate, true, todayIndex + 1, todayLabel, null, moneyFormatter);

                document.getElementById("start-period-contrib-today").innerText = `${moneyFormatter(startPeriodContrib)} / ${getPeriodText(contribPeriod)}`;
                document.getElementById("today-period-contrib-today").innerText = periodContribTodayText;
            }
        }

    }

    // EXPECTED TARGET THIS MONTH
    if (isTargetTime || !isInflationMode) {

        document.getElementById("target-section").style.display = 'none';
    }
    else {

        document.getElementById("target-section").style.display = 'flex';


        // Monthly Target
        document.getElementById('chart-title-target-today').innerText =
            (isTargetTime ?
                'Süre'
                : simulation.targetType === 'principal'
                    ? 'Anapara'
                    : `${getPeriodText2(period)} Getiri`
            ) + ' Hedefi';

        const targetValue = !isForeign ? simulation.targetValueFirstDays : simulation.targetValueForeignFirstDays;
        const targetValueTimeline = !isForeign
            ? simulation.fx.fxInflationIndexTimeline.map((v, i) => v * simulation.fx.fxRateIndexTimeline[i] * targetValue)
            : simulation.fx.fxInflationIndexTimeline.map(v => v * targetValue);

        createLineChartMoney(document.getElementById("chart-target-today"), colorTarget, targetValueTimeline, labelStartDate, true, todayIndex, todayLabel, null, moneyFormatter);

        // Initial Target
        document.getElementById("start-target-today").innerText = !isTargetIncome
            ? moneyFormatter(targetValue)
            : `${moneyFormatter(targetValue)} / ${getPeriodText(simulation.targetPeriod)}`;

        // Current Target
        document.getElementById("today-target-today").innerText = !isTargetIncome
            ? moneyFormatter(targetValueTimeline[todayIndex])
            : `${moneyFormatter(targetValueTimeline[todayIndex])} / ${getPeriodText(simulation.targetPeriod)}`;


        // Target Progress Rate
        // const targetReachPercentTimeline =
        //     (isTargetIncome ? periodIncomeRealTimeline : timelineNominal).map((v, i) => (v / targetValueTimeline[i]) * 100);

        // createLineChartMoney(document.getElementById("chart-target-percent-today"), colorTarget, targetReachPercentTimeline, labelStartDate, true, todayIndex, todayLabel, null, percentFormatter);

        // document.getElementById("today-target-percent-today").innerText = percentFormatter(targetReachPercentTimeline[todayIndex]);

        // // Target Progress Status
        // const targetState = document.getElementById("today-target-state-today");

        // targetState.innerText = moneyFormatter((isTargetIncome ? periodIncomeRealTimeline : timelineNominal)[todayIndex]);
        // document.getElementById("today-target-state-target-today").innerText = moneyFormatter(targetValueTimeline[todayIndex]);

        // const endDisplay = document.getElementById("today-target-state-target-end-today");
        // if (isTargetIncome) {

        //     endDisplay.style.display = 'unset';
        //     endDisplay.innerText = `/ ${getPeriodText(simulation.targetPeriod)}`
        // }
        // else {
        //     endDisplay.style.display = 'none';
        // }

        // targetState.classList.remove('highlight-blue', 'highlight-green');
        // targetState.classList.add(!isTargetIncome ? 'highlight-blue' : 'highlight-green');

        toggleHorizontalCard(document.getElementById("target-section"), false, 0);

    }


    // EXPECTED INFLATION THIS MONTH
    if (!isInflationMode) {

        document.getElementById("inflation-section").style.display = 'none';
    }
    else {

        if (inflationMode === "currency")
            toggleHorizontalCard(document.getElementById("inflation-section"), true);
        else
            toggleHorizontalCard(document.getElementById("inflation-section"), false, 0);

        document.getElementById("inflation-section").style.display = 'flex';

        // Accumulated Inflation
        createLineChartMoney(document.getElementById("chart-enf-total-today"), colorEnflation, inflationTotalTimeline, labelStartDate, true, todayIndex, todayLabel, null, percentFormatter);

        document.getElementById("yearly-inflation-today").innerText = percentFormatter(inflationPercent);
        document.getElementById("today-inflation-today").innerText = percentFormatter(inflationTotalTimeline[todayIndex]);

        // Exchange Rate
        if (inflationMode === "currency") {

            document.getElementById("chart-title-fx-value-today").innerText = `Aylık Döviz (${getExchangeConfig().symbol}) Kuru`;
            createLineChartMoney(document.getElementById("chart-fx-value-today"), colorRate, simulation.fx.fxRateTimeline, labelStartDate, true, todayIndex, todayLabel, null, fxRateFormatter);

            document.getElementById("start-fx-rate-today").innerText = fxRateFormatter(simulation.fx.startFxRate);
            document.getElementById("today-fx-rate-today").innerText = fxRateFormatter(simulation.fx.fxRateTimeline[todayIndex]);
        }
    }


    // SCENARIO RESULT
    const finalPrincipal = !isForeign ? simulation.finalPrincipal : simulation.fx.finalPrincipal;
    const finalTotalInvestment = !isForeign ? simulation.finalTotalInvestmentNominal : simulation.fx.finalTotalInvestmentNominalForeign;
    const finalTotalInterest = finalPrincipal - finalTotalInvestment;

    createDonutChartInvestInterest(document.getElementById("modal-donut-canvas-final-today"), finalPrincipal, finalTotalInvestment, true, true, moneyFormatter);
    document.getElementById('sum-invested-final-today').innerText = moneyFormatter(finalTotalInvestment);
    document.getElementById('sum-interest-final-today').innerText = moneyFormatter(finalTotalInterest);

    // Income Summary
    createTodayIncomeSummary(document.querySelector('#display-summary-income-final-today'), simulation, totalMonths, isForeign, false);
    createTodayIncomeSummary(document.querySelector('#display-summary-income-real-final-today'), simulation, totalMonths, isForeign, true);

    // Target
    if (isTargetTime) {

        document.getElementById("final-target-income-summary").style.display = 'none';
    }
    else {

        document.getElementById("final-target-income-summary").style.display = 'grid';

        document.getElementById('title-final-target-income-summary').innerText =
            (isTargetTime ?
                'Süre'
                : simulation.targetType === 'principal'
                    ? 'Anapara'
                    : 'Getiri'
            ) + ' Hedefi';

        const startTargetValue = !isForeign ? simulation.targetValueFirstDays : simulation.targetValueForeignFirstDays;

        document.getElementById("target-start-income-final-today").innerText = !isTargetIncome
            ? moneyFormatter(startTargetValue)
            : `${moneyFormatter(startTargetValue)} / ${getPeriodText(simulation.targetPeriod)}`;


        let finalTargetValue = !isForeign ? simulation.targetValueFirstDays : simulation.targetValueForeignFirstDays;
        finalTargetValue *= !isForeign ? (simulation.fx.finalFxRateIndex * simulation.fx.finalInflationRate) : simulation.fx.finalInflationRate;

        document.getElementById("target-final-income-final-today").innerText = !isTargetIncome
            ? moneyFormatter(finalTargetValue)
            : `${moneyFormatter(finalTargetValue)} / ${getPeriodText(simulation.targetPeriod)}`;
    }

    // Final Inflation
    if (!isInflationMode) {

        document.getElementById("final-enf-summary").style.display = 'none';

    }
    else {

        document.getElementById("final-enf-summary").style.display = 'grid';

        // Final Rate
        document.getElementById("target-final-enf-final-today").innerText = percentFormatter(inflationTotalTimeline[totalMonths]);

        // Final FX Rate
        if (inflationMode !== "currency") {

            document.getElementById("final-rate-item").style.display = 'none';
        }
        else {

            document.getElementById("final-rate-item").style.display = 'block';

            document.getElementById("target-final-rate-final-today").innerText = fxRateFormatter(simulation.fx.finalFxRate);
        }
    }

    // Elapsed Time
    const finalTimeElement0 = document.getElementById('time-passed-final-today')
    finalTimeElement0.innerText = formatTimeOrText(simulation.totalMonths, '0');

    if (isTargetTime) finalTimeElement0.classList.add('highlight-gold');
    else finalTimeElement0.classList.remove('highlight-gold');



    // IN TODAY'S MONEY
    const valueToTodaysMoney = (value, monthIndex) => {

        const currentLocalMultiplier = currentFxRateIndex * currentFxInflationIndex;

        return !isForeign
            ? value * (currentLocalMultiplier / (fxRateIndexTimeline[monthIndex] * fxInflationIndexTimeline[monthIndex]))
            : value * (currentFxInflationIndex / fxInflationIndexTimeline[monthIndex]);
    };
    const timelineToTodaysMoney = (timeline) => {

        const currentLocalMultiplier = currentFxRateIndex * currentFxInflationIndex;

        return !isForeign
            ? timeline.map((v, i) => v * (currentLocalMultiplier / (fxRateIndexTimeline[i] * fxInflationIndexTimeline[i])))
            : timeline.map((v, i) => v * (currentFxInflationIndex / fxInflationIndexTimeline[i]));
    };


    if (!isInflationMode) {

        document.getElementById("todays-money-section").style.display = 'none';
    }
    else {

        document.getElementById("todays-money-section").style.display = 'flex';

        // Total and Income Charts
        createLineChartMoney(document.getElementById("chart-principal-todays-money-today"), colorPrincipal, timelineToTodaysMoney(timelineNominal), labelStartDate, true, todayIndex, todayLabel, null, moneyFormatter);
        createLineChartMoney(document.getElementById("chart-monthly-income-todays-money-today"), colorIncome, timelineToTodaysMoney(monthlyIncomeReal), labelStartDate, true, todayIndex, todayLabel, null, moneyFormatter);

        createDonutChartInvestInterest(document.getElementById("modal-donut-canvas-todays-money-today"), todayBalanceNominal, todayInvestmentNominal, true, true, moneyFormatter);

        const source = document.getElementById("modal-donut-canvas-today-summary");
        const target = document.getElementById("modal-donut-canvas-todays-money-today-summary");
        target.innerHTML = "";
        target.style.cssText = source.style.cssText;
        [...source.children].forEach(child => {
            const clone = child.cloneNode(true);

            clone.querySelectorAll("[id]").forEach(e => e.removeAttribute("id"));
            clone.removeAttribute("id");

            target.appendChild(clone);
        });


        const source2 = document.getElementById("today-metric-list");
        const target2 = document.getElementById("today-todays-money-metric-list");
        target2.innerHTML = "";
        [...source2.children].forEach(child => {

            const clone = child.cloneNode(true);

            // Remove the "enf-summary-today" element from the clone if it exists
            const enfSummary = clone.querySelector("#enf-summary-today");
            if (enfSummary) enfSummary.remove();

            const basicSummary = clone.querySelector("#yearly-interest-summary-today");
            if (basicSummary) {

                basicSummary.style.borderBottomLeftRadius = "";
                basicSummary.style.borderBottomRightRadius = "";
            }

            const contribTodayElement = clone.querySelector("#contrib-today");
            if (contribTodayElement) {

                contribTodayElement.innerHTML = monthlyRealContribTodayText;
            }

            clone.querySelectorAll("[id]").forEach(e => e.removeAttribute("id"));
            clone.removeAttribute("id");

            target2.appendChild(clone);
        });



        // Income (Nominal)
        if (!isTargetIncome) {

            document.getElementById("target-income-todays-money-section").style.display = 'none';
        }
        else {

            document.getElementById("target-income-todays-money-section").style.display = 'grid';

            document.getElementById("target-income-todays-money").innerText = todayTargetText;
        }

        document.getElementById("chart-title-income-todays-money-today").innerText = periodNominalTitle;
        const periodIncomeTodaysMoneyTimeline = timelineToTodaysMoney(periodIncomeNominalTimeline);

        createLineChartMoney(document.getElementById("chart-income-todays-money-today"), colorIncome, periodIncomeTodaysMoneyTimeline, labelStartDate, true, todayIndex, todayLabel, null, moneyFormatter);

        // Income (Real)
        document.getElementById("chart-title-income2-todays-money-today").innerText = periodRealTitle;
        const periodIncomeRealTodaysMoneyTimeline = timelineToTodaysMoney(periodIncomeRealTimeline);

        createLineChartMoney(document.getElementById("chart-income2-todays-money-today"), colorIncome, periodIncomeRealTodaysMoneyTimeline, labelStartDate, true, todayIndex, todayLabel, null, moneyFormatter);

        // Income Summary
        createTodayIncomeSummary(document.querySelector('#display-summary-income-todays-money-today'), simulation, todayIndex, isForeign, false);
        createTodayIncomeSummary(document.querySelector('#display-summary-income-real-todays-money-today'), simulation, todayIndex, isForeign, true);




        // SCENARIO RESULT
        const todaysMoneyfinalPrincipal = valueToTodaysMoney(!isForeign ? simulation.finalPrincipal : simulation.fx.finalPrincipal, totalMonths);
        const todaysMoneyfinalTotalInvestment = valueToTodaysMoney(!isForeign ? simulation.finalTotalInvestmentNominal : simulation.fx.finalTotalInvestmentNominalForeign, totalMonths);
        const todaysMoneyfinalTotalInterest = todaysMoneyfinalPrincipal - todaysMoneyfinalTotalInvestment;

        createDonutChartInvestInterest(document.getElementById("modal-donut-canvas-todays-money-final-today"), todaysMoneyfinalPrincipal, todaysMoneyfinalTotalInvestment, true, true, moneyFormatter);
        document.getElementById('sum-invested-todays-money-final-today').innerText = moneyFormatter(todaysMoneyfinalTotalInvestment);
        document.getElementById('sum-interest-todays-money-final-today').innerText = moneyFormatter(todaysMoneyfinalTotalInterest);

        // Income Summary
        const valueAdjuster = (amount) => valueToTodaysMoney(amount, totalMonths);
        createTodayIncomeSummary(document.querySelector('#display-summary-income-todays-money-final-today'), simulation, totalMonths, isForeign, false, valueAdjuster);
        createTodayIncomeSummary(document.querySelector('#display-summary-income-todays-money-real-final-today'), simulation, totalMonths, isForeign, true, valueAdjuster);


        // Target
        if (isTargetTime) {

            document.getElementById("final-target-income-todays-money-summary").style.display = 'none';
        }
        else {

            document.getElementById("final-target-income-todays-money-summary").style.display = 'grid';

            document.getElementById('title-final-target-income-todays-money-summary').innerText =
                (isTargetTime ?
                    'Süre'
                    : simulation.targetType === 'principal'
                        ? 'Anapara'
                        : 'Getiri'
                ) + ' Hedefi';

            document.getElementById("target-income-todays-money-today").innerText = todayTargetText;
        }


        // Elapsed Time
        const finalTimeElement = document.getElementById('time-passed-final-todays-money-today');
        finalTimeElement.innerText = formatTimeOrText(simulation.totalMonths, '0');

        if (isTargetTime) finalTimeElement.classList.add('highlight-gold');
        else finalTimeElement.classList.remove('highlight-gold');
    }


    console.log(simulation);

    adjustTodayModal();

    modalContent.style.opacity = 1;

}

function adjustTodayModal() {

    requestAnimationFrame(() => {

        modal.style.opacity = 1;

        // Observer watching for content size changes
        const ro = new ResizeObserver(entries => {
            for (let entry of entries) {

                const contentHeight = entry.contentRect.height;
                const screenHeight = window.innerHeight;

                if (contentHeight <= screenHeight) {

                    modal.style.overflowY = 'hidden';
                    entry.target.style.margin = '0';
                    modal.style.alignItems = 'center';
                }
                else {
                    modal.style.overflowY = 'auto';
                    entry.target.style.margin = '4rem auto';
                    modal.style.alignItems = 'flex-start';
                }

                ro.disconnect();
            }
        });
        // Start observing the modalContent element
        ro.observe(modalContent);
    });

}
























function toggleHorizontalCard(section, showAll, targetIndex) {
    const container = section.querySelector(".horizontal-card-container");

    // 1. ON FIRST RUN, SAVE THE ORIGINAL ORDER AND OWNERSHIP
    if (!container.hasAttribute('data-initialized')) {
        container.querySelectorAll(".canvas-wrap").forEach((el, i) => el.setAttribute('data-idx', i));

        container.querySelectorAll(".summary-top-bar").forEach((el, i) => {
            el.setAttribute('data-idx', i);
            el.querySelectorAll(".param-item").forEach(param => {
                param.setAttribute('data-parent-idx', i);
            });
        });
        container.setAttribute('data-initialized', 'true');
    }

    // --- SELECT ELEMENTS ---
    const canvases = Array.from(container.querySelectorAll(".canvas-wrap"))
        .sort((a, b) => a.getAttribute('data-idx') - b.getAttribute('data-idx'));

    const summaries = Array.from(container.querySelectorAll(".summary-top-bar:not(.temp-bar)"))
        .sort((a, b) => a.getAttribute('data-idx') - b.getAttribute('data-idx'));

    // 2. RESET TO FACTORY STATE (Cleanup)
    const allParams = container.querySelectorAll(".param-item");
    allParams.forEach(param => {
        const parentIdx = param.getAttribute('data-parent-idx');
        const originalParent = summaries.find(s => s.getAttribute('data-idx') === parentIdx);
        if (originalParent) {
            originalParent.appendChild(param);
        }
    });

    const existingWrapper = container.querySelector(".summary-column-wrapper");
    if (existingWrapper) {
        existingWrapper.remove();
    }

    // 3. APPLY THE DESIRED STATE
    if (showAll) {
        // --- LAYOUT 1: SHOW ALL (No border-radius) ---
        canvases.forEach(el => el.style.display = "");

        summaries.forEach(el => {
            el.style.display = "";
            el.style.gridTemplateColumns = "1fr 1fr";

            // Reset border-radius here
            el.style.borderTopLeftRadius = "6px";
            el.style.borderTopRightRadius = "6px";

            container.appendChild(el);
        });

        return;
    }

    // --- LAYOUT 2: SINGLE VIEW (With border-radius) ---
    canvases.forEach((el, i) => {
        el.style.display = (i === targetIndex) ? "" : "none";
    });

    summaries.forEach(el => el.style.display = "none");

    const wrapper = document.createElement("div");
    wrapper.className = "summary-column-wrapper";
    wrapper.style.display = "flex";
    wrapper.style.flexDirection = "column";
    wrapper.style.justifyContent = "space-evenly";
    container.appendChild(wrapper);

    const originalSummary = summaries[targetIndex];
    const targetParams = container.querySelectorAll(`.param-item[data-parent-idx="${targetIndex}"]`);

    targetParams.forEach(param => {
        const tempBar = originalSummary.cloneNode(false);
        tempBar.classList.add("temp-bar");
        tempBar.style.display = "";
        tempBar.style.gridTemplateColumns = "1fr";

        // Apply border-radius here
        tempBar.style.borderTopLeftRadius = "";
        tempBar.style.borderTopRightRadius = "";

        tempBar.appendChild(param);
        wrapper.appendChild(tempBar);
    });
}