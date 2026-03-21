











const defaultForeignCurrencySymbol = '$'
const defaultExchangeRate = 1;
const defaultExchangeIncrease = 0;
const defaultExchangeIncreasePlaceholder = '-';
const defaultExchangeInflation = 0;

const defaultLocalInflation = 0;



document.addEventListener('DOMContentLoaded', () => {

    // 1. Select Elements
    const symbolInput = document.getElementById('settings-currency-symbol');
    const rateInput = document.getElementById('settings-currency-rate');
    const increaseInput = document.getElementById('settings-currency-increase-rate');
    const inflationInput = document.getElementById('settings-currency-inflation-rate');

    const localInflationInput = document.getElementById('settings-local-inflation-rate');



    // 4. Load Data and Populate Inputs
    function loadCurrencySettings() {

        const config = getExchangeConfig(true);

        symbolInput.placeholder = defaultForeignCurrencySymbol;
        rateInput.placeholder = defaultExchangeRate.toFixed(2);
        increaseInput.placeholder = defaultExchangeIncreasePlaceholder;
        inflationInput.placeholder = defaultExchangeInflation.toFixed(2);

        localInflationInput.placeholder = defaultLocalInflation.toFixed(2);



        symbolInput.value = config.symbol ?? null;
        rateInput.value = config.rate ?? null;
        increaseInput.value = config.exchangeIncrease ?? null;
        inflationInput.value = config.inflation ?? null;

        localInflationInput.value = config.localInflation ?? null;

        // Calculator
        inputs.inflationRate.placeholder = "%" + (localInflationInput.value || parseFloat(localInflationInput.placeholder));

        inputs.currencyInflationRate.placeholder = "%" + (inflationInput.value || parseFloat(inflationInput.placeholder));
    }

    // 5. Save Data
    function saveCurrencySettings() {

        // Settings
        settings.user_currency_symbol = symbolInput.value;
        settings.user_currency_rate = rateInput.value;
        settings.user_currency_increase_rate = increaseInput.value;
        settings.user_currency_inflation_rate = inflationInput.value;

        settings.user_currency_local_inflation_rate = localInflationInput.value;

        saveAll();

        const btn = document.querySelector('.tab-btn[data-tab="saved"]');
        if (btn.classList.contains('active')) {

            window.renderSavedProjections();
        }

        // Calculator
        inputs.inflationRate.placeholder = "%" + (localInflationInput.value || parseFloat(localInflationInput.placeholder));

        inputs.currencyInflationRate.placeholder = "%" + (inflationInput.value || parseFloat(inflationInput.placeholder));


        const btn2 = document.querySelector('.tab-btn[data-tab="projection"]');
        if (btn2.classList.contains('active')) {

            window.calculateAndDraw();
        }
    }

    // 6. Add Event Listeners (saves on each keystroke)
    symbolInput.addEventListener('input', saveCurrencySettings);
    rateInput.addEventListener('input', saveCurrencySettings);
    increaseInput.addEventListener('input', saveCurrencySettings);
    inflationInput.addEventListener('input', saveCurrencySettings);
    localInflationInput.addEventListener('input', saveCurrencySettings);



    // Load on initialization
    loadCurrencySettings();
});


// --- HELPER FUNCTION ---
// Use this function in other chart rendering code.
function getExchangeConfig(nullIfNotExists = false) {

    const config = {
        symbol: settings.user_currency_symbol,
        rate: parseFloat(settings.user_currency_rate),
        exchangeIncrease: parseFloat(settings.user_currency_increase_rate),
        inflation: parseFloat(settings.user_currency_inflation_rate),

        localInflation: parseFloat(settings.user_currency_local_inflation_rate),

    };

    if (!nullIfNotExists)
        return {
            symbol: config.symbol || defaultForeignCurrencySymbol,
            rate: config.rate || defaultExchangeRate,
            exchangeIncrease: config.exchangeIncrease || defaultExchangeIncrease,
            inflation: config.inflation || defaultExchangeInflation,

            localInflation: config.localInflation || defaultLocalInflation,
        };

    return config;
}




function accounts() {

    console.log(options.savedAccounts);
}


function setAccount(accountName) {

    setStorage(accountName);

    // Portfolio
    renderPortfolioInputs();
    updatePortfolioCharts();

    // Saved Projections
    renderSavedProjections();
}

function swapSaved(first, second) {

    first = first - 1;
    second = second - 1;

    const temp = savedProjections[first];
    savedProjections[first] = savedProjections[second];
    savedProjections[second] = temp;

    saveAll();

    // Saved Projections
    renderSavedProjections();
}




function help() {

    console.log("")
    console.log("")
    console.log("accounts()")
    console.log("setAccount(string accountName)")
    console.log("")
    console.log("swapSaved(first, second)")
    console.log("")
    console.log("")

}


