







/* =========================================
   PORTFOLIO MANAGEMENT LOGIC
========================================= */



// --- DOM ELEMENTS ---
const assetListEl = document.getElementById('asset-list');
const addGroupBtn = document.getElementById('add-asset-group-btn');
const totalValueEl = document.getElementById('port-total-value');
const emptyStateEl = document.getElementById('port-empty-state');
const stackedChartWrapper = document.getElementById('stacked-chart-wrapper');
const stackedDonutChartWrapper = document.getElementById('stacked-donut-chart-wrapper');


// Chart Instances
let pieChartInstance = null;
let barChartInstance = null;
let donutChartInstance = null;


// --- EVENTS ---
if (addGroupBtn) {
    addGroupBtn.addEventListener('click', () => {
        const newGroup = {
            id: 'g' + Date.now(),
            name: 'Yeni Grup',
            color: getRandomColor(),
            manualAmount: 0,
            subItems: []
        };
        portfolio.push(newGroup);

        saveAll();
        renderPortfolioInputs();
        updatePortfolioCharts();
    });
}

// --- FUNCTIONS ---

// Random color generator (pastel tones compatible with the GitHub Dark palette)
function getRandomColor() {
    const colors = ['#58a6ff', '#238636', '#da3633', '#d29922', '#a371f7', '#f0883e', '#3fb950'];
    return colors[Math.floor(Math.random() * colors.length)];
}



// Render portfolio input list
function renderPortfolioInputs() {
    if (!assetListEl) return;
    assetListEl.innerHTML = '';

    if (portfolio.length === 0) {
        emptyStateEl.style.display = 'block';
        stackedChartWrapper.style.display = 'none';
        stackedDonutChartWrapper.style.display = 'none';

    } else {
        emptyStateEl.style.display = 'none';
    }

    portfolio.forEach(group => {
        const groupEl = document.createElement('div');
        groupEl.className = 'asset-card';

        // If sub-items exist, the main amount should be read-only and computed
        const hasSubItems = group.subItems.length > 0;
        const groupTotal = hasSubItems
            ? group.subItems.reduce((sum, item) => sum + item.amount, 0)
            : group.manualAmount;

        groupEl.innerHTML = `
                <div class="asset-card-header">
                    <div class="color-input-wrapper" style="background-color: ${group.color}">
                        <input type="color" value="${group.color}" data-id="${group.id}" class="action-change-color">
                    </div>
                    <input type="text" class="port-input action-change-name" data-id="${group.id}" value="${group.name}" placeholder="Grup Adı">

                    <input type="number" class="port-input action-change-amount" 
       data-id="${group.id}" 
       value="${group.manualAmount === 0 ? '' : group.manualAmount}" 
       placeholder="0">

                    <button class="btn-icon action-delete-group" data-id="${group.id}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg>
                    </button>
                </div>
            `;

        // Sub-items container
        const subItemsContainer = document.createElement('div');
        subItemsContainer.className = 'sub-items-container';

        // If no sub-items, optionally hide the container or just show the add button
        if (!hasSubItems) {
            // subItemsContainer.style.display = 'none'; // Optional
        }

        // Render sub-items
        group.subItems.forEach(sub => {
            const subRow = document.createElement('div');
            subRow.className = 'sub-item-row';
            subRow.innerHTML = `
                    <div class="color-input-wrapper sub-color-wrapper" style="background-color: ${sub.color}">
                         <input type="color" value="${sub.color}" data-group-id="${group.id}" data-sub-id="${sub.id}" class="action-sub-color">
                    </div>
                    <input type="text" class="port-input action-sub-name" data-group-id="${group.id}" data-sub-id="${sub.id}" value="${sub.name}" placeholder="Varlık Adı">
                    
                    <input type="number" class="port-input action-sub-amount" 
       data-group-id="${group.id}" 
       data-sub-id="${sub.id}" 
       value="${sub.amount === 0 ? '' : sub.amount}" 
       placeholder="0">
                    
                    <button class="btn-icon action-sub-delete" data-group-id="${group.id}" data-sub-id="${sub.id}">✕</button>
                `;
            subItemsContainer.appendChild(subRow);
        });

        // Add Sub-item Button
        const addSubBtn = document.createElement('button');
        addSubBtn.className = 'btn-add-sub';
        addSubBtn.textContent = '+ Alt Varlık Ekle';
        addSubBtn.addEventListener('click', () => {
            group.subItems.push({
                id: 's' + Date.now(),
                name: 'Yeni Varlık',
                color: group.color, // Default to the group color
                amount: 0
            });

            saveAll();
            renderPortfolioInputs();
            updatePortfolioCharts();
        });

        subItemsContainer.appendChild(addSubBtn);
        groupEl.appendChild(subItemsContainer);
        assetListEl.appendChild(groupEl);
    });

    attachInputListeners();
}


// Listen for input changes (direct binding is cleaner than event delegation here)
function attachInputListeners() {
    // Group Color
    document.querySelectorAll('.action-change-color').forEach(inp => {
        inp.addEventListener('input', (e) => {
            const group = portfolio.find(g => g.id === e.target.dataset.id);
            if (group) {
                group.color = e.target.value;
                e.target.parentElement.style.backgroundColor = e.target.value;

                saveAll();
                updatePortfolioCharts();
            }
        });
    });

    // Group Name
    document.querySelectorAll('.action-change-name').forEach(inp => {
        inp.addEventListener('input', (e) => {
            const group = portfolio.find(g => g.id === e.target.dataset.id);
            if (group) {
                group.name = e.target.value;

                saveAll();
                updatePortfolioCharts(); // Update chart label
            }
        });
    });

    // Group Amount (Manual)
    document.querySelectorAll('.action-change-amount').forEach(inp => {
        inp.addEventListener('input', (e) => {
            const group = portfolio.find(g => g.id === e.target.dataset.id);
            if (group) {
                group.manualAmount = parseFloat(e.target.value) || 0;

                saveAll();
                updatePortfolioCharts();
            }
        });
    });

    // Delete Group
    document.querySelectorAll('.action-delete-group').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id; // currentTarget is important since the SVG child is also clickable
            portfolio = portfolio.filter(g => g.id !== id);

            saveAll();
            renderPortfolioInputs();
            updatePortfolioCharts();
        });
    });

    // --- SUB-ITEM LISTENERS ---

    // Sub-item Name
    document.querySelectorAll('.action-sub-name').forEach(inp => {
        inp.addEventListener('input', (e) => {
            const { groupId, subId } = e.target.dataset;
            const group = portfolio.find(g => g.id === groupId);
            const sub = group.subItems.find(s => s.id === subId);
            sub.name = e.target.value;

            saveAll();
            updatePortfolioCharts();
        });
    });

    // Sub-item Amount
    document.querySelectorAll('.action-sub-amount').forEach(inp => {
        inp.addEventListener('input', (e) => {
            const { groupId, subId } = e.target.dataset;
            const group = portfolio.find(g => g.id === groupId);
            const sub = group.subItems.find(s => s.id === subId);
            sub.amount = parseFloat(e.target.value) || 0;

            // Update the parent group input (even if visually disabled)
            saveAll();
            updatePortfolioCharts();
        });
    });

    // Sub-item Color
    document.querySelectorAll('.action-sub-color').forEach(inp => {
        inp.addEventListener('input', (e) => {
            const { groupId, subId } = e.target.dataset;
            const group = portfolio.find(g => g.id === groupId);
            const sub = group.subItems.find(s => s.id === subId);
            sub.color = e.target.value;
            e.target.parentElement.style.backgroundColor = e.target.value;

            saveAll();
            updatePortfolioCharts();
        });
    });

    // Delete Sub-item
    document.querySelectorAll('.action-sub-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const { groupId, subId } = e.target.dataset;
            const group = portfolio.find(g => g.id === groupId);
            group.subItems = group.subItems.filter(s => s.id !== subId);

            saveAll();
            renderPortfolioInputs();
            updatePortfolioCharts();
        });
    });
}

// Chart.js Update
function updatePortfolioCharts() {

    if (!document.getElementById('port-pie-chart')) return;

    // 1. Data Preparation
    const labels = [];
    const dataPie = [];
    const backgroundColorsPie = [];

    let totalPortfolioValue = portfolio.reduce((sum, g) => sum + (parseFloat(g.manualAmount) || 0), 0);

    let hasAnySubItem = false;


    const sortedDataForPie = [...portfolio].sort((a, b) => {
        return (parseFloat(b.manualAmount) || 0) - (parseFloat(a.manualAmount) || 0);
    });

    // 1. Data Preparation (Main Groups Only)
    sortedDataForPie.forEach(group => {
        labels.push(group.name);
        backgroundColorsPie.push(group.color);
        dataPie.push(group.manualAmount);

        if (group.subItems.length > 0) {
            amount = group.subItems.reduce((sum, s) => sum + s.amount, 0);
            hasAnySubItem = true;
        }
    });

    // --- PIE CHART (LABELS OUTSIDE) ---
    const pieConfig = {
        type: 'doughnut',
        plugins: [ChartDataLabels],
        data: {
            labels: labels,
            datasets: [{
                data: dataPie,
                backgroundColor: backgroundColorsPie,
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            devicePixelRatio: window.devicePixelRatio || 1, // Match pixel ratio to screen quality
            responsive: true,
            maintainAspectRatio: false,

            layout: {
                // Extra padding since labels and percentages are rendered outside
                padding: 50
            },
            plugins: {
                legend: { display: false },
                tooltip: {

                    backgroundColor: 'rgba(22, 27, 34, 0.95)', // GitHub Dark background
                    titleColor: '#58a6ff', // Title color (blue tone)
                    bodyColor: '#adbac7',  // Body text color
                    borderColor: '#30363d', // Thin border
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 8,       // Rounded corners for a smooth look
                    displayColors: true,   // Show color indicator

                    // --- FONT SETTINGS ---
                    titleFont: {
                        family: "'Inter', 'Segoe UI', 'Roboto', sans-serif",
                        size: 13,
                        weight: 600
                    },
                    bodyFont: {
                        family: "'Inter', 'Segoe UI', 'Roboto', sans-serif",
                        size: 12,
                        weight: 400
                    },

                    callbacks: {
                        label: function (context) {
                            let value = context.raw || 0;
                            let percentage = totalPortfolioValue > 0 ? "%" + smartFixed((value / totalPortfolioValue) * 100, 1) : "%0";
                            return ` ${percentage}`;
                        }
                    }
                },
                datalabels: {
                    // Pin labels outside the slice
                    anchor: 'end',
                    align: 'end',
                    color: '#c9d1d9', // GitHub Dark text color
                    offset: 15, // Offset for visual breathing room
                    textAlign: 'center',

                    // --- FONT SETTINGS ---
                    font: {
                        family: "'Inter', 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif",
                        size: 12,
                        weight: 600, // 600 is more modern than bold/700
                        lineHeight: 1.5 // Breathing room between lines
                    },
                    formatter: (value, ctx) => {
                        if (!value || value === 0) return null;

                        // Calculate percentage
                        let pct = totalPortfolioValue > 0 ? smartFixed(value / totalPortfolioValue * 100, 1) : 0;
                        // Label (name)
                        let label = ctx.chart.data.labels[ctx.dataIndex];

                        // Name on top, percentage on the line below
                        return `${label}\n%${pct}`;
                    }
                }
            }
        }
    };

    if (pieChartInstance) pieChartInstance.destroy();
    const ctxPie = document.getElementById('port-pie-chart').getContext('2d');
    pieChartInstance = new Chart(ctxPie, pieConfig);


    // --- STACKED BAR CHART ---
    if (hasAnySubItem) {
        stackedChartWrapper.style.display = 'block';
        stackedDonutChartWrapper.style.display = 'block';


        let barDatasets = [];


        const sortedPortfolioData = [...portfolio].sort((a, b) => {
            const amountA = parseFloat(a.manualAmount) || 0;
            const amountB = parseFloat(b.manualAmount) || 0;

            // 1. Main amount comparison (primary sort key)
            if (amountB !== amountA) {
                return amountB - amountA;
            }

            // 2. Iterative sub-asset comparison (tie-breaker)
            // Build a descending-sorted list of sub-asset amounts for each group
            const subListA = a.subItems.map(s => parseFloat(s.amount) || 0).sort((x, y) => y - x);
            const subItemsTotalA = subListA.reduce((sum, value) => sum + value, 0);

            const subListB = b.subItems.map(s => parseFloat(s.amount) || 0).sort((x, y) => y - x);
            const subItemsTotalB = subListB.reduce((sum, value) => sum + value, 0);



            // Loop over the longer list (one group may have fewer sub-assets)
            const maxLength = Math.max(subListA.length, subListB.length);

            for (let i = 0; i < maxLength; i++) {
                const valA = ((subListA[i] || 0) / subItemsTotalA) * 100;
                const valB = ((subListB[i] || 0) / subItemsTotalB) * 100;

                // If values differ at this index, the larger one wins and the loop ends
                if (valB !== valA) {
                    return valB - valA;
                }
                // If values are equal, continue to the next index
            }

            // If everything is identical, preserve the current order
            return 0;
        });


        sortedPortfolioData.forEach((group, groupIndex) => {
            const groupMainAmount = parseFloat(group.manualAmount) || 0;
            // This group's percentage weight in the total portfolio (determines bar height)
            const groupPctWeight = totalPortfolioValue > 0 ? (groupMainAmount / totalPortfolioValue * 100) : 0;


            const sortedSubItems = [...group.subItems].sort((a, b) => b.amount - a.amount);
            const subItemsTotal = sortedSubItems.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);

            if (sortedSubItems.length > 0) {

                sortedSubItems.forEach(sub => {
                    const dataArray = new Array(portfolio.length).fill(0);

                    // Formula: (Sub-asset / Sub-assets total) * Group's portfolio weight %
                    if (subItemsTotal > 0)
                        dataArray[groupIndex] = (sub.amount / subItemsTotal) * groupPctWeight;
                    else
                        dataArray[groupIndex] = (1 / sortedSubItems.length) * groupPctWeight;

                    barDatasets.push({
                        label: sub.name,
                        data: dataArray,
                        backgroundColor: sub.color,
                        barPercentage: 0.8,

                        borderRadius: {
                            topLeft: 12,
                            topRight: 12,
                            bottomLeft: 4,
                            bottomRight: 4
                        },
                        borderSkipped: 'middle',

                        realPct: ((sub.amount / subItemsTotal) * 100) // Share within the group
                    });
                });

            } else if (groupMainAmount > 0) {
                const dataArray = new Array(portfolio.length).fill(0);
                dataArray[groupIndex] = groupPctWeight;
                barDatasets.push({
                    label: group.name,
                    data: dataArray,
                    backgroundColor: group.color,
                    barPercentage: 0.8,

                    borderRadius: {
                        topLeft: 12,
                        topRight: 12,
                        bottomLeft: 4,
                        bottomRight: 4
                    },
                    borderSkipped: 'middle',

                    realPct: 100
                });
            }
        });


        const sortedLabels = sortedPortfolioData.map(group => group.name);

        const barConfig = {
            type: 'bar',
            plugins: [ChartDataLabels],
            data: { labels: sortedLabels, datasets: barDatasets },
            options: {
                devicePixelRatio: window.devicePixelRatio || 1, // Match pixel ratio to screen quality
                responsive: true,
                maintainAspectRatio: false,

                scales: {
                    x: {
                        stacked: true,
                        grid: { color: '#30363d' },
                        ticks: {
                            color: '#a9adb3',
                            font: {
                                family: "'Inter', 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif",
                                size: 12,
                                weight: 500, // 600 is more modern than bold/700
                                lineHeight: 1.4 // Breathing room between lines
                            },
                            // Show group name with percentage below it on the X-axis
                            callback: function (value, index) {
                                const label = this.getLabelForValue(value);
                                // Look up the group's amount from sorted data and calculate its percentage
                                const group = sortedPortfolioData[index];
                                if (group && totalPortfolioValue > 0) {
                                    const groupPct = ((parseFloat(group.manualAmount) || 0) / totalPortfolioValue * 100);
                                    // Returning an array causes Chart.js to render each item on a new line
                                    return [label, `%${smartFixed(groupPct, 1)}`];
                                }
                                return label;
                            }
                        }
                    },
                    y: {
                        stacked: true,
                        grid: { color: '#30363d' },
                        ticks: {
                            color: '#8b949e',
                            callback: (val) => `%${val}` // Display Y-axis values as percentages
                        }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(22, 27, 34, 0.95)', // GitHub Dark background
                        titleColor: '#58a6ff', // Title color (blue tone)
                        bodyColor: '#adbac7',  // Body text color
                        borderColor: '#30363d', // Thin border
                        borderWidth: 1,
                        padding: 12,
                        cornerRadius: 8,       // Rounded corners for a smooth look
                        displayColors: true,   // Show color indicator

                        // --- FONT SETTINGS ---
                        titleFont: {
                            family: "'Inter', 'Segoe UI', 'Roboto', sans-serif",
                            size: 13,
                            weight: 600
                        },
                        bodyFont: {
                            family: "'Inter', 'Segoe UI', 'Roboto', sans-serif",
                            size: 12,
                            weight: 400
                        },

                        callbacks: {
                            label: function (context) {
                                let label = context.dataset.label || '';
                                // Pull the real within-group percentage stored in the dataset
                                let pct = context.dataset.realPct || 0;
                                return ` ${label}: %${smartFixed(pct, 1)}`;
                            }
                        }
                    },

                    datalabels: {

                        offset: 15, // Offset for visual breathing room
                        color: '#fcfcfc', // Slightly off-white to reduce eye strain
                        textAlign: 'center',

                        // --- FONT SETTINGS ---
                        font: {
                            family: "'Inter', 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif",
                            size: 12,
                            weight: 600, // 600 is more modern than bold/700
                            lineHeight: 1.5 // Breathing room between lines
                        },

                        opacity: 1,
                        formatter: (value, ctx) => {
                            if (!value || value === 0) return null;

                            // Calculate the sub-asset's percentage share within its group total
                            const groupSum = ctx.chart.data.datasets
                                .map(ds => ds.data[ctx.dataIndex])
                                .reduce((a, b) => a + b, 0);

                            let pct = groupSum > 0 ? smartFixed((value / groupSum) * 100, 1) : 0;

                            return ctx.dataset.label + `\n%${pct}`;
                        }
                    }
                }
            }
        };

        if (barChartInstance) barChartInstance.destroy();
        const ctxBar = document.getElementById('port-bar-chart').getContext('2d');
        barChartInstance = new Chart(ctxBar, barConfig);



        const donutLabels = [];
        const donutData = [];
        const donutBgs = [];

        barDatasets.forEach(d => {

            donutLabels.push(d.label);
            donutData.push(d.data.find(v => v !== 0) || 0);
            donutBgs.push(d.backgroundColor);

        });


        const donutConfig = {
            type: 'doughnut',
            plugins: [ChartDataLabels],
            data: {
                labels: donutLabels,
                datasets: [{
                    data: donutData,
                    backgroundColor: donutBgs,
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                devicePixelRatio: window.devicePixelRatio || 1, // Match pixel ratio to screen quality
                responsive: true,
                maintainAspectRatio: false,

                layout: {
                    // Extra padding since labels and percentages are rendered outside
                    padding: 50
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {

                        backgroundColor: 'rgba(22, 27, 34, 0.95)', // GitHub Dark background
                        titleColor: '#58a6ff', // Title color (blue tone)
                        bodyColor: '#adbac7',  // Body text color
                        borderColor: '#30363d', // Thin border
                        borderWidth: 1,
                        padding: 12,
                        cornerRadius: 8,       // Rounded corners for a smooth look
                        displayColors: true,   // Show color indicator

                        // --- FONT SETTINGS ---
                        titleFont: {
                            family: "'Inter', 'Segoe UI', 'Roboto', sans-serif",
                            size: 13,
                            weight: 600
                        },
                        bodyFont: {
                            family: "'Inter', 'Segoe UI', 'Roboto', sans-serif",
                            size: 12,
                            weight: 400
                        },

                        callbacks: {
                            label: function (context) {
                                let value = context.raw || 0;
                                let percentage = totalPortfolioValue > 0 ? "%" + smartFixed((value / totalPortfolioValue) * 100, 1) : "%0";
                                return ` ${percentage}`;
                            }
                        }
                    },
                    datalabels: {
                        // Pin labels outside the slice
                        anchor: 'end',
                        align: 'end',
                        color: '#c9d1d9', // GitHub Dark text color
                        offset: 15, // Offset for visual breathing room
                        textAlign: 'center',

                        // --- FONT SETTINGS ---
                        font: {
                            family: "'Inter', 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif",
                            size: 12,
                            weight: 600, // 600 is more modern than bold/700
                            lineHeight: 1.5 // Breathing room between lines
                        },
                        formatter: (value, ctx) => {
                            if (!value || value === 0) return null;

                            // Calculate percentage
                            let pct = totalPortfolioValue > 0 ? smartFixed(value / totalPortfolioValue * 100, 1) : 0;
                            // Label (name)
                            let label = ctx.chart.data.labels[ctx.dataIndex];

                            // Name on top, percentage on the next line
                            return `${label}\n%${pct}`;
                        }
                    }
                }
            }
        };

        if (donutChartInstance) donutChartInstance.destroy();
        const ctxDonut = document.getElementById('port-stacked-donut-chart').getContext('2d');
        donutChartInstance = new Chart(ctxDonut, donutConfig);




    } else {
        stackedChartWrapper.style.display = 'none';
        stackedDonutChartWrapper.style.display = 'none';

    }
}

// Initialization
renderPortfolioInputs();
// Ensure the chart is drawn after the container is rendered
requestAnimationFrame(() => {
    updatePortfolioCharts();
})







