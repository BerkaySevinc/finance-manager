const inputs = {
    initial: document.getElementById('initial-principal'),
    compoundType: document.getElementById('compound-type'),
    contribution: document.getElementById('contribution-amount'),
    contribPeriod: document.getElementById('contribution-period'),
    targetIncome: document.getElementById('target-income'),
    incomePeriod: document.getElementById('income-period'),
    targetPrincipal: document.getElementById('target-principal'),
    targetTimeVal: document.getElementById('target-time-val'),
    targetTimeUnit: document.getElementById('target-time-unit'),
    inflationRate: document.getElementById('inflation-rate'),
    currencyRate: document.getElementById('currency-rate'),
    currencyInflationRate: document.getElementById('currency-inflation'),
};

const main = document.querySelector('.main-content');

const resultsSection = document.getElementById('results-section');
const toggles = document.querySelectorAll('.toggle-btn');

const tableHeader = document.getElementById('table-header-row');
const tableBody = document.getElementById('table-body');
const subGoalsCheckbox = document.getElementById('show-subgoals');

// Modal Elements
const modal = document.getElementById('detail-modal');
const modalContent = modal.querySelector('.modal-content');
const modalDashboard = modal.querySelector('.modal-body-dashboard');
const closeModalBtn = document.getElementById('close-modal');



const saveModal = document.getElementById('save-modal');


main.style.marginLeft = document.querySelector('.sidebar').offsetWidth + 'px';


document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {

        // Buttons
        document.querySelectorAll(".tab-btn")
            .forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        // Contents
        document.querySelectorAll(".tab-content")
            .forEach(t => t.classList.remove("active"));

        document
            .getElementById(`tab-${btn.dataset.tab}`)
            .classList.add("active");

        if (btn.dataset.tab === 'saved') {
            renderSavedProjections();
        }
    });
});

document.querySelectorAll(".tab-btn2").forEach(btn => {
    btn.addEventListener("click", () => {

        // Buttons
        document.querySelectorAll(".tab-btn2")
            .forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        // Contents
        document.querySelectorAll(".tab-content2")
            .forEach(t => t.classList.remove("active"));

        document
            .getElementById(`tab2-${btn.dataset.tab}`)
            .classList.add("active");

        adjustTodayModal();

    });
});





toggles.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const clickedBtn = e.target;
        const group = clickedBtn.dataset.group; // 'goal' or 'enf'
        const mode = clickedBtn.dataset.mode;   // 'income', 'local', etc.

        // 1. Remove 'active' class from all buttons in the relevant group
        document.querySelectorAll(`.toggle-btn[data-group="${group}"]`).forEach(b => {
            b.classList.remove('active');
        });

        // 2. Add 'active' to the clicked button
        clickedBtn.classList.add('active');

        // 3. Hide all input fields in the relevant group
        // ID structure for goal group: goal-inputs-{mode}
        // ID structure for inflation group: enf-inputs-{mode}
        const prefix = group === 'goal' ? 'goal-inputs' : 'enf-inputs';

        // Find and hide all input divs in that group
        const container = clickedBtn.closest('.input-group-wrapper');
        container.querySelectorAll('.dynamic-inputs').forEach(div => {
            div.classList.remove('active');
        });

        // 4. Show the input field for the selected mode
        const targetDiv = document.getElementById(`${prefix}-${mode}`);
        if (targetDiv) {
            targetDiv.classList.add('active');
        }

        calculateAndDraw();
    });
});

// Iterate all inputs and save their placeholder values as dataset.defaultPlaceholder
Object.values(inputs).forEach(input => {
    if (input && input.placeholder) {
        input.dataset.defaultPlaceholder = input.placeholder;
    }
});

Object.values(inputs).forEach(input => {
    input.addEventListener('input', calculateAndDraw);
});

// Checkbox and Modal Events
subGoalsCheckbox.addEventListener('change', calculateAndDraw);

closeModalBtn.addEventListener('click', () => {
    closeModel();
});

window.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModel();
    }
});

window.addEventListener('click', (e) => {
    if (e.target === saveModal) {
        closeSaveModal();
    }
});

function closeModel() {

    modal.style.opacity = 0;
    modalContent.style.opacity = 0;
    setTimeout(() => {
        modal.scrollTop = 0;
        modal.style.display = 'none';
        document.body.classList.remove('modal-open');
    }, 300);
}





function formatTimeOrCheck(months) {

    return formatTimeOrText(months, '<span class="checkmark">✔</span>')
}

function formatTimeOrCheckType2(months) {

    return formatTimeOrTextType2(months, '<span class="checkmark">✔</span>')
}

// Utility (re-declared here in case it's not globally available from script.js)
function parseMoney(val) {
    if (typeof val === 'number') return val;
    return val === '' || val === null || val === undefined ? 0 : parseFloat(val);
}



function formatTimeOrText(months, text) {
    if (months === Infinity) return "∞";
    if (months <= 0) return text;
    if (months < 12) return `${Math.ceil(months)} Ay`;
    const years = months / 12;
    return years > 100 ? "> 100 Yıl" : `${smartFixed(years, 1)} Yıl`;
}

function formatTimeOrTextWithStartDate(months, text, startDate) {
    if (months === Infinity) return "∞";

    // Build the base date (use today if no startDate is provided)
    const baseDate = startDate ? new Date(startDate) : new Date();

    // Advance by months (Math.max(0, ...) prevents negative values)
    baseDate.setMonth(baseDate.getMonth() + Math.max(0, Math.floor(months)));

    // Format as "Month Year" (e.g. January 2025)
    const dateOptions = { month: 'long' };
    const dateText = new Intl.DateTimeFormat('tr-TR', dateOptions).format(baseDate);

    // If months === 0: "January 2025 [given text]"
    // if (months === 0) {
    //     return `${text}`;
    // }

    // In all other cases, return only the date: "March 2026"
    return dateText;
}

function formatTimeOrTextType2(months, text) {
    if (months === Infinity) return "∞";
    if (months <= 0) return text;

    const totalMonths = Math.ceil(months);

    if (totalMonths < 12) {
        return `${totalMonths} Ay`;
    }

    const years = Math.floor(totalMonths / 12);
    const remainingMonths = totalMonths % 12;

    if (years > 100) return "> 100 Yıl";

    if (remainingMonths === 0) {
        return `${years} Yıl`;
    }

    return `${years} Yıl ${remainingMonths} Ay`;
}


function calculateAndDraw() {

    // 1. Select container elements
    const container = document.querySelector('.container');
    const header = container.querySelector('header');
    const panel = document.querySelector('.control-panel');

    const principal = parseMoney(inputs.initial.value);
    const contrib = parseMoney(inputs.contribution.value);
    const compoundType = inputs.compoundType.value;
    const contribPeriod = inputs.contribPeriod.value;


    const enfMode = Object.values(toggles).find(t => t.dataset.group === "enf" && t.classList.contains("active")).dataset.mode;
    let calculateInflation = enfMode !== "none";

    let inflation = 0;
    let exchangeRateIncrease = 0;
    if (calculateInflation) {

        if (enfMode === "local") {
            inflation = parseMoney(inputs.inflationRate.value || parseFloat(inputs.inflationRate.placeholder.replace("%", "")));
        }
        else {
            exchangeRateIncrease = parseMoney(inputs.currencyRate.value || parseFloat(inputs.currencyRate.placeholder.replace("%", "")));
            inflation = parseMoney(inputs.currencyInflationRate.value || parseFloat(inputs.currencyInflationRate.placeholder.replace("%", "")));
        }

        if (inflation === 0 && exchangeRateIncrease === 0) calculateInflation = false;
    }

    if (principal <= 0 && contrib <= 0 && !calculateInflation) {

        const panelRect = panel.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(container);
        const mainComputedStyle = window.getComputedStyle(main);


        const mainPadding = parseFloat(mainComputedStyle.padding || 0);
        const containerHeight = window.innerHeight - (2 * mainPadding); // Precise decimal value

        const panelHeight = panelRect.height;       // Precise decimal value
        const rowGap = parseFloat(computedStyle.rowGap) || 0;

        // To mathematically derive the first row height (firstRowHeight):
        const calculatedFirstRow = ((containerHeight - panelHeight - (rowGap * 2)) / 2).toFixed(1);
        const firstRow = parseFloat(computedStyle.gridTemplateRows.split(' ')[0]);

        const translateAmount = calculatedFirstRow - firstRow;


        hideResults();
        container.style.transform = `translateY(${translateAmount}px)`;
        header.style.opacity = "1";

        inputs.targetIncome.placeholder = inputs.targetIncome.dataset.defaultPlaceholder;
        inputs.targetPrincipal.placeholder = inputs.targetPrincipal.dataset.defaultPlaceholder;

        return;

    } else {

        header.style.opacity = "0";

        const offset = panel.offsetTop;

        showResults();
        container.style.transform = `translateY(-${offset}px)`;
        header.style.opacity = "0";
    }


    const targetMode = Object.values(toggles).find(t => t.dataset.group === "goal" && t.classList.contains("active")).dataset.mode;

    const targetContributionTotal = convertContributionToPeriod(contrib, contribPeriod, inputs.incomePeriod.value);

    const autoBase = targetContributionTotal > 0 ? targetContributionTotal : principal;

    // Targets
    let targets = [];
    const showSubs = subGoalsCheckbox.checked;
    if (targetMode === 'income') {
        const incomePeriod = inputs.incomePeriod.value;
        let baseIncomeTarget = parseMoney(inputs.targetIncome.value);
        if (baseIncomeTarget === 0 && inputs.targetIncome.value === '') baseIncomeTarget = autoBase;
        inputs.targetIncome.placeholder = `Otomatik (${autoBase.toLocaleString()} ₺)`;

        const targetValues = showSubs
            ? [baseIncomeTarget / 3, baseIncomeTarget * (2 / 3), baseIncomeTarget]
            : [baseIncomeTarget];

        targets = targetValues.map(v => ({ val: smartRound(v), type: 'income', period: incomePeriod }));

    } else if (targetMode === 'principal') {
        let basePrincipalTarget = parseMoney(inputs.targetPrincipal.value);
        if (basePrincipalTarget === 0 && inputs.targetPrincipal.value === '') basePrincipalTarget = autoBase * 10;
        inputs.targetPrincipal.placeholder = `Otomatik (${(autoBase * 10).toLocaleString()} ₺)`;

        const targetValues = showSubs
            ? [basePrincipalTarget / 3, basePrincipalTarget * (2 / 3), basePrincipalTarget]
            : [basePrincipalTarget];

        targets = targetValues.map(v => ({ val: smartRound(v), type: 'principal' }));

    } else if (targetMode === 'time') {
        let timeVal = parseFloat(inputs.targetTimeVal.value);
        let timeUnit = parseFloat(inputs.targetTimeUnit.value);
        if (isNaN(timeVal) || timeVal <= 0) timeVal = 5;
        const totalMonths = timeVal * timeUnit;

        const targetValues = showSubs
            ? [totalMonths / 3, totalMonths * (2 / 3), totalMonths]
            : [totalMonths];

        targets = targetValues.map(v => ({ val: v, type: 'time' }));
    }

    // Annual Return Header
    let headerHtml = '<th><div class="cell-content">Yıllık Getiri</div></th>';

    // Target Headers
    targets.forEach(t => {
        let title = "";

        if (t.type === 'time') {
            // For time targets (already comes in time format)
            title = formatTimeOrCheck(t.val);
        } else {
            // For monetary targets (Principal or Income)
            title = formatMoney(t.val);

            // If in "Income Target" mode, append the period label
            if (targetMode === 'income') {
                const periodText = t.period === 'monthly' ? '/ Ay' :
                    t.period === 'yearly' ? '/ Yıl' :
                        t.period === 'weekly' ? '/ Hafta' :
                            t.period === 'daily' ? '/ Gün' : '';
                title += ` <span>${periodText}</span>`;
            }
        }

        headerHtml += `<th>
                <div class="cell-content">
                    <span class="highlight-main">${title}</span>
                </div>
            </th>`;
    });

    // Save Button Header
    headerHtml += '<th class="action-cell"><div class="cell-content" style="align-items: center;"><span class="highlight-main">Kaydet</span></div></th>';

    // Set Table Headers
    tableHeader.innerHTML = headerHtml;

    // Data
    let bodyHtml = '';
    for (let rate = 2.5; rate <= 100; rate += 2.5) {

        let isInfinity = false;
        let isComplete = false;
        let newNominalRate;

        const isCompunded = compoundType !== 'yearly';
        let nominalYearlyRate;

        // Target Data
        let cellHtml = '';
        targets.forEach(targetObj => {

            // Simulation
            const result = simulate(principal, contrib, rate, compoundType, contribPeriod, targetObj, true, {
                isFxAccount: true,
                foreignContribution: 0,
                startFxRate: 1, // local / foreign (e.g. 1 USD = X TRY -> fxRate = TRY per 1 USD)
                fxAnnualRatePercent: exchangeRateIncrease, // annual % change of the exchange rate (e.g. foreign currency appreciation vs TRY)
                fxAnnualInflationPercent: inflation, // annual inflation rate in the foreign country (%)
                autoAdjustContribByFx: true // keep contributions real-constant relative to FX + inflation
            });

            let mainText = "";
            let subText = "";
            isComplete = (result.totalMonths <= 0 && targetObj.type !== 'time');
            isInfinity = result.totalMonths === Infinity;

            console.log(result)
            nominalYearlyRate = result.realAnnualNominalPercent;

            if (result.fx) newNominalRate = result.fx.localNominalAnnualPercent;
            else {
                newNominalRate = calculateLocalNominalReturnFromForeignReal(rate / 100, exchangeRateIncrease / 100, inflation / 100) * 100;
            }


            if (isInfinity) {

                mainText =
                    targetObj.type === 'time' ? '-'
                        : formatTimeOrCheck(Infinity);
                subText = "";
            }
            else {

                if (targetObj.type === 'time') {
                    mainText = formatMoney(smartRound(result.fx.finalBalanceFirstDays ?? result.finalPrincipal));
                    const mIncome = smartRound(result.fx.finalMonthlyRealIncomeFirstDays);
                    subText = `Getiri: ${formatMoney(mIncome)} / Ay`;
                }
                else if (targetObj.type === 'principal') {
                    mainText = formatTimeOrCheck(result.totalMonths);
                    const mIncome = smartRound(result.fx.finalMonthlyRealIncomeFirstDays);

                    subText = isComplete ? "" : `Getiri: ${formatMoney(mIncome)} / Ay`;
                }
                else {
                    mainText = formatTimeOrCheck(result.totalMonths);
                    if (result.totalMonths > 0) {
                        const roundedP = smartRound(result.fx.finalBalanceFirstDays ?? result.finalPrincipal);
                        subText = `Ana: ${formatMoney(roundedP)}`;
                    } else {
                        subText = "";
                    }
                }
            }


            // If the output is a checkmark (isComplete or ✓ returned from formatTimeOrCheck),
            // the empty subText allows the CSS grid to vertically center the main value.
            cellHtml += `<td>
                    <div class="cell-content">
                        <span class="${isComplete ? 'checkmark' : 'highlight-main'}">${mainText}</span>
                        ${subText ? `<span class="sub-value">${subText}</span>` : ''}
                    </div>
                </td>`;
        });

        console.log(nominalYearlyRate + " => " + rate)

        // Return Rates
        bodyHtml += `<tr data-rate="${rate}" data-enf="${calculateInflation}" data-fx-rate="${exchangeRateIncrease}" data-enf-rate="${inflation}" ${(!isInfinity && !isComplete) ? "" : 'style="cursor: default;"'}><td>
                <div class="cell-content">

                    ${!calculateInflation ?
                `
                    <span class="highlight-main">
                    ${!isCompunded
                    ? `%${smartFixed(rate, 2)}`
                    : `%${smartFixed(nominalYearlyRate, 2)} ➜ %${smartFixed(rate, 2)}`
                }
                    </span>
                    `
                :
                `
                    <span class="highlight-main">
                    ${!isCompunded
                    ? `%${smartFixed(rate, 2)} Reel`
                    : `%${smartFixed(nominalYearlyRate, 2)} ➜ %${smartFixed(rate, 2)} Reel`
                }
                    </span>

                    <span class="highlight-main" style="font-weight: 300; opacity: 0.9;">%${smartFixed(newNominalRate, 1)} Nominal</span>
                    `
            }
                </div>
            </td>`;

        bodyHtml += cellHtml;



        const mainTarget = targets[targets.length - 1];

        const state = {
            rate, principal, contrib, compoundType,
            contribPeriod, targetObj: mainTarget
        };

        // Check if already saved (looking up from LocalStorage)
        const isSaved = isScenarioSaved(state)



        // Save Button
        if (!isInfinity && !isComplete)
            bodyHtml += `
                <td class="action-cell" onclick="event.stopPropagation()">
                    <button class="btn-save-scenario ${isSaved ? 'saved' : ''}" 
                        data-rate="${rate}" 
                        data-config='${JSON.stringify(state).replace(/"/g, '&quot;')}'
                        onclick="handleSaveClick(this)">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M2 1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H9.5a1 1 0 0 0-1 1v7.293l2.646-2.647a.5.5 0 0 1 .708.708l-3.5 3.5a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L7.5 9.293V2a2 2 0 0 1 2-2H14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h2.5a.5.5 0 0 1 0 1H2z"/></svg>
                    </button>
                </td>`;
        else
            bodyHtml += `
                <td class="action-cell" onclick="event.stopPropagation()">
                </td>`;



        bodyHtml += `</tr>`;
    }
    tableBody.innerHTML = bodyHtml;

    // Attach click events to rows
    const rows = tableBody.querySelectorAll('tr');
    rows.forEach(row => {
        row.addEventListener('click', () => {

            const rate = parseFloat(row.dataset.rate);
            const enf = row.dataset.enf === "true";
            const mainTarget = targets[targets.length - 1]; // The main target is always the last item in the array

            const simulation = simulate(principal, contrib, rate, compoundType, contribPeriod, mainTarget, true);

            showProjectionDetails(simulation, enf);
        });
    });
}




function downsampleTimeline(timeline, minPoints = 10, maxPoints = 20) {
    if (!timeline || timeline.length === 0) {
        return { data: [], labels: [] };
    }

    const len = timeline.length;

    // Already small enough: first and last are naturally included
    if (len <= maxPoints) {
        return {
            data: timeline.slice(),
            labels: timeline.map((_, i) => i)
        };
    }

    // Find the most evenly divisible point count
    let bestPoints = minPoints;
    let bestScore = Infinity;

    for (let points = minPoints; points <= maxPoints; points++) {
        const step = (len - 1) / (points - 1); // including first & last
        const score = Math.abs(step - Math.round(step));
        if (score < bestScore) {
            bestScore = score;
            bestPoints = points;
        }
    }

    const step = (len - 1) / (bestPoints - 1);

    const data = [];
    const labels = [];

    // First point
    data.push(timeline[0]);
    labels.push(0);

    // Middle points
    for (let k = 1; k < bestPoints - 1; k++) {
        const idx = Math.round(k * step);
        data.push(timeline[idx]);
        labels.push(idx);
    }

    // Last point
    if (labels.at(-1) !== len - 1) {
        data.push(timeline[len - 1]);
        labels.push(len - 1);
    }

    return { data, labels };
}




let prevContainerHeight = 0;
function fixContainer() {

    const container = document.querySelector('.container');
    if (container.offsetHeight === prevContainerHeight) return;
    prevContainerHeight = container.offsetHeight;

    container.style.transition = 'none';

    container.style.gridTemplateRows = "1fr auto 1fr";
    container.style.transform = `translateY(0)`;
    container.offsetHeight;

    const computedStyle = window.getComputedStyle(container);
    const gridRows = computedStyle.getPropertyValue('grid-template-rows');
    const rowValues = gridRows.split(' ');
    const firstRowHeight = rowValues[0]; // e.g. "140.5px"

    // 2. Shift the container up by this distance
    container.style.gridTemplateRows = firstRowHeight + " auto 1fr";

    container.style.transition = '';

    console.log("\nFixed to: " + firstRowHeight + "\n");
}
requestAnimationFrame(() => {

    const body = document.querySelector("body");

    body.style.transition = "opacity 0.4s ease";
    body.style.opacity = 1;


    setTimeout(() => { fixContainer() }, 200);

    setTimeout(() => {

        body.style.transition = '';

        containerObserver.observe(document.querySelector('.container'));

    }, 400)

})


const containerObserver = new ResizeObserver(() => {
    // Only fix position when results are hidden (panel is centered)
    console.log("triggered")
    if (resultsSection.style.display === 'none' || !resultsSection.style.display) {
        fixContainer();
    }
});



// SAME CURRENCY
function calculateNominalReturnFromReal(realReturn, inflation) {
    return (1 + realReturn) * (1 + inflation) - 1;
}

function calculateRealReturnFromNominal(nominalReturn, inflation) {
    return (1 + nominalReturn) / (1 + inflation) - 1;
}

// FOREIGN CURRENCY ↔ LOCAL
function calculateLocalNominalReturnFromForeignReal(
    foreignRealReturn,
    exchangeRateIncrease,
    foreignInflation
) {
    return (
        (1 + foreignRealReturn) *
        (1 + exchangeRateIncrease) *
        (1 + foreignInflation)
    ) - 1;
}

function calculateForeignRealReturnFromLocalNominal(
    localNominalReturn,
    exchangeRateIncrease,
    foreignInflation
) {
    return (
        (1 + localNominalReturn) /
        ((1 + exchangeRateIncrease) * (1 + foreignInflation))
    ) - 1;
}

function calculateForeignNominalForRealTarget(
    realTarget,
    exchangeRateChange,
    foreignInflation
) {
    return (
        ((1 + realTarget) * (1 + foreignInflation)) /
        (1 + exchangeRateChange)
    ) - 1;
}



let resultsAnim = null;
let isResultsVisible = false;
let hideTimeout = null;

function showResults() {
    if (isResultsVisible) return;

    isResultsVisible = true;

    if (hideTimeout) {
        clearTimeout(hideTimeout);
        hideTimeout = null;
    }

    resultsSection.style.display = 'block';

    resultsSection.style.animation = 'none';
    void resultsSection.offsetWidth;

    resultsSection.style.animation =
        "slideFadeIn 0.8s cubic-bezier(0.19, 1, 0.22, 1) both";
}


function hideResults() {
    if (!isResultsVisible) return;

    isResultsVisible = false;

    resultsSection.style.animation = 'none';
    void resultsSection.offsetWidth;

    resultsSection.style.animation =
        "slideFadeOut 0.8s cubic-bezier(0.19, 1, 0.22, 1) both";

    hideTimeout = setTimeout(() => {
        if (!isResultsVisible) {
            resultsSection.style.display = 'none';
        }
    }, 800);
}


calculateAndDraw();








document.addEventListener('DOMContentLoaded', () => {

    document.querySelectorAll('.dashboard-main-grid-today .dashboard-card.data-card').forEach(card => {
        const header = card.querySelector('h4');
        if (!header) return;

        // Create wrapper
        const body = document.createElement('div');
        body.className = 'card-body';

        // Move children into wrapper (including text nodes)
        while (header.nextSibling) {
            body.appendChild(header.nextSibling);
        }
        card.appendChild(body);

        // Add caret icon
        let icon = header.querySelector('.collapse-indicator');
        if (!icon) {
            icon = document.createElement('span');
            icon.className = 'collapse-indicator';
            icon.setAttribute('aria-hidden', 'true');
            icon.textContent = '▾';
            header.appendChild(icon);
        }

        header.classList.add('collapsible-header');

        // Accessibility
        header.setAttribute('role', 'button');
        header.setAttribute('tabindex', '0');

        // --- Read gap, reset card gap, and apply it as padding to the body ---
        const cardStyles = window.getComputedStyle(card);
        let gap = cardStyles.gap && cardStyles.gap !== 'normal' ? cardStyles.gap : (
            cardStyles.rowGap && cardStyles.rowGap !== '0px' ? cardStyles.rowGap :
                (cardStyles.columnGap && cardStyles.columnGap !== '0px' ? cardStyles.columnGap : '1.5rem')
        );

        // Copy flex-related properties from the card to the body wrapper
        body.style.display = cardStyles.display;
        body.style.flexDirection = cardStyles.flexDirection;
        body.style.justifyContent = cardStyles.justifyContent;
        body.style.alignItems = cardStyles.alignItems;
        body.style.flexWrap = cardStyles.flexWrap;
        body.style.gap = gap;

        header.style.marginBottom = gap;
        card.style.gap = '0px';
        card.style.paddingBottom = '0px';
        body.style.boxSizing = 'border-box';

        const openCloseTransition = 'max-height 420ms cubic-bezier(.2,.9,.2,1), padding-top 360ms cubic-bezier(.2,.9,.2,1), opacity 260ms ease';
        body.style.transition = openCloseTransition;

        const computedBodyDisplay = window.getComputedStyle(body).display === 'none'
            ? 'block'
            : window.getComputedStyle(body).display;

        // Track active handler to prevent animation spam
        let activeTransitionHandler = null;

        // Helper: open card
        function openCard() {
            if (!card.classList.contains('collapsed')) return;

            // Remove existing transition end listener if present
            if (activeTransitionHandler) {
                body.removeEventListener('transitionend', activeTransitionHandler);
            }

            body.style.display = computedBodyDisplay;
            body.style.maxHeight = '0px';
            body.style.opacity = '0';
            body.style.paddingBottom = '0px';
            body.style.paddingBottom = gap;

            void body.offsetHeight; // force reflow

            const targetHeight = body.scrollHeight + 'px';
            card.classList.remove('collapsed');
            header.setAttribute('aria-expanded', 'true');

            body.style.maxHeight = targetHeight;
            body.style.opacity = '1';

            activeTransitionHandler = (e) => {
                if (e.target !== body || e.propertyName !== 'max-height') return;
                body.style.maxHeight = 'none';
                body.removeEventListener('transitionend', activeTransitionHandler);
                activeTransitionHandler = null;
            };
            body.addEventListener('transitionend', activeTransitionHandler);
        }

        // Helper: close card
        function closeCard() {
            if (card.classList.contains('collapsed')) return;

            // Remove existing transition end listener if present
            if (activeTransitionHandler) {
                body.removeEventListener('transitionend', activeTransitionHandler);
            }

            const currentHeight = body.scrollHeight;
            body.style.maxHeight = currentHeight + 'px';
            body.style.opacity = '1';
            body.style.paddingBottom = gap;

            void body.offsetHeight; // force reflow

            card.classList.add('collapsed');
            header.setAttribute('aria-expanded', 'false');

            body.style.maxHeight = '0px';
            body.style.paddingBottom = '0px';
            body.style.opacity = '0';

            activeTransitionHandler = (e) => {
                if (e.target !== body || e.propertyName !== 'max-height') return;
                body.style.display = 'none';
                body.style.maxHeight = '';
                body.removeEventListener('transitionend', activeTransitionHandler);
                activeTransitionHandler = null;
            };
            body.addEventListener('transitionend', activeTransitionHandler);
        }

        header.addEventListener('click', (ev) => {
            ev.stopPropagation();
            if (card.classList.contains('collapsed')) openCard();
            else closeCard();
        });

        header.addEventListener('keydown', (ev) => {
            if (ev.key === 'Enter' || ev.key === ' ' || ev.key === 'Spacebar') {
                ev.preventDefault();
                ev.stopPropagation();
                if (card.classList.contains('collapsed')) openCard();
                else closeCard();
            }
        });

        card.addEventListener('click', () => {
            if (card.classList.contains('collapsed')) openCard();
        });

        if (card.classList.contains('collapsed')) {
            body.style.display = 'none';
            body.style.maxHeight = '0px';
            body.style.opacity = '0';
            body.style.paddingBottom = '0px';
            header.setAttribute('aria-expanded', 'false');
            icon.style.transform = 'rotate(-90deg)';
        } else {
            body.style.display = computedBodyDisplay;
            body.style.maxHeight = 'none';
            body.style.opacity = '1';
            body.style.paddingBottom = gap;
            header.setAttribute('aria-expanded', 'true');
            icon.style.transform = 'rotate(0deg)';
        }

        const observer = new MutationObserver(() => {
            if (card.classList.contains('collapsed')) icon.style.transform = 'rotate(-90deg)';
            else icon.style.transform = 'rotate(0deg)';
        });
        observer.observe(card, { attributes: true, attributeFilter: ['class'] });

        const firstChild = body.firstElementChild;
        if (firstChild) {
            const mt = parseFloat(window.getComputedStyle(firstChild).marginTop || 0);
            if (mt > 0) firstChild.style.marginTop = '0px';
        }

    });
});




// TODO: Handle projections where more time has passed than expected (e.g. show a "completed" marker or highlight the target point)

// TODO: When "View Details" is opened, if no tab is selected, default to the first tab
// TODO: Card collapse/expand state should be persisted; adjustTodayModal is not working correctly (could be solved by attaching a one-time ResizeObserver that auto-adjusts on size changes)

// TODO: Consider adding a monthly progress percentage indicator to the contribution section

// TODO: In the projection calculator, when an inflation mode is selected, the default value should come from settings rather than defaulting to 0
// TODO: The exchange rate increase setting should not display as 0 by default, since it auto-reads from settings
// TODO: If the exchange rate changes month to month, it should be automatically increased by the configured rate after the saved month

// TODO: Add a button to install the site as a desktop app (PWA)