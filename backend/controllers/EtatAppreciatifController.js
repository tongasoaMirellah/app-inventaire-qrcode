/*import { Op } from 'sequelize';
import Bien from '../modeles/Bien.js';
import Entree from '../modeles/Entree.js';
import Sortie from '../modeles/Sortie.js';
import generateEtatAppreciatifPDF from '../utils/pdfEtatAppreciatifGenerator.js';

/* -------------------------------
   FONCTIONS DE VALORISATION
--------------------------------*
const calculateFlowValue = (transaction) => {
    if (!transaction.bien) return 0;
    const prixUnitaire = parseFloat(transaction.bien.prix_unitaire || 0);
    const valeurUtilisee = parseFloat(transaction.valeur || prixUnitaire);
    return parseFloat(transaction.quantite || 0) * valeurUtilisee;
};

/* -------------------------------
   MAIN FUNCTION
--------------------------------*
export async function getEtatAppreciatifDataByPeriod(dateDebut, dateFin, serviceId = null) {

    console.log("\n---------------- ÉTAT APPRÉCIATIF ----------------");
    console.log(`Période : ${dateDebut} → ${dateFin}`);

    const annee = new Date(dateFin).getFullYear();
    const effectiveServiceId =
        serviceId && serviceId !== "null" && serviceId !== "" ? serviceId : null;

    const serviceFilter = effectiveServiceId
        ? { service_id: effectiveServiceId }
        : { service_id: { [Op.not]: null } };

    const bienInclude = {
        model: Bien,
        as: "bien",
        attributes: ["designation", "nomenclature", "prix_unitaire", "code_bien"]
    };

    /* =======================================================
        1️⃣ SOLDE INITIAL (CORRIGÉ)
        Prélevé sur TOUS les biens du service.
       ======================================================= *

    const biensDuService = await Bien.findAll({
        where: serviceFilter,
        attributes: ["nomenclature", "quantite", "prix_unitaire", "designation"]
    });

    console.log("\n>>> CALCUL DU SOLDE INITIAL (TOUS LES BIENS)");
    const soldeInitialMap = new Map();
    let totalSoldeInitial = 0;

    for (const bien of biensDuService) {
        const nomenclature = bien.nomenclature || "AUTRE";
        const valeur = parseFloat(bien.quantite || 0) * parseFloat(bien.prix_unitaire || 0);

        soldeInitialMap.set(nomenclature, (soldeInitialMap.get(nomenclature) || 0) + valeur);
        totalSoldeInitial += valeur;

        console.log(
            ` - ${bien.designation} | Nomenc. ${nomenclature} | Qté ${bien.quantite} × PU ${bien.prix_unitaire} = ${valeur.toLocaleString()} Ar`
        );
    }

    console.log(`>>> TOTAL SOLDE INITIAL : ${totalSoldeInitial.toLocaleString()} Ar`);

    /* =======================================================
        2️⃣ FLUX DE LA PÉRIODE
       ======================================================= *

    const periodCondition = {
        date: { [Op.between]: [dateDebut, dateFin] },
        ...serviceFilter
    };

    const entrees = await Entree.findAll({ where: periodCondition, include: [bienInclude], order: [["date", "ASC"]] });
    const sorties = await Sortie.findAll({ where: periodCondition, include: [bienInclude], order: [["date", "ASC"]] });

    console.log("\n>>> FLUX : ENTRÉES & SORTIES");

    const periodFlowMap = new Map();
    soldeInitialMap.forEach((_v, nom) => periodFlowMap.set(nom, { entrees: 0, sorties: 0 }));

    let totalEntrees = 0;
    let totalSorties = 0;

    let allLignes = [];

    /* === ENTRÉES === *
    for (const entree of entrees) {
        const nomenclature = entree.bien.nomenclature || "AUTRE";
        const valeur = calculateFlowValue(entree);

        if (valeur === 0) continue;

        console.log(` Entrée: ${entree.bien.designation} | ${valeur.toLocaleString()} Ar`);

        totalEntrees += valeur;

        const flow = periodFlowMap.get(nomenclature) || { entrees: 0, sorties: 0 };
        flow.entrees += valeur;
        periodFlowMap.set(nomenclature, flow);

        allLignes.push({
            designation: `Entrée: ${entree.bien.designation}`,
            nomenclature_code: nomenclature,
            valeur_existants: valeur,
            valeur_deficits : 0,
            date_pv: entree.date,
            type: "charge",
            quantite: entree.quantite
        });
    }

    /* === SORTIES === *
    for (const sortie of sorties) {
        const nomenclature = sortie.bien.nomenclature || "AUTRE";
        const valeur = calculateFlowValue(sortie);

        if (valeur === 0) continue;

        console.log(` Sortie: ${sortie.bien.designation} | ${valeur.toLocaleString()} Ar`);

        totalSorties += valeur;

        const flow = periodFlowMap.get(nomenclature) || { entrees: 0, sorties: 0 };
        flow.sorties += valeur;
        periodFlowMap.set(nomenclature, flow);

        allLignes.push({
            designation: `Sortie: ${sortie.bien.designation}`,
            nomenclature_code: nomenclature,
            valeur_existants: 0,
            valeur_deficits: valeur,
            date_pv: sortie.date,
            type: "decharge",
            quantite: sortie.quantite
        });
    }

    console.log(`>>> TOTAL ENTRÉES : ${totalEntrees.toLocaleString()} Ar`);
    console.log(`>>> TOTAL SORTIES : ${totalSorties.toLocaleString()} Ar`);

    /* =======================================================
        3️⃣ SOLDE FINAL PHYSIQUE (STOCK ACTUEL)
       ======================================================= *
    const biensActuels = await Bien.findAll({ where: serviceFilter });

    console.log("\n>>> SOLDE FINAL PHYSIQUE (VALEUR ACTUELLE)");

    const stockFinalMap = new Map();
    let totalSoldeFinal = 0;

    for (const bien of biensActuels) {
        const nomenclature = bien.nomenclature || "AUTRE";
        const valeur = parseFloat(bien.quantite || 0) * parseFloat(bien.prix_unitaire || 0);

        stockFinalMap.set(nomenclature, (stockFinalMap.get(nomenclature) || 0) + valeur);
        totalSoldeFinal += valeur;

        console.log(
            ` - ${bien.designation} | Qté ${bien.quantite} × PU ${bien.prix_unitaire} = ${valeur.toLocaleString()} Ar`
        );
    }

    console.log(`>>> TOTAL SOLDE FINAL PHYSIQUE : ${totalSoldeFinal.toLocaleString()} Ar`);

    /* =======================================================
        4️⃣ RECALCUL PAR NOMENCLATURE
       ======================================================= *
    const allNomenclatures = new Set([
        ...soldeInitialMap.keys(),
        ...stockFinalMap.keys(),
        ...entrees.map(e => e.bien.nomenclature || "AUTRE"),
        ...sorties.map(s => s.bien.nomenclature || "AUTRE")
    ]);

    const recapitulatifParNomenclature = [];
    let totalEcart = 0;

    console.log("\n>>> RÉCAPITULATIF PAR NOMENCLATURE");

    for (const nom of allNomenclatures) {
        const solde_initial = soldeInitialMap.get(nom) || 0;
        const flow = periodFlowMap.get(nom) || { entrees: 0, sorties: 0 };
        const solde_final = stockFinalMap.get(nom) || 0;

        const solde_theorique = solde_initial + flow.entrees - flow.sorties;
        const ecart = solde_theorique - solde_final;
        totalEcart += ecart;

        console.log(
            `Nomenc ${nom} | SI ${solde_initial} | Ent ${flow.entrees} | Sort ${flow.sorties} | Théorique ${solde_theorique} | Final ${solde_final} | Écart ${ecart}`
        );

        recapitulatifParNomenclature.push({
            nomenclature_code: nom,
            solde_initial,
            valeur_entrees: flow.entrees,
            valeur_sorties: flow.sorties,
            solde_final_theorique: solde_theorique,
            solde_final,
            ecart_a_justifier: ecart
        });
    }

    allLignes.sort((a, b) => new Date(a.date_pv) - new Date(b.date_pv));

    return {
        exercice: annee,
        date_pv: new Date().toISOString().split("T")[0],
        total_solde_initial: totalSoldeInitial,
        total_entrees_periode: totalEntrees,
        total_sorties_periode: totalSorties,
        total_solde_theorique: totalSoldeInitial + totalEntrees - totalSorties,
        total_solde_final: totalSoldeFinal,
        total_ecart_a_justifier: totalEcart,
        Depositaire: { nom: "À REMPLACER", matricule: "IM-000000" },
        recapitulatifParNomenclature,
        lignes: allLignes
    };
}

/* =======================================================
   CONTROLLER API
======================================================= *
export const generateEtatAppreciatifPdfByPeriod = async (req, res) => {
    try {
        const { dateDebut, dateFin, serviceId } = req.body;
        if (!dateDebut || !dateFin)
            return res.status(400).json({ error: "dateDebut et dateFin requis." });

        const pvData = await getEtatAppreciatifDataByPeriod(dateDebut, dateFin, serviceId);
        const { pdfBuffer } = await generateEtatAppreciatifPDF(pvData);

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="Etat_Appreciatif_${dateDebut}_a_${dateFin}.pdf"`
        );

        res.status(200).send(pdfBuffer);
    } catch (err) {
        console.log("❌ ERREUR :", err);
        res.status(500).json({ error: "Erreur génération PDF", details: err.message });
    }
};
*/
/*import { Op } from 'sequelize';
import Bien from '../modeles/Bien.js';
import Entree from '../modeles/Entree.js';
import Sortie from '../modeles/Sortie.js';
import Nomenclature from '../modeles/Nomenclature.js'; // Import nécessaire
import generateEtatAppreciatifPDF from '../utils/pdfEtatAppreciatifGenerator.js';

/* -------------------------------
   FONCTIONS DE VALORISATION
--------------------------------*
const calculateFlowValue = (transaction) => {
    // Utilisez transaction.bien.prix_unitaire car nous récupérons Bien via include
    if (!transaction.bien) return 0;
    const prixUnitaire = parseFloat(transaction.bien.prix_unitaire || 0);
    const valeurUtilisee = parseFloat(transaction.valeur || prixUnitaire);
    return parseFloat(transaction.quantite || 0) * valeurUtilisee;
};

/* -------------------------------
   MAIN FUNCTION
--------------------------------*
export async function getEtatAppreciatifDataByPeriod(dateDebut, dateFin, serviceId = null) {

    console.log("\n---------------- ÉTAT APPRÉCIATIF ----------------");
    console.log(`Période : ${dateDebut} → ${dateFin}`);

    const annee = new Date(dateFin).getFullYear();
    const effectiveServiceId =
        serviceId && serviceId !== "null" && serviceId !== "" ? serviceId : null;

    // 🔴 CORRECTION POUR GÉRER L'INCOHÉRENCE DES NOMS DE COLONNES ENTRE LES TABLES
    // serviceId pour la table 'biens' (CamelCase)
    // service_id pour les tables 'entrees' et 'sorties' (Snake_case)

    // 1. Filtre pour la table BIENS (Solde Initial/Final)
    const serviceFilterBien = effectiveServiceId
        ? { serviceId: effectiveServiceId }
        : { serviceId: { [Op.not]: null } };

    // 2. Filtre pour les tables ENTREES et SORTIES (Flux de la Période)
    const serviceFilterFlux = effectiveServiceId
        ? { service_id: effectiveServiceId }
        : { service_id: { [Op.not]: null } };
    // -------------------------------------------------------------------------

    // Définition de l'inclusion de la nomenclature pour toutes les requêtes Bien
    const nomenclatureInclude = {
        model: Nomenclature,
        as: 'nomenclature',
        attributes: ['code'],
        required: false
    };

    const bienIncludeForFlows = {
        model: Bien,
        as: "bien",
        // CORRIGÉ : Retire "nomenclature" de la liste des attributs du Bien
        attributes: ["designation", "prix_unitaire", "code_bien"],
        include: [nomenclatureInclude] // Ajout de l'inclusion de la nomenclature
    };

    /* =======================================================
        1️⃣ SOLDE INITIAL (STOCK au début de période)
       ======================================================= *

    const biensDuService = await Bien.findAll({
        where: serviceFilterBien, // 👈 UTILISATION DU FILTRE CORRIGÉ
        // CORRECTION : Retire "nomenclature" et ajoute l'INCLUDE
        attributes: ["quantite", "prix_unitaire", "designation"],
        include: [nomenclatureInclude]
    });

    console.log("\n>>> CALCUL DU SOLDE INITIAL (TOUS LES BIENS)");
    const soldeInitialMap = new Map();
    let totalSoldeInitial = 0;

    for (const bien of biensDuService) {
        // CORRECTION : Accès à la propriété 'code' de l'objet inclus
        const nomenclature = bien.nomenclature ? bien.nomenclature.code : "AUTRE";
        const valeur = parseFloat(bien.quantite || 0) * parseFloat(bien.prix_unitaire || 0);

        soldeInitialMap.set(nomenclature, (soldeInitialMap.get(nomenclature) || 0) + valeur);
        totalSoldeInitial += valeur;

        console.log(
            ` - ${bien.designation} | Nomenc. ${nomenclature} | Qté ${bien.quantite} × PU ${bien.prix_unitaire} = ${valeur.toLocaleString()} Ar`
        );
    }

    console.log(`>>> TOTAL SOLDE INITIAL : ${totalSoldeInitial.toLocaleString()} Ar`);

    /* =======================================================
        2️⃣ FLUX DE LA PÉRIODE
       ======================================================= *

    const periodCondition = {
        date: { [Op.between]: [dateDebut, dateFin] },
        ...serviceFilterFlux // 👈 UTILISATION DU FILTRE CORRIGÉ
    };

    // Utilisation de l'objet d'inclusion corrigé
    const entrees = await Entree.findAll({ where: periodCondition, include: [bienIncludeForFlows], order: [["date", "ASC"]] });
    const sorties = await Sortie.findAll({ where: periodCondition, include: [bienIncludeForFlows], order: [["date", "ASC"]] });

    console.log("\n>>> FLUX : ENTRÉES & SORTIES");

    const periodFlowMap = new Map();
    soldeInitialMap.forEach((_v, nom) => periodFlowMap.set(nom, { entrees: 0, sorties: 0 }));

    let totalEntrees = 0;
    let totalSorties = 0;

    let allLignes = [];

    /* === ENTRÉES === *
    for (const entree of entrees) {
        // CORRECTION : Accès à la propriété 'code' de l'objet inclus
        const nomenclature = entree.bien.nomenclature ? entree.bien.nomenclature.code : "AUTRE";
        const valeur = calculateFlowValue(entree);

        if (valeur === 0) continue;

        console.log(` Entrée: ${entree.bien.designation} | ${valeur.toLocaleString()} Ar`);

        totalEntrees += valeur;

        const flow = periodFlowMap.get(nomenclature) || { entrees: 0, sorties: 0 };
        flow.entrees += valeur;
        periodFlowMap.set(nomenclature, flow);

        allLignes.push({
            designation: `Entrée: ${entree.bien.designation}`,
            nomenclature_code: nomenclature,
            valeur_existants: valeur,
            valeur_deficits: 0,
            date_pv: entree.date,
            type: "charge",
            quantite: entree.quantite
        });
    }

    /* === SORTIES === *
    for (const sortie of sorties) {
        // CORRECTION : Accès à la propriété 'code' de l'objet inclus
        const nomenclature = sortie.bien.nomenclature ? sortie.bien.nomenclature.code : "AUTRE";
        const valeur = calculateFlowValue(sortie);

        if (valeur === 0) continue;

        console.log(` Sortie: ${sortie.bien.designation} | ${valeur.toLocaleString()} Ar`);

        totalSorties += valeur;

        const flow = periodFlowMap.get(nomenclature) || { entrees: 0, sorties: 0 };
        flow.sorties += valeur;
        periodFlowMap.set(nomenclature, flow);

        allLignes.push({
            designation: `Sortie: ${sortie.bien.designation}`,
            nomenclature_code: nomenclature,
            valeur_existants: 0,
            valeur_deficits: valeur,
            date_pv: sortie.date,
            type: "decharge",
            quantite: sortie.quantite
        });
    }

    console.log(`>>> TOTAL ENTRÉES : ${totalEntrees.toLocaleString()} Ar`);
    console.log(`>>> TOTAL SORTIES : ${totalSorties.toLocaleString()} Ar`);

    /* =======================================================
        3️⃣ SOLDE FINAL PHYSIQUE (STOCK ACTUEL)
       ======================================================= *
    const biensActuels = await Bien.findAll({
        where: serviceFilterBien, // 👈 UTILISATION DU FILTRE CORRIGÉ
        // CORRECTION : Retire "nomenclature" et ajoute l'INCLUDE
        attributes: ["quantite", "prix_unitaire", "designation"],
        include: [nomenclatureInclude]
    });

    console.log("\n>>> SOLDE FINAL PHYSIQUE (VALEUR ACTUELLE)");

    const stockFinalMap = new Map();
    let totalSoldeFinal = 0;

    for (const bien of biensActuels) {
        // CORRECTION : Accès à la propriété 'code' de l'objet inclus
        const nomenclature = bien.nomenclature ? bien.nomenclature.code : "AUTRE";
        const valeur = parseFloat(bien.quantite || 0) * parseFloat(bien.prix_unitaire || 0);

        stockFinalMap.set(nomenclature, (stockFinalMap.get(nomenclature) || 0) + valeur);
        totalSoldeFinal += valeur;

        console.log(
            ` - ${bien.designation} | Nomenc. ${nomenclature} | Qté ${bien.quantite} × PU ${bien.prix_unitaire} = ${valeur.toLocaleString()} Ar`
        );
    }

    console.log(`>>> TOTAL SOLDE FINAL PHYSIQUE : ${totalSoldeFinal.toLocaleString()} Ar`);

    /* =======================================================
        4️⃣ RECALCUL PAR NOMENCLATURE
       ======================================================= *
    // La logique ici utilise maintenant les objets biens, entrées et sorties corrigés
    const allNomenclatures = new Set([
        ...soldeInitialMap.keys(),
        ...stockFinalMap.keys(),
        // Correction de l'accès à la nomenclature
        ...entrees.map(e => (e.bien && e.bien.nomenclature) ? e.bien.nomenclature.code : "AUTRE"),
        ...sorties.map(s => (s.bien && s.bien.nomenclature) ? s.bien.nomenclature.code : "AUTRE")
    ]);

    const recapitulatifParNomenclature = [];
    let totalEcart = 0;

    console.log("\n>>> RÉCAPITULATIF PAR NOMENCLATURE");

    for (const nom of allNomenclatures) {
        const solde_initial = soldeInitialMap.get(nom) || 0;
        const flow = periodFlowMap.get(nom) || { entrees: 0, sorties: 0 };
        const solde_final = stockFinalMap.get(nom) || 0;

        const solde_theorique = solde_initial + flow.entrees - flow.sorties;
        const ecart = solde_theorique - solde_final;
        totalEcart += ecart;

        console.log(
            `Nomenc ${nom} | SI ${solde_initial} | Ent ${flow.entrees} | Sort ${flow.sorties} | Théorique ${solde_theorique} | Final ${solde_final} | Écart ${ecart}`
        );

        recapitulatifParNomenclature.push({
            nomenclature_code: nom,
            solde_initial,
            valeur_entrees: flow.entrees,
            valeur_sorties: flow.sorties,
            solde_final_theorique: solde_theorique,
            solde_final,
            ecart_a_justifier: ecart
        });
    }

    allLignes.sort((a, b) => new Date(a.date_pv) - new Date(b.date_pv));

    return {
        exercice: annee,
        date_pv: new Date().toISOString().split("T")[0],
        total_solde_initial: totalSoldeInitial,
        total_entrees_periode: totalEntrees,
        total_sorties_periode: totalSorties,
        total_solde_theorique: totalSoldeInitial + totalEntrees - totalSorties,
        total_solde_final: totalSoldeFinal,
        total_ecart_a_justifier: totalEcart,
        Depositaire: { nom: "À REMPLACER", matricule: "IM-000000" },
        recapitulatifParNomenclature,
        lignes: allLignes
    };
}

/* =======================================================
   CONTROLLER API
======================================================= *
export const generateEtatAppreciatifPdfByPeriod = async (req, res) => {
    try {
        const { dateDebut, dateFin, serviceId } = req.body;
        if (!dateDebut || !dateFin)
            return res.status(400).json({ error: "dateDebut et dateFin requis." });

        const pvData = await getEtatAppreciatifDataByPeriod(dateDebut, dateFin, serviceId);
        const { pdfBuffer } = await generateEtatAppreciatifPDF(pvData);

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="Etat_Appreciatif_${dateDebut}_a_${dateFin}.pdf"`
        );

        res.status(200).send(pdfBuffer);
    } catch (err) {
        console.log("❌ ERREUR :", err);
        res.status(500).json({ error: "Erreur génération PDF", details: err.message });
    }
};*/import { Op } from 'sequelize';
import Affectation from '../modeles/Affectation.js';
import Bien from '../modeles/Bien.js';
import Entree from '../modeles/Entree.js';
import Sortie from '../modeles/Sortie.js';
import Nomenclature from '../modeles/Nomenclature.js';
import generateEtatAppreciatifPDF from '../utils/pdfEtatAppreciatifGenerator.js';

/* -------------------------------
   FONCTION DE CALCUL DES VALEURS
--------------------------------*/
const calculateFlowValue = (transaction, bien) => {
    if (!bien) return 0;
    const prixUnitaire = parseFloat(bien.prix_unitaire || 0);
    const valeurUtilisee = parseFloat(transaction.valeur || prixUnitaire);
    return parseFloat(transaction.quantite || 0) * valeurUtilisee;
};

/* -------------------------------
   FONCTION PRINCIPALE
--------------------------------*/
export async function getEtatAppreciatifDataByPeriod(dateDebut, dateFin, serviceId = null) {
    console.log("\n---------------- ÉTAT APPRÉCIATIF ----------------");
    console.log(`Période : ${dateDebut} → ${dateFin}`);

    const annee = new Date(dateFin).getFullYear();

    /* -------------------
       FILTRE DES AFFECTATIONS / ENTREES / SORTIES
    ------------------- */
    const affectationFilter = serviceId
        ? { serviceId }
        : { serviceId: { [Op.not]: null } };

    const entreeFilter = serviceId
        ? { service_id: serviceId }
        : { service_id: { [Op.not]: null } };

    const nomenclatureInclude = {
        model: Nomenclature,
        as: 'nomenclature',
        attributes: ['code'],
        required: false
    };

    const bienInclude = {
        model: Bien,
        as: 'bien',
        attributes: ['designation', 'prix_unitaire', 'code_bien'],
        include: [nomenclatureInclude]
    };

    /* =======================================================
        1️⃣ SOLDE INITIAL (STOCK AU DÉBUT DE PÉRIODE)
    ======================================================= */
    const affectationsInitiales = await Affectation.findAll({
        where: affectationFilter,
        include: [bienInclude]
    });

    const soldeInitialMap = new Map();
    let totalSoldeInitial = 0;

    for (const aff of affectationsInitiales) {
        const bien = aff.bien;
        if (!bien) continue;

        const nomenclature = bien.nomenclature?.code || "AUTRE";
        const quantite = Number(aff.quantite_affectee || 0);
        const valeur = quantite * Number(bien.prix_unitaire || 0);

        soldeInitialMap.set(nomenclature, (soldeInitialMap.get(nomenclature) || 0) + valeur);
        totalSoldeInitial += valeur;
    }

    /* =======================================================
        2️⃣ FLUX DE LA PÉRIODE (ENTRÉES / SORTIES)
    ======================================================= */
    const periodCondition = {
        date: { [Op.between]: [dateDebut, dateFin] },
        ...entreeFilter
    };

    const entrees = await Entree.findAll({
        where: periodCondition,
        include: [bienInclude],
        order: [['date', 'ASC']]
    });

    const sorties = await Sortie.findAll({
        where: periodCondition,
        include: [
            {
                model: Affectation,
                as: 'affectation',
                include: [bienInclude]
            }
        ],
        order: [['date', 'ASC']]
    });

    const periodFlowMap = new Map();
    soldeInitialMap.forEach((_v, nom) => periodFlowMap.set(nom, { entrees: 0, sorties: 0 }));

    let totalEntrees = 0;
    let totalSorties = 0;
    let allLignes = [];

    /* === ENTRÉES === */
    for (const entree of entrees) {
        const bien = entree.bien;
        if (!bien) continue;

        const nomenclature = bien.nomenclature?.code || "AUTRE";
        const valeur = calculateFlowValue(entree, bien);
        if (valeur === 0) continue;

        totalEntrees += valeur;

        const flow = periodFlowMap.get(nomenclature) || { entrees: 0, sorties: 0 };
        flow.entrees += valeur;
        periodFlowMap.set(nomenclature, flow);

        allLignes.push({
            designation: `Entrée: ${bien.designation}`,
            nomenclature_code: nomenclature,
            valeur_existants: valeur,
            valeur_deficits: 0,
            date_pv: entree.date,
            type: "charge",
            quantite: entree.quantite
        });
    }

    /* === SORTIES === */
    for (const sortie of sorties) {
        const aff = sortie.affectation;
        const bien = aff?.bien;
        if (!bien) continue;

        const nomenclature = bien.nomenclature?.code || "AUTRE";
        const valeur = (sortie.quantite || 0) * Number(bien.prix_unitaire || 0);
        if (valeur === 0) continue;

        totalSorties += valeur;

        const flow = periodFlowMap.get(nomenclature) || { entrees: 0, sorties: 0 };
        flow.sorties += valeur;
        periodFlowMap.set(nomenclature, flow);

        allLignes.push({
            designation: `Sortie: ${bien.designation}`,
            nomenclature_code: nomenclature,
            valeur_existants: 0,
            valeur_deficits: valeur,
            date_pv: sortie.date,
            type: "decharge",
            quantite: sortie.quantite
        });
    }

    /* =======================================================
        3️⃣ SOLDE FINAL PHYSIQUE (STOCK ACTUEL)
    ======================================================= */
    const affectationsFinales = await Affectation.findAll({
        where: affectationFilter,
        include: [bienInclude]
    });

    const stockFinalMap = new Map();
    let totalSoldeFinal = 0;

    for (const aff of affectationsFinales) {
        const bien = aff.bien;
        if (!bien) continue;

        const nomenclature = bien.nomenclature?.code || "AUTRE";
        const quantite = Number(aff.quantite_affectee || 0);
        const valeur = quantite * Number(bien.prix_unitaire || 0);

        stockFinalMap.set(nomenclature, (stockFinalMap.get(nomenclature) || 0) + valeur);
        totalSoldeFinal += valeur;
    }

    /* =======================================================
        4️⃣ RECALCUL PAR NOMENCLATURE
    ======================================================= */
    const allNomenclatures = new Set([
        ...soldeInitialMap.keys(),
        ...stockFinalMap.keys(),
        ...entrees.map(e => e.bien?.nomenclature?.code || "AUTRE"),
        ...sorties.map(s => s.affectation?.bien?.nomenclature?.code || "AUTRE")
    ]);

    const recapitulatifParNomenclature = [];
    let totalEcart = 0;

    for (const nom of allNomenclatures) {
        const solde_initial = soldeInitialMap.get(nom) || 0;
        const flow = periodFlowMap.get(nom) || { entrees: 0, sorties: 0 };
        const solde_final = stockFinalMap.get(nom) || 0;

        const solde_theorique = solde_initial + flow.entrees - flow.sorties;
        const ecart = solde_theorique - solde_final;
        totalEcart += ecart;

        recapitulatifParNomenclature.push({
            nomenclature_code: nom,
            solde_initial,
            valeur_entrees: flow.entrees,
            valeur_sorties: flow.sorties,
            solde_final_theorique: solde_theorique,
            solde_final,
            ecart_a_justifier: ecart
        });
    }

    allLignes.sort((a, b) => new Date(a.date_pv) - new Date(b.date_pv));

    return {
        exercice: annee,
        date_pv: new Date().toISOString().split("T")[0],
        total_solde_initial: totalSoldeInitial,
        total_entrees_periode: totalEntrees,
        total_sorties_periode: totalSorties,
        total_solde_theorique: totalSoldeInitial + totalEntrees - totalSorties,
        total_solde_final: totalSoldeFinal,
        total_ecart_a_justifier: totalEcart,
        Depositaire: { nom: "À REMPLACER", matricule: "IM-000000" },
        recapitulatifParNomenclature,
        lignes: allLignes
    };
}

/* =======================================================
   CONTROLLER API
======================================================= */
export const generateEtatAppreciatifPdfByPeriod = async (req, res) => {
    try {
        const { dateDebut, dateFin, serviceId } = req.body;
        if (!dateDebut || !dateFin) {
            return res.status(400).json({ error: "dateDebut et dateFin requis." });
        }

        const pvData = await getEtatAppreciatifDataByPeriod(dateDebut, dateFin, serviceId);
        const { pdfBuffer } = await generateEtatAppreciatifPDF(pvData);

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="Etat_Appreciatif_${dateDebut}_a_${dateFin}.pdf"`
        );
        res.status(200).send(pdfBuffer);
    } catch (err) {
        console.error("❌ ERREUR :", err);
        res.status(500).json({ error: "Erreur génération PDF", details: err.message });
    }
};
