/*
import db from '../modeles/index.js';
import generateRecensementPDF from '../utils/pdfRecensementGenerator.js';
import path from 'path';
import fs from 'fs';
import AuditService from "../services/auditService.js";   // ✅ AJOUT AUDIT

const { Recensement, LigneRecensement, sequelize, Bien, Utilisateur, Service } = db;
const mapEtatRecensementToEtatBien = (etat) => {
  if (!etat) return 'moyen';

  switch (etat.toLowerCase()) {
    case 'neuf':
      return 'bon';
    case 'bon':
      return 'bon';
    case 'moyen':
      return 'moyen';
    case 'mauvais':
    case 'mauvais état':
    case 'a reformer':
    case 'à reformer':
      return 'mauvais';
    default:
      return 'moyen';
  }
};


// 📂 Répertoire PDF
const PV_DIR = path.join(process.cwd(), 'uploads', 'pv_recensements');
if (!fs.existsSync(PV_DIR)) fs.mkdirSync(PV_DIR, { recursive: true });

// ▶️ Fonction utilitaire
const calculateLineData = (l) => {
  const qteExistante = l.qte_existante_ecriture || 0;
  const qteConstatee = parseInt(l.qte_constatee) || 0;
  const prixUnitaire = l.prix_unitaire || 0;

  const ecart = qteConstatee - qteExistante;
  const qteDeficit = ecart < 0 ? Math.abs(ecart) : 0;
  const qteExcedent = ecart > 0 ? ecart : 0;

  return {
    ...l,
    qte_constatee: qteConstatee,
    qte_excedent: qteExcedent,
    qte_deficit: qteDeficit,
    valeur_deficits: qteDeficit * prixUnitaire,
    valeur_existants: qteConstatee * prixUnitaire,
  };
};

// 1️⃣ ▶️ **Créer un PV de recensement**
/*export const createRecensement = async (req, res) => {
  let transaction;
  try {
    const { pvHeader, lignes } = req.body;

    if (!lignes || lignes.length === 0) {
      return res.status(400).json({ message: "Le PV doit contenir au moins une ligne." });
    }

    let totalGeneralDeficits = 0;
    let totalGeneralExistants = 0;

    transaction = await sequelize.transaction();

    // ▶ Calcul lignes
    const lignesFinales = lignes.map(l => {
      const calculated = calculateLineData(l);
      totalGeneralDeficits += calculated.valeur_deficits;
      totalGeneralExistants += calculated.valeur_existants;
      return { ...calculated, bienId: l.bien_id };
    });

    // ▶ Création du PV principal
    const nouvelEnregistrement = await Recensement.create({
      date_pv: pvHeader.datePv,
      exercice: new Date(pvHeader.datePv).getFullYear().toString(),
      recenseurId: pvHeader.recenseurId,
      depositaireId: pvHeader.depositaireId,
      recenseur_qualite: pvHeader.recenseurQualite,
      total_general_deficits: totalGeneralDeficits,
      total_general_existants: totalGeneralExistants,
    }, { transaction });

    // ▶ Insert lignes PV
    await LigneRecensement.bulkCreate(
      lignesFinales.map(l => ({ ...l, recensementId: nouvelEnregistrement.id })),
      { transaction }
    );

    // ▶ Jointure complète
    const pvData = await Recensement.findByPk(nouvelEnregistrement.id, {
      include: [
        { model: LigneRecensement, as: 'lignes', include: [{ model: Bien, attributes: ['designation'] }] },
        { model: Utilisateur, as: 'AgentRecenseur', include: [{ model: Service, as: 'serviceMembre' }] },
        { model: Utilisateur, as: 'Depositaire' },
      ],
      transaction
    });

    // ▶ Ajout mesure
    const pvJSON = pvData.toJSON();
    pvJSON.lignes.forEach(l => l.unite_de_mesure = 'nbre');

    // ▶ Génération PDF
    const filename = `PV_Recensement_${pvData.exercice}_${nouvelEnregistrement.id}.pdf`;
    const outPath = path.join(PV_DIR, filename);

    const { pdfBuffer } = await generateRecensementPDF(pvJSON, { outPath });
    fs.writeFileSync(outPath, pdfBuffer);

    // ▶ Mise à jour
    await nouvelEnregistrement.update({
      fichier_pdf: outPath,
      nb_lignes: lignesFinales.length,
    }, { transaction });

    await transaction.commit();

    // 🔥 AUDIT : création PV
    await AuditService.log(
      req,
      "CREATE",
      "RECENSEMENT",
      `Création du PV de recensement N°${nouvelEnregistrement.id}`
    );

    // ▶ Retour PDF au client
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    return res.send(pdfBuffer);

  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error("ERREUR CRÉATION PV:", error);

    await AuditService.log(
      req,
      "ERROR",
      "RECENSEMENT",
      `Erreur lors de la création d'un PV : ${error.message}`
    );

    res.status(500).json({ message: "Erreur serveur lors de la création du PV." });
  }
};*
export const createRecensement = async (req, res) => {
  let transaction;
  try {
    const { pvHeader, lignes } = req.body;

    if (!lignes || lignes.length === 0) {
      return res.status(400).json({ message: "Le PV doit contenir au moins une ligne." });
    }

    transaction = await sequelize.transaction();
    // Récupérer les IDs des biens ACTIFS uniquement
    const biensActifs = await Bien.findAll({
      where: { statut: 'ACTIF' },
      attributes: ['id'],
      transaction
    });

    const idsBiensActifs = biensActifs.map(b => b.id);


    // ▶ Filtrer les biens avec quantité > 0
    const lignesFiltrees = lignes.filter(
      l => l.quantite > 0 && idsBiensActifs.includes(l.bien_id)
    );


    if (lignesFiltrees.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ message: "Aucun bien à recenser (quantité = 0)." });
    }

    let totalGeneralDeficits = 0;
    let totalGeneralExistants = 0;

    // ▶ Calcul lignes
    const lignesFinales = lignesFiltrees.map(l => {
      const calculated = calculateLineData(l);
      totalGeneralDeficits += calculated.valeur_deficits;
      totalGeneralExistants += calculated.valeur_existants;
      return { ...calculated, bienId: l.bien_id };
    });

    // ▶ Création du PV principal
    const nouvelEnregistrement = await Recensement.create({
      date_pv: pvHeader.datePv,
      exercice: new Date(pvHeader.datePv).getFullYear().toString(),
      recenseurId: pvHeader.recenseurId,
      depositaireId: pvHeader.depositaireId,
      recenseur_qualite: pvHeader.recenseurQualite,
      total_general_deficits: totalGeneralDeficits,
      total_general_existants: totalGeneralExistants,
    }, { transaction });

    // ▶ Insert lignes PV
    await LigneRecensement.bulkCreate(
      lignesFinales.map(l => ({ ...l, recensementId: nouvelEnregistrement.id })),
      { transaction }
    );

    // ▶ Jointure complète
    const pvData = await Recensement.findByPk(nouvelEnregistrement.id, {
      include: [
        { model: LigneRecensement, as: 'lignes', include: [{ model: Bien, attributes: ['designation'] }] },
        { model: Utilisateur, as: 'AgentRecenseur', include: [{ model: Service, as: 'serviceMembre' }] },
        { model: Utilisateur, as: 'Depositaire' },
      ],
      transaction
    });

    // ▶ Ajout mesure
    const pvJSON = pvData.toJSON();
    pvJSON.lignes.forEach(l => l.unite_de_mesure = 'nbre');

    // ▶ Génération PDF
    const filename = `PV_Recensement_${pvData.exercice}_${nouvelEnregistrement.id}.pdf`;
    const outPath = path.join(PV_DIR, filename);

    const { pdfBuffer } = await generateRecensementPDF(pvJSON, { outPath });
    fs.writeFileSync(outPath, pdfBuffer);

    // ▶ Mise à jour
    await nouvelEnregistrement.update({
      fichier_pdf: outPath,
      nb_lignes: lignesFinales.length,
    }, { transaction });

    await transaction.commit();

    // 🔥 AUDIT : création PV
    await AuditService.log(
      req,
      "CREATE",
      "RECENSEMENT",
      `Création du PV de recensement N°${nouvelEnregistrement.id}`
    );

    // ▶ Retour JSON avec ID et PDF
    return res.status(201).json({
      id: nouvelEnregistrement.id,
      filename,
      pdfBase64: pdfBuffer.toString('base64') // le PDF encodé pour le téléchargement côté front
    });

  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error("ERREUR CRÉATION PV:", error);

    await AuditService.log(
      req,
      "ERROR",
      "RECENSEMENT",
      `Erreur lors de la création d'un PV : ${error.message}`
    );

    res.status(500).json({ message: "Erreur serveur lors de la création du PV." });
  }
};


/*export const createRecensement = async (req, res) => {
  let transaction;
  try {
    const { pvHeader, lignes } = req.body;

    if (!lignes || lignes.length === 0) {
      return res.status(400).json({ message: "Le PV doit contenir au moins une ligne." });
    }

    let totalGeneralDeficits = 0;
    let totalGeneralExistants = 0;

    transaction = await sequelize.transaction();

    // ▶ Calcul lignes
    const lignesFinales = lignes.map(l => {
      const calculated = calculateLineData(l);
      totalGeneralDeficits += calculated.valeur_deficits;
      totalGeneralExistants += calculated.valeur_existants;
      return { ...calculated, bienId: l.bien_id };
    });

    // ▶ Création du PV principal
    const nouvelEnregistrement = await Recensement.create({
      date_pv: pvHeader.datePv,
      exercice: new Date(pvHeader.datePv).getFullYear().toString(),
      recenseurId: pvHeader.recenseurId,
      depositaireId: pvHeader.depositaireId,
      recenseur_qualite: pvHeader.recenseurQualite,
      total_general_deficits: totalGeneralDeficits,
      total_general_existants: totalGeneralExistants,
    }, { transaction });

    // ▶ Insert lignes PV
    await LigneRecensement.bulkCreate(
      lignesFinales.map(l => ({ ...l, recensementId: nouvelEnregistrement.id })),
      { transaction }
    );

    // ▶ Jointure complète
    const pvData = await Recensement.findByPk(nouvelEnregistrement.id, {
      include: [
        { model: LigneRecensement, as: 'lignes', include: [{ model: Bien, attributes: ['designation'] }] },
        { model: Utilisateur, as: 'AgentRecenseur', include: [{ model: Service, as: 'serviceMembre' }] },
        { model: Utilisateur, as: 'Depositaire' },
      ],
      transaction
    });

    // ▶ Ajout mesure
    const pvJSON = pvData.toJSON();
    pvJSON.lignes.forEach(l => l.unite_de_mesure = 'nbre');

    // ▶ Génération PDF
    const filename = `PV_Recensement_${pvData.exercice}_${nouvelEnregistrement.id}.pdf`;
    const outPath = path.join(PV_DIR, filename);

    const { pdfBuffer } = await generateRecensementPDF(pvJSON, { outPath });
    fs.writeFileSync(outPath, pdfBuffer);

    // ▶ Mise à jour
    await nouvelEnregistrement.update({
      fichier_pdf: outPath,
      nb_lignes: lignesFinales.length,
    }, { transaction });

    await transaction.commit();

    // 🔥 AUDIT : création PV
    await AuditService.log(
      req,
      "CREATE",
      "RECENSEMENT",
      `Création du PV de recensement N°${nouvelEnregistrement.id}`
    );

    // ▶ Retour JSON avec ID et PDF
    return res.status(201).json({
      id: nouvelEnregistrement.id,
      filename,
      pdfBase64: pdfBuffer.toString('base64') // le PDF encodé pour le téléchargement côté front
    });

  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error("ERREUR CRÉATION PV:", error);

    await AuditService.log(
      req,
      "ERROR",
      "RECENSEMENT",
      `Erreur lors de la création d'un PV : ${error.message}`
    );

    res.status(500).json({ message: "Erreur serveur lors de la création du PV." });
  }
};
*

// 2️⃣ ▶️ Lister PVs
export const getAllRecensements = async (req, res) => {
  try {
    const recensements = await Recensement.findAll({
      attributes: ['id', 'date_pv', 'recenseur_nom', 'total_general_deficits', 'statut', 'createdAt', 'fichier_pdf'],
      order: [['createdAt', 'DESC']],
    });

    // 🔥 AUDIT : consultation
    await AuditService.log(req,
      "CONSULT",
      "RECENSEMENT",
      "Consultation de la liste des PV de recensement"
    );

    res.status(200).json(recensements);
  } catch (error) {
    console.error("Erreur récupération PV:", error);

    await AuditService.log(
      req,
      "ERROR",
      "RECENSEMENT",
      `Erreur lors de la consultation des PV : ${error.message}`
    );

    res.status(500).json({ message: "Erreur serveur." });
  }
};

// 3️⃣ ▶️ Télécharger un PDF PV
export const downloadRecensementPDF = async (req, res) => {
  try {
    const id = req.params.id;
    const pv = await Recensement.findByPk(id);

    if (!pv || !pv.fichier_pdf) {
      return res.status(404).json({ message: 'Fichier introuvable.' });
    }

    // 🔥 AUDIT : téléchargement fichier
    await AuditService.log(
      req,
      "DOWNLOAD",
      "RECENSEMENT",
      `Téléchargement du PV n°${id}`
    );

    res.download(pv.fichier_pdf);

  } catch (error) {
    console.error("Erreur téléchargement PV:", error);

    await AuditService.log(
      req,
      "ERROR",
      "RECENSEMENT",
      `Erreur lors du téléchargement du PV ${req.params.id}`
    );

    res.status(500).json({ message: "Erreur serveur." });
  }
};

export const transmettreRecensement = async (req, res) => {
  try {
    const pv = await Recensement.findByPk(req.params.id);
    if (!pv) return res.status(404).json({ message: "PV introuvable." });
    if (pv.statut !== 'BROUILLON') return res.status(400).json({ message: "Seul un PV en brouillon peut être transmis." });

    pv.statut = 'TRANSMIS';
    pv.date_transmission = new Date();
    await pv.save();
    await AuditService.log(req, "TRANSMIT", "RECENSEMENT", `Transmission PV N°${pv.id} au dépositaire`);

    res.status(200).json({ message: "PV transmis au dépositaire." });
  } catch (error) {
    console.error(error);
    await AuditService.log(req, "ERROR", "RECENSEMENT", `Erreur transmission PV ${req.params.id}`);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// ▶ Valider PV
/*export const validerRecensement = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const pv = await Recensement.findByPk(req.params.id, {
      include: [{ model: LigneRecensement, as: 'lignes' }],
      transaction
    });
    if (!pv) {
      await transaction.rollback();
      return res.status(404).json({ message: "PV introuvable." });
    }
    if (pv.statut !== 'TRANSMIS') {
      await transaction.rollback();
      return res.status(400).json({ message: "Le PV doit être transmis avant validation." });
    }

    for (const ligne of pv.lignes) {
      const bien = await Bien.findByPk(ligne.bienId, { transaction });
      if (!bien) continue;
      bien.quantite = ligne.qte_constatee;
      bien.etat = ligne.etat_recensement;
      await bien.save({ transaction });
    }

    pv.statut = 'VALIDE';
    pv.date_validation = new Date();
    pv.valide_par = req.user.id;
    await pv.save({ transaction });
    await transaction.commit();

    await AuditService.log(req, "VALIDATE", "RECENSEMENT", `Validation PV N°${pv.id}`);
    res.status(200).json({ message: "PV validé avec succès." });

  } catch (error) {
    await transaction.rollback();
    console.error(error);
    await AuditService.log(req, "ERROR", "RECENSEMENT", `Erreur validation PV ${req.params.id}`);
    res.status(500).json({ message: "Erreur serveur lors de la validation." });
  }
};*//*
export const validerRecensement = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const pv = await Recensement.findByPk(req.params.id, {
      include: [{ model: LigneRecensement, as: 'lignes' }],
      transaction
    });
    if (!pv) {
      await transaction.rollback();
      return res.status(404).json({ message: "PV introuvable." });
    }
    if (pv.statut !== 'TRANSMIS') {
      await transaction.rollback();
      return res.status(400).json({ message: "Le PV doit être transmis avant validation." });
    }

    // Mise à jour des biens
    for (const ligne of pv.lignes) {
      const bien = await Bien.findByPk(ligne.bienId, { transaction });
      if (!bien) continue;
      bien.quantite = ligne.qte_constatee;
      bien.etat = mapEtatRecensementToEtatBien(ligne.etat_recensement);
      await bien.save({ transaction });

    }

    pv.statut = 'VALIDE';
    pv.date_validation = new Date();
    pv.valide_par = req.user.id; // ID du dépositaire
    await pv.save({ transaction });
    await transaction.commit();

    await AuditService.log(req, "VALIDATE", "RECENSEMENT", `Validation PV N°${pv.id}`);
    res.status(200).json({ message: "PV validé avec succès." });

  } catch (error) {
    await transaction.rollback();
    console.error(error);
    await AuditService.log(req, "ERROR", "RECENSEMENT", `Erreur validation PV ${req.params.id}`);
    res.status(500).json({ message: "Erreur serveur lors de la validation." });
  }
};
*
export const validerRecensement = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    // Récupération du PV complet avec ses lignes
    const pv = await Recensement.findByPk(req.params.id, {
      include: [
        { model: LigneRecensement, as: 'lignes', include: [{ model: Bien }] },
        { model: Utilisateur, as: 'AgentRecenseur', include: [{ model: Service, as: 'serviceMembre' }] },
        { model: Utilisateur, as: 'Depositaire' },
      ],
      transaction
    });

    if (!pv) {
      await transaction.rollback();
      return res.status(404).json({ message: "PV introuvable." });
    }

    if (pv.statut !== 'TRANSMIS') {
      await transaction.rollback();
      return res.status(400).json({ message: "Le PV doit être transmis avant validation." });
    }

    // 1️⃣ Mise à jour automatique des biens
    for (const ligne of pv.lignes) {
      const bien = await Bien.findByPk(ligne.bienId, { transaction });
      if (!bien) continue;

      bien.quantite = ligne.qte_constatee;
      bien.etat = mapEtatRecensementToEtatBien(ligne.etat_recensement);
      await bien.save({ transaction });
    }

    // 2️⃣ Génération automatique du PDF FINAL
    const pvJSON = pv.toJSON();
    pvJSON.lignes.forEach(l => l.unite_de_mesure = 'nbre');

    const filename = `PV_Recensement_FINAL_${pv.exercice}_${pv.id}.pdf`;
    const outPath = path.join(PV_DIR, filename);

    const { pdfBuffer } = await generateRecensementPDF(pvJSON);
    fs.writeFileSync(outPath, pdfBuffer);

    // 3️⃣ Validation officielle par le dépositaire
    pv.statut = 'VALIDE';
    pv.date_validation = new Date();
    pv.valide_par = req.user.id; // ID du dépositaire
    pv.fichier_pdf = outPath;
    await pv.save({ transaction });

    await transaction.commit();

    // 🔥 Audit
    await AuditService.log(req, "VALIDATE", "RECENSEMENT", `Validation PV N°${pv.id}`);

    res.status(200).json({
      message: "PV validé et PDF officiel généré automatiquement.",
      pdf: filename
    });

  } catch (error) {
    await transaction.rollback();
    console.error(error);
    await AuditService.log(req, "ERROR", "RECENSEMENT", `Erreur validation PV ${req.params.id}`);
    res.status(500).json({ message: "Erreur serveur lors de la validation." });
  }
};
// GET /api/recensements/:id
export const getRecensementById = async (req, res) => {
  try {
    const pv = await Recensement.findByPk(req.params.id, {
      include: [
        { model: LigneRecensement, as: 'lignes', include: [{ model: Bien }] },
        { model: Utilisateur, as: 'AgentRecenseur', include: [{ model: Service, as: 'serviceMembre' }] },
        { model: Utilisateur, as: 'Depositaire' },
      ]
    });

    if (!pv) return res.status(404).json({ message: "PV introuvable" });

    // Retour JSON complet
    const pvJSON = pv.toJSON();
    pvJSON.lignes.forEach(l => l.unite_de_mesure = 'nbre');

    res.status(200).json(pvJSON);

    // Audit
    await AuditService.log(req, "CONSULT", "RECENSEMENT", `Consultation PV N°${pv.id}`);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur." });
  }
};
*/
import db from '../modeles/index.js';
import generateRecensementPDF from '../utils/pdfRecensementGenerator.js';
import path from 'path';
import fs from 'fs';
import { io } from '../app.js';
import AuditService from "../services/auditService.js";

const { Recensement, LigneRecensement, sequelize, Affectation, Bien, Utilisateur, Service, Sequelize } = db;

const PV_DIR = path.join(process.cwd(), 'uploads', 'pv_recensements');
if (!fs.existsSync(PV_DIR)) fs.mkdirSync(PV_DIR, { recursive: true });

const mapEtatRecensementToEtatBien = (etat) => {
  if (!etat) return 'moyen';
  switch (etat.toLowerCase()) {
    case 'neuf':
    case 'bon':
      return 'bon';
    case 'moyen':
      return 'moyen';
    case 'mauvais':
    case 'mauvais état':
    case 'a reformer':
    case 'à reformer':
      return 'mauvais';
    default:
      return 'moyen';
  }
};

const calculateLineData = (l) => {
  const qteExistante = l.qte_existante_ecriture || 0;
  const qteConstatee = parseInt(l.qte_constatee) || qteExistante;
  const prixUnitaire = l.prix_unitaire || 0;

  const ecart = qteConstatee - qteExistante;
  const qteDeficit = ecart < 0 ? Math.abs(ecart) : 0;
  const qteExcedent = ecart > 0 ? ecart : 0;

  return {
    ...l,
    qte_constatee: qteConstatee,
    qte_excedent: qteExcedent,
    qte_deficit: qteDeficit,
    valeur_deficits: qteDeficit * prixUnitaire,
    valeur_existants: qteConstatee * prixUnitaire,
  };
};

// ========================== CREATE PV ==========================
export const createRecensement = async (req, res) => {
  let transaction;
  try {
    const { pvHeader, lignes } = req.body;
    console.log("Requête reçue pour création PV :", { pvHeader, lignes });
    // lignes envoyées depuis le front avec qte_constatee et etat_constate
    transaction = await sequelize.transaction();

    if (!lignes || lignes.length === 0) {
      console.log("Aucune ligne fournie pour le recensement.");
      await transaction.rollback();
      return res.status(400).json({ message: "Aucune ligne fournie pour le recensement." });
    }

    let totalGeneralDeficits = 0;
    let totalGeneralExistants = 0;

    const lignesFinales = await Promise.all(lignes.map(async l => {
      console.log("Traitement ligne:", l);
      const affectation = await Affectation.findOne({
        where: { id: l.affectationId },
        include: [{ model: Bien, as: 'bien', attributes: ['id', 'designation', 'prix_unitaire'] }],
        transaction
      });

      if (!affectation || !affectation.bien) return null;
      console.log(`Affectation introuvable pour ligne ${l.affectationId}`);

      const ligne = {
        affectationId: affectation.id,
        qte_existante_ecriture: affectation.quantite_affectee,
        qte_constatee: l.qte_constatee || affectation.quantite_affectee,
        prix_unitaire: affectation.bien.prix_unitaire || 0,
        etat_recensement: l.etat_recensement || affectation.etat || 'Moyen'
      };
      console.log("Ligne calculée avant valeur :", ligne);
      const calculated = calculateLineData(ligne);
      totalGeneralDeficits += calculated.valeur_deficits;
      totalGeneralExistants += calculated.valeur_existants;

       console.log("Ligne finale calculée :", calculated);

      return { affectationId: affectation.id, bienId: affectation.bien.id, etat_recensement: ligne.etat_recensement, ...calculated };
    }));
    console.log("Toutes les lignes finales :", lignesFinales);

    const depositaireId = pvHeader.depositaireId || (await Utilisateur.findOne({ where: { role: 'depositaire' }, transaction }))?.id;
    if (!depositaireId) {
      await transaction.rollback();
      return res.status(400).json({ message: "Aucun dépositaire trouvé pour créer le PV." });
    }

    // Création PV
    const nouvelEnregistrement = await Recensement.create({
      date_pv: pvHeader.datePv,
      exercice: new Date(pvHeader.datePv).getFullYear().toString(),
      recenseurId: pvHeader.recenseurId,
      depositaireId,
      recenseur_qualite: pvHeader.recenseurQualite,
      total_general_deficits: totalGeneralDeficits,
      total_general_existants: totalGeneralExistants,
      statut: 'BROUILLON'
    }, { transaction });

    // Création des lignes
    await LigneRecensement.bulkCreate(
      lignesFinales.filter(l => l !== null).map(l => ({ ...l, recensementId: nouvelEnregistrement.id })),
      { transaction }
    );
console.log("Lignes PV insérées en base.")
    // Génération PDF
    const pvData = await Recensement.findByPk(nouvelEnregistrement.id, {
      include: [
        { model: LigneRecensement, as: 'lignes', include: [{ model: Bien, attributes: ['designation'] }] },
        { model: Utilisateur, as: 'AgentRecenseur', include: [{ model: Service, as: 'serviceMembre' }] },
        { model: Utilisateur, as: 'Depositaire' }
      ],
      transaction
    });

    const pvJSON = pvData.toJSON();
    pvJSON.lignes.forEach(l => {
      l.unite_de_mesure = 'nbre';
      l.etat_recensement = l.etat_recensement || 'Moyen'; // ✅ forcer valeur si vide
    });

    const filename = `PV_Recensement_${pvData.exercice}_${nouvelEnregistrement.id}.pdf`;
    const outPath = path.join(PV_DIR, filename);
    const { pdfBuffer } = await generateRecensementPDF(pvJSON, { outPath });
    fs.writeFileSync(outPath, pdfBuffer);

    await nouvelEnregistrement.update({ fichier_pdf: outPath, nb_lignes: lignesFinales.length }, { transaction });
    await transaction.commit();

    await AuditService.log(req, "CREATE", "RECENSEMENT", `Création du PV N°${nouvelEnregistrement.id}`);

    res.status(201).json({ id: nouvelEnregistrement.id, filename, pdfBase64: pdfBuffer.toString('base64') });

  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error("ERREUR CRÉATION PV:", error);
    await AuditService.log(req, "ERROR", "RECENSEMENT", `Erreur création PV : ${error.message}`);
    res.status(500).json({ message: "Erreur serveur lors de la création du PV." });
  }
};

// ========================== GET ALL PV ==========================
export const getAllRecensements = async (req, res) => {
  try {
    const recensements = await Recensement.findAll({
      attributes: ['id', 'date_pv', 'recenseurId', 'total_general_deficits', 'statut', 'createdAt', 'fichier_pdf'],
      order: [['createdAt', 'DESC']],
    });

    await AuditService.log(req, "CONSULT", "RECENSEMENT", "Consultation de la liste des PV");
    res.status(200).json(recensements);

  } catch (error) {
    console.error("Erreur récupération PV:", error);
    await AuditService.log(req, "ERROR", "RECENSEMENT", `Erreur consultation PV : ${error.message}`);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// ========================== GET PV BY ID ==========================
export const getRecensementById = async (req, res) => {
  try {
    const pv = await Recensement.findByPk(req.params.id, {
      include: [
        { model: LigneRecensement, as: 'lignes', include: [{ model: Bien }] },
        { model: Utilisateur, as: 'AgentRecenseur', include: [{ model: Service, as: 'serviceMembre' }] },
        { model: Utilisateur, as: 'Depositaire' },
      ]
    });

    if (!pv) return res.status(404).json({ message: "PV introuvable" });

    const pvJSON = pv.toJSON();
    pvJSON.lignes.forEach(l => l.unite_de_mesure = 'nbre');

    await AuditService.log(req, "CONSULT", "RECENSEMENT", `Consultation PV N°${pv.id}`);
    res.status(200).json(pvJSON);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// ========================== DOWNLOAD PDF ==========================
export const downloadRecensementPDF = async (req, res) => {
  try {
    const pv = await Recensement.findByPk(req.params.id);
    if (!pv || !pv.fichier_pdf) return res.status(404).json({ message: 'Fichier introuvable.' });

    await AuditService.log(req, "DOWNLOAD", "RECENSEMENT", `Téléchargement PV N°${pv.id}`);
    res.download(pv.fichier_pdf);

  } catch (error) {
    console.error(error);
    await AuditService.log(req, "ERROR", "RECENSEMENT", `Erreur téléchargement PV ${req.params.id}`);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// ========================== TRANSMIT PV ==========================
export const transmettreRecensement = async (req, res) => {
  try {
    const pv = await Recensement.findByPk(req.params.id);
    if (!pv) return res.status(404).json({ message: "PV introuvable." });
    if (pv.statut !== 'BROUILLON') return res.status(400).json({ message: "Seul un PV en brouillon peut être transmis." });

    pv.statut = 'TRANSMIS';
    pv.date_transmission = new Date();
    await pv.save();
      const depositaireId = String(pv.depositaireId);
    io.to(`departement-${depositaireId}`).emit('nouveauPv', {
      id: pv.id,
      date_pv: pv.date_pv,
      total_general_deficits: pv.total_general_deficits,
      statut: pv.statut
    });
    await AuditService.log(req, "TRANSMIT", "RECENSEMENT", `Transmission PV N°${pv.id}`);
    res.status(200).json({ message: "PV transmis au dépositaire." });

  } catch (error) {
    console.error(error);
    await AuditService.log(req, "ERROR", "RECENSEMENT", `Erreur transmission PV ${req.params.id}`);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// ========================== VALIDATE PV ==========================
export const validerRecensement = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const pv = await Recensement.findByPk(req.params.id, {
      include: [{ model: LigneRecensement, as: 'lignes', include: [{ model: Affectation , as: 'affectation'}] }],
      transaction
    });

    if (!pv) {
      await transaction.rollback();
      return res.status(404).json({ message: "PV introuvable." });
    }

    if (pv.statut !== 'TRANSMIS') {
      await transaction.rollback();
      return res.status(400).json({ message: "Le PV doit être transmis avant validation." });
    }

    // Mettre à jour les affectations avec quantité constatée et état
    for (const ligne of pv.lignes) {
  const affectation = await Affectation.findByPk(ligne.affectationId, { transaction });
  if (!affectation) continue;

  affectation.quantite_affectee = ligne.qte_constatee;
  affectation.etat = mapEtatRecensementToEtatBien(ligne.etat_recensement);
  await affectation.save({ transaction });
}

    // Générer PDF final
    const pvJSON = pv.toJSON();
    pvJSON.lignes.forEach(l => l.unite_de_mesure = 'nbre');
    const filename = `PV_Recensement_FINAL_${pv.exercice}_${pv.id}.pdf`;
    const outPath = path.join(PV_DIR, filename);
    const { pdfBuffer } = await generateRecensementPDF(pvJSON);
    fs.writeFileSync(outPath, pdfBuffer);

    pv.statut = 'VALIDE';
    pv.date_validation = new Date();
    pv.valide_par = req.user.id;
    pv.fichier_pdf = outPath;
    await pv.save({ transaction });

    await transaction.commit();
    await AuditService.log(req, "VALIDATE", "RECENSEMENT", `Validation PV N°${pv.id}`);

    res.status(200).json({ message: "PV validé et PDF généré.", pdf: filename });

  } catch (error) {
    await transaction.rollback();
    console.error(error);
    await AuditService.log(req, "ERROR", "RECENSEMENT", `Erreur validation PV ${req.params.id}`);
    res.status(500).json({ message: "Erreur serveur lors de la validation." });
  }
};
