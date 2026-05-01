import puppeteer from 'puppeteer';

// ====================== Fonctions de Formatage ======================

/** Formate une valeur numérique avec deux décimales, SANS SYMBOLE DE DEVISE */
function formatAriary(value) {
    const numericValue = parseFloat(value || 0);
    if (numericValue === 0) return ''; 
    return numericValue.toLocaleString('fr-FR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }); 
}

/** Formate une valeur numérique (pour les totaux), SANS SYMBOLE DE DEVISE */
function formatAriaryTotal(value) {
    // Utilisation d'un espace insécable (\u00A0) pour la lisibilité des grands nombres.
    return parseFloat(value || 0).toLocaleString('fr-FR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).replace(/\s/g, '\u00A0'); 
}

// ====================== Fonction de Conversion Numérique en Lettres (Ariary) ======================

function numberToFrenchWordsAriary(n) {
    const num = Math.abs(parseFloat(n));
    if (isNaN(num)) return "VALEUR NON DÉFINIE";

    const integerPart = Math.floor(num);
    const centimes = Math.round((num - integerPart) * 100);

    // Si le nombre est nul (Ariary et centimes), renvoyer "ZÉRO Ariary"
    if (integerPart === 0 && centimes === 0) return "ZÉRO Ariary";

    const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
    const teens = ['', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
    const tens = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix'];

    function convertLess100(n) {
        if (n === 0) return '';
        if (n < 10) return units[n];
        if (n < 20) return teens[n - 10];
        
        const t = Math.floor(n / 10);
        const u = n % 10;
        let s = '';

        if (t === 7) { // 70-79
            s = 'soixante-' + convertLess100(n - 60);
        } else if (t === 9) { // 90-99
            s = 'quatre-vingt-' + convertLess100(n - 80);
        } else if (t === 8) { // 80-89
            s = tens[t];
            if (n === 80) s = 'quatre-vingts';
            else if (u > 0) s += '-' + units[u];
        } else {
            s = tens[t];
            if (u === 1 && t !== 8) s += ' et ' + units[u];
            else if (u > 0) s += '-' + units[u];
        }
        return s.replace(/\s+/g, ' ').trim().replace(/--/g, '-').replace(' et -', ' et ');
    }

    function convertHundreds(n) {
        if (n === 0) return '';
        let s = '';
        const c = Math.floor(n / 100);
        const r = n % 100;
        
        if (c > 0) {
            s += (c === 1 ? 'cent' : units[c] + ' cents');
            if (r > 0) s = s.replace('cents', 'cent') + ' ' + convertLess100(r);
            else if (c > 1 && n === c * 100) s = s.replace('cent', 'cents');
        } else {
             s = convertLess100(r);
        }
        return s.trim();
    }

    function convert(n) {
        if (n === 0) return 'zéro';
        
        let words = '';
        let tempNum = n;
        const scales = [
            { val: 1000000000, str: 'milliard' },
            { val: 1000000, str: 'million' },
            { val: 1000, str: 'mille' },
        ];

        for (const scale of scales) {
            if (tempNum >= scale.val) {
                let count = Math.floor(tempNum / scale.val);
                let countWords = convertHundreds(count);
                
                let scaleStr = scale.str;
                if (scale.str === 'mille' && count === 1) countWords = ''; // 1000 is "mille"
                else if (count > 1) scaleStr += 's'; // Millions/Milliards pluriels
                
                // Correction pour 1 million / 1 milliard
                if (count === 1 && scale.str.startsWith('milli')) countWords = 'un';


                words += countWords + ' ' + scaleStr + ' ';
                tempNum %= scale.val;
            }
        }
        
        if (tempNum > 0) {
            words += convertHundreds(tempNum);
        }
        
        return words.trim().replace(/\s+/g, ' ');
    }
    
    // --- Corps principal de la fonction Ariary ---
    
    let words = convert(integerPart);
    
    const ariaryUnit = 'Ariary'; 
    words += ' ' + ariaryUnit;

    if (centimes > 0) {
        let centimesWords = convert(centimes);
        words += ' et ' + centimesWords;
        const centimeUnit = (centimes > 1) ? 'Centimes' : 'Centime';
        words += ' ' + centimeUnit;
    }
    
    // Capitalize first letter
    return words.charAt(0).toUpperCase() + words.slice(1);
}

// ====================== Génération HTML (Largeur et Padding Ajustés) ======================

function generateEtatAppreciatifHtml(pvData) {
    console.log("=== Génération HTML PDF (Montants en lettres et largeurs maximales) ===");

    const exercice = pvData.exercice || String(new Date().getFullYear());
    
    // Données par défaut pour éviter les "undefined" si pvData est incomplet
    const depositaire = pvData.Depositaire || { nom: 'RABEZARASON Daniella Harmine', matricule: '322.346' };
    const depositaireNomComplet = `${depositaire.nom || 'RABEZARASON Daniella Harmine'}, IM ${depositaire.matricule || '322.346'}, Réalisateurs, 1re classe 3e échelon`;
    const dateDebut = pvData.dateDebut ? new Date(pvData.dateDebut).toLocaleDateString('fr-FR') : '01 janvier 2023'; 
    const dateFin = pvData.dateFin ? new Date(pvData.dateFin).toLocaleDateString('fr-FR') : '29 Décembre 2023';
    const periode = `${dateDebut} au ${dateFin}`;

    const lignes = Array.isArray(pvData.lignes) ? pvData.lignes : [];
    const recapitulatif = Array.isArray(pvData.recapitulatifParNomenclature) ? pvData.recapitulatifParNomenclature : [];

    // --- LOGIQUE CRUCIALE: Calculer les totaux par Nomenclature (Inchangée) ---
    const totalsParNomenclature = {}; 
    for (let i = 1; i <= 5; i++) {
        totalsParNomenclature[`${i}_charge`] = 0;
        totalsParNomenclature[`${i}_decharge`] = 0;
    }

    lignes.forEach(ligne => {
        const nomenclature = parseInt(ligne.nomenclature_chapitre || ligne.nomenclature_code, 10);
        
        if (nomenclature >= 1 && nomenclature <= 5) {
            const nomenclatureKey = String(nomenclature);
            
            if (ligne.valeur_existants > 0) {
                totalsParNomenclature[`${nomenclatureKey}_charge`] += parseFloat(ligne.valeur_existants || 0);
            } 
            if (ligne.valeur_deficits > 0) {
                totalsParNomenclature[`${nomenclatureKey}_decharge`] += parseFloat(ligne.valeur_deficits || 0);
            }
        }
    });

    // --- CSS pour la Mise en Page Exacte (Padding réduit) ---
    const styleCss = `
        <style>
            body { 
                font-family: 'Times New Roman', Times, serif; 
                margin: 0; 
                padding: 0;
                font-size: 11px; 
                line-height: 1.2;
            }
            .page-wrapper {
                padding: 30mm 25mm 20mm 25mm; 
                box-sizing: border-box;
                min-height: 297mm; 
                page-break-after: always;
                position: relative;
            }
            /* --- HEADER PAGE 1 --- */
            .header-info { text-align: center; margin-bottom: 30px; }
            .header-info p { margin: 0; padding: 0; font-size: 11px; }
            .header-info .title { font-weight: bold; margin-bottom: 5px; }
            .header-info .line { border-bottom: 1px solid black; width: 60%; margin: 5px auto; }
            .header-info .service-line { font-weight: bold; margin-top: 10px; }
            .chapitre-block { 
                text-align: left; 
                margin-top: 5px; 
                line-height: 1.4;
            }
            .chapitre-block strong { font-size: 11px; display: block; margin-top: 5px; }
            .etat-title { 
                font-size: 16px; 
                font-weight: bold; 
                text-align: center; 
                margin: 30px 0 10px 0; 
            }
            .period-text { text-align: center; margin-bottom: 25px; }
            .depositaire-text { 
                text-align: left; 
                line-height: 1.6; 
                margin-top: 10px;
                font-size: 11px; 
            }
            .depositaire-text strong { text-decoration: none; font-weight: normal; } 
            .cl-joint { margin-bottom: 10px; font-size: 11px; }
            .page-number { position: absolute; bottom: 15mm; left: 50%; transform: translateX(-50%); font-size: 10px; }
            /* --- TABLES GENERALES --- */
            table { 
                width: 100%; 
                border-collapse: collapse; 
                margin-top: 10px; 
                table-layout: fixed; 
            }
            th, td { 
                border: 1px solid #000; 
                /* Padding réduit pour gagner de l'espace horizontal */
                padding: 3px 3px; 
                text-align: center; 
                font-size: 9px; 
                vertical-align: middle;
            }
            .text-right { text-align: right; }
            .text-left { text-align: left; }
            /* --- RECAPITULATION (PAGE 3) --- */
            .recap-table th { background-color: #f0f0f0; height: 30px; }
            .recap-table .total-row td { 
                font-weight: bold; 
                background-color: #e0e0e0; 
                padding: 5px 10px; 
            }
            .recap-amounts { margin-top: 20px; font-size: 10px; line-height: 1.6; }
            .date-place { 
                text-align: right; 
                margin-top: 30px; 
                font-size: 10px; 
                padding-right: 5px; 
            }
            .signatures-section {
                margin-top: 50px;
                display: flex;
                justify-content: space-around;
                font-size: 10px;
            }
            .signature-block {
                text-align: center;
                width: 40%;
            }
            .signature-block .role { margin-bottom: 40px; margin-top: 10px; }
            .signature-block .name { font-weight: bold; text-decoration: underline; }
            /* --- DETAIL DES MOUVEMENTS (PAGE 2) --- */
            .detail-table th { background-color: #f0f0f0; height: 30px; }
            .detail-table .merged-header { font-weight: bold; background-color: #f0f0f0; }
            .detail-table .row-total td { font-weight: bold; background-color: #f0f0f0; }
            .detail-table .designation-cell { 
                text-align: left; 
                padding-left: 3px; /* Utiliser le même padding minimal */
                font-size: 9px;
            }
            .detail-table .total-label {
                text-align: right;
                font-weight: bold;
                padding-right: 5px;
            }
        </style>
    `;

    // --- PAGE 1: En-tête et Informations Générales (Inchangée) ---
    const page1Html = `
        <div class="page-wrapper">
            <div class="header-info">
                <p style="font-weight: bold; text-decoration: underline;">RÉPUBLIKAN'I MADAGASIKARA</p>
                <p>Fitiavana - Tanindrazana - Fandrosoana</p>
                <p>&nbsp;</p>
                <p class="title">MINISTÈRE DE L'ÉCONOMIE ET DES FINANCES</p>
                <p class="title">DIRECTION GÉNÉRALE DU BUDGET</p>
                <p class="title">DIRECTION DU MATÉRIEL</p>
                <div class="line"></div>
                <p class="service-line">(4) SERVICE RÉGIONAL DU BUDGET DE LA HAUTE MATSIATRA</p>
            </div>

            <div class="chapitre-block">
                <strong>(1) MATÉRIEL EN SERVICE</strong>
                <p style="margin-left: 10px;">Budget : Général</p>
                <p style="margin-left: 10px;">Chapitre (2) 21 Article 24e paragraphe 2163-2164</p>
                <p style="margin-left: 10px;">SOA : 00-23-2-F15-30101</p>
                <strong>(3) MATÉRIEL ET MOBILIER DE BUREAU</strong>
            </div>

            <p class="etat-title">ÉTAT APPRÉCIATIF</p>
            <p class="period-text">
                présentant les mouvements des entrées et des sorties
                <br>effectuées pendant l'année ${exercice}
            </p>

            <p class="cl-joint">
                Ci-joint <span style="text-decoration: underline; font-weight: bold;">UNE (01)</span> pièce justificative
            </p>

            <p class="depositaire-text">
                Gestion de Madame <span style="font-weight: bold;">RABEZARASON Daniella Harmine, IM : 322.346, Réalisateurs...</span>, du ${periode}
            </p>

            <div class="page-number">PAGE 1</div>
        </div>
    `;

    // --- PAGE 2: DÉTAIL DES MOUVEMENTS (Largeur des colonnes Maximales pour Montants) ---
    const detailHtml = `
        <div class="page-wrapper">
            <h2 style="text-align:center; font-size: 16px; margin-top: 20px;">DÉTAIL DES MOUVEMENTS</h2>
            <h2 style="text-align:center; font-size: 12px; margin-bottom: 20px;">(Entrées et Sorties)</h2>
            <table class="detail-table">
                <thead>
                    <tr>
                        <th rowspan="3" style="width: 5%;">N°</th>
                        <th rowspan="3" style="width: 7%;">Date</th>
                        <th rowspan="3" style="width: 10%;">Désignation sommaire des opérations</th>
                        <th colspan="2" class="merged-header" style="width: 15.6%;">1</th>
                        <th colspan="2" class="merged-header" style="width: 15.6%;">2</th>
                        <th colspan="2" class="merged-header" style="width: 15.6%;">3</th>
                        <th colspan="2" class="merged-header" style="width: 15.6%;">4</th>
                        <th colspan="2" class="merged-header" style="width: 15.6%;">5</th>
                    </tr>
                    <tr>
                        <th class="col-operation-header" colspan="2">Opération A</th>
                        <th class="col-operation-header" colspan="2">Opération A</th>
                        <th class="col-operation-header" colspan="2">Opération A</th>
                        <th class="col-operation-header" colspan="2">Opération A</th>
                        <th class="col-operation-header" colspan="2">Opération A</th>
                    </tr>
                    <tr>
                        <th style="width: 7.8%;">Charge</th>
                        <th style="width: 7.8%;">Décharge</th>
                        <th style="width: 7.8%;">Charge</th>
                        <th style="width: 7.8%;">Décharge</th>
                        <th style="width: 7.8%;">Charge</th>
                        <th style="width: 7.8%;">Décharge</th>
                        <th style="width: 7.8%;">Charge</th>
                        <th style="width: 7.8%;">Décharge</th>
                        <th style="width: 7.8%;">Charge</th>
                        <th style="width: 7.8%;">Décharge</th>
                    </tr>
                </thead>
                <tbody>
                    ${lignes.map((ligne, index) => {
                        const dateOp = ligne.date_pv ? new Date(ligne.date_pv).toLocaleDateString('fr-FR') : '';
                        
                        // Utilisation des fonctions de formatage sans 'Ar'
                        const chargeValue = ligne.valeur_existants > 0 ? formatAriary(ligne.valeur_existants) : '';
                        const dechargeValue = ligne.valeur_deficits > 0 ? formatAriary(ligne.valeur_deficits) : '';
                        
                        const nomenclature = parseInt(ligne.nomenclature_chapitre || ligne.nomenclature_code, 10);
                        
                        const cols = Array(10).fill(''); 
                        
                        if (nomenclature >= 1 && nomenclature <= 5) {
                            const baseIndex = (nomenclature - 1) * 2; 

                            if (chargeValue) {
                                cols[baseIndex] = chargeValue; 
                            } 
                            if (dechargeValue) {
                                cols[baseIndex + 1] = dechargeValue; 
                            }
                        }

                        return `
                            <tr>
                                <td>${String(index + 1).padStart(2,'0')}</td>
                                <td>${dateOp}</td>
                                <td class="designation-cell">${ligne.designation || ''}</td>
                                ${cols.map(val => `<td class="text-right">${val}</td>`).join('')}
                            </tr>
                        `;
                    }).join('')}
                    <tr>
                        <td colspan="3" class="total-label">TOTAUX.......................</td>
                        
                        ${Array(5).fill(0).map((_, i) => {
                            const nom = i + 1;
                            const totalCharge = totalsParNomenclature[`${nom}_charge`] || 0;
                            const totalDecharge = totalsParNomenclature[`${nom}_decharge`] || 0;
                            
                            return `
                                <td class="text-right" style="font-weight: bold;">${formatAriaryTotal(totalCharge)}</td>
                                <td class="text-right" style="font-weight: bold;">${formatAriaryTotal(totalDecharge)}</td>
                            `;
                        }).join('')}
                    </tr>
                </tbody>
            </table>
            <div class="page-number">PAGE 2</div>
        </div>
    `;


    // --- PAGE 3: RÉCAPITULATION (MODIFIÉ: Remplacement des placeholders en lettres) ---
    const recapHtml = `
        <div class="page-wrapper">
            <h2 style="text-align:center; font-size: 16px; margin-top: 20px;">RÉCAPITULATION</h2>
            <h2 style="text-align:center; font-size: 12px; margin-bottom: 20px;">(en Ariary)</h2>
            <table class="recap-table">
                <thead>
                    <tr>
                        <th rowspan="2" style="width: 15%;">Numéro de la nomenclature</th>
                        <th rowspan="2" style="width: 15%;">Existant au 01-Janv-${exercice}</th>
                        <th colspan="2" style="width: 35%;">Mouvements pendant l'année ${exercice}</th>
                        <th rowspan="2" style="width: 15%;">Reste au 31-Déc-${exercice}</th>
                    </tr>
                    <tr>
                        <th style="width: 17.5%;">Entrées</th>
                        <th style="width: 17.5%;">Sorties</th>
                    </tr>
                </thead>
                <tbody>
                    ${recapitulatif.map(r => `
                        <tr>
                            <td>${r.nomenclature_code}</td>
                            <td class="text-right">${formatAriaryTotal(r.solde_initial)}</td>
                            <td class="text-right">${formatAriaryTotal(r.valeur_entrees)}</td>
                            <td class="text-right">${formatAriaryTotal(r.valeur_sorties)}</td>
                            <td class="text-right">${formatAriaryTotal(r.solde_final_theorique)}</td>
                        </tr>
                    `).join('')}
                    <tr class="total-row">
                        <td class="text-left" style="font-weight: bold;">TOTAUX</td>
                        <td class="text-right">${formatAriaryTotal(pvData.total_solde_initial)}</td>
                        <td class="text-right">${formatAriaryTotal(pvData.total_entrees_periode)}</td>
                        <td class="text-right">${formatAriaryTotal(pvData.total_sorties_periode)}</td>
                        <td class="text-right">${formatAriaryTotal(pvData.total_solde_theorique)}</td>
                    </tr>
                </tbody>
            </table>

            <div class="recap-amounts">
                <p>ARRETE à la somme de (1): <span style="font-weight: bold;">${numberToFrenchWordsAriary(pvData.total_entrees_periode)} (${formatAriaryTotal(pvData.total_entrees_periode)})</span></p>
                <p>en ce qui concerne les entrées</p>
                <p>et à la somme de (1): <span style="font-weight: bold;">${numberToFrenchWordsAriary(pvData.total_sorties_periode)} (${formatAriaryTotal(pvData.total_sorties_periode)})</span></p>
                <p>en ce qui concerne les sorties</p>
                <p>et à la somme de (1): <span style="font-weight: bold;">${numberToFrenchWordsAriary(pvData.total_solde_theorique)} (${formatAriaryTotal(pvData.total_solde_theorique)})</span></p>
                <p>valeur restant au dernier jour de l'année</p>
            </div>

            <p class="date-place">A Fianarantsoa, le <span style="font-weight: bold;">${new Date().toLocaleDateString('fr-FR')}</span></p>

            <div class="signatures-section">
                <div class="signature-block">
                    <p style="font-style: italic;">Pour régularisation</p>
                    <p class="role">Le Dépositaire Comptable</p>
                    <p class="name">RABEZARASON Daniella H.</p>
                </div>
                <div class="signature-block">
                    <p style="font-style: italic;">Vu le Chef de Service</p>
                    <p class="role">&nbsp;</p>
                    <p class="name">RANJONANAHARY Marcellin</p>
                </div>
            </div>
            <div class="page-number">PAGE 3</div>
        </div>
    `;

    return `
        <html>
            <head>
                <meta charset="UTF-8">
                <title>État Appréciatif ${exercice}</title>
                ${styleCss}
            </head>
            <body>
                ${page1Html}
                ${lignes.length > 0 ? detailHtml : ''} 
                ${recapitulatif.length > 0 ? recapHtml : ''} 
            </body>
        </html>
    `;
}

// ====================== Fonction Principale (Buffer) ======================

async function generateEtatAppreciatifPDF(pvData) {
    const htmlContent = generateEtatAppreciatifHtml(pvData);

    let browser;
    let pdfBuffer;
    try {
        browser = await puppeteer.launch({ 
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'], 
            headless: true
        });
        const page = await browser.newPage();
        await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 }); 
        
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        
        pdfBuffer = await page.pdf({ 
            format: 'A4', 
            printBackground: true, 
            margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' } 
        });
        console.log("PDF généré en buffer avec succès.");
        return { pdfBuffer }; 
    } catch (error) {
        console.error("Erreur lors de la génération du PDF avec Puppeteer:", error);
        throw new Error("Échec de la génération du PDF.");
    } finally { 
        if(browser) await browser.close(); 
    }
}

export default generateEtatAppreciatifPDF;
export { generateEtatAppreciatifPDF, generateEtatAppreciatifHtml, formatAriary, formatAriaryTotal, numberToFrenchWordsAriary };