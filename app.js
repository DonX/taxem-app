/**
 * TAXEM Website Demo Engine
 * Handles interactive calculations, scenario loading, theme switches, and line calculations inspector.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Scenario & Calculations Database
    const taxDatabase = {
        '2025': {
            'simple': {
                'line10100': 54200,
                'line15000': 54200,
                'line23600': 54200,
                'line20800': 18000,
                'line22000': 0,
                'line26000': 52400,
                'fedGross': 7860,
                'line30000': 15705,
                'fedCredits': 2778,
                'fedNetTax': 5082,
                'qcTaxable': 52400,
                'qcGross': 7860,
                'qcCredits': 2986,
                'qcNetTax': 4874,
                'withheld': 11500
            },
            'selfemployed': {
                'line10100': 0,
                'line15000': 68500,
                'line23600': 56200,
                'line20800': 0,
                'line22000': 0,
                'line26000': 56200,
                'fedGross': 8430,
                'line30000': 15705,
                'fedCredits': 2778,
                'fedNetTax': 5652,
                'qcTaxable': 56200,
                'qcGross': 8430,
                'qcCredits': 3020,
                'qcNetTax': 5410,
                'withheld': 9000
            },
            'household': {
                'line10100': 88400,
                'line15000': 88400,
                'line23600': 88400,
                'line20800': 0,
                'line22000': 6200,
                'line26000': 82200,
                'fedGross': 12330,
                'line30000': 15705,
                'fedCredits': 2680,
                'fedNetTax': 9650,
                'qcTaxable': 82200,
                'qcGross': 12330,
                'qcCredits': 3100,
                'qcNetTax': 9230,
                'withheld': 20000
            }
        },
        '2024': {
            'simple': {
                'line10100': 52100,
                'line15000': 52100,
                'line23600': 52100,
                'line20800': 15000,
                'line22000': 0,
                'line26000': 50600,
                'fedGross': 7590,
                'line30000': 15000,
                'fedCredits': 2758,
                'fedNetTax': 4832,
                'qcTaxable': 50600,
                'qcGross': 7590,
                'qcCredits': 2910,
                'qcNetTax': 4680,
                'withheld': 11000
            },
            'selfemployed': {
                'line10100': 0,
                'line15000': 64200,
                'line23600': 53400,
                'line20800': 0,
                'line22000': 0,
                'line26000': 53400,
                'fedGross': 8010,
                'line30000': 15000,
                'fedCredits': 2778,
                'fedNetTax': 5232,
                'qcTaxable': 53400,
                'qcGross': 8010,
                'qcCredits': 2990,
                'qcNetTax': 5020,
                'withheld': 8500
            },
            'household': {
                'line10100': 84100,
                'line15000': 84100,
                'line23600': 84100,
                'line20800': 0,
                'line22000': 5800,
                'line26000': 78300,
                'fedGross': 11745,
                'line30000': 15000,
                'fedCredits': 2700,
                'fedNetTax': 9045,
                'qcTaxable': 78300,
                'qcGross': 11745,
                'qcCredits': 3065,
                'qcNetTax': 8680,
                'withheld': 19500
            }
        }
    };

    // Detailed Explanations for each click target
    const explanations = {
        'line10100': {
            title: 'Employment Income',
            jurisdiction: 'SLIP INPUTS',
            section: 'T4 Box 14 / RL-1 Box A',
            text: 'This is the raw total of your employment income as declared on your federal T4 slips and provincial Relevé 1 slips. TAXEM reconciles differences automatically.',
            formula: 'Sum(T4.Box14) + Sum(RL-1.BoxA)'
        },
        'line15000': {
            title: 'Total Income',
            jurisdiction: 'FEDERAL + QUÉBEC',
            section: 'Line 15000 / Line 199',
            text: 'The total income from all sources (employment, self-employment, pensions, investment, and benefits) before any deductions are made.',
            formula: 'Line 10100 + Line 12100 + Line 13500 + ...'
        },
        'line23600': {
            title: 'Net Income',
            jurisdiction: 'FEDERAL + QUÉBEC',
            section: 'Line 23600 / Line 275',
            text: 'Your total income minus basic adjustments. This amount is crucial because it determines eligibility for child benefit programs, GST credits, and provincial rebates.',
            formula: 'Total Income (Line 15000) - Adjustments (Line 20700 + ...)'
        },
        'line20800': {
            title: 'RRSP Contribution Deduction',
            jurisdiction: 'FEDERAL + QUÉBEC',
            section: 'Line 20800 / Line 214',
            text: 'A highly strategic deduction. Registered Retirement Savings Plan (RRSP/REER) contributions reduce your taxable income directly, lowering the starting base for tax calculations.',
            formula: 'Min(ContributionLimit, ActualContributionsClaimed)'
        },
        'line22000': {
            title: 'Childcare Expenses',
            jurisdiction: 'FEDERAL DEDUCTION / QC CREDIT',
            section: 'Form T778 / Schedule C',
            text: 'Expenses paid to childcare providers so you could work or study. Under federal rules, this acts as a net income deduction. Under Quebec rules, it generates a refundable tax credit.',
            formula: 'Federal: T778 Deduction | Quebec: Schedule C Credit (up to 75%)'
        },
        'line26000': {
            title: 'Taxable Income',
            jurisdiction: 'FEDERAL + QUÉBEC',
            section: 'Line 26000 / Line 299',
            text: 'The final adjusted income amount used to determine your progressive tax brackets. Tax rates are applied strictly to this line.',
            formula: 'Net Income (Line 23600) - Special Deductions'
        },
        'fedGross': {
            title: 'Gross Federal Tax',
            jurisdiction: 'FEDERAL (CRA)',
            section: 'Schedule 1 - Step 3',
            text: 'The initial gross tax computed using the progressive Canadian tax brackets (e.g., 15% on the first bracket up to ~$55k, 20.5% on the next tier).',
            formula: 'BracketRate1 * TaxableIncome + BracketRate2 * ExcessAmount'
        },
        'line30000': {
            title: 'Basic Personal Amount',
            jurisdiction: 'FEDERAL CONSTANT',
            section: 'Line 30000',
            text: 'A tax-free allowance granted to all Canadian filers. In 2025, the federal basic personal amount is set to $15,705 (indexed up from $15,000 in 2024).',
            formula: 'Static Value ($15,705 for 2025 | $15,000 for 2024)'
        },
        'fedCredits': {
            title: 'Federal Non-Refundable Credits',
            jurisdiction: 'FEDERAL (CRA)',
            section: 'Line 35000 / Schedule 1',
            text: 'Your non-refundable credits (Basic Personal, CPP, EI) are summed up and multiplied by the lowest federal bracket rate (15%) to act as a discount against gross tax.',
            formula: 'Sum(Line 30000 + Line 30800 + Line 31200) * 15.00%'
        },
        'fedNetTax': {
            title: 'Net Federal Tax Owed',
            jurisdiction: 'FEDERAL (CRA)',
            section: 'Line 42000',
            text: 'Your net liability to Revenue Canada. This represents the actual income tax you owe federally after applying non-refundable credits.',
            formula: 'Max(0, Gross Federal Tax - Federal Credits)'
        },
        'qcTaxable': {
            title: 'Quebec Taxable Income',
            jurisdiction: 'QUÉBEC (REVENU QC)',
            section: 'Line 299',
            text: 'Quebec recalculates taxable income independently. Certain employer-paid benefit policies can cause this to differ from the federal taxable income amount.',
            formula: 'Federal Taxable Income + QC Specific Adjustments'
        },
        'qcGross': {
            title: 'Gross Quebec Tax',
            jurisdiction: 'QUÉBEC (REVENU QC)',
            section: 'Line 401',
            text: 'The initial provincial tax calculated using Quebec\'s progressive tax brackets (14% on the first bracket, rising to 19% for subsequent brackets).',
            formula: 'BracketRateQC1 * QCTaxableIncome + BracketRateQC2 * ExcessAmount'
        },
        'qcCredits': {
            title: 'Quebec Non-Refundable Credits',
            jurisdiction: 'QUÉBEC (REVENU QC)',
            section: 'Line 414',
            text: 'Your provincial non-refundable credits (such as the basic amount, and QPIP contributions) are summed up and multiplied by the lowest Quebec rate (14%) to reduce your provincial liability.',
            formula: 'Sum(QC_BasicAmount + QC_Contributions) * 14.00%'
        },
        'qcNetTax': {
            title: 'Net Quebec Tax Owed',
            jurisdiction: 'QUÉBEC (REVENU QC)',
            section: 'Line 450',
            text: 'The net provincial tax liability owed to Revenu Québec after applying provincial tax credits and indexations.',
            formula: 'Max(0, Gross Quebec Tax - Quebec Credits)'
        }
    };

    // State Variables
    let currentYear = '2025';
    let currentScenario = 'simple';

    // Element Selectors
    const btnYear2024 = document.getElementById('btnYear2024');
    const btnYear2025 = document.getElementById('btnYear2025');
    const btnThemeLedger = document.getElementById('btnThemeLedger');
    const btnThemeArch = document.getElementById('btnThemeArch');
    const demoDisplayContainer = document.getElementById('demoDisplayContainer');
    const ledgerYearVal = document.getElementById('ledgerYearVal');

    const scenarioButtons = document.querySelectorAll('.scenario-option');
    const ledgerRows = document.querySelectorAll('.ledger-row.clickable');
    const explanationCard = document.getElementById('explanationCard');
    const explanationTitle = document.getElementById('explanationTitle');
    const explanationJurisdiction = document.getElementById('explanationJurisdiction');
    const explanationSection = document.getElementById('explanationSection');
    const explanationText = document.getElementById('explanationText');
    const explanationFormula = document.getElementById('explanationFormula');
    const closeExplanationBtn = document.getElementById('closeExplanationBtn');

    // UI Updates: Populate numbers dynamically
    function formatCurrency(value) {
        return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(value);
    }

    function calculateRefundOrOwed(data) {
        const totalOwed = data.fedNetTax + data.qcNetTax;
        const netRefund = data.withheld - totalOwed;
        return {
            totalOwed,
            netRefund
        };
    }

    function updateLedgerData() {
        const yearData = taxDatabase[currentYear];
        if (!yearData) return;
        
        const data = yearData[currentScenario];
        if (!data) return;

        // Apply to DOM
        document.getElementById('valLine10100').textContent = formatCurrency(data.line10100);
        document.getElementById('valLine15000').textContent = formatCurrency(data.line15000);
        document.getElementById('valLine23600').textContent = formatCurrency(data.line23600);
        document.getElementById('valLine20800').textContent = formatCurrency(data.line20800);
        document.getElementById('valLine22000').textContent = formatCurrency(data.line22000);
        document.getElementById('valLine26000').textContent = formatCurrency(data.line26000);
        
        document.getElementById('valFedGross').textContent = formatCurrency(data.fedGross);
        document.getElementById('valLine30000').textContent = formatCurrency(currentYear === '2025' ? 15705 : 15000);
        document.getElementById('valFedCredits').textContent = formatCurrency(data.fedCredits);
        document.getElementById('valFedNetTax').textContent = formatCurrency(data.fedNetTax);
        
        document.getElementById('valQcTaxable').textContent = formatCurrency(data.qcTaxable);
        document.getElementById('valQcGross').textContent = formatCurrency(data.qcGross);
        document.getElementById('valQcCredits').textContent = formatCurrency(data.qcCredits);
        document.getElementById('valQcNetTax').textContent = formatCurrency(data.qcNetTax);

        const { totalOwed, netRefund } = calculateRefundOrOwed(data);

        document.getElementById('valCombinedTax').textContent = formatCurrency(totalOwed);
        document.getElementById('valWithheld').textContent = formatCurrency(data.withheld);

        const statusLabel = document.getElementById('summaryStatusLabel');
        const statusAmount = document.getElementById('valStatusAmount');

        if (netRefund >= 0) {
            statusLabel.textContent = 'Expected Refund:';
            statusAmount.textContent = formatCurrency(netRefund);
            statusAmount.className = 'summary-value success-text';
        } else {
            statusLabel.textContent = 'Tax Balance Owed:';
            statusAmount.textContent = formatCurrency(Math.abs(netRefund));
            statusAmount.className = 'summary-value error-text';
        }

        // Highlight red text for tax balance owed if needed
        const errorStyles = document.createElement('style');
        errorStyles.innerHTML = `.error-text { color: #d00000 !important; }`;
        document.head.appendChild(errorStyles);

        // Update year indicator
        ledgerYearVal.textContent = currentYear;
    }

    // Toggle Active Class helper
    function toggleActiveButton(activeBtn, siblingBtn) {
        siblingBtn.classList.remove('active');
        activeBtn.classList.add('active');
    }

    // Event Listeners for Year Toggles
    btnYear2024.addEventListener('click', () => {
        currentYear = '2024';
        toggleActiveButton(btnYear2024, btnYear2025);
        updateLedgerData();
        // If an explanation card is active, refresh its data context
        const activeRow = document.querySelector('.ledger-row.active-row');
        if (activeRow) {
            triggerExplanation(activeRow.getAttribute('data-explain'));
        }
    });

    btnYear2025.addEventListener('click', () => {
        currentYear = '2025';
        toggleActiveButton(btnYear2025, btnYear2024);
        updateLedgerData();
        // If an explanation card is active, refresh its data context
        const activeRow = document.querySelector('.ledger-row.active-row');
        if (activeRow) {
            triggerExplanation(activeRow.getAttribute('data-explain'));
        }
    });

    // Theme Toggle Controls
    btnThemeLedger.addEventListener('click', () => {
        toggleActiveButton(btnThemeLedger, btnThemeArch);
        demoDisplayContainer.classList.remove('theme-arch');
        demoDisplayContainer.classList.add('theme-ledger');
    });

    btnThemeArch.addEventListener('click', () => {
        toggleActiveButton(btnThemeArch, btnThemeLedger);
        demoDisplayContainer.classList.remove('theme-ledger');
        demoDisplayContainer.classList.add('theme-arch');
    });

    // Scenario Selectors
    scenarioButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Remove active state from all scenario buttons
            scenarioButtons.forEach(b => b.classList.remove('active'));
            
            // Add to selected button
            const selectedBtn = e.currentTarget;
            selectedBtn.classList.add('active');
            
            // Update state
            currentScenario = selectedBtn.getAttribute('data-scenario');
            updateLedgerData();

            // Refresh Explanation Card if visible
            const activeRow = document.querySelector('.ledger-row.active-row');
            if (activeRow) {
                triggerExplanation(activeRow.getAttribute('data-explain'));
            }
        });
    });

    // Explanation Inspector Functionality
    function triggerExplanation(key) {
        const itemInfo = explanations[key];
        if (!itemInfo) return;

        // Fetch numbers to embed dynamic context into the description
        const yearData = taxDatabase[currentYear];
        const scenarioData = yearData[currentScenario];
        const lineVal = scenarioData[key] !== undefined ? scenarioData[key] : (key === 'line30000' ? (currentYear === '2025' ? 15705 : 15000) : 0);

        explanationTitle.textContent = itemInfo.title;
        explanationJurisdiction.textContent = itemInfo.jurisdiction;
        explanationSection.textContent = itemInfo.section;
        explanationFormula.textContent = itemInfo.formula;
        
        // Append context-aware value info to explain text
        explanationText.innerHTML = `${itemInfo.text}<br><br><strong>Current Active Value:</strong> ${formatCurrency(lineVal)} (${currentYear})`;

        // Slide/fade explanation card in
        explanationCard.classList.add('show');
    }

    // Set Row Click Event Listeners
    ledgerRows.forEach(row => {
        row.addEventListener('click', (e) => {
            // Remove active-row class from all rows
            ledgerRows.forEach(r => r.classList.remove('active-row'));
            
            // Highlight selected
            const clickedRow = e.currentTarget;
            clickedRow.classList.add('active-row');

            // Trigger Inspector
            const key = clickedRow.getAttribute('data-explain');
            triggerExplanation(key);
        });
    });

    // Close Explanation Card
    closeExplanationBtn.addEventListener('click', () => {
        explanationCard.classList.remove('show');
        ledgerRows.forEach(r => r.classList.remove('active-row'));
    });

    // Initialize Page Data
    updateLedgerData();
});
