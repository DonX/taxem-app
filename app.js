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

    // State Variables
    const isFr = window.location.pathname.includes('/fr');

    // Detailed Explanations for each click target in English
    const explanationsEn = {
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

    // Detailed Explanations in French
    const explanationsFr = {
        'line10100': {
            title: "Revenu d'emploi",
            jurisdiction: "FEUILLETS D'IMPÔT",
            section: "Case 14 du T4 / Case A du RL-1",
            text: "Il s'agit du total brut de vos revenus d'emploi déclarés sur vos feuillets T4 (fédéral) et Relevés 1 (provincial). TAXEM concilie les écarts automatiquement.",
            formula: "Somme(T4.Case14) + Somme(RL-1.CaseA)"
        },
        'line15000': {
            title: "Revenu total",
            jurisdiction: "FÉDÉRAL + QUÉBEC",
            section: "Ligne 15000 / Ligne 199",
            text: "Le revenu total de toutes provenances (emploi, travail autonome, pensions, placements et prestations) avant l'application de toute déduction.",
            formula: "Ligne 10100 + Ligne 12100 + Ligne 13500 + ..."
        },
        'line23600': {
            title: "Revenu net",
            jurisdiction: "FÉDÉRAL + QUÉBEC",
            section: "Ligne 23600 / Ligne 275",
            text: "Votre revenu total moins les ajustements de base. Ce montant est crucial car il détermine votre admissibilité aux allocations familiales, aux crédits de TPS et aux remboursements provinciaux.",
            formula: "Revenu total (Ligne 15000) - Ajustements (Ligne 20700 + ...)"
        },
        'line20800': {
            title: "Déduction pour REER",
            jurisdiction: "FÉDÉRAL + QUÉBEC",
            section: "Ligne 20800 / Ligne 214",
            text: "Une déduction hautement stratégique. Les cotisations au Régime enregistré d'épargne-retraite (REER/RRSP) réduisent directement votre revenu imposable, abaissant l'assiette fiscale.",
            formula: "Min(LimiteDeCotisation, CotisationsRéellesDéclarées)"
        },
        'line22000': {
            title: "Frais de garde d'enfants",
            jurisdiction: "DÉDUCTION FED / CRÉDIT QC",
            section: "Formulaire T778 / Annexe C",
            text: "Frais versés pour la garde d'enfants afin de vous permettre de travailler ou d'étudier. Au fédéral, cela agit comme déduction. Au Québec, cela génère un crédit d'impôt remboursable.",
            formula: "Fédéral : Déduction T778 | Québec : Crédit Annexe C (jusqu'à 75 %)"
        },
        'line26000': {
            title: "Revenu imposable",
            jurisdiction: "FÉDÉRAL + QUÉBEC",
            section: "Ligne 26000 / Ligne 299",
            text: "Le montant final du revenu ajusté utilisé pour déterminer vos tranches d'imposition progressives. Les taux d'imposition sont appliqués strictement sur cette ligne.",
            formula: "Revenu net (Ligne 23600) - Déductions spéciales"
        },
        'fedGross': {
            title: "Impôt fédéral brut",
            jurisdiction: "FÉDÉRAL (ARC)",
            section: "Annexe 1 - Étape 3",
            text: "L'impôt brut initial calculé en utilisant les paliers d'imposition progressifs du Canada (ex. : 15 % sur la première tranche jusqu'à ~55k $, 20,5 % sur le palier suivant).",
            formula: "TauxPalier1 * RevenuImposable + TauxPalier2 * MontantExcédentaire"
        },
        'line30000': {
            title: "Montant personnel de base",
            jurisdiction: "CONSTANTE FÉDÉRALE",
            section: "Ligne 30000",
            text: "Une franchise d'impôt accordée à tous les contribuables canadiens. En 2025, le montant personnel de base fédéral est fixé à 15 705 $ (indexé de 15 000 $ en 2024).",
            formula: "Valeur fixe (15 705 $ pour 2025 | 15 000 $ pour 2024)"
        },
        'fedCredits': {
            title: "Crédits fédéraux non remboursables",
            jurisdiction: "FÉDÉRAL (ARC)",
            section: "Ligne 35000 / Annexe 1",
            text: "Vos crédits non remboursables (personnel de base, RPC, AE) sont additionnés puis multipliés par le taux le plus bas du fédéral (15 %) pour réduire l'impôt brut.",
            formula: "Somme(Ligne 30000 + Ligne 30800 + Ligne 31200) * 15,00 %"
        },
        'fedNetTax': {
            title: "Impôt fédéral net dû",
            jurisdiction: "FÉDÉRAL (ARC)",
            section: "Ligne 42000",
            text: "Votre obligation nette envers l'Agence du revenu du Canada. Cela représente l'impôt réel que vous devez au fédéral après déduction des crédits non remboursables.",
            formula: "Max(0, Gross Federal Tax - Federal Credits)"
        },
        'qcTaxable': {
            title: "Revenu imposable du Québec",
            jurisdiction: "QUÉBEC (REVENU QC)",
            section: "Ligne 299",
            text: "Le Québec recalcule le revenu imposable de manière indépendante. Certains avantages payés par l'employeur peuvent faire différer ce montant du montant fédéral.",
            formula: "Revenu imposable fédéral + Ajustements spécifiques au QC"
        },
        'qcGross': {
            title: "Impôt québécois brut",
            jurisdiction: "QUÉBEC (REVENU QC)",
            section: "Ligne 401",
            text: "L'impôt provincial de base calculé à l'aide des paliers d'imposition progressifs du Québec (14 % sur la première tranche, puis jusqu'à 19 % pour les paliers suivants).",
            formula: "TauxPalierQC1 * RevenuImposableQC + TauxPalierQC2 * MontantExcédentaire"
        },
        'qcCredits': {
            title: "Crédits du Québec non remboursables",
            jurisdiction: "QUÉBEC (REVENU QC)",
            section: "Ligne 414",
            text: "Vos crédits provinciaux non remboursables (montant personnel de base, cotisations RQAP) sont cumulés puis multipliés par le taux québécois minimum (14 %) pour réduire votre impôt provincial.",
            formula: "Somme(QC_MontantDeBase + CotisationsQC) * 14,00 %"
        },
        'qcNetTax': {
            title: "Impôt québécois net dû",
            jurisdiction: "QUÉBEC (REVENU QC)",
            section: "Ligne 450",
            text: "L'impôt net dû au gouvernement du Québec après application des crédits d'impôt provinciaux et indexations.",
            formula: "Max(0, Impôt québécois brut - Crédits québécois)"
        }
    };

    const explanations = isFr ? explanationsFr : explanationsEn;

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
        const locale = isFr ? 'fr-CA' : 'en-CA';
        return new Intl.NumberFormat(locale, { style: 'currency', currency: 'CAD' }).format(value);
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
            statusLabel.textContent = isFr ? 'Remboursement attendu :' : 'Expected Refund:';
            statusAmount.textContent = formatCurrency(netRefund);
            statusAmount.className = 'summary-value success-text';
        } else {
            statusLabel.textContent = isFr ? "Solde d'impôt dû :" : 'Tax Balance Owed:';
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
        const labelActiveValue = isFr ? "Valeur active actuelle :" : "Current Active Value:";
        explanationText.innerHTML = `${itemInfo.text}<br><br><strong>${labelActiveValue}</strong> ${formatCurrency(lineVal)} (${currentYear})`;

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

    // Newsletter subscription form handler
    const subscribeForm = document.getElementById('subscribeForm');
    if (subscribeForm) {
        subscribeForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const emailInput = document.getElementById('subscribeEmail');
            const submitBtn = document.getElementById('btnSubscribe');
            const msgBox = document.getElementById('subscribeMessage');
            
            if (!emailInput || !submitBtn || !msgBox) return;
            
            const email = emailInput.value.trim();
            if (!email) return;
            
            const locale = isFr ? 'fr' : 'en';
            
            // Set loading state
            submitBtn.disabled = true;
            const originalBtnText = submitBtn.textContent;
            submitBtn.textContent = locale === 'fr' ? 'Inscription...' : 'Subscribing...';
            msgBox.className = 'subscribe-message';
            msgBox.textContent = '';
            
            try {
                const response = await fetch('/api/subscribe', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, locale }),
                });
                
                if (response.ok) {
                    msgBox.className = 'subscribe-message success';
                    msgBox.textContent = locale === 'fr' 
                        ? '✓ Merci pour votre inscription !' 
                        : '✓ Thank you for subscribing!';
                    emailInput.value = '';
                } else {
                    const data = await response.json();
                    msgBox.className = 'subscribe-message error';
                    msgBox.textContent = data.error || (locale === 'fr' 
                        ? 'Une erreur est survenue. Veuillez réessayer.' 
                        : 'An error occurred. Please try again.');
                }
            } catch (err) {
                console.error('Subscription error:', err);
                msgBox.className = 'subscribe-message error';
                msgBox.textContent = locale === 'fr' 
                    ? 'Erreur de connexion. Veuillez réessayer.' 
                    : 'Connection error. Please try again.';
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
            }
        });
    }
});
