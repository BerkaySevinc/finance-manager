



/* =========================
   Simple Local Store (LocalStorage)
========================= */


const appName = 'financial-management';
const version = "1";

var account = "main";



const storage = {
    get(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : (fallback ?? null);
        } catch (e) { console.warn('Storage read error', e); return fallback ?? null; }
    },
    set(key, value) {
        try { localStorage.setItem(key, JSON.stringify(value)); }
        catch (e) { console.warn('Storage write error', e); }
    }
};




var LS_KEYS = {};
let options;

let settings;
let portfolio;
let savedProjections;

function setStorage(accountName) {

    // Get options
    LS_KEYS.OPTIONS = [appName, ('v' + version), 'options'].join('.');
    options = storage.get(LS_KEYS.OPTIONS, {});


    if (accountName) account = accountName;
    else if (options.selectedAccount) account = options.selectedAccount;

    LS_KEYS.SETTINGS = [appName, ('v' + version), account, 'settings'].join('.');
    LS_KEYS.PORTFOLIO = [appName, ('v' + version), account, 'portfolio'].join('.');
    LS_KEYS.SAVED_PROJECTIONS = [appName, ('v' + version), account, 'saved_projections'].join('.');


    settings = storage.get(LS_KEYS.SETTINGS, {});
    portfolio = storage.get(LS_KEYS.PORTFOLIO, []);
    savedProjections = storage.get(LS_KEYS.SAVED_PROJECTIONS, []);
    

    options.savedAccounts = options.savedAccounts ?? [];

    // Add account to list if not already present
    if (!options.savedAccounts.includes(account)) {
        options.savedAccounts.push(account);
    }

    options.selectedAccount = account;

    storage.set(LS_KEYS.OPTIONS, options);
}
setStorage();





function saveAll() {

    storage.set(LS_KEYS.SETTINGS, settings);
    storage.set(LS_KEYS.PORTFOLIO, portfolio);
    storage.set(LS_KEYS.SAVED_PROJECTIONS, savedProjections);

}