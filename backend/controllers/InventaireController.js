/*import Inventaire from '../modeles/Inventaire.js';
import Bien from '../modeles/Bien.js';
import Sortie from '../modeles/Sortie.js';
import Entree from '../modeles/Entree.js';
import Service from '../modeles/Service.js';
import { generateInventairePDF } from '../utils/pdfGenerator.js';
import generateJournalOperationsPDF from '../utils/pdfEtatAppreciatifGenerator.js';
import path from 'path';
import fs from 'fs';
import { Op } from 'sequelize';

// ... (Définition de UPLOAD_DIR et fs.mkdirSync)
const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'inventaires');

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

export const genererInventaire = async (req, res) => {
  try {
    const { periode_debut, periode_fin, serviceId } = req.body;
    if (!periode_debut || !periode_fin) return res.status(400).json({ message: 'période_debut et période_fin requis' });

    const dateDebut = new Date(periode_debut);
    const dateFin = new Date(periode_fin);
    const whereBien = serviceId ? { serviceId } : {};

    const biens = await Bien.findAll({
      where: whereBien,
      // 🛑 CORRECTION 1 : Remplacer 'valeur' par 'prix_unitaire'
      attributes: ['id', 'code_bien', 'designation', 'nomenclatureId', 'prix_unitaire', 'quantite', 'date_acquisition'],
      include: [{ model: Sortie, as: 'sorties', attributes: ['date', 'quantite'], required: false }]
    });

    const rows = [];
    let valeurTotale = 0;

    for (const bien of biens) {
      // STOCK FINAL ACTUEL (Le Reste)
      const stockFinalActuel = bien.quantite || 0;

      // --- 1. CALCUL DES FLUX DANS LA PÉRIODE (Entrées et Sorties) ---

      const totalSortiePeriode = await Sortie.sum('quantite', {
        where: { bien_id: bien.id, date: { [Op.between]: [dateDebut, dateFin] } }
      }) || 0;

      const totalEntreePeriode = await Entree.sum('quantite', {
        where: { bien_id: bien.id, date: { [Op.between]: [dateDebut, dateFin] } }
      }) || 0;

      // --- 2. LE CALCUL CLÉ DU STOCK INITIAL (Existant au début de la période) ---
      // Initial = Final - Entrées (Période) + Sorties (Période)
      const quantite_existante = stockFinalActuel - totalEntreePeriode + totalSortiePeriode;

      const quantite_reste = stockFinalActuel; // Le Reste dans le rapport est le Stock Final Actuel

      // 🛑 CORRECTION 2 : Utiliser bien.prix_unitaire pour le calcul
      const valeur = quantite_reste * (bien.prix_unitaire || 0);

      rows.push({
        code_bien: bien.code_bien || '',
        designation: bien.designation || '',
        nomenclatureId: bien.nomenclatureId || '',

        quantite_existante, // Stock Initial (Calculé)
        quantite_entree: totalEntreePeriode, // Entrées (Sommé)
        quantite_sortie: totalSortiePeriode, // Sorties (Sommé)
        quantite_reste, // Stock Final (Lu du Bien)

        // 🛑 CORRECTION 3 : Utiliser bien.prix_unitaire
        prix_unitaire: bien.prix_unitaire || 0,
        valeur,
        date_acquisition: bien.date_acquisition,
        sorties: bien.sorties,
      });

      valeurTotale += valeur;
    }

    // ... (Le reste de votre code pour PDF et enregistrement d'inventaire) ...
    const service = serviceId ? await Service.findByPk(serviceId) : null;
    const serviceName = service ? (service.nom || service.name || `Service_${service.id}`) : 'Tous_services';
    const dateGen = new Date().toISOString().slice(0, 10);
    const filename = `inventaire_${serviceName}_${dateGen}.pdf`.replace(/\s+/g, '_');
    const outPath = path.join(UPLOAD_DIR, filename);

    const pdfResult = await generateInventairePDF(rows, {
      serviceName,
      periode_debut,
      periode_fin,
      date_generation: dateGen,
      outPath
    });

    // Écriture du fichier PDF
    if (pdfResult.pdfBuffer) {
      fs.writeFileSync(outPath, pdfResult.pdfBuffer);
    }

    const inventaire = await Inventaire.create({
      periode_debut,
      periode_fin,
      serviceId: serviceId || null,
      fichier_pdf: outPath,
      valeur_totale: pdfResult.valeurTotale || valeurTotale,
      nb_biens: rows.length,
      meta: { rowsCount: rows.length }
    });

    return res.status(201).json({ message: 'Inventaire généré', inventaire });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur génération inventaire', error: err.message });
  }
};

/**
 * Génère le Journal des Opérations (État Appréciatif détaillé) pour une période donnée.
 *
export const genererJournalOperations = async (req, res) => {
  try {
    const { periode_debut, periode_fin, serviceId } = req.body;
    if (!periode_debut || !periode_fin) return res.status(400).json({ message: 'période_debut et période_fin requis' });

    const dateDebut = new Date(periode_debut);
    const dateFin = new Date(periode_fin);
    const wherePeriod = { date: { [Op.between]: [dateDebut, dateFin] } };

    // 1. Fetch all entries and exits in the period
    const entres = await Entree.findAll({
      where: wherePeriod,
      // 🛑 CORRECTION 4 : Remplacer 'valeur' par 'prix_unitaire'
      include: [{ model: Bien, attributes: ['nomenclatureId', 'designation', 'prix_unitaire'] }],
      attributes: ['date', 'quantite', 'justification', 'valeur'] // Valeur unitaire de l'entrée/sortie
    });

    const sorties = await Sortie.findAll({
      where: wherePeriod,
      // 🛑 CORRECTION 5 : Remplacer 'valeur' par 'prix_unitaire'
      include: [{ model: Bien, attributes: ['nomenclatureId', 'designation', 'prix_unitaire'] }],
      attributes: ['date', 'quantite', 'justification', 'valeur'] // Valeur unitaire de l'entrée/sortie
    });

    // 2. Aggregate data into journalRows format expected by PDF generator
    const allMovements = [
      ...entres.map(e => ({
        type: 'entree',
        date: e.date,
        justification: `Entrée: ${e.justification} (${e.Bien.designation})`,
        quantite: e.quantite,
        // 🛑 CORRECTION 6 : Utiliser e.Bien.prix_unitaire
        valeur_unitaire: e.valeur || e.Bien.prix_unitaire || 0,
        nomenclatureId: e.Bien.nomenclatureId,
      })),
      ...sorties.map(s => ({
        type: 'sortie',
        date: s.date,
        justification: `Sortie: ${s.justification} (${s.Bien.designation})`,
        quantite: s.quantite,
        // 🛑 CORRECTION 7 : Utiliser s.Bien.prix_unitaire
        valeur_unitaire: s.valeur || s.Bien.prix_unitaire || 0,
        nomenclatureId: s.Bien.nomenclatureId,
      }))
    ].sort((a, b) => new Date(a.date) - new Date(b.date)); // Sort by date

    const nomenclatures = [...new Set(allMovements.map(m => m.nomenclature))].sort();

    // Grouping movements by date/justification (assuming one line per entry/exit document)
    const journalMap = new Map();
    allMovements.forEach(m => {
      // Clé pour regrouper par date et justification (un document = une ligne de journal)
      const key = `${m.date}-${m.justification}`;

      if (!journalMap.has(key)) {
        journalMap.set(key, {
          date: m.date,
          justification: m.justification,
          operations: {}
        });
      }
      const row = journalMap.get(key);
      const value = m.quantite * m.valeur_unitaire; // Valeur totale du mouvement (Quantité * Valeur unitaire)

      // Initialiser l'opération si elle n'existe pas pour cette nomenclature
      if (!row.operations[m.nomenclatureId]) {
        row.operations[m.nomenclatureId] = { charge: 0, decharge: 0 };
      }

      // Cumuler les charges/décharges par nomenclature pour cette ligne de journal
      if (m.type === 'entree') {
        row.operations[m.nomenclatureId].charge += value;
      } else {
        row.operations[m.nomenclatureId].decharge += value;
      }
    });

    const journalRows = Array.from(journalMap.values());

    // Calculer la valeur totale générale (Charge)
    const totalChargeGeneral = journalRows.reduce((sum, row) => sum + Object.values(row.operations).reduce((s, op) => s + op.charge, 0), 0);

    // 3. Generate PDF
    const service = service_id ? await Service.findByPk(service_id) : null;
    const serviceName = service ? (service.nom || service.name || `Service_${service.id}`) : 'Tous_services';

    const pdfResult = await generateJournalOperationsPDF(journalRows, nomenclatures, {
      serviceName,
      periode_debut,
      periode_fin,
    });

    const dateGen = new Date().toISOString().slice(0, 10);
    const filename = `journal_operations_${serviceName}_${dateGen}.pdf`.replace(/\s+/g, '_');
    const outPath = path.join(UPLOAD_DIR, filename);

    // Save PDF buffer to file system
    fs.writeFileSync(outPath, pdfResult.pdfBuffer);

    // 4. Save Inventaire (as a Journal type report)
    const inventaire = await Inventaire.create({
      periode_debut,
      periode_fin,
      serviceId: serviceId || null,
      fichier_pdf: outPath,
      nb_biens: allMovements.length, // Nombre total de lignes de mouvement
      valeur_totale: totalChargeGeneral,
      meta: {
        rowsCount: journalRows.length,
        type_report: 'Journal_Operations'
      }
    });

    return res.status(201).json({ message: 'Journal des Opérations généré', inventaire });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur génération Journal des Opérations', error: err.message });
  }
};

export const getHistorique = async (req, res) => {
  try {
    const inventaires = await Inventaire.findAll({
      order: [['date_generation', 'DESC']],
      include: [{ model: Service, as: 'service' }]
    });
    res.json(inventaires);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur historique', error: err.message });
  }
};






export const downloadPDF = async (req, res) => {
  try {
    const id = req.params.id;
    const inventaire = await Inventaire.findByPk(id);
    if (!inventaire || !inventaire.fichier_pdf) return res.status(404).json({ message: 'Fichier introuvable' });
    res.download(inventaire.fichier_pdf);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur téléchargement', error: err.message });
  }
};*/
/*
import Inventaire from '../modeles/Inventaire.js';
import Bien from '../modeles/Bien.js';
import Sortie from '../modeles/Sortie.js';
import Entree from '../modeles/Entree.js'; // 🛑 Assurez-vous que Entree est correctement importé
import Service from '../modeles/Service.js';
import Nomenclature from '../modeles/Nomenclature.js'; // 🛑 Nécessaire pour l'inclusion
import { generateInventairePDF } from '../utils/pdfGenerator.js';
import generateJournalOperationsPDF from '../utils/pdfEtatAppreciatifGenerator.js';
import path from 'path';
import fs from 'fs';
import { Op } from 'sequelize';

// --- CONFIGURATION ---
const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'inventaires');

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });


/**
 * Génère le rapport d'inventaire complet pour une période donnée.
 *
export const genererInventaire = async (req, res) => {
    try {
        const { periode_debut, periode_fin, serviceId } = req.body;
        if (!periode_debut || !periode_fin) return res.status(400).json({ message: 'période_debut et période_fin requis' });

        const dateDebut = new Date(periode_debut);
        const dateFin = new Date(periode_fin);
        const whereBien = serviceId ? { serviceId } : {};

        // 1. Récupération des biens avec les relations nécessaires
        const biens = await Bien.findAll({
            where: whereBien,
            attributes: ['id', 'code_bien', 'designation', 'prix_unitaire', 'quantite', 'date_acquisition'],
            include: [
                // 🛑 CORRECTION MAJEURE : Inclusion de la nomenclature pour obtenir son code
                { 
                    model: Nomenclature, 
                    as: 'nomenclature', // Alias défini dans index.js
                    attributes: ['code'], 
                    required: false 
                },
                { 
                    model: Sortie, 
                    as: 'sorties', 
                    attributes: ['date', 'quantite'], 
                    required: false 
                }
            ]
        });

        const rows = [];
        let valeurTotale = 0;

        for (const bien of biens) {
            const stockFinalActuel = bien.quantite || 0;

            // --- 1. CALCUL DES FLUX DANS LA PÉRIODE (Entrées et Sorties) ---

            const totalSortiePeriode = await Sortie.sum('quantite', {
                where: { bien_id: bien.id, date: { [Op.between]: [dateDebut, dateFin] } }
            }) || 0;

            const totalEntreePeriode = await Entree.sum('quantite', {
                where: { bien_id: bien.id, date: { [Op.between]: [dateDebut, dateFin] } }
            }) || 0;

            // --- 2. LE CALCUL CLÉ DU STOCK INITIAL (Existant au début de la période) ---
            // Initial = Final - Entrées (Période) + Sorties (Période)
            const quantite_existante = stockFinalActuel - totalEntreePeriode + totalSortiePeriode;

            const quantite_reste = stockFinalActuel; // Le Reste dans le rapport est le Stock Final Actuel

            const valeur = quantite_reste * (bien.prix_unitaire || 0);

            rows.push({
                code_bien: bien.code_bien || '',
                designation: bien.designation || '',
                // 🛑 CORRECTION : Lecture du code à partir de la relation incluse
                nomenclature: bien.nomenclature ? bien.nomenclature.code : '', 

                quantite_existante, // Stock Initial (Calculé)
                quantite_entree: totalEntreePeriode, // Entrées (Sommé)
                quantite_sortie: totalSortiePeriode, // Sorties (Sommé)
                quantite_reste, // Stock Final (Lu du Bien)

                prix_unitaire: bien.prix_unitaire || 0,
                valeur,
                date_acquisition: bien.date_acquisition,
                sorties: bien.sorties,
            });

            valeurTotale += valeur;
        }

        // 3. Préparation et génération du PDF
        const service = serviceId ? await Service.findByPk(serviceId) : null;
        const serviceName = service ? (service.nom || service.name || `Service_${service.id}`) : 'Tous_services';
        const dateGen = new Date().toISOString().slice(0, 10);
        const filename = `inventaire_${serviceName}_${dateGen}.pdf`.replace(/\s+/g, '_');
        const outPath = path.join(UPLOAD_DIR, filename);

        const pdfResult = await generateInventairePDF(rows, {
            serviceName,
            periode_debut,
            periode_fin,
            date_generation: dateGen,
            outPath
        });

        // Écriture du fichier PDF
        // NOTE: Si generateInventairePDF utilise puppeteer, il sauvegarde déjà le fichier à outPath.
        // Si la fonction retourne un buffer, il faut l'écrire comme ci-dessous.
        // if (pdfResult.pdfBuffer) {
        //   fs.writeFileSync(outPath, pdfResult.pdfBuffer);
        // }

        // 4. Enregistrement de l'inventaire dans la base de données
        const inventaire = await Inventaire.create({
            periode_debut,
            periode_fin,
            serviceId: serviceId || null,
            fichier_pdf: outPath,
            valeur_totale: pdfResult.valeurTotale || valeurTotale,
            nb_biens: rows.length,
            meta: { rowsCount: rows.length }
        });

        return res.status(201).json({ message: 'Inventaire généré', inventaire });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Erreur génération inventaire', error: err.message });
    }
};

/**
 * Génère le Journal des Opérations (État Appréciatif détaillé) pour une période donnée.
 *
export const genererJournalOperations = async (req, res) => {
    try {
        const { periode_debut, periode_fin, serviceId } = req.body;
        if (!periode_debut || !periode_fin) return res.status(400).json({ message: 'période_debut et période_fin requis' });

        const dateDebut = new Date(periode_debut);
        const dateFin = new Date(periode_fin);
        const wherePeriod = { date: { [Op.between]: [dateDebut, dateFin] } };
        // const whereBien = serviceId ? { serviceId } : {}; // Non utilisé ici pour le moment

        // 1. Fetch all entries and exits in the period
        const entres = await Entree.findAll({
            where: wherePeriod,
            include: [
                { 
                    model: Bien, 
                    attributes: ['designation', 'prix_unitaire'],
                    // 🛑 AJOUT : Inclusion de la nomenclature pour le journal
                    include: [{ model: Nomenclature, as: 'nomenclature', attributes: ['code'] }]
                }
            ],
            attributes: ['date', 'quantite', 'justification', 'valeur'] 
        });

        const sorties = await Sortie.findAll({
            where: wherePeriod,
            include: [
                { 
                    model: Bien, 
                    attributes: ['designation', 'prix_unitaire'],
                    // 🛑 AJOUT : Inclusion de la nomenclature pour le journal
                    include: [{ model: Nomenclature, as: 'nomenclature', attributes: ['code'] }]
                }
            ],
            attributes: ['date', 'quantite', 'justification', 'valeur'] 
        });

        // 2. Aggregate data into journalRows format expected by PDF generator
        const allMovements = [
            ...entres.map(e => ({
                type: 'entree',
                date: e.date,
                justification: `Entrée: ${e.justification} (${e.Bien.designation})`,
                quantite: e.quantite,
                // Utilisation de la valeur de l'entrée ou du prix unitaire du bien
                valeur_unitaire: e.valeur || e.Bien.prix_unitaire || 0,
                // 🛑 CORRECTION : Lecture du code de nomenclature
                nomenclature: e.Bien.nomenclature ? e.Bien.nomenclature.code : '00', 
            })),
            ...sorties.map(s => ({
                type: 'sortie',
                date: s.date,
                justification: `Sortie: ${s.justification} (${s.Bien.designation})`,
                quantite: s.quantite,
                // Utilisation de la valeur de la sortie ou du prix unitaire du bien
                valeur_unitaire: s.valeur || s.Bien.prix_unitaire || 0,
                // 🛑 CORRECTION : Lecture du code de nomenclature
                nomenclature: s.Bien.nomenclature ? s.Bien.nomenclature.code : '00',
            }))
        ].sort((a, b) => new Date(a.date) - new Date(b.date)); // Sort by date

        const nomenclatures = [...new Set(allMovements.map(m => m.nomenclature))].sort();

        // Grouping movements by date/justification (assuming one line per entry/exit document)
        const journalMap = new Map();
        allMovements.forEach(m => {
            // Clé pour regrouper par date et justification (un document = une ligne de journal)
            const key = `${m.date}-${m.justification}`;

            if (!journalMap.has(key)) {
                journalMap.set(key, {
                    date: m.date,
                    justification: m.justification,
                    operations: {}
                });
            }
            const row = journalMap.get(key);
            const value = m.quantite * m.valeur_unitaire; // Valeur totale du mouvement (Quantité * Valeur unitaire)

            // Initialiser l'opération si elle n'existe pas pour cette nomenclature
            if (!row.operations[m.nomenclature]) {
                row.operations[m.nomenclature] = { charge: 0, decharge: 0 };
            }

            // Cumuler les charges/décharges par nomenclature pour cette ligne de journal
            if (m.type === 'entree') {
                row.operations[m.nomenclature].charge += value;
            } else {
                row.operations[m.nomenclature].decharge += value;
            }
        });

        const journalRows = Array.from(journalMap.values());

        // Calculer la valeur totale générale (Charge)
        const totalChargeGeneral = journalRows.reduce((sum, row) => sum + Object.values(row.operations).reduce((s, op) => s + op.charge, 0), 0);

        // 3. Generate PDF
        // 🛑 NOTE : service_id n'est pas défini ici. Utiliser serviceId
        const service = serviceId ? await Service.findByPk(serviceId) : null; 
        const serviceName = service ? (service.nom || service.name || `Service_${service.id}`) : 'Tous_services';

        const dateGen = new Date().toISOString().slice(0, 10);
        const filename = `journal_operations_${serviceName}_${dateGen}.pdf`.replace(/\s+/g, '_');
        const outPath = path.join(UPLOAD_DIR, filename);

        const pdfResult = await generateJournalOperationsPDF(journalRows, nomenclatures, {
            serviceName,
            periode_debut,
            periode_fin,
            outPath, // Ajouter outPath si le generator sauvegarde lui-même
        });

        // Save PDF buffer to file system (si le generator retourne un buffer)
        // fs.writeFileSync(outPath, pdfResult.pdfBuffer); 

        // 4. Save Inventaire (as a Journal type report)
        const inventaire = await Inventaire.create({
            periode_debut,
            periode_fin,
            serviceId: serviceId || null,
            fichier_pdf: outPath,
            nb_biens: allMovements.length, // Nombre total de lignes de mouvement
            valeur_totale: totalChargeGeneral,
            meta: {
                rowsCount: journalRows.length,
                type_report: 'Journal_Operations'
            }
        });

        return res.status(201).json({ message: 'Journal des Opérations généré', inventaire });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Erreur génération Journal des Opérations', error: err.message });
    }
};

/**
 * Récupère l'historique des inventaires générés.
 *
export const getHistorique = async (req, res) => {
    try {
        const inventaires = await Inventaire.findAll({
            order: [['date_generation', 'DESC']],
            include: [{ model: Service, as: 'service' }]
        });
        res.json(inventaires);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erreur historique', error: err.message });
    }
};

/**
 * Permet de télécharger un PDF d'inventaire spécifique.
 *
export const downloadPDF = async (req, res) => {
    try {
        const id = req.params.id;
        const inventaire = await Inventaire.findByPk(id);
        if (!inventaire || !inventaire.fichier_pdf) return res.status(404).json({ message: 'Fichier introuvable' });
        
        // Vérification de l'existence du fichier sur le disque
        if (!fs.existsSync(inventaire.fichier_pdf)) {
             return res.status(404).json({ message: 'Fichier PDF non trouvé sur le serveur.' });
        }
        
        res.download(inventaire.fichier_pdf);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erreur téléchargement', error: err.message });
    }
};*//*
import Inventaire from '../modeles/Inventaire.js';
import Bien from '../modeles/Bien.js';
import Sortie from '../modeles/Sortie.js';
import Entree from '../modeles/Entree.js';
import Service from '../modeles/Service.js';
import Nomenclature from '../modeles/Nomenclature.js';
import { generateInventairePDF } from '../utils/pdfGenerator.js';
import generateJournalOperationsPDF from '../utils/pdfEtatAppreciatifGenerator.js';
import path from 'path';
import fs from 'fs';
import { Op } from 'sequelize';

// --- CONFIGURATION ---
const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'inventaires');

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });


/**
 * Génère le rapport d'inventaire complet pour une période annuelle.
 * Nécessite uniquement la periode_fin (ex: 31/12/2025). La période de début (01/01/2025)
 * est déterminée automatiquement.
 *
export const genererInventaire = async (req, res) => {
  try {
    // Suppression de raw_periode_debut de req.body
    const { periode_fin, serviceId } = req.body;

    if (!periode_fin) {
      return res.status(400).json({ message: 'période_fin requis pour la génération de l\'inventaire (ex: 31/12/2025).' });
    }

    const dateFin = new Date(periode_fin);

    // Détermination automatique de la période de début (01/01 de l'année de fin)
    const year = dateFin.getFullYear();
    const dateDebut = new Date(`${year}-01-01`);

    // Formatage pour l'enregistrement et le PDF
    const periodeDebutFinal = dateDebut.toISOString().slice(0, 10);
    const periodeFinFinal = dateFin.toISOString().slice(0, 10);

    const whereBien = {
      statut: 'ACTIF',
      ...(serviceId && { serviceId })
    };


    // 1. Récupération de TOUS les biens existants (dans le service ou tous)
    const biens = await Bien.findAll({
      where: whereBien,
      attributes: ['id', 'code_bien', 'designation', 'prix_unitaire', 'quantite', 'date_acquisition'],
      include: [
        {
          model: Nomenclature,
          as: 'nomenclature',
          attributes: ['code'],
          required: false
        },
        {
          model: Sortie,
          as: 'sorties', // Inclusion pour les détails si nécessaire, mais non utilisée dans les calculs de flux ici
          attributes: ['date', 'quantite'],
          required: false
        }
      ]
    });

    const rows = [];
    let valeurTotale = 0;

    for (const bien of biens) {

      // --- 0. Ajustement du stock actuel (DB) à la date de fin de période (31/12/N) ---
      // On remonte le stock actuel (quantite) à ce qu'il était A LA DATE DE FIN

      // Mouvements APRES la date de fin (pour corriger le stock DB au stock à dateFin)
      const totalSortieApresPeriode = await Sortie.sum('quantite', {
        where: { bien_id: bien.id, date: { [Op.gt]: dateFin } }
      }) || 0;

      const totalEntreeApresPeriode = await Entree.sum('quantite', {
        where: { bien_id: bien.id, date: { [Op.gt]: dateFin } }
      }) || 0;

      // STOCK FINAL DU RAPPORT (quantité existante au 31/12/N)
      // Stock à dateFin = Stock Actuel (DB) - Entrées (Après) + Sorties (Après)
      const quantite_reste_a_date_fin = (bien.quantite || 0) - totalEntreeApresPeriode + totalSortieApresPeriode;

      // Filtre : Exclure les biens qui n'existent plus à la date de clôture
      if (quantite_reste_a_date_fin <= 0) {
        continue;
      }

      // --- 1. CALCUL DES FLUX DANS LA PÉRIODE (Ex: du 01/01/N au 31/12/N) ---

      const totalSortiePeriode = await Sortie.sum('quantite', {
        where: { bien_id: bien.id, date: { [Op.between]: [dateDebut, dateFin] } }
      }) || 0;

      const totalEntreePeriode = await Entree.sum('quantite', {
        where: { bien_id: bien.id, date: { [Op.between]: [dateDebut, dateFin] } }
      }) || 0;

      // --- 2. CALCUL DU STOCK INITIAL (au 01/01/N) ---
      // Stock Initial = Stock Final - Entrées (Période) + Sorties (Période)
      const quantite_existante = quantite_reste_a_date_fin - totalEntreePeriode + totalSortiePeriode;

      const quantite_reste = quantite_reste_a_date_fin;

      const valeur = quantite_reste * (bien.prix_unitaire || 0);

      rows.push({
        code_bien: bien.code_bien || '',
        designation: bien.designation || '',
        nomenclature: bien.nomenclature ? bien.nomenclature.code : '00',

        quantite_existante, // Stock Initial (Calculé - Solde au 31/12/(N-1))
        quantite_entree: totalEntreePeriode, // Entrées de l'année N
        quantite_sortie: totalSortiePeriode, // Sorties de l'année N
        quantite_reste, // Stock Final (au 31/12/N)

        prix_unitaire: bien.prix_unitaire || 0,
        valeur,
        date_acquisition: bien.date_acquisition,
        sorties: bien.sorties,
      });

      valeurTotale += valeur;
    }

    // 3. Préparation et génération du PDF
    const service = serviceId ? await Service.findByPk(serviceId) : null;
    const serviceName = service ? (service.nom || service.name || `Service_${service.id}`) : 'Tous_services';
    const dateGen = new Date().toISOString().slice(0, 10);
    const filename = `inventaire_${serviceName}_${dateGen}.pdf`.replace(/\s+/g, '_');
    const outPath = path.join(UPLOAD_DIR, filename);

    const pdfResult = await generateInventairePDF(rows, {
      serviceName,
      periode_debut: periodeDebutFinal,
      periode_fin: periodeFinFinal,
      date_generation: dateGen,
      outPath
    });

    // 4. Enregistrement de l'inventaire dans la base de données
    const inventaire = await Inventaire.create({
      periode_debut: periodeDebutFinal,
      periode_fin: periodeFinFinal,
      serviceId: serviceId || null,
      fichier_pdf: outPath,
      valeur_totale: pdfResult.valeurTotale || valeurTotale,
      nb_biens: rows.length,
      meta: { rowsCount: rows.length }
    });

    return res.status(201).json({ message: 'Inventaire généré', inventaire });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur génération inventaire', error: err.message });
  }
};

/**
 * Génère le Journal des Opérations (État Appréciatif détaillé) pour une période donnée.
 * Note : Ce rapport nécessite toujours periode_debut et periode_fin pour couvrir 
 * toute période souhaitée (pas nécessairement annuelle).
 *
export const genererJournalOperations = async (req, res) => {
  try {
    const { periode_debut, periode_fin, serviceId } = req.body;
    if (!periode_debut || !periode_fin) return res.status(400).json({ message: 'période_debut et période_fin requis pour le Journal des Opérations' });

    const dateDebut = new Date(periode_debut);
    const dateFin = new Date(periode_fin);
    const wherePeriod = { date: { [Op.between]: [dateDebut, dateFin] } };

    // 1. Fetch all entries and exits in the period
    const entres = await Entree.findAll({
      where: wherePeriod,
      include: [
        {
          model: Bien,
          attributes: ['designation', 'prix_unitaire'],
          include: [{ model: Nomenclature, as: 'nomenclature', attributes: ['code'] }]
        }
      ],
      attributes: ['date', 'quantite', 'justification', 'valeur', 'bien_id']
    });

    const sorties = await Sortie.findAll({
      where: wherePeriod,
      include: [
        {
          model: Bien,
          attributes: ['designation', 'prix_unitaire'],
          include: [{ model: Nomenclature, as: 'nomenclature', attributes: ['code'] }]
        }
      ],
      attributes: ['date', 'quantite', 'justification', 'valeur', 'bien_id']
    });

    // 2. Aggregate data into journalRows format expected by PDF generator
    const allMovements = [
      ...entres.map(e => ({
        type: 'entree',
        date: e.date,
        justification: `Entrée: ${e.justification} (${e.Bien.designation})`,
        quantite: e.quantite,
        valeur_unitaire: e.valeur || e.Bien.prix_unitaire || 0,
        nomenclature: e.Bien.nomenclature ? e.Bien.nomenclature.code : '00',
      })),
      ...sorties.map(s => ({
        type: 'sortie',
        date: s.date,
        justification: `Sortie: ${s.justification} (${s.Bien.designation})`,
        quantite: s.quantite,
        valeur_unitaire: s.valeur || s.Bien.prix_unitaire || 0,
        nomenclature: s.Bien.nomenclature ? s.Bien.nomenclature.code : '00',
      }))
    ].sort((a, b) => new Date(a.date) - new Date(b.date)); // Sort by date

    const nomenclatures = [...new Set(allMovements.map(m => m.nomenclature))].sort();

    // Grouping movements by date/justification 
    const journalMap = new Map();
    allMovements.forEach(m => {
      const key = `${m.date}-${m.justification}`;

      if (!journalMap.has(key)) {
        journalMap.set(key, {
          date: m.date,
          justification: m.justification,
          operations: {}
        });
      }
      const row = journalMap.get(key);
      const value = m.quantite * m.valeur_unitaire;

      if (!row.operations[m.nomenclature]) {
        row.operations[m.nomenclature] = { charge: 0, decharge: 0 };
      }

      if (m.type === 'entree') {
        row.operations[m.nomenclature].charge += value;
      } else {
        row.operations[m.nomenclature].decharge += value;
      }
    });

    const journalRows = Array.from(journalMap.values());

    // Calculer la valeur totale générale (Charge)
    const totalChargeGeneral = journalRows.reduce((sum, row) => sum + Object.values(row.operations).reduce((s, op) => s + op.charge, 0), 0);

    // 3. Generate PDF
    const service = serviceId ? await Service.findByPk(serviceId) : null;
    const serviceName = service ? (service.nom || service.name || `Service_${service.id}`) : 'Tous_services';

    const dateGen = new Date().toISOString().slice(0, 10);
    const filename = `journal_operations_${serviceName}_${dateGen}.pdf`.replace(/\s+/g, '_');
    const outPath = path.join(UPLOAD_DIR, filename);

    const pdfResult = await generateJournalOperationsPDF(journalRows, nomenclatures, {
      serviceName,
      periode_debut,
      periode_fin,
      outPath,
    });

    // 4. Save Inventaire (as a Journal type report)
    const inventaire = await Inventaire.create({
      periode_debut,
      periode_fin,
      serviceId: serviceId || null,
      fichier_pdf: outPath,
      nb_biens: allMovements.length,
      valeur_totale: totalChargeGeneral,
      meta: {
        rowsCount: journalRows.length,
        type_report: 'Journal_Operations'
      }
    });

    return res.status(201).json({ message: 'Journal des Opérations généré', inventaire });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur génération Journal des Opérations', error: err.message });
  }
};

/**
 * Récupère l'historique des inventaires générés.
 *
export const getHistorique = async (req, res) => {
  try {
    const inventaires = await Inventaire.findAll({
      order: [['createdAt', 'DESC']], // Utiliser la date de création ou de génération
      include: [{ model: Service, as: 'service' }]
    });
    res.json(inventaires);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur historique', error: err.message });
  }
};

/**
 * Permet de télécharger un PDF d'inventaire spécifique.
 *
export const downloadPDF = async (req, res) => {
  try {
    const id = req.params.id;
    const inventaire = await Inventaire.findByPk(id);
    if (!inventaire || !inventaire.fichier_pdf) return res.status(404).json({ message: 'Fichier introuvable' });

    if (!fs.existsSync(inventaire.fichier_pdf)) {
      return res.status(404).json({ message: 'Fichier PDF non trouvé sur le serveur.' });
    }

    res.download(inventaire.fichier_pdf);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur téléchargement', error: err.message });
  }
};*/
import Inventaire from '../modeles/Inventaire.js';
import Affectation from '../modeles/Affectation.js';
import Bien from '../modeles/Bien.js';
import Sortie from '../modeles/Sortie.js';
import Service from '../modeles/Service.js';
import Entree from '../modeles/Entree.js';
import Nomenclature from '../modeles/Nomenclature.js';
import { generateInventairePDF } from '../utils/pdfGenerator.js';
import generateJournalOperationsPDF from '../utils/pdfEtatAppreciatifGenerator.js';
import path from 'path';
import fs from 'fs';
import { Op } from 'sequelize';
const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'inventaires');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// =====================
// GENERER INVENTAIRE
// =====================
export const genererInventaire = async (req, res) => {
  try {
    const { date_inventaire, serviceId } = req.body;

    if (!date_inventaire) {
      return res.status(400).json({ message: 'date_inventaire requise (ex: 31/12/2025).' });
    }

    const dateFin = new Date(date_inventaire);

    // --- Récupérer toutes les affectations actives ---
    const affectations = await Affectation.findAll({
      where: {
        statut: 'ACTIVE',
        ...(serviceId && { serviceId })
      },
      include: [
        {
          model: Bien,
          as: 'bien',
          attributes: ['id', 'code_bien', 'designation', 'prix_unitaire', 'quantite', 'date_acquisition'],
          include: [
            { model: Nomenclature, as: 'nomenclature', attributes: ['code'] }
          ]
        }
      ]
    });

    const rows = [];
    let valeurTotale = 0;

    for (const aff of affectations) {
      const bien = aff.bien;
      if (!bien) continue;

      // --- Calcul des flux ---
      const stock_initial = aff.annee_precedente ?? aff.quantite_affectee ?? 0;

      // Somme des entrées
      const quantite_entree = await Entree.sum('quantite', {
        where: {
          bien_id: bien.id,
          departement_id: aff.departementId,
          service_id: aff.serviceId,
          date: { [Op.lte]: dateFin }
        }
      }) || 0;

      // Somme des sorties via association Affectation
      const quantite_sortie = await Sortie.sum('quantite', {
        include: [{
          model: Affectation,
          as: 'affectation',
          where: { id: aff.id },
          attributes: [] // pas besoin de récupérer de colonnes
        }],
        where: {
          date: { [Op.lte]: dateFin }
        }
      }) || 0;

      const quantite_reste = stock_initial + quantite_entree - quantite_sortie;
      if (quantite_reste <= 0) continue;

      const prix_unitaire = bien.prix_unitaire ?? 0;
      const nomenclature_code = bien.nomenclature?.code ?? '00';
      const valeur = quantite_reste * prix_unitaire;

      rows.push({
        code_bien: bien.code_bien,
        designation: bien.designation,
        nomenclature: nomenclature_code,
        quantite_existante: stock_initial,
        quantite_entree,
        quantite_sortie,
        quantite_reste,
        prix_unitaire,
        valeur,
        date_acquisition: bien.date_acquisition
      });

      valeurTotale += valeur;
    }

    // --- Génération PDF ---
    const service = serviceId ? await Service.findByPk(serviceId) : null;
    const serviceName = service?.nom || service?.name || 'Tous_services';
    const dateGen = new Date().toISOString().slice(0, 10);
    const filename = `inventaire_${serviceName}_${dateGen}.pdf`.replace(/\s+/g, '_');
    const outPath = path.join(UPLOAD_DIR, filename);

    await generateInventairePDF(rows, {
      serviceName,
      periode_debut: 'N/A',
      periode_fin: date_inventaire,
      date_generation: dateGen,
      outPath
    });

    // --- Enregistrer l’inventaire ---
    const inventaire = await Inventaire.create({
      periode_debut: 'N/A',
      periode_fin: date_inventaire,
      serviceId: serviceId || null,
      fichier_pdf: outPath,
      valeur_totale: valeurTotale,
      nb_biens: rows.length,
      meta: { rowsCount: rows.length }
    });

    return res.status(201).json({ message: 'Inventaire généré', inventaire });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur génération inventaire', error: err.message });
  }
};
/*
export const genererInventaire = async (req, res) => {
  try {
    const { date_inventaire, serviceId } = req.body;

    if (!date_inventaire) {
      return res.status(400).json({ message: 'date_inventaire requise (ex: 31/12/2025).' });
    }

    const dateFin = new Date(date_inventaire);

    // Récupérer toutes les affectations actives jusqu'à la date donnée
    const affectations = await Affectation.findAll({
      where: {
        statut: 'ACTIVE',
        ...(serviceId && { serviceId })
      },
      include: [
        {
          model: Bien,
          as: 'bien',
          attributes: ['id', 'code_bien', 'designation', 'prix_unitaire', 'quantite', 'date_acquisition'],
          include: [
            { model: Nomenclature, as: 'nomenclature', attributes: ['code'] }
          ]
        }
      ]
    });

    const rows = [];
    let valeurTotale = 0;

    for (const aff of affectations) {
      const bien = aff.bien;
      if (!bien) continue;

      // --- CALCUL DES FLUX ---
      // Entrées et sorties liées à l'affectation après la date d'inventaire
      const totalEntreeApres = await Affectation.sum('quantite_affectee', {
        where: { id: aff.id, createdAt: { [Op.gt]: dateFin } }
      }) || 0;

      const totalSortieApres = 0; // pas de sortie physique pour l'instant

      const quantite_reste_a_date_fin = (aff.quantite_affectee || 0) - totalEntreeApres + totalSortieApres;
      if (quantite_reste_a_date_fin <= 0) continue;

      // Stock initial = quantité de l'année précédente si existe sinon quantité initiale du bien
      const stock_initial = aff.annee_precedente !== undefined ? aff.annee_precedente : aff.quantite_affectee || 0;

      const quantite_entree = 0; // Pas de flux dans cette version simplifiée
      const quantite_sortie = 0;

      const prix_unitaire = bien.prix_unitaire != null ? bien.prix_unitaire : 0;
      const nomenclature_code = bien.nomenclature ? bien.nomenclature.code : '00';

      const valeur = quantite_reste_a_date_fin * prix_unitaire;

      rows.push({
        code_bien: bien.code_bien,
        designation: bien.designation,
        nomenclature: nomenclature_code,
        quantite_existante: stock_initial,
        quantite_entree,
        quantite_sortie,
        quantite_reste: quantite_reste_a_date_fin,
        prix_unitaire,
        valeur,
        date_acquisition: bien.date_acquisition
      });

      valeurTotale += valeur;
    }

    // Génération PDF
    const service = serviceId ? await Service.findByPk(serviceId) : null;
    const serviceName = service ? (service.nom || service.name || `Service_${service.id}`) : 'Tous_services';
    const dateGen = new Date().toISOString().slice(0, 10);
    const filename = `inventaire_${serviceName}_${dateGen}.pdf`.replace(/\s+/g, '_');
    const outPath = path.join(UPLOAD_DIR, filename);

    await generateInventairePDF(rows, {
      serviceName,
      periode_debut: 'N/A',
      periode_fin: date_inventaire,
      date_generation: dateGen,
      outPath
    });

    const inventaire = await Inventaire.create({
      periode_debut: 'N/A',
      periode_fin: date_inventaire,
      serviceId: serviceId || null,
      fichier_pdf: outPath,
      valeur_totale: valeurTotale,
      nb_biens: rows.length,
      meta: { rowsCount: rows.length }
    });

    return res.status(201).json({ message: 'Inventaire généré', inventaire });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur génération inventaire', error: err.message });
  }
}*/
// =====================
// GENERER JOURNAL OPERATIONS
// =====================
export const genererJournalOperations = async (req, res) => {
  try {
    const { date_fin, serviceId } = req.body;
    if (!date_fin) return res.status(400).json({ message: 'date_fin requis pour le Journal des Opérations' });

    const dateFin = new Date(date_fin);

    // Récupérer toutes les affectations jusqu'à la date donnée
    const affectations = await Affectation.findAll({
      where: {
        statut: 'ACTIVE',
        ...(serviceId && { serviceId })
      },
      include: [
        { model: Bien, as: 'bien', attributes: ['id', 'designation', 'prix_unitaire'], include: [{ model: Nomenclature, as: 'nomenclature', attributes: ['code'] }] }
      ]
    });

    const journalRows = [];

    for (const aff of affectations) {
      const bien = aff.bien;
      if (!bien) continue;

      // Logique Entrée/Sortie par affectation
      const entree = aff.quantite_affectee || 0;
      const sortie = 0;

      const valueEntree = entree * (bien.prix_unitaire || 0);
      const valueSortie = sortie * (bien.prix_unitaire || 0);

      journalRows.push({
        date: aff.createdAt,
        justification: `Affectation: ${bien.designation}`,
        operations: {
          [bien.nomenclature ? bien.nomenclature.code : '00']: { charge: valueEntree, decharge: valueSortie }
        }
      });
    }

    const nomenclatures = [...new Set(journalRows.flatMap(r => Object.keys(r.operations)))].sort();
    const totalChargeGeneral = journalRows.reduce((sum, row) => sum + Object.values(row.operations).reduce((s, op) => s + op.charge, 0), 0);

    // Génération PDF
    const service = serviceId ? await Service.findByPk(serviceId) : null;
    const serviceName = service ? (service.nom || service.name || `Service_${service.id}`) : 'Tous_services';
    const dateGen = new Date().toISOString().slice(0, 10);
    const filename = `journal_operations_${serviceName}_${dateGen}.pdf`.replace(/\s+/g, '_');
    const outPath = path.join(UPLOAD_DIR, filename);

    await generateJournalOperationsPDF(journalRows, nomenclatures, {
      serviceName,
      periode_debut: 'N/A',
      periode_fin: date_fin,
      outPath
    });

    const inventaire = await Inventaire.create({
      periode_debut: 'N/A',
      periode_fin: date_fin,
      serviceId: serviceId || null,
      fichier_pdf: outPath,
      nb_biens: journalRows.length,
      valeur_totale: totalChargeGeneral,
      meta: { rowsCount: journalRows.length, type_report: 'Journal_Operations' }
    });

    return res.status(201).json({ message: 'Journal des Opérations généré', inventaire });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur génération Journal des Opérations', error: err.message });
  }
};

// =====================
// HISTORIQUE ET TELECHARGEMENT PDF
// =====================
export const getHistorique = async (req, res) => {
  try {
    const inventaires = await Inventaire.findAll({
      order: [['createdAt', 'DESC']],
      include: [{ model: Service, as: 'service' }]
    });
    res.json(inventaires);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur historique', error: err.message });
  }
};

export const downloadPDF = async (req, res) => {
  try {
    const id = req.params.id;
    const inventaire = await Inventaire.findByPk(id);
    if (!inventaire || !inventaire.fichier_pdf) return res.status(404).json({ message: 'Fichier introuvable' });

    if (!fs.existsSync(inventaire.fichier_pdf)) {
      return res.status(404).json({ message: 'Fichier PDF non trouvé sur le serveur.' });
    }

    res.download(inventaire.fichier_pdf);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur téléchargement', error: err.message });
  }
};
