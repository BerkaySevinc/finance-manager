



function createDonutChartInvestInterest(element, finalAmount, totalInvested, showPercents = false, showReturnRate = false, moneyFormatter = formatMoney) {


    // Color Definitions (change from here in one place)
    const colorAnapara = "#4ea8ff";
    const colorGetiri = "#32d48a";

    const showPercentsTranslate = '40px';


    if (!finalAmount) {

        showPercents = false;
        showReturnRate = false;
    }


    // 1. Check if a chart was already created inside this parent
    let { canvas, container } = getCanvas(element);

    finalAmount = finalAmount.toFixed(2);
    totalInvested = totalInvested.toFixed(2);

    const totalInterest = finalAmount - totalInvested;


    // 2. TARGETED CLEANUP: Remove only overlay elements we added
    const oldOverlays = container.querySelectorAll('.chart-overlay');
    oldOverlays.forEach(el => el.remove());

    if (showPercents || showReturnRate) canvas.style.transform = `translateX(-${showPercentsTranslate})`;

    container.insertAdjacentHTML('beforeend', `
        <div class="chart-overlay" style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(calc(-50%${(showPercents || showReturnRate) ? ` - ${showPercentsTranslate}` : ''}), calc(-50% - 3px));
            display: flex;
            flex-direction: column;
            align-items: center;
            pointer-events: none;
            text-align: center;
            width: 100%;
            opacity: 0;
        ">
            <span style="
                font-size: 0.75rem;
                color: #8b949e;
                margin-bottom: 3px;
                font-family: 'Inter', sans-serif;
            ">Toplam Varlık</span>
            <span style="
                font-size: 1.1rem;
                font-weight: 700;
                color: #c9d1d9;
                font-family: 'Inter', sans-serif;
            ">${moneyFormatter(finalAmount)}</span>
        </div>
    `);

    if (showPercents && finalAmount) {
        const investRatio = ((totalInvested / finalAmount) * 100).toFixed(0);
        const interestRatio = (100 - investRatio);

        container.insertAdjacentHTML('beforeend', `
<div class="chart-overlay" style="
                position: absolute;
                bottom: 12px;
                right: 12px;
                display: flex;
                flex-direction: column;
                gap: 8px;
                pointer-events: none;
                font-family: 'Inter', sans-serif;
                font-size: 0.95rem; 
                color: #c9d1d9;
                font-weight: 500;
                margin: 0.6rem;
                text-align: center;
                            opacity: 0;
            ">
                <div style="display: flex; align-items: center; gap: 3px;">
                    <span style="width: 12px; height: 12px; border-radius: 4px; background: ${colorAnapara}; flex-shrink: 0;"></span>
                    <span style="display: inline-block; width: 65px;">Yatırım:</span>
                    <span>%${investRatio}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 3px;">
                    <span style="width: 12px; height: 12px; border-radius: 4px; background: ${colorGetiri}; flex-shrink: 0;"></span>
                    <span style="display: inline-block; width: 65px;">Getiri:</span>
                    <span>%${interestRatio}</span>
                </div>
            </div>`);
    }

    if (showReturnRate) {

        const ror = (totalInterest / totalInvested) * 100;
        const rorClean = ror > 10 ? smartRound(ror) : ror.toFixed(1);

        container.insertAdjacentHTML('beforeend', `
            <div class="chart-overlay" style="
                position: absolute;
                top: 12px;
                right: 12px;
                display: flex;
                flex-direction: column;
                gap: 8px;
                pointer-events: none;
                font-family: 'Inter', sans-serif;
                font-size: 0.95rem; 
                color: #c9d1d9;
                font-weight: 500;
                margin: 0.6rem;
                text-align: center;
                            opacity: 0;
            ">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="width: 12px; height: 12px; border-radius: 4px; background: ${colorGetiri}; flex-shrink: 0;"></span>
                    <div>
                        <span style="display: inline-block;">RoR</span><span style="display: inline-block;">:</span>
                    </div>
                    <span>%${rorClean}</span>
                    </div>
                    </div>`);
        // <span style="display: inline-block; width: 8px; text-align: left">:</span>
    }




    const isVisibleNow = !!(container.offsetWidth && container.offsetHeight && getComputedStyle(container).display !== 'none' && getComputedStyle(container).visibility !== 'hidden');
    const isAnimate = isVisibleNow;

    requestAnimationFrame(() => {

        // 3. Create the chart and save its reference on the PARENT element
        parent.chartInstance = new Chart((canvas), {
            type: "doughnut",
            data: {
                labels: ["Yatırım", "Getiri"],
                datasets: [{
                    data: [smartRound(totalInvested), smartRound(totalInterest)],
                    backgroundColor: [colorAnapara, colorGetiri]
                }]
            },
            options: {

                transitions: {
                    active: { animation: { duration: 0 } },
                    resize: { animation: { duration: 0 } },
                    show: { animation: { duration: 0 } },
                    hide: { animation: { duration: 0 } }
                },

                cutout: "60%",

                animation: {
                    duration: isAnimate ? 2000 : 0,
                    easing: 'easeOutQuart', // Starts sharp, ends very smoothly
                    animateRotate: true,    // Spin-in animation effect
                    animateScale: false,     // Scale-in from center (usually straining — can stay disabled)

                    onProgress: (animation) => {
                        // Only process on the initial creation animation
                        if (!animation.initial || !isAnimate) return;

                        const progress = animation.currentStep / animation.numSteps;
                        let overlayOpacity = 0;

                        if (progress >= 0.5) {
                            const localProgress = (progress - 0.5) / 0.5;
                            const speedFactor = 1.5;
                            overlayOpacity = Math.min(localProgress * speedFactor, 1);

                            const overlays = container.querySelectorAll('.chart-overlay');
                            overlays.forEach(el => {
                                el.style.opacity = overlayOpacity.toFixed(2);
                            });
                        }
                    },

                    onComplete: (animation) => {
                        animation.chart.options.animation.duration = 0; // Disable further animation after completion

                        container.querySelectorAll('.chart-overlay').forEach(el => {
                            el.style.opacity = "1";
                        });
                    }
                },

                devicePixelRatio: 2, // Match pixel ratio to screen quality
                responsive: true,
                maintainAspectRatio: false,

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


                        enabled: true,
                        callbacks: {
                            label: function (item) {
                                return moneyFormatter(item.raw || 0);
                            }
                        }
                    },

                }
            }
        });

    });
}

















function createLineChartMoney(element, borderColor, timeline, labelStartDate = null, showBothLabel = false, todayIndex = null, todayLabel = "Now", distance = null, moneyFormatter = formatMoney) {

    if (!timeline) return;

    const { canvas, container } = getCanvas(element);

    timeline = timeline.map(d => d != null ? d.toFixed(2) : null);

    let labels = getLabels(timeline, labelStartDate, timeline.length > 12);
    let gridLabels = getLabels(timeline);

    // If "This Month" marker is present
    if (todayIndex !== null && distance !== null) {

        let start = Math.max(0, todayIndex - (distance - 1));
        let end = todayIndex + distance + 1;

        // The slice method copies the specified range
        const fullTimeline = timeline;
        timeline = timeline.slice(start, end);

        labels = getLabels(fullTimeline, labelStartDate, timeline.length > 12).slice(start, end);
        gridLabels = getLabels(fullTimeline).slice(start, end);

        todayIndex = todayIndex - Math.max(0, todayIndex - (distance - 1));
    }

    if (labelStartDate !== null && showBothLabel) {

        labels = labels.map((item, index) => {
            return `${item} (${gridLabels[index]})`;
        });
    }
    else {
        gridLabels = labels;
    }


    // 🎯 Parse borderColor once
    const hex = borderColor.replace('#', '');
    const bigint = parseInt(hex, 16);

    const rgbColor = {
        r: (bigint >> 16) & 255,
        g: (bigint >> 8) & 255,
        b: bigint & 255
    };

    const hexStart = `rgba(${rgbColor.r},${rgbColor.g},${rgbColor.b},`;
    const getColor = (alpha) => hexStart + alpha + ')';


    const isVisibleNow = !!(container.offsetWidth && container.offsetHeight && getComputedStyle(container).display !== 'none' && getComputedStyle(container).visibility !== 'hidden');
    const isAnimate = isVisibleNow;

    const startAlpha = !isAnimate ? 1 : 0;
    const startBgAlpha = !isAnimate ? 0.95 : 0;


    const annotations = {};
    if (todayIndex !== null) {
        annotations.todayPoint = {
            type: 'point',
            // Ensure both values use the SAME index variable
            xValue: todayIndex,
            yValue: timeline[todayIndex],
            backgroundColor: getColor(startAlpha),
            radius: 6,
            borderWidth: 2,
            borderColor: `rgba(255, 255, 255, ${startAlpha})`,
            zIndex: 10, // Ensures the point always stays on top
        };
        annotations.todayLabel = {
            type: 'label',
            xValue: todayIndex, // aligned by using todayIndex instead of passedMonths
            yValue: timeline[todayIndex],
            backgroundColor: `rgba(22, 27, 34, ${startBgAlpha})`,
            borderColor: `rgba(48, 54, 61, ${startAlpha})`,
            borderWidth: 1,
            borderRadius: 6,
            padding: 8,
            content: [todayLabel, moneyFormatter(timeline[todayIndex])],

            // 💡 SOLUTION: Prevents the label from overflowing off screen
            position: 'center',

            xAdjust: (() => {
                const totalPoints = timeline.length;
                const ratio = todayIndex / (totalPoints - 1);

                const content = [todayLabel, moneyFormatter(timeline[todayIndex])];
                const longestText = content.reduce((a, b) => a.length > b.length ? a : b);

                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                context.font = "600 12px 'Inter', sans-serif";
                const textWidth = context.measureText(longestText).width;

                const labelWidth = textWidth + 24;
                const shiftAmount = (labelWidth / 2) * Math.min(1, totalPoints / 20);

                // Push right for the first 10% (original logic)
                if (ratio < 0.10) {
                    return (1 - (ratio / 0.10)) * shiftAmount;
                }
                // Push left for the last 10% (improved: pulls toward the point as it approaches the end)
                else if (ratio > 0.90) {
                    const factor = (ratio - 0.90) / 0.10;
                    // Start from standard shiftAmount, reach (labelWidth/2 + 5) at the very end
                    const targetShift = (labelWidth / 2) + 10;
                    const currentShift = shiftAmount + (targetShift - shiftAmount) * factor;
                    return -currentShift;
                }

                return 0;
            })(), // Push label slightly right if in the early months

            yAdjust: (() => {
                const totalPoints = timeline.length;
                const ratio = todayIndex / (totalPoints - 1);
                const standardHeight = -40; // Default height

                // Start reducing height for the last 10% of the range
                if (ratio > 0.90) {
                    // Factor approaches 0 as we near the end, using (1 - ratio) logic
                    const factor = (1 - ratio) / 0.10;
                    return standardHeight * factor;
                }

                return standardHeight; // Keep at default in normal cases
            })(),

            color: `rgba(201, 209, 217, ${startAlpha})`,
            font: {
                family: "'Inter', 'Segoe UI', 'Roboto', sans-serif",
                size: 12,
                weight: 600,
                lineHeight: 1.5
            },
            textAlign: 'center',
            zIndex: 11,

        };
    }

    requestAnimationFrame(() => {

        // 3. Create the chart and save its reference on the PARENT element
        parent.chartInstance = new Chart(canvas, {
            type: "line",
            data: {
                labels: gridLabels,
                datasets: [{
                    label: "Portföy",
                    data: timeline,
                    borderColor: borderColor,
                    backgroundColor: hexToBg(borderColor),
                    fill: true,
                    tension: 0.35,

                    /* 🎯 hover fix */
                    pointRadius: 0,
                    pointHoverRadius: 5,
                    pointHitRadius: 10,
                    clip: 8
                }]
            },
            options: {

                transitions: {
                    active: { animation: { duration: 0 } },
                    resize: { animation: { duration: 0 } },
                    show: { animation: { duration: 0 } },
                    hide: { animation: { duration: 0 } }
                },

                layout: {
                    padding: {
                        left: 2,
                        right: 2,
                    }
                },
                animation: {
                    duration: isAnimate ? 2000 : 0,
                    easing: 'easeOutExpo',

                    onProgress: (animation) => {
                        const chart = animation.chart;

                        if (!animation.initial || !isAnimate) return;

                        // 🎯 CRITICAL FIX: Trigger only ONCE at around the midpoint of the animation (0.5).
                        // Catch it near 0.5 once and set the lock flag.
                        const progress = animation.currentStep / animation.numSteps;

                        // Tighten the check so it only fires once around 50%
                        if (progress < 0.5 || progress > 0.55 || chart.$labelsAnimStarted) return;

                        chart.$labelsAnimStarted = true; // This flag ensures the animation runs only once until page reload

                        const anno = chart.options?.plugins?.annotation?.annotations;
                        if (!anno || !anno.todayLabel) return;

                        const DURATION_MS = 500;
                        const TARGET_FPS = 30;
                        const FRAME_INTERVAL = 1000 / TARGET_FPS;

                        let startTime = performance.now();
                        let lastUpdateTime = 0;

                        function step(now) {
                            if (!chart.canvas) return;

                            const elapsed = now - startTime;
                            const t = Math.min(elapsed / DURATION_MS, 1);

                            // Update colors
                            anno.todayPoint.backgroundColor = getColor(t),
                                anno.todayPoint.borderColor = `rgba(255,255,255,${t})`;

                            anno.todayLabel.backgroundColor = `rgba(22,27,34,${t * 0.95})`;
                            anno.todayLabel.borderColor = `rgba(48,54,61,${t})`;
                            anno.todayLabel.color = `rgba(201,209,217,${t})`;

                            if (now - lastUpdateTime >= FRAME_INTERVAL) {
                                // Use 'none' to minimize Chart.js re-triggering onProgress
                                chart.update('none');
                                lastUpdateTime = now;
                            }

                            if (t < 1) {
                                requestAnimationFrame(step);
                            }
                        }

                        requestAnimationFrame(step);
                    },

                    onComplete: (animation) => {
                        animation.chart.options.animation.duration = 0;
                    }
                },

                /* 🔧 BUG FIXES */
                devicePixelRatio: 2, // Match pixel ratio to screen quality
                responsive: true,
                maintainAspectRatio: false,

                interaction: {
                    mode: "index",
                    intersect: false
                },
                scales: {
                    x: {

                        grid: {
                            drawTicks: false, // Removes small tick marks on the axis, freeing up space
                        },
                        // Alternatively:
                        offset: true, // Prevents bars/points from sticking to the edges
                    },
                    y: {
                        // Alternatively:
                        offset: true // Prevents bars/points from sticking to the edges
                    }
                },
                plugins: {
                    annotation: {
                        annotations: annotations
                    },

                    tooltip: {

                        backgroundColor: 'rgba(22, 27, 34, 0.95)', // GitHub Dark background
                        titleColor: '#58a6ff', // Title color (blue tone)
                        bodyColor: '#adbac7',  // Body text color
                        borderColor: '#30363d', // Thin border
                        borderWidth: 1,
                        padding: 12,
                        cornerRadius: 8,       // Rounded corners for a smooth look
                        displayColors: false,   // Show color indicator

                        titleAlign: 'center',
                        bodyAlign: 'center',

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

                        enabled: true,
                        callbacks: {
                            title: function (items) {
                                const i = items[0].dataIndex;
                                return labels[i]; // 🎯 TOOLTIP ARRAY
                            },
                            label: function (item) {
                                return moneyFormatter(item.parsed.y);
                            }
                        }
                    },
                    legend: { display: false }
                }
            }
        });




    });
}







function getCanvas(element) {

    let canvas;
    let storageTarget;


    // 1. Detect element and canvas + clean up the old one
    if (element.tagName.toLowerCase() === 'canvas') {

        canvas = element;
        storageTarget = element.parentElement || element;

    } else {

        storageTarget = element;
        storageTarget.style.position = "relative";

        storageTarget.innerHTML = '<canvas></canvas>';
        canvas = storageTarget.querySelector('canvas');
    }

    // CRITICAL: Destroy old instance using its reference BEFORE overwriting with innerHTML
    if (storageTarget.chartInstance) {
        storageTarget.chartInstance.destroy();
        storageTarget.chartInstance = null;
    }

    // Canvas stays in place, so the official destroy method is sufficient
    const existingChart = Chart.getChart(canvas);
    if (existingChart) existingChart.destroy();

    return { canvas, container: storageTarget };
}




function getLabels(timeline, startDate = null, includeYear = false) {


    let labels = timeline.map((_, i) => formatMonth(i, startDate, includeYear))
    if (!startDate) {
        labels[0] = "Baş";
        labels[labels.length - 1] = "Son";
    }

    return labels;
}

function formatMonth(month, startDate = null, includeYear = false) {

    if (month === Infinity) return "∞";

    if (!startDate) {

        if (month <= 0) return "0";
        if (month < 12) return `${Math.ceil(month)} Ay`;
        const years = month / 12;
        return years > 100 ? "> 100 Yıl" : `${smartFixed(years, 1)} Yıl`;

    }
    else {

        const baseDate = new Date(startDate);

        // FIX THE DAY (critical point)
        baseDate.setDate(1);

        // Advance the month
        baseDate.setMonth(baseDate.getMonth() + Math.max(0, Math.floor(month)));

        // "Month Year" format
        const monthText = baseDate.toLocaleString('tr-TR', { month: 'long' });
        const year = baseDate.getFullYear().toString().slice(-2);

        const dateText = includeYear ? `${monthText} ${year}` : monthText;

        return dateText;

    }

}

function hexToBg(hex) {
    // Strip the leading # character
    hex = hex.replace('#', '');

    // Extract R, G, B values
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return `rgba(${r}, ${g}, ${b}, 0.1)`;
}

function hexToRgba(hex, alpha = 1) {
    const bigint = parseInt(hex.replace('#', ''), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
