// backend/utils/pdfRecensementGenerator.js
/*
import fs from 'fs';
import puppeteer from 'puppeteer'; 

function generatePVHtml(pvData) {
    
    // Assurez-vous que les totaux sont correctement formatés
    const montantTotalDeficits = parseFloat(pvData.total_general_deficits || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 });
    const montantTotalExistants = parseFloat(pvData.total_general_existants || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 });
    const datePV = new Date(pvData.date_pv).toLocaleDateString('fr-FR');
    
    // ----------------------------------------------------------------
    // ✅ DONNÉES DYNAMIQUES DU PV 
    // ----------------------------------------------------------------
    const recenseur = pvData.AgentRecenseur || {};
    const service = recenseur.service || {};
    // const comptable = pvData.Comptable || {}; 

    // Données affichées
    const serviceRegional = 'SERVICE REGIONAL DU BUDGET HAUTE MATSIATRA - FIANARANTSOA';
    const devise = 'BUDGET : GENERAL'; 
    const codeService = service.code || 'N/A'; 
    const soaAffichage = `SOA : [CODE BUGETAIRE] - ${codeService}`; 
    const chapitre = 'CHAPITRE (1) : 21 ARTICLE : 216 PARAGRAPHE : 2163-2164'; 

    // Construction du nom et matricule du recenseur
    const recenseurNomComplet = `${recenseur.nom || pvData.recenseur_nom || 'N/A'}, IM : ${recenseur.matricule || 'N/A'}, ${recenseur.role || pvData.recenseur_qualite}`; 
    const comptableNomComplet = 'RABEZARASON Daniella Harmine, IM : 322.346, Réalisateurs...'; // Placeholder

    const styleCss = `
        <style>
            body { font-family: 'Times New Roman', Times, serif; margin: 40px; font-size: 11px; }
            .header-pv { text-align: left; margin-bottom: 25px; } /* Changé de center à left pour coller à la mise en page *
            .header-pv h1 { margin: 0; font-size: 18px; color: #333; }
            
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #000; padding: 4px 6px; text-align: left; vertical-align: middle; }
            
            .pv-table th { background-color: #f0f0f0; font-weight: bold; text-align: center; }
            .pv-table td { font-size: 10px; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }

            .pv-table thead { display: table-header-group; }
            
            /* 🚀 NOUVELLE RÈGLE CSS : Force un saut de page avant l'élément *
            .table-container { 
                page-break-before: always; 
            }
        </style>
    `;

    const tableHeader = `
        <thead>
            <tr style="font-size: 10px;">
                <th rowspan="3" style="width: 15%;">Désignation de la matière</th>
                <th rowspan="3" style="width: 4%;">Unité</th>
                <th rowspan="3" style="width: 7%; text-align: right;">Prix Unitaire</th>
                <th colspan="4">QUANTITÉS</th>
                <th colspan="5">VALEURS</th>
                <th rowspan="3" style="width: 10%;">Observation</th>
            </tr>
            <tr style="font-size: 9px;">
                <th colspan="2">Constat/Écritures</th>
                <th colspan="2">Écart</th>
                <th colspan="2">Des Excédents</th>
                <th colspan="2">Des Déficits</th>
                <th rowspan="2">Des Existants</th>
            </tr>
            <tr style="font-size: 9px;">
                <th>Écritures</th>
                <th>Constatés</th>
                <th>Excédent</th>
                <th>Déficit</th>
                <th>Par article</th>
                <th>Total Excédent</th>
                <th>Par article</th>
                <th>Total Déficit</th>
            </tr>
        </thead>
    `;
    
    const tableBody = pvData.lignes.map(l => {
        // ... (Code des lignes inchangé)
        const prixU = parseFloat(l.prix_unitaire || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 });
        const valDef = parseFloat(l.valeur_deficits || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 });
        const valExis = parseFloat(l.valeur_existants || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 });
        const qteExcedent = l.qte_excedent || 0;
        const qteDeficit = l.qte_deficit || 0;

        const designation = l.Bien?.designation || l.designation || 'N/A';
        const unite = l.Bien?.unite_de_mesure || 'Nbre'; 

        return `
        <tr>
            <td style="width: 150px;">${designation}</td>
            <td class="text-center" style="width: 40px;">${unite}</td>
            <td class="text-right">${prixU}</td>
            
            <td class="text-center">${l.qte_existante_ecriture}</td>
            <td class="text-center" style="font-weight: bold;">${l.qte_constatee}</td>
            <td class="text-center" style="color: green;">${qteExcedent > 0 ? qteExcedent : ''}</td>
            <td class="text-center" style="color: red;">${qteDeficit > 0 ? qteDeficit : ''}</td>
            
            <td></td>
            <td class="text-right">${qteExcedent > 0 ? (qteExcedent * l.prix_unitaire).toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : ''}</td>
            
            <td class="text-right">${qteDeficit > 0 ? (qteDeficit * l.prix_unitaire).toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : ''}</td>
            <td class="text-right">${valDef}</td>
            <td class="text-right" style="font-weight: bold;">${valExis}</td>
            
            <td>${l.etat_recensement}</td>
        </tr>
    `}).join('');

    const totalRow = `
        <tr style="background-color: #e0f0ff; font-weight: bold;">
            <td colspan="7" class="text-right">TOTAUX GÉNÉRAUX</td>
            <td></td>
            <td class="text-right"></td> <td></td>
            <td class="text-right">${montantTotalDeficits}</td>
            <td class="text-right" style="font-weight: bold;">${montantTotalExistants}</td>
            <td></td>
        </tr>
    `;
    
    // J'ai déplacé la zone de signature DANS le div du tableau pour qu'elle suive le tableau,
    // MAIS elle ne déclenchera pas un saut de page si elle rentre sur la page 2.
    const signatureArea = `
        <div style="margin-top: 50px;">
            <p>Le présent Procès-Verbal comprend un total de ${pvData.lignes.length} lignes de biens et est établi en présence des parties prenantes.</p>
            <div style="display: flex; justify-content: space-between; margin-top: 30px;">
                <p><strong>Fait à [Lieu], le ${datePV}</strong></p>
                <p style="text-align: right; width: 30%;">Le Comptable Matières</p>
                <p style="text-align: right; width: 30%;">Le Responsable Comptable</p>
            </div>
        </div>
    `;

    return `
        <html>
            <head>${styleCss}</head>
            <body>
                <div class="header-pv">
                    <p style="text-align: center; margin-bottom: 20px;">
                        <span style="font-size: 8px;">Fitiavana - Tanindrazana - Fandrosoana</span>
                    </p>
                    
                    <div style="font-size: 13px; font-weight: bold; margin-bottom: 5px;">
                        ${devise}
                    </div>
                    <div style="font-size: 13px; margin-bottom: 10px;">
                        EXERCICE : ${pvData.exercice}
                    </div>
                    
                    <div style="font-size: 10px; margin-bottom: 5px;">
                        ${soaAffichage}
                    </div>
                    <div style="font-size: 10px; margin-bottom: 25px;">
                        ${chapitre}
                    </div>

                    <div style="font-weight: bold; font-size: 11px; margin-bottom: 40px;">
                        ${serviceRegional}
                    </div>

                    <h1 style="text-align: center; font-size: 20px; font-weight: bold; color: #000; margin-bottom: 50px;">
                        PROCES-VERBAL DE RECENSEMENT
                    </h1>

                    <p style="font-style: italic; font-size: 12px; margin-bottom: 5px;">
                        Nom et qualité d'un agent recenseur:
                    </p>
                    <p style="font-weight: bold; font-size: 13px; margin-left: 10px; margin-bottom: 25px;">
                        ${recenseurNomComplet}
                    </p>

                    <p style="font-style: italic; font-size: 12px; margin-bottom: 5px;">
                        Nom et qualité du comptable :
                    </p>
                    <p style="font-weight: bold; font-size: 13px; margin-left: 10px; margin-bottom: 50px;">
                        ${comptableNomComplet}
                    </p>
                </div>
                
                <div class="table-container">
                    <table class="pv-table">
                        ${tableHeader}
                        <tbody>
                            ${tableBody}
                            ${totalRow}
                        </tbody>
                    </table>
                    ${signatureArea}
                </div>
            </body>
        </html>
    `;
}

// Renommée en 'generateRecensementPDF'
const generateRecensementPDF = async (recensementData) => {
    const htmlContent = generatePVHtml(recensementData);
    const fileName = `PV_Recensement_${recensementData.exercice}_${recensementData.id}.pdf`;
    
    const browser = await puppeteer.launch({ 
        headless: 'new'
    });
    const page = await browser.newPage();
    
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' }); 
    
    const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20mm', right: '10mm', bottom: '20mm', left: '10mm' }
    });
    
    await browser.close();
    
    return { fileName, pdfBuffer };
};

export default generateRecensementPDF;*/
// backend/utils/pdfRecensementGenerator.js

import fs from 'fs';
import puppeteer from 'puppeteer';

function generatePVHtml(pvData) {

    // -------------------- Calcul dynamique des totaux --------------------
    const totalExistants = pvData.total_general_existants !== undefined
        ? parseFloat(pvData.total_general_existants)
        : pvData.lignes.reduce((sum, l) => sum + (l.valeur_existants || 0), 0);

    const totalDeficits = pvData.total_general_deficits !== undefined
        ? parseFloat(pvData.total_general_deficits)
        : pvData.lignes.reduce((sum, l) => sum + (l.valeur_deficits || 0), 0);

    const montantTotalExistants = totalExistants.toLocaleString('fr-FR', { minimumFractionDigits: 2 });
    const montantTotalDeficits = totalDeficits.toLocaleString('fr-FR', { minimumFractionDigits: 2 });

    const datePV = new Date(pvData.date_pv).toLocaleDateString('fr-FR');

    // -------------------- Informations Recenseur et Service --------------------
    const recenseur = pvData.AgentRecenseur || {};
    const service = recenseur.service || {};

    const recenseurNomComplet = `${recenseur.nom || 'N/A'}, IM : ${recenseur.matricule || 'N/A'}, ${recenseur.role || pvData.recenseur_qualite}`;
    const comptableNomComplet = 'RABEZARASON Daniella Harmine, IM : 322.346, Réalisateurs...'; // Placeholder

    const serviceRegional = 'SERVICE REGIONAL DU BUDGET HAUTE MATSIATRA - FIANARANTSOA';
    const devise = 'BUDGET : GENERAL'; 
    const codeService = service.code || 'N/A'; 
    const soaAffichage = `SOA : [CODE BUGETAIRE] - ${codeService}`; 
    const chapitre = 'CHAPITRE (1) : 21 ARTICLE : 216 PARAGRAPHE : 2163-2164'; 

    // -------------------- Style CSS --------------------
    const styleCss = `
        <style>
            body { font-family: 'Times New Roman', Times, serif; margin: 40px; font-size: 11px; }
            .header-pv { text-align: left; margin-bottom: 25px; }
            .header-pv h1 { margin: 0; font-size: 18px; color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #000; padding: 4px 6px; text-align: left; vertical-align: middle; }
            .pv-table th { background-color: #f0f0f0; font-weight: bold; text-align: center; }
            .pv-table td { font-size: 10px; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .pv-table thead { display: table-header-group; }
            .table-container { page-break-before: always; }
        </style>
    `;

    // -------------------- Table Header --------------------
    const tableHeader = `
        <thead>
            <tr style="font-size: 10px;">
                <th rowspan="3" style="width: 15%;">Désignation de la matière</th>
                <th rowspan="3" style="width: 4%;">Unité</th>
                <th rowspan="3" style="width: 7%; text-align: right;">Prix Unitaire</th>
                <th colspan="4">QUANTITÉS</th>
                <th colspan="5">VALEURS</th>
           <th rowspan="3" style="width: 12%; min-width: 80px;">Observation</th>

            </tr>
            <tr style="font-size: 9px;">
                <th colspan="2">Constat/Écritures</th>
                <th colspan="2">Écart</th>
                <th colspan="2">Des Excédents</th>
                <th colspan="2">Des Déficits</th>
                <th rowspan="2">Des Existants</th>
            </tr>
            <tr style="font-size: 9px;">
                <th>Écritures</th>
                <th>Constatés</th>
                <th>Excédent</th>
                <th>Déficit</th>
                <th>Par article</th>
                <th>Total Excédent</th>
                <th>Par article</th>
                <th>Total Déficit</th>
            </tr>
        </thead>
    `;

    // -------------------- Table Body --------------------
    const tableBody = pvData.lignes.map(l => {
        const prixU = parseFloat(l.prix_unitaire || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 });
        const valDef = parseFloat(l.valeur_deficits || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 });
        const valExis = parseFloat(l.valeur_existants || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 });
        const qteExcedent = l.qte_excedent || 0;
        const qteDeficit = l.qte_deficit || 0;
        const designation = l.Bien?.designation || l.designation || 'N/A';
        const unite = l.unite_de_mesure || 'Nbre'; 

        return `
        <tr>
            <td style="width: 150px;">${designation}</td>
            <td class="text-center" style="width: 40px;">${unite}</td>
            <td class="text-right">${prixU}</td>
            <td class="text-center">${l.qte_existante_ecriture}</td>
            <td class="text-center" style="font-weight: bold;">${l.qte_constatee}</td>
            <td class="text-center" style="color: green;">${qteExcedent > 0 ? qteExcedent : ''}</td>
            <td class="text-center" style="color: red;">${qteDeficit > 0 ? qteDeficit : ''}</td>
            <td></td>
            <td class="text-right">${qteExcedent > 0 ? (qteExcedent * l.prix_unitaire).toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : ''}</td>
            <td class="text-right">${qteDeficit > 0 ? (qteDeficit * l.prix_unitaire).toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : ''}</td>
            <td class="text-right">${valDef}</td>
            <td class="text-right" style="font-weight: bold;">${valExis}</td>
            <td class="text-center">${l.etat_recensement || ''}</td>

        </tr>
        `;
    }).join('');

    // -------------------- Totaux --------------------
    const totalRow = `
        <tr style="background-color: #e0f0ff; font-weight: bold;">
            <td colspan="7" class="text-right">TOTAUX GÉNÉRAUX</td>
            <td></td>
            <td class="text-right"></td>
            <td></td>
            <td class="text-right">${montantTotalDeficits}</td>
            <td class="text-right" style="font-weight: bold;">${montantTotalExistants}</td>
            <td></td>
        </tr>
    `;

    // -------------------- Signature --------------------
    const signatureArea = `
        <div style="margin-top: 50px;">
            <p>Le présent Procès-Verbal comprend un total de ${pvData.lignes.length} lignes de biens et est établi en présence des parties prenantes.</p>
            <div style="display: flex; justify-content: space-between; margin-top: 30px;">
                <p><strong>Fait à [Lieu], le ${datePV}</strong></p>
                <p style="text-align: right; width: 30%;">Le Comptable Matières</p>
                <p style="text-align: right; width: 30%;">Le Responsable Comptable</p>
            </div>
        </div>
    `;

    return `
        <html>
            <head>${styleCss}</head>
            <body>
                <div class="header-pv">
                    <p style="text-align: center; margin-bottom: 20px;">
                        <span style="font-size: 8px;">Fitiavana - Tanindrazana - Fandrosoana</span>
                    </p>
                    <div style="font-size: 13px; font-weight: bold; margin-bottom: 5px;">${devise}</div>
                    <div style="font-size: 13px; margin-bottom: 10px;">EXERCICE : ${pvData.exercice}</div>
                    <div style="font-size: 10px; margin-bottom: 5px;">${soaAffichage}</div>
                    <div style="font-size: 10px; margin-bottom: 25px;">${chapitre}</div>
                    <div style="font-weight: bold; font-size: 11px; margin-bottom: 40px;">${serviceRegional}</div>
                    <h1 style="text-align: center; font-size: 20px; font-weight: bold; color: #000; margin-bottom: 50px;">PROCES-VERBAL DE RECENSEMENT</h1>
                    <p style="font-style: italic; font-size: 12px; margin-bottom: 5px;">Nom et qualité d'un agent recenseur:</p>
                    <p style="font-weight: bold; font-size: 13px; margin-left: 10px; margin-bottom: 25px;">${recenseurNomComplet}</p>
                    <p style="font-style: italic; font-size: 12px; margin-bottom: 5px;">Nom et qualité du comptable :</p>
                    <p style="font-weight: bold; font-size: 13px; margin-left: 10px; margin-bottom: 50px;">${comptableNomComplet}</p>
                </div>
                <div class="table-container">
                    <table class="pv-table">
                        ${tableHeader}
                        <tbody>
                            ${tableBody}
                            ${totalRow}
                        </tbody>
                    </table>
                    ${signatureArea}
                </div>
            </body>
        </html>
    `;
}

// -------------------- Générer le PDF --------------------
const generateRecensementPDF = async (recensementData) => {
    const htmlContent = generatePVHtml(recensementData);
    const fileName = `PV_Recensement_${recensementData.exercice}_${recensementData.id}.pdf`;

    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20mm', right: '10mm', bottom: '20mm', left: '10mm' }
    });

    await browser.close();
    return { fileName, pdfBuffer };
};

export default generateRecensementPDF;
