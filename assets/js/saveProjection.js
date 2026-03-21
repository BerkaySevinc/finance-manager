












/* =========================================
   SAVED PROJECTIONS LOGIC
========================================= */




window.handleSaveClick = function (btn) {
    // Parse the config attribute back to an object
    const d = JSON.parse(btn.getAttribute('data-config'));

    // Forward to the original function with intact types
    saveProjectionScenario(
        btn, d
    );
};




// Hold the pending scenario data as a global variable
let pendingScenario = null;

// 1. Open modal when the save button is clicked
saveProjectionScenario = function (btn, state) {

    console.log(state)

    // Get the current input state and simulation result (used to compute elapsed time)
    pendingScenario = {
        state: state,
        btn: btn
    };

    // Prepare the modal
    document.getElementById('modal-save-title').value = `${state.rate}% Getiri Senaryosu`;
    document.getElementById('modal-save-date').value = new Date().toISOString().split('T')[0];

    const currencyConfig = getExchangeConfig();
    document.getElementById('modal-save-currency-rate-label').innerText = `Başlangıç Döviz Kuru (${currencyConfig.symbol})`;
    document.getElementById('modal-save-currency-rate').placeholder = currencyConfig.rate.toFixed(2);
    document.getElementById('modal-save-currency-rate').value = null;


    document.getElementById('save-modal').style.display = 'flex';
};

// 2. Close Modal
window.closeSaveModal = function () {
    document.getElementById('save-modal').style.display = 'none';

    pendingScenario = null;
};

// 3. Save when the "Add" button in the modal is clicked
document.getElementById('confirm-save-btn').onclick = function () {

    if (!pendingScenario) return;

    const title = document.getElementById('modal-save-title').value || "Başlıksız Senaryo";
    const date = document.getElementById('modal-save-date').value;
    const currencyStartRate = parseFloat(document.getElementById('modal-save-currency-rate').value) || getExchangeConfig().rate;

    savedProjections.push({
        id: Date.now(),
        title: title,
        displayDate: date,
        inputs: pendingScenario.state,
        currencyStartRate,
        displayInDoviz: false,
        inflationMode: 'none'
    });

    saveAll();

    // Update UI
    pendingScenario.btn.classList.add('saved');

    closeSaveModal();
};





// Check if scenario is already saved (used during table generation)
function isScenarioSaved(currentState) {

    return savedProjections.some(item => {
        const s = item.inputs;
        // Compare technical data
        return JSON.stringify(s) === JSON.stringify(currentState);
    });
}







// Edit Function
window.editSavedScenario = function (id) {

    const index = savedProjections.findIndex(s => s.id === id);
    if (index === -1) return;

    const newTitle = prompt("Yeni başlığı girin:", savedProjections[index].title);
    if (newTitle === null) return; // Cancelled

    const newDate = prompt("Yeni tarihi girin (YYYY-MM-DD):", savedProjections[index].displayDate);
    if (newDate === null) return;

    savedProjections[index].title = newTitle;
    savedProjections[index].displayDate = newDate;

    saveAll();
    renderSavedProjections();
};



// Delete Saved Projection
window.deleteSavedProjection = function (id) {

    if (confirm('Bu kaydı silmek istediğinize emin misiniz?')) {

        id = parseInt(id);

        savedProjections = savedProjections.filter(item => item.id !== id);

        saveAll();

        // 1. Update the saved list (Tab 3)
        renderSavedProjections();

        // 2. Update the projection table (Tab 2) so save icons are refreshed
        // Re-renders the table if it was previously built
        if (typeof calculateAndDraw === "function") {
            calculateAndDraw();
        }

    }
};


window.updateSavedProjection = function (id, updatedData) {
    // Convert ID to a number (parseInt safety)
    const targetId = parseInt(id);

    // Find the target scenario and merge updated data into it
    savedProjections = savedProjections.map(item => {
        if (item.id === targetId) {
            // Preserve existing data, only overwrite provided fields
            return { ...item, ...updatedData };
        }
        return item;
    });

    saveAll();

    // 1. Update the saved list (Tab 3)
    renderSavedProjections();

    // 2. Update the projection table (Tab 2) so save icons are refreshed
    // Re-renders the table if it was previously built
    if (typeof calculateAndDraw === "function") {
        calculateAndDraw();
    }
};






























// Render saved projections to screen (Tab 3)
window.savedSimulationCache = {};
// 4. Render cards with full details (Tab 3)
window.renderSavedProjections = function () {

    window.savedSimulationCache = {};

    const container = document.getElementById('saved-projections-list');
    const emptyState = document.getElementById('saved-empty-state');
    const header = document.getElementById('saved-header');

    if (savedProjections.length === 0) {
        container.innerHTML = '';
        emptyState.style.display = 'block';
        header.style.display = 'block';
        return;
    }
    header.style.display = 'none';
    emptyState.style.display = 'none';



    container.innerHTML = '';
    savedProjections.forEach(item => {

        const isDoviz = item.displayInDoviz === true;

        container.innerHTML += `
            <div class="saved-scenario-card">


                <div class="scenario-top-row">
                    <h3 class="scenario-title">${item.title}</h3>

                    <div>
                    <span class="scenario-date">${getExchangeConfig().symbol}${item.inflationMode === 'currency' ? item.currencyStartRate : getExchangeConfig().rate} 💵</span>
                    <span class="scenario-date">${item.displayDate} 📅</span>
                    </div>
                </div>


                <div id="top-summary"></div>



                <div class="scenario-status-info" style="justify-content: center; margin-top: auto; padding-top: 1.5rem; border-top: 1px solid rgba(255, 255, 255, 0.05);">
                    <h4 id="result-title" style="text-align: center;">Beklenen Güncel Seviye</h4>
                </div>





            <div id="today-top-summary"></div>







            <div style="text-align: center; display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;" class="horizontal-card-container">

                <div class="canvas-wrap""></div>

                
                <div style="flex: 1 1 0">

                  <div class="canvas-wrap" style="height: 330px; padding: 1.75rem;"></div>

                </div>




            </div>





            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">

            <div class="summary-top-bar" style="grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));" id="today-bottom-summary">

              <div class="param-item" id="monthlyIncomeNominal-saved-item">
                    <span class="p-label">Nominal Getiri</span>
                    <span class="p-val highlight-green" id="monthlyIncomeNominal-saved">-</span>
                    </div>

                    <div class="param-item">
                    <span class="p-label" id="monthlyIncomeReal-saved-label">Reel Getiri</span>
                    <span class="p-val highlight-green" id="monthlyIncomeReal-saved">-</span>
                    </div>

            </div>

            <div class="summary-top-bar" style="grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));" id="today-bottom-summary">

                    <div class="param-item">
                    <span class="p-label">Toplam Yatırım</span>
                    <span class="p-val highlight-blue" id="totalInvestX">-</span>
                    </div>

                    <div class="param-item">
                    <span class="p-label">Toplam Getiri</span>
                    <span class="p-val highlight-green" id="totalInterestX">-</span>
                    </div>

            </div>

            </div>





                <div class="scenario-bottom-row">


                  <div class="currency-switch-container">
                        <span class="switch-label ${!isDoviz ? 'active-label' : ''}">TL</span>
                        <label class="switch">
                            <input type="checkbox" id="toggle-${item.id}" 
                                   onchange="currencyChanged('${item.id}', 'toggle')"
                                   ${isDoviz ? 'checked' : ''}>
                            <span class="slider round"></span>
                        </label>
                        <span class="switch-label ${isDoviz ? 'active-label' : ''}">
                            Döviz (${getExchangeConfig().symbol})
                        </span>
                    </div>



<div class="inflation-control-wrapper">
            <span class="control-label">Enflasyon Etkisi</span>
            <div class="segmented-control">
                <button class="segment-btn ${item.inflationMode === 'none' ? 'active' : ''}" 
                        onclick="window.updateInflationMode('${item.id}', 'none')">
                    Yok
                </button>
                <button class="segment-btn ${item.inflationMode === 'local' ? 'active' : ''}" 
                        onclick="window.updateInflationMode('${item.id}', 'local')">
                    Yerel Bazlı
                </button>
                <button class="segment-btn ${item.inflationMode === 'currency' ? 'active' : ''}" 
                        onclick="window.updateInflationMode('${item.id}', 'currency')">
                    Döviz Bazlı
                </button>
            </div>
        </div>



                    <div class="scenario-actions">
                        <button class="btn-action view" onclick="window.loadAndShowDetail('${item.id}')">Detay Gör</button>
                        <button class="btn-action edit" onclick="window.editSavedScenario('${item.id}')">Düzenle</button>
                        <button class="btn-action delete" onclick="window.deleteSavedProjection('${item.id}')">Sil</button>
                    </div>
                </div>


        </div>

        `;

    });





    requestAnimationFrame(() => {


        for (let i = 0; i < savedProjections.length; i++) {

            // Elements
            const conts = container.querySelectorAll('.horizontal-card-container');
            const cont = conts[i];

            const summary = cont.closest('.saved-scenario-card');

            const charts = cont.querySelectorAll('.canvas-wrap');

            const lineChart = charts[0];
            const donutChart = charts[1];


            // Kaydedilenler
            const item = savedProjections[i];
            const s = item.inputs;

            const savedDate = new Date(item.displayDate);
            const today = new Date();

            let passedMonths = (today.getFullYear() - savedDate.getFullYear()) * 12 + (today.getMonth() - savedDate.getMonth());

            const isInflationMode = item.inflationMode !== 'none';

            const isForeign = item.displayInDoviz === true;

            let moneyFormatter = (amount) => formatMoney(amount, isForeign);


            let principal = s.principal;
            let contrib = s.contrib;
            let compoundType = s.compoundType;
            let contribPeriod = s.contribPeriod;
            let rate = s.rate;
            let targetObj = s.targetObj;


            console.log("\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n")
            console.log(item)
            console.log("\n\n\n\n")




            let isCompleted = targetObj.type === 'time' && targetObj.val <= passedMonths;


            const currencyConfig = getExchangeConfig();
            const currencyTodayRate = currencyConfig.rate;
            let simulation;

            // Local-based inflation
            if (item.inflationMode === 'local') {

                const inflation = currencyConfig.localInflation;
                console.log(inflation)

                simulation = simulate(principal, contrib, rate, compoundType, contribPeriod, targetObj, true, {
                    isFxAccount: true,
                    foreignContribution: 0,
                    startFxRate: currencyTodayRate, // local / foreign (e.g. 1 USD = X TRY -> fxRate = TRY per 1 USD)
                    fxAnnualRatePercent: 0, // annual % change of the exchange rate (e.g. foreign currency appreciation vs TRY)
                    fxAnnualInflationPercent: inflation, // annual inflation rate in the foreign country (%)
                    autoAdjustContribByFx: true // keep contributions real-constant relative to FX + inflation
                });
            }

            // Currency-based inflation
            else if (item.inflationMode === 'currency') {

                // Required data
                const currencyStartRate = item.currencyStartRate;
                const exchangeRateUntilToday = calculateAnnualGrowthByMonthDiff(savedDate, today, currencyStartRate, currencyTodayRate) * 100;

                const savedExpectedExchangeRate = getExchangeConfig(true).exchangeIncrease;
                const isExpectedExchangeRateNotFound = (savedExpectedExchangeRate == null) || Number.isNaN(savedExpectedExchangeRate);
                const exchangeRateExpected = isExpectedExchangeRateNotFound ? exchangeRateUntilToday : currencyConfig.exchangeIncrease;

                // Simulation

                // If target is time-based and already completed
                if (isCompleted) {

                    simulation = simulate(principal, contrib, rate, compoundType, contribPeriod, { ...targetObj }, true, {
                        isFxAccount: true,
                        foreignContribution: 0,
                        startFxRate: currencyStartRate, // local / foreign (e.g. 1 USD = X TRY -> fxRate = TRY per 1 USD)
                        fxAnnualRatePercent: exchangeRateUntilToday, // annual % change of the exchange rate (e.g. foreign currency appreciation vs TRY)
                        fxAnnualInflationPercent: currencyConfig.inflation, // annual inflation rate in the foreign country (%)
                        autoAdjustContribByFx: true // keep contributions real-constant relative to FX + inflation
                    });
                }

                // If target is not time-based, check for completion
                else {

                    const checkSimulation = simulate(principal, contrib, rate, compoundType, contribPeriod, { ...targetObj }, true, {

                        isFxAccount: true,
                        foreignContribution: 0,
                        startFxRate: currencyStartRate, // local / foreign (e.g. 1 USD = X TRY -> fxRate = TRY per 1 USD)
                        fxAnnualRatePercent: exchangeRateUntilToday, // annual % change of the exchange rate (e.g. foreign currency appreciation vs TRY)
                        fxAnnualInflationPercent: currencyConfig.inflation, // annual inflation rate in the foreign country (%)
                        autoAdjustContribByFx: true // keep contributions real-constant relative to FX + inflation
                    });

                    isCompleted = passedMonths >= checkSimulation.totalMonths;

                    // If completed, use the check simulation result
                    if (isCompleted) simulation = checkSimulation;

                    // If not completed, simulate up to today and continue from there
                    else {

                        const targetObjUntilToday = { ...targetObj, val: passedMonths, type: 'time' };
                        const simulationUntilToday = simulate(principal, contrib, rate, compoundType, contribPeriod, targetObjUntilToday, true, {
                            isFxAccount: true,
                            foreignContribution: 0,
                            startFxRate: currencyStartRate, // local / foreign (e.g. 1 USD = X TRY -> fxRate = TRY per 1 USD)
                            fxAnnualRatePercent: exchangeRateUntilToday, // annual % change of the exchange rate (e.g. foreign currency appreciation vs TRY)
                            fxAnnualInflationPercent: currencyConfig.inflation, // annual inflation rate in the foreign country (%)
                            autoAdjustContribByFx: true // keep contributions real-constant relative to FX + inflation
                        });


                        const targetObjAfterToday = {
                            ...targetObj,

                            val: targetObj.type === 'time'
                                ? targetObj.val - simulationUntilToday.totalMonths
                                : targetObj.val
                        };


                        simulation = simulate(null, contrib, rate, compoundType, contribPeriod, targetObjAfterToday, true, {
                            isFxAccount: true,
                            foreignContribution: 0,
                            fxAnnualRatePercent: exchangeRateExpected, // annual % change of the exchange rate (e.g. foreign currency appreciation vs TRY)
                            fxAnnualInflationPercent: currencyConfig.inflation, // annual inflation rate in the foreign country (%)
                            autoAdjustContribByFx: true, // keep contributions real-constant relative to FX + inflation
                        }
                            , simulationUntilToday);
                    }
                }

            }

            // Nominal (No Inflation)
            else {

                simulation = simulate(principal, contrib, rate, compoundType, contribPeriod, targetObj, true, {
                    isFxAccount: true,
                    foreignContribution: 0,
                    startFxRate: currencyTodayRate, // local / foreign (e.g. 1 USD = X TRY -> fxRate = TRY per 1 USD)
                    fxAnnualRatePercent: 0, // annual % change of the exchange rate (e.g. foreign currency appreciation vs TRY)
                    fxAnnualInflationPercent: 0, // annual inflation rate in the foreign country (%)
                    autoAdjustContribByFx: false // keep contributions real-constant relative to FX + inflation
                });
            }

            
            
            window.savedSimulationCache[item.id] = {
                title: item.title,
                simulation,
                savedDate,
                passedMonths: passedMonths,
                inflationMode: item.inflationMode,
                isForeign
            };
            
            
            
            
            
            // Simulation Data
            const totalMonths = simulation.totalMonths;
            const todayIndex = Math.min(passedMonths, totalMonths);

            const startPrincipal = !isForeign ? simulation.startPrincipal : simulation.startPrincipalForeign;

            const realAnnualEffectiveRate = simulation.realAnnualEffectivePercent;
            const localNominalRate = simulation.fx.localNominalAnnualPercent;
            const fxNominalRate = simulation.fx.fxNominalAnnualPercent;
            const resultNominalRate = !isForeign ? localNominalRate : fxNominalRate;

            const currentFxRate = simulation.fx.fxRateTimeline[todayIndex] ?? 1;
            const currentFxRateIndex = simulation.fx.fxRateIndexTimeline[todayIndex] ?? 1;
            const currentFxInflationIndex = simulation.fx.fxInflationIndexTimeline[todayIndex] ?? 1;

            const options = {

                yearlyRealRate: realAnnualEffectiveRate / 100,

                yearlyLocalNominalRate: localNominalRate / 100,
                yearlyForeignNominalRate: fxNominalRate / 100,

                currentFxRateIndex: currentFxRateIndex,
                currentInflationIndex: currentFxInflationIndex,
            };

            const localBalanceTimeline = simulation.balanceTimeline;
            const foreignBalanceTimeline = simulation.fx.foreignBalanceTimeline;
            const resultTimeline = !isForeign ? localBalanceTimeline : foreignBalanceTimeline;

            const todayBalance = resultTimeline[todayIndex];

            const totalInvestmentNominal = !isForeign ? simulation.totalInvestmentNominalTimeline[todayIndex] : simulation.fx.totalInvestmentNominalForeignTimeline[todayIndex];

            const totalInterest = todayBalance - totalInvestmentNominal;

            const resultContrib = !isForeign ? contrib : contrib / simulation.fx.startFxRate;
            const contribText = resultContrib > 0 ? `${moneyFormatter(resultContrib)} / ${getPeriodText(contribPeriod)}` : "Yok";



            // Mark card as completed
            if (isCompleted) summary.style.borderColor = "var(--accent-green)";


            // Top Summary
            createStartSummary(summary.querySelector('#top-summary'), simulation, isInflationMode, isForeign);


            // Current Month Top Summary
            createThisMonthSummary(summary.querySelector('#today-top-summary'), simulation, passedMonths, isInflationMode, isForeign);


            // Charts
            createLineChartMoney(lineChart, "#4ea8ff", resultTimeline, savedDate, false, todayIndex, isCompleted ? "Son Ay" : "Bu Ay", 6, moneyFormatter);
            createDonutChartInvestInterest(donutChart, todayBalance, totalInvestmentNominal, true, true, moneyFormatter);


            // Current Month Bottom Summary
            const targetIncomePeriod = targetObj.period || 'monthly';

            const todayPeriodIncomeReal = todayBalance * getPeriodIncomeRate(options, targetIncomePeriod, isForeign, true, false);
            const todayPeriodIncomeRealText = `${moneyFormatter(todayPeriodIncomeReal)} / ${getPeriodText(targetIncomePeriod)}`

            summary.querySelector("#totalInvestX").innerText = moneyFormatter(totalInvestmentNominal);
            summary.querySelector("#totalInterestX").innerText = moneyFormatter(totalInterest);

            summary.querySelector("#monthlyIncomeReal-saved").innerText = todayPeriodIncomeRealText;

            if (item.inflationMode === 'none') {

                summary.querySelector("#monthlyIncomeReal-saved-label").innerText = "Getiri";

                summary.querySelector("#monthlyIncomeNominal-saved-item").style.display = 'none';
            }
            else {

                summary.querySelector("#monthlyIncomeReal-saved-label").innerText = "Reel Getiri";

                const todayPeriodIncomeNominal = todayBalance * getPeriodIncomeRate(options, targetIncomePeriod, isForeign, false, false);
                const todayPeriodIncomeNominalText = `${moneyFormatter(todayPeriodIncomeNominal)} / ${getPeriodText(targetIncomePeriod)}`

                summary.querySelector("#monthlyIncomeNominal-saved").innerText = todayPeriodIncomeNominalText;

                summary.querySelector("#monthlyIncomeNominal-saved-item").style.display = 'block';
            }




        }
    });

};







function getRangeFromArray(arr, index, distance) {
    // Start index: index - (distance - 1)
    // Clamped to 0 with Math.max (slice handles it too, but this is explicit)
    let start = Math.max(0, index - (distance - 1));

    // End index: index + distance
    // Since slice's second argument is exclusive, we add +1 to include the last element
    let end = index + distance + 1;

    // The slice method copies the specified range
    return arr.slice(start, end);
}






// Show Details (Open Modal)
window.loadAndShowDetail = function (id) {

    id = parseInt(id);

    const cached = window.savedSimulationCache?.[id];

    if (!cached) {
        console.error("Simulation cache bulunamadı:", id);
        return;
    }

    showProjectionTodayDetails(
        cached.title,
        cached.simulation,
        cached.inflationMode,
        cached.isForeign,
        cached.savedDate,
        cached.passedMonths
    );
};




window.currencyChanged = function (scenarioId, type) {

    if (type === 'toggle') {
        const toggle = document.getElementById(`toggle-${scenarioId}`);

        // Delegate to the central update function
        updateSavedProjection(scenarioId, {
            displayInDoviz: toggle.checked
        });
    }
};


/**
 * Updates the inflation mode for a scenario and refreshes the UI.
 * @param {string} id - The unique ID of the scenario
 * @param {string} mode - 'none', 'local', or 'currency'
 */
window.updateInflationMode = function (id, mode) {

    const cardControl = document.querySelector(`[onclick*="updateInflationMode('${id}'"]`)?.parentElement;
    if (cardControl) {
        cardControl.querySelectorAll('.segment-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('onclick').includes(`'${mode}'`)) {
                btn.classList.add('active');
            }
        });
    }

    window.updateSavedProjection(id, { inflationMode: mode });
};