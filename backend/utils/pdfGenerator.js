/*import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';

// =========================================================================
// FONCTIONS UTILITAIRES
// =========================================================================

function formatMonetaire(nombre) {
    // Formatage des nombres à deux décimales (ex: 520 000,00)
    return (nombre || 0).toLocaleString('fr-DZ', { minimumFractionDigits: 2 });
}

function formatDate(dateString) {
    if (!dateString) return '';
    try {
        // Crée une date à partir de la chaîne (ex: '2019-12-31')
        const date = new Date(dateString);
        // Formate au format JJ/MM/AAAA (ex: 31/12/2019)
        return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (e) {
        // En cas d'erreur de formatage, retourne la chaîne originale.
        return dateString;
    }
}

/**
 * Détermine le contenu de la colonne Observation en priorisant l'Ordre d'Entrée (OE).
 * @param {object} r - L'objet Bien enrichi.
 * @returns {string} Le texte formaté pour la colonne Observation.
 *
function getObservationContent(r) {
    let observation = '';
    const ORDRE_STATIQUE = '01'; // Numéro statique pour OE et OS

    // --- 1. Logique d'Entrée/Acquisition (OE) - PRIORITÉ ---
    if (r.quantite_reste > 0 || r.quantite_entree > 0) {

        if (!r.date_acquisition) {
            observation += `<span class="error">ERREUR: Date Acquisition Manquante!</span>`;
        } else {
            const dateAcquisition = new Date(r.date_acquisition);
            const anneeAcquisition = String(dateAcquisition.getFullYear()).slice(-2);
            const dateFormatted = formatDate(r.date_acquisition);

            // Utilisation du numéro d'ordre d'entrée (statique 01 si non fourni)
            const numeroOrdreEntree = r.numero_ordre_entree || ORDRE_STATIQUE;

            observation += `Ordre d'entrée N°${numeroOrdreEntree}/${anneeAcquisition} du ${dateFormatted}`;
        }
    }

    // --- 2. Logique de Sortie (OS) - Complémentaire ---
    if (Array.isArray(r.sorties) && r.sorties.length > 0) {
        r.sorties.sort((a, b) => new Date(b.date) - new Date(a.date));
        const lastSortie = r.sorties[0];

        if (lastSortie.date) {
            const dateSortie = lastSortie.date;
            const anneeSortie = String(new Date(dateSortie).getFullYear()).slice(-2);
            const dateFormatted = formatDate(dateSortie);

            // 🛑 CORRECTION 1 : Utilisation du numéro statique '01' pour l'OS
            const numeroOrdreSortie = ORDRE_STATIQUE;

            const sortieContent = `OS N°${numeroOrdreSortie}/${anneeSortie} du ${dateFormatted}`;

            // 🛑 CORRECTION 2 : Utilisation correcte de " ET "
            if (observation !== '') {
                observation += ` ET ${sortieContent}`;
            } else {
                observation = sortieContent;
            }
        }
    }

    // 3. Retourner l'observation finale
    return observation || r.observation || '';
}

/**
 * Génère le contenu HTML pour le tableau.
 *
function generateTableHTML(rows, totalGlobalValeur) {
    let tbodyHTML = '';
    let folioNumber = 1;
    let currentNomenclature = null;

    // Étape 1: Trier les données par nomenclature
    const sortedRows = [...rows].sort((a, b) => {
        const nomenA = a.nomenclature ? parseInt(a.nomenclature, 10) : 0;
        const nomenB = b.nomenclature ? parseInt(b.nomenclature, 10) : 0;
        return nomenA - nomenB;
    });

    sortedRows.forEach(r => {

        // --- LOGIQUE DE GROUPEMENT PAR NOMENCLATURE ---
        if (r.nomenclature && r.nomenclature !== currentNomenclature) {
            currentNomenclature = r.nomenclature;

            // Ligne d'en-tête du groupe (NOMENCLATURE 0X)
            tbodyHTML += `
                <tr class="nomenclature-group-header">
                    <td></td> 
                    <td colspan="8" class="align-left bold">
                        NOMENCLATURE ${r.nomenclature ? r.nomenclature.padStart(2, '0') : ''}
                    </td>
                    <td></td>
                </tr>
            `;
        }

        // --- PRÉPARATION ET AFFICHAGE DES DONNÉES ---
        const observationContent = getObservationContent(r);

        const prixUStr = formatMonetaire(r.prix_unitaire);
        const decompte = ((r.quantite_reste || 0) * (r.prix_unitaire || 0));
        const decompteStr = formatMonetaire(decompte);

        tbodyHTML += `
            <tr class="data-row">
                <td class="col-folio align-center">${folioNumber++}</td>
                <td class="col-designation align-left">${r.designation || ''}</td>
                <td class="col-unite align-center">${r.unite || 'Nbre'}</td> 
                <td class="col-prix align-right">${prixUStr}</td>
                <td class="col-qte align-center">${r.quantite_existante || 0}</td>
                <td class="col-qte align-center">${r.quantite_entree || 0}</td>
                <td class="col-qte align-center">${r.quantite_sortie || 0}</td>
                <td class="col-reste align-center">${r.quantite_reste || 0}</td>
                <td class="col-decompte align-right">${decompteStr}</td>
                <td class="col-observation align-left">${observationContent}</td>
            </tr>
        `;
    });

    // Ligne de total (A REPORTER)
    tbodyHTML += `
        <tr class="total-row">
            <td colspan="8" class="align-right bold total-label">A REPORTER</td>
            <td class="align-right bold total-value">${formatMonetaire(totalGlobalValeur)}</td>
            <td></td> 
        </tr>
    `;

    // L'en-tête du tableau 
    return `
        <table class="inventaire-table">
            <thead>
                <tr>
                    <th rowspan="2" class="col-folio">Numéro du folio ou Gr. Livre</th>
                    <th rowspan="2" class="col-designation">Désignation du matériel</th>
                    
                    <th rowspan="2" class="col-unite">Espèces des unités</th>
                    <th rowspan="2" class="col-prix">Prix de l'unité</th>
                    <th colspan="4" class="col-group">Quantité</th>
                    <th rowspan="2" class="col-decompte">Décompte</th>
                    <th rowspan="2" class="col-observation">Observation</th>
                </tr>
                <tr>
                    <th class="col-qte">Existant</th>
                    <th class="col-qte">Entrées</th>
                    <th class="col-qte">Sorties</th>
                    <th class="col-qte">Reste</th>
                </tr>
            </thead>
            <tbody>
                ${tbodyHTML}
            </tbody>
        </table>
    `;
}

// =========================================================================
// FONCTION PRINCIPALE
// =========================================================================

export const generateInventairePDF = async (rows, options) => {
    let totalGlobalValeur = 0;
    // Calcul de la valeur totale
    rows.forEach(r => {
        totalGlobalValeur += ((r.quantite_reste || 0) * (r.prix_unitaire || 0));
    });

    const tableHTML = generateTableHTML(rows, totalGlobalValeur);

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Inventaire</title>
            <style>
                /* Configuration générale *
                body { font-family: sans-serif; font-size: 8pt; }
                .container { margin: 36px; }
                .bold { font-weight: bold; }
                .align-left { text-align: left; }
                .align-center { text-align: center; }
                .align-right { text-align: right; }
                .error { color: red; font-weight: bold; }

                /* En-tête *
                .header-top { margin-bottom: 20px; font-size: 7pt; }
                .header-left, .header-right { width: 48%; display: inline-block; vertical-align: top; }
                .header-right { text-align: right; }
                .title { font-size: 14pt; font-weight: bold; text-align: center; margin: 20px 0 5px 0; }
                .subtitle { font-size: 9pt; text-align: center; margin-bottom: 25px; }

                /* Styles de Tableau *
                .inventaire-table { width: 100%; border-collapse: collapse; font-size: 7pt; table-layout: fixed; }
                .inventaire-table th, .inventaire-table td { 
                    border: 1px solid black; 
                    padding: 4px 2px;
                    vertical-align: middle; 
                }
                .inventaire-table th { background-color: #EFEFEF; font-weight: bold; padding: 4px 2px; }
                
                /* Style pour l'en-tête de groupement (NOMENCLATURE 0X) *
                .nomenclature-group-header td {
                    background-color: #F8F8F8; 
                    font-size: 8pt;
                    padding: 4px 10px;
                    border-bottom: 1px solid black !important;
                }

                /* Largeurs de Colonnes *
                .col-folio { width: 45px; }
                .col-designation { width: 145px; } 
                .col-unite { width: 30px; }
                .col-prix { width: 55px; } 
                .col-qte { width: 40px; } 
                .col-reste { width: 50px; }
                .col-decompte { width: 60px; }
                .col-observation { width: 60px; } /* Attention à cette largeur pour le texte combiné */

                /* Styles totaux *
                .total-row td { background-color: #EFEFEF; }
                .total-label { padding-right: 10px !important; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header-top">
                    <div class="header-left">
                        <p class="bold">REPUBLIQUE ALGERIENNE DEMOCRATIQUE ET POPULAIRE</p>
                        <p>MINISTERE DES FINANCES</p>
                        <p>SERVICE REGIONAL DU NORD</p>
                        <p class="bold">(2) HAUTE SAOURA</p>
                    </div>
                    <div class="header-right">
                        <p>BUDGET: Général</p>
                        <p>SOA: 00-23-33-01-013</p>
                        <p>Date: ${options.date_generation}</p>
                    </div>
                </div>

                <div class="title">INVENTAIRE</div>
                <div class="subtitle">du mobilier et objets d'équipement existant au ${options.periode_fin}</div>

                ${tableHTML}
                
                <div style="margin-top: 50px; font-size: 10pt;">
                    <p>Établi par : ____________________</p>
                    <p style="margin-top: 5px;">Signature : ____________________</p>
                </div>
            </div>
            
        </body>
        </html>
    `;

    // 2. Lancement de Puppeteer
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    // 3. Définition du contenu
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    // 4. Génération du PDF avec gestion du footer de pagination
    await page.pdf({
        path: options.outPath,
        format: 'A4',
        margin: { top: '120px', right: '36px', bottom: '50px', left: '36px' },
        displayHeaderFooter: true,
        footerTemplate: `
            <div style="font-size: 8pt; margin: 10px 36px 0 36px; width: 100%; display: flex; justify-content: space-between;">
                <span>À reporter sur la page suivante si nécessaire</span>
                <span>PAGE <span class="pageNumber"></span> / <span class="totalPages"></span></span>
            </div>
        `,
        headerTemplate: `<div style="display: none;"></div>`,
    });

    await browser.close();

    return { outPath: options.outPath, valeurTotale: totalGlobalValeur };
};*/
import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';

// =========================================================================
// FONCTIONS UTILITAIRES
// =========================================================================

function formatMonetaire(nombre) {
    // Formatage des nombres à deux décimales (ex: 520 000,00)
    return (nombre || 0).toLocaleString('fr-DZ', { minimumFractionDigits: 2 });
}

function formatDate(dateString) {
    if (!dateString) return '';
    try {
        // Crée une date à partir de la chaîne (ex: '2019-12-31')
        const date = new Date(dateString);
        // Formate au format JJ/MM/AAAA (ex: 31/12/2019)
        return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (e) {
        // En cas d'erreur de formatage, retourne la chaîne originale.
        return dateString;
    }
}

/**
 * Détermine le contenu de la colonne Observation en priorisant l'Ordre d'Entrée (OE).
 * @param {object} r - L'objet Bien enrichi.
 * @returns {string} Le texte formaté pour la colonne Observation.
 */
function getObservationContent(r) {
    let observation = '';
    const ORDRE_STATIQUE = '01'; // Numéro statique pour OE et OS

    // --- 1. Logique d'Entrée/Acquisition (OE) - PRIORITÉ ---
    if (r.quantite_reste > 0 || r.quantite_entree > 0) {

        if (!r.date_acquisition) {
            observation += `<span class="error">ERREUR: Date Acquisition Manquante!</span>`;
        } else {
            const dateAcquisition = new Date(r.date_acquisition);
            // Assurez-vous que l'année est valide (pour éviter "NaN")
            const anneeAcquisition = dateAcquisition.getFullYear() ? String(dateAcquisition.getFullYear()).slice(-2) : 'XX';
            const dateFormatted = formatDate(r.date_acquisition);

            // Utilisation du numéro d'ordre d'entrée (statique 01 si non fourni)
            const numeroOrdreEntree = r.numero_ordre_entree || ORDRE_STATIQUE;

            observation += `Ordre d'entrée N°${numeroOrdreEntree}/${anneeAcquisition} du ${dateFormatted}`;
        }
    }

    // --- 2. Logique de Sortie (OS) - Complémentaire ---
    if (Array.isArray(r.sorties) && r.sorties.length > 0) {
        r.sorties.sort((a, b) => new Date(b.date) - new Date(a.date));
        const lastSortie = r.sorties[0];

        if (lastSortie.date) {
            const dateSortie = lastSortie.date;
            const dateObj = new Date(dateSortie);
            const anneeSortie = dateObj.getFullYear() ? String(dateObj.getFullYear()).slice(-2) : 'XX';
            const dateFormatted = formatDate(dateSortie);

            const numeroOrdreSortie = ORDRE_STATIQUE;

            const sortieContent = `OS N°${numeroOrdreSortie}/${anneeSortie} du ${dateFormatted}`;

            if (observation !== '') {
                observation += ` ET ${sortieContent}`;
            } else {
                observation = sortieContent;
            }
        }
    }

    // 3. Retourner l'observation finale
    return observation || r.observation || '';
}

/**
 * Génère le contenu HTML pour le tableau.
 */
function generateTableHTML(rows, totalGlobalValeur) {
    let tbodyHTML = '';
    let folioNumber = 1;
    let currentNomenclature = null;

    // Étape 1: Trier les données par nomenclature
    // Correction: On trie d'abord les nombres (01, 02, ...) et on place les vides (SANS NOMENCLATURE) à la fin
    const sortedRows = [...rows].sort((a, b) => {
        const nomenA = a.nomenclature ? parseInt(a.nomenclature, 10) : Infinity;
        const nomenB = b.nomenclature ? parseInt(b.nomenclature, 10) : Infinity;
        
        // Si les deux sont Infinity (SANS NOMENCLATURE), trier par désignation
        if (nomenA === Infinity && nomenB === Infinity) {
            return (a.designation || '').localeCompare(b.designation || '');
        }

        return nomenA - nomenB;
    });

    sortedRows.forEach(r => {
        // --- LOGIQUE DE GROUPEMENT PAR NOMENCLATURE ---
        // r.nomenclature contient maintenant le code (ex: '01', '02') ou une chaîne vide ''
        const nomenclatureCode = r.nomenclature || 'SANS_NOMENCLATURE';

        if (nomenclatureCode !== currentNomenclature) {
            currentNomenclature = nomenclatureCode;

            // Déterminer le texte d'en-tête du groupe
            const headerText = (currentNomenclature === 'SANS_NOMENCLATURE') 
                ? 'BIENS SANS NOMENCLATURE' 
                : `NOMENCLATURE ${currentNomenclature.padStart(2, '0')}`;

            // Ligne d'en-tête du groupe
            tbodyHTML += `
                <tr class="nomenclature-group-header">
                    <td></td> 
                    <td colspan="8" class="align-left bold">
                        ${headerText}
                    </td>
                    <td></td>
                </tr>
            `;
        }

        // --- PRÉPARATION ET AFFICHAGE DES DONNÉES ---
        const observationContent = getObservationContent(r);

        const prixUStr = formatMonetaire(r.prix_unitaire);
        const decompte = ((r.quantite_reste || 0) * (r.prix_unitaire || 0));
        const decompteStr = formatMonetaire(decompte);

        tbodyHTML += `
            <tr class="data-row">
                <td class="col-folio align-center">${folioNumber++}</td>
                <td class="col-designation align-left">${r.designation || ''}</td>
                <td class="col-unite align-center">${r.unite || 'Nbre'}</td> 
                <td class="col-prix align-right">${prixUStr}</td>
                <td class="col-qte align-center">${r.quantite_existante || 0}</td>
                <td class="col-qte align-center">${r.quantite_entree || 0}</td>
                <td class="col-qte align-center">${r.quantite_sortie || 0}</td>
                <td class="col-reste align-center">${r.quantite_reste || 0}</td>
                <td class="col-decompte align-right">${decompteStr}</td>
                <td class="col-observation align-left">${observationContent}</td>
            </tr>
        `;
    });

    // Ligne de total (A REPORTER)
    tbodyHTML += `
        <tr class="total-row">
            <td colspan="8" class="align-right bold total-label">A REPORTER</td>
            <td class="align-right bold total-value">${formatMonetaire(totalGlobalValeur)}</td>
            <td></td> 
        </tr>
    `;

    // L'en-tête du tableau 
    return `
        <table class="inventaire-table">
            <thead>
                <tr>
                    <th rowspan="2" class="col-folio">Numéro du folio ou Gr. Livre</th>
                    <th rowspan="2" class="col-designation">Désignation du matériel</th>
                    
                    <th rowspan="2" class="col-unite">Espèces des unités</th>
                    <th rowspan="2" class="col-prix">Prix de l'unité</th>
                    <th colspan="4" class="col-group">Quantité</th>
                    <th rowspan="2" class="col-decompte">Décompte</th>
                    <th rowspan="2" class="col-observation">Observation</th>
                </tr>
                <tr>
                    <th class="col-qte">Existant</th>
                    <th class="col-qte">Entrées</th>
                    <th class="col-qte">Sorties</th>
                    <th class="col-qte">Reste</th>
                </tr>
            </thead>
            <tbody>
                ${tbodyHTML}
            </tbody>
        </table>
    `;
}

// =========================================================================
// FONCTION PRINCIPALE
// =========================================================================

export const generateInventairePDF = async (rows, options) => {
    let totalGlobalValeur = 0;
    // Calcul de la valeur totale
    rows.forEach(r => {
        totalGlobalValeur += ((r.quantite_reste || 0) * (r.prix_unitaire || 0));
    });

    const tableHTML = generateTableHTML(rows, totalGlobalValeur);

    // Formatte la date pour l'affichage dans l'en-tête
    const dateAffichage = options.periode_fin ? formatDate(options.periode_fin) : new Date().toLocaleDateString('fr-FR');
    const dateGenerationAffichage = options.date_generation ? formatDate(options.date_generation) : new Date().toLocaleDateString('fr-FR');

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Inventaire</title>
            <style>
                /* Configuration générale */
                body { font-family: sans-serif; font-size: 8pt; margin: 0; }
                .container { margin: 0 36px; }
                .bold { font-weight: bold; }
                .align-left { text-align: left; }
                .align-center { text-align: center; }
                .align-right { text-align: right; }
                .error { color: red; font-weight: bold; }

                /* En-tête */
                .header-top { margin-bottom: 20px; font-size: 7pt; }
                .header-left, .header-right { width: 48%; display: inline-block; vertical-align: top; }
                .header-right { text-align: right; }
                .title { font-size: 14pt; font-weight: bold; text-align: center; margin: 20px 0 5px 0; }
                .subtitle { font-size: 9pt; text-align: center; margin-bottom: 25px; }

                /* Styles de Tableau */
                .inventaire-table { width: 100%; border-collapse: collapse; font-size: 7pt; table-layout: fixed; }
                .inventaire-table th, .inventaire-table td { 
                    border: 1px solid black; 
                    padding: 4px 2px;
                    vertical-align: middle; 
                }
                .inventaire-table th { background-color: #EFEFEF; font-weight: bold; padding: 4px 2px; }
                
                /* Style pour l'en-tête de groupement (NOMENCLATURE 0X) */
                .nomenclature-group-header td {
                    background-color: #F8F8F8; 
                    font-size: 8pt;
                    padding: 4px 10px;
                    border-bottom: 1px solid black !important;
                }

                /* Largeurs de Colonnes - Ajustées pour mieux distribuer */
                .col-folio { width: 45px; }
                .col-designation { width: 145px; } 
                .col-unite { width: 30px; }
                .col-prix { width: 55px; } 
                .col-qte { width: 40px; } 
                .col-reste { width: 50px; }
                .col-decompte { width: 60px; }
                .col-observation { width: 100px; } /* Augmenté pour l'Ordre Entrée + Sortie */

                /* Styles totaux */
                .total-row td { background-color: #EFEFEF; }
                .total-label { padding-right: 10px !important; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header-top">
                    <div class="header-left">
                        <p class="bold">REPOBLIKAN'I MADAGASIKARA</p>
                        <p>MINISTERE DES FINANCES</p>
                        <p>SERVICE REGIONAL DU BUDGET </p>
                        <p class="bold">(2) HAUTE MATSIATRA</p>
                    </div>
                    <div class="header-right">
                        <p>BUDGET: Général</p>
                        <p>SOA: 00-23-33-01-013</p>
                        <p>Date: ${dateGenerationAffichage}</p>
                    </div>
                </div>

                <div class="title">INVENTAIRE</div>
                <div class="subtitle">du mobilier et objets d'équipement existant au ${dateAffichage}</div>

                ${tableHTML}
                
                <div style="margin-top: 50px; font-size: 10pt;">
                    <p>Établi par : ____________________</p>
                    <p style="margin-top: 5px;">Signature : ____________________</p>
                </div>
            </div>
            
        </body>
        </html>
    `;

    // 2. Lancement de Puppeteer
    // On force un lancement non-headless pour le debug si besoin, mais en production, headless: true est préféré.
    const browser = await puppeteer.launch({ headless: true }); 
    const page = await browser.newPage();

    // 3. Définition du contenu
    // await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    // Utiliser la fonction pour charger le contenu HTML
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    // 4. Génération du PDF avec gestion du footer de pagination
    await page.pdf({
        path: options.outPath,
        format: 'A4',
        margin: { top: '120px', right: '36px', bottom: '50px', left: '36px' },
        displayHeaderFooter: true,
        footerTemplate: `
            <div style="font-size: 8pt; margin: 10px 36px 0 36px; width: 100%; display: flex; justify-content: space-between;">
                <span>À reporter sur la page suivante si nécessaire</span>
                <span>PAGE <span class="pageNumber"></span> / <span class="totalPages"></span></span>
            </div>
        `,
        headerTemplate: `<div style="display: none;"></div>`, // Garder l'en-tête vide si déjà inclus dans le HTML
    });

    await browser.close();

    return { outPath: options.outPath, valeurTotale: totalGlobalValeur };
};