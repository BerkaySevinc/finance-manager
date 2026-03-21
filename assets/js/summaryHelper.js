

const colorPrincipal = "#4ea8ff";
const colorIncome = "#32d48a";
const colorContrib = "#47daee";
const colorEnflation = "#ff4e4e";
const colorRate = "#cd4eff";
const colorTarget = "#ffd735";




function createStartSummary(element, simulation, isInflationMode = false, isForeign = false) {

    adjustSummaryDivStyle(element);

    const moneyFormatter = (amount) => formatMoney(amount, isForeign);


    // Data
    const totalMonths = simulation.totalMonths;

    const realAnnualEffectivePercent = simulation.realAnnualEffectivePercent;

    const startPrincipal = !isForeign ? simulation.startPrincipal : simulation.startPrincipalForeign;

    const contribPeriod = simulation.contributionPeriod;
    const resultContrib = !isForeign ? simulation.startContribution : simulation.startContributionForeign;
    const contribText = resultContrib > 0 ? `${moneyFormatter(resultContrib)} / ${getPeriodText(contribPeriod)}` : "Yok";

    const isTargetTime = simulation.targetType === 'time';

    element.innerHTML =
        `

        <div class="param-item">
            <span class="p-label">Başlangıç</span>
            <span class="p-val">${moneyFormatter(startPrincipal)}</span>
        </div>

        <div class="param-item">
            <span class="p-label">Düzenli Katkı</span>
            <span class="p-val highlight-cyan">${contribText}</span>
        </div>

        <div class="param-item">
            <span class="p-label">Yıllık Getiri</span>
            <div class="p-val highlight-blue">%${smartFixed(realAnnualEffectivePercent, 1)}${isInflationMode ? ' Reel' : ''}</div>
        </div>

        <div class="param-item">
            <span class="p-label">${isTargetTime ? 'Süre Hedefi' : 'Toplam Süre'}</span>
            <div class="p-val ${isTargetTime ? "highlight-gold" : "highlight-blue"}">${formatTimeOrCheckType2(totalMonths)}</div>
        </div>

        ${isTargetTime ? '' : (() => {

            const resultTarget = !isForeign ? simulation.targetValueFirstDays : simulation.targetValueForeignFirstDays;

            const targetText =
                simulation.targetType === 'principal'
                    ? moneyFormatter(resultTarget)
                    : `${moneyFormatter(resultTarget)} / ${getPeriodText(simulation.targetPeriod)}`

            return `

            <div class="param-item">
                <span class="p-label" id="target-saved-label">${simulation.targetType === 'principal' ? 'Anapara' : 'Getiri'} Hedefi</span>
                <span class="p-val highlight-gold">${targetText}</span>
            </div> 

            `})()
        }

        `;

}





function createThisMonthSummary(element, simulation, passedMonths, isInflationMode = false, isForeign = false) {

    adjustSummaryDivStyle(element);

    const moneyFormatter = (amount) => formatMoney(amount, isForeign);


    // Data
    const totalMonths = simulation.totalMonths;
    const todayIndex = Math.min(passedMonths, totalMonths);

    const isCompleted = passedMonths >= totalMonths;

    const isTargetTime = simulation.targetType === 'time';


    element.innerHTML =
        `

        ${false ? '' : (() => {

            const localNominalRate = simulation.fx.localNominalAnnualPercent;
            const fxNominalRate = simulation.fx.fxNominalAnnualPercent;
            const resultNominalRate = !isForeign ? localNominalRate : fxNominalRate;

            const todayMonthlyContributionNominal = !isForeign ? simulation.fx.contributionTimeline[todayIndex + 1] : simulation.fx.foreignContributionTimeline[todayIndex + 1];

            return `

            <div class="param-item">
                <span class="p-label">Gerekli Yıllık Getiri</span>
                <span class="p-val highlight-blue">%${smartFixed(resultNominalRate, 1)}${isInflationMode ? ' Nominal' : ''}</span>
            </div>


            ${todayMonthlyContributionNominal == null ? '' : (() => {

                    const contribTodayText = `${moneyFormatter(todayMonthlyContributionNominal)} / ${getPeriodText('monthly')}`;

                    return `

                    <div class="param-item">
                        <span class="p-label">Ay Sonuna Gerekli Katkı</span>
                        <span class="p-val highlight-cyan">${contribTodayText}</span>
                    </div>

                    `})()
                }

            `})()
        }

        ${!isCompleted ?
            `
            <div class="param-item">
                <span class="p-label">Geçen Süre</span>
                <span class="p-val">${formatTimeOrText(todayIndex, '0')}</span>
            </div>
    
            <div class="param-item">
                <span class="p-label">Kalan Süre</span>
                <span class="p-val">${formatTimeOrText(totalMonths - todayIndex, '0')}</span>
            </div>
            `
            :
            `

            <div class="param-item">
                <span class="p-label">Süre</span>
                <span class="p-val highlight-dark-green">${totalMonths === passedMonths ? 'Bu Ay' : (formatTimeOrText(passedMonths - totalMonths, '0') + ' Önce')} Tamamlandı</span>
            </div>

            `
        }

        ${!isInflationMode || isTargetTime ? '' : (() => {

            const currentFxRate = simulation.fx.fxRateTimeline[todayIndex] ?? 1;
            const currentFxRateIndex = simulation.fx.fxRateIndexTimeline[todayIndex] ?? 1;
            const currentFxInflationIndex = simulation.fx.fxInflationIndexTimeline[todayIndex] ?? 1;

            let todayTargetVal = simulation.targetValueFirstDays * currentFxRateIndex * currentFxInflationIndex;
            if (isForeign) todayTargetVal /= currentFxRate;

            const targetText =
                simulation.targetType === 'principal'
                    ? moneyFormatter(todayTargetVal)
                    : `${moneyFormatter(todayTargetVal)} / ${getPeriodText(simulation.targetPeriod)}`

            return `

            <div class="param-item">
                <span class="p-label">${simulation.targetType === 'principal' ? 'Anapara' : 'Reel Getiri'} Hedefi</span>
                <span class="p-val highlight-gold">${targetText}</span>
            </div>

            `})()
        }

       

        `;

}







function createTodayIncomeSummary(element, simulation, passedMonths, isForeign = false, isReal = false, valueAdjuster = null) {

    adjustSummaryDivStyle(element);


    const moneyFormatter =
        valueAdjuster == null ?
            (amount) => formatMoney(amount, isForeign)
            : (amount) => formatMoney(valueAdjuster(amount), isForeign);


    // Data
    const localBalanceTimeline = simulation.balanceTimeline;
    const foreignBalanceTimeline = simulation.fx.foreignBalanceTimeline;
    const resultTimeline = !isForeign ? localBalanceTimeline : foreignBalanceTimeline;

    const todayBalance = resultTimeline[passedMonths];


    const realAnnualEffectiveRate = simulation.realAnnualEffectivePercent;
    const localNominalRate = simulation.fx.localNominalAnnualPercent;
    const fxNominalRate = simulation.fx.fxNominalAnnualPercent;

    const currentFxRateIndex = simulation.fx.fxRateIndexTimeline[passedMonths] ?? 1;
    const currentFxInflationIndex = simulation.fx.fxInflationIndexTimeline[passedMonths] ?? 1;

    const options = {

        yearlyRealRate: realAnnualEffectiveRate / 100,

        yearlyLocalNominalRate: localNominalRate / 100,
        yearlyForeignNominalRate: fxNominalRate / 100,

        currentFxRateIndex: currentFxRateIndex,
        currentInflationIndex: currentFxInflationIndex,
    };



    const dailyIncomeNominal = todayBalance * getPeriodIncomeRate(options, 'daily', isForeign, isReal, false);
    // const dailyIncomeNominalText = `${moneyFormatter(dailyIncomeNominal)} / ${getPeriodText('daily')}`
    const dailyIncomeNominalText = moneyFormatter(dailyIncomeNominal);

    const weeklyIncomeNominal = todayBalance * getPeriodIncomeRate(options, 'weekly', isForeign, isReal, false);
    // const weeklyIncomeNominalText = `${moneyFormatter(weeklyIncomeNominal)} / ${getPeriodText('weekly')}`
    const weeklyIncomeNominalText = moneyFormatter(weeklyIncomeNominal);

    const monthlyIncomeNominal = todayBalance * getPeriodIncomeRate(options, 'monthly', isForeign, isReal, false);
    // const monthlyIncomeNominalText = `${moneyFormatter(monthlyIncomeNominal)} / ${getPeriodText('monthly')}`
    const monthlyIncomeNominalText = moneyFormatter(monthlyIncomeNominal);

    const yearlyIncomeNominal = todayBalance * getPeriodIncomeRate(options, 'yearly', isForeign, isReal, false);
    // const yearlyIncomeNominalText = `${moneyFormatter(yearlyIncomeNominal)} / ${getPeriodText('yearly')}`
    const yearlyIncomeNominalText = moneyFormatter(yearlyIncomeNominal);


    // Data
    element.innerHTML =
        `

        <div class="param-item">
            <span class="p-label">Günlük Getiri</span>
            <span class="p-val highlight-green">${dailyIncomeNominalText}</span>
        </div>

         <div class="param-item">
            <span class="p-label">Haftalık Getiri</span>
            <span class="p-val highlight-green">${weeklyIncomeNominalText}</span>
        </div>

         <div class="param-item">
            <span class="p-label">Aylık Getiri</span>
            <span class="p-val highlight-green">${monthlyIncomeNominalText}</span>
        </div>

         <div class="param-item">
            <span class="p-label">Yıllık Getiri</span>
            <span class="p-val highlight-green">${yearlyIncomeNominalText}</span>
        </div>

        `;

}









function adjustSummaryDivStyle(element) {
    if (!element) return;

    // scope class
    const scopeClass = "summary-scope";
    element.classList.add(scopeClass);

    // layout styles
    Object.assign(element.style, {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        background: "var(--bg-input)",
        borderRadius: "12px",
        padding: "1rem",
        border: "1px solid var(--border-color)"
    });

    // Skip if scoped style already exists
    if (element.querySelector("style[data-summary-scope]")) return;

    const style = document.createElement("style");
    style.dataset.summaryScope = "true"; // must match the selector exactly

    style.textContent = `
    .${scopeClass} .param-item {
      text-align: center;
    }

    .${scopeClass} .p-label {
      display: block;
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-bottom: 8px;
    }

    .${scopeClass} .p-val {
      font-weight: 600;
      font-size: 1.1rem;
    }

    .${scopeClass} .highlight-blue {
      color: var(--accent-blue);
    }

    .${scopeClass} .highlight-green {
      color: var(--accent-green-bright);
    }
  `;

    element.appendChild(style);
}





function getPeriodText(period) {

    return period === 'monthly' ? 'Ay' :
        period === 'yearly' ? 'Yıl' :
            period === 'weekly' ? 'Hafta' :
                period === 'daily' ? 'Gün' : '';
}

function getPeriodText2(period) {

    return period === 'monthly' ? 'Aylık' :
        period === 'yearly' ? 'Yıllık' :
            period === 'weekly' ? 'Haftalık' :
                period === 'daily' ? 'Günlük' : '';
}

