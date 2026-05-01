import db from "../modeles/index.js";
import generateRecensementPDF from "../utils/pdfRecensementGenerator.js";
import path from "path";
import fs from "fs";
import AuditService from "../services/auditService.js";

const { Recensement, LigneRecensement, Bien, Affectation, sequelize } = db;

const PV_DIR = path.join(process.cwd(), "uploads", "pv_recensements");
if (!fs.existsSync(PV_DIR)) fs.mkdirSync(PV_DIR, { recursive: true });

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

const mapEtatRecensementToEtatBien = (etat) => {
  if (!etat) return "moyen";
  const e = etat.toLowerCase();
  if (["neuf", "bon", "bon état"].includes(e)) return "bon";
  if (["moyen"].includes(e)) return "moyen";
  if (["mauvais", "mauvais état", "a reformer", "à reformer"].includes(e)) return "mauvais";
  return "moyen";
};

// 1️⃣ SCAN QR CODE
export const scanQRCode = async (req, res) => {
  try {
    const { qrDataList } = req.body;
    if (!qrDataList || !Array.isArray(qrDataList)) {
      return res.status(400).json({ message: "Aucun QR Code fourni." });
    }

    const results = [];
    for (const qrData of qrDataList) {
      const affectation = await Affectation.findOne({
        include: [{ model: Bien, as: 'bien', where: { code_bien: qrData } }]
      });

      if (affectation) {
        results.push({
          affectationId: affectation.id, 
          bienId: affectation.bienId,
          designation: affectation.bien.designation,
          quantite: affectation.quantite_affectee,
          prix_unitaire: affectation.bien.prix_unitaire
        });
        await AuditService.log(req, "SCAN", "RECENSEMENT", `Scan réussi: ${qrData}`);
      }
    }
    res.status(200).json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur lors du scan." });
  }
};

// 2️⃣ CRÉER PV
export const createRecensement = async (req, res) => {
  let transaction;
  try {
    const { pvHeader, lignes } = req.body;
    if (!lignes?.length) return res.status(400).json({ message: "PV vide." });

    transaction = await sequelize.transaction();

    let totalDeficits = 0;
    let totalExistants = 0;
    const lignesFinales = [];

    for (const l of lignes) {
      // Correction ici : On s'assure que l'ID est présent
      if (!l.affectationId) throw new Error(`ID affectation manquant pour ${l.designation}`);

      const affectation = await Affectation.findByPk(l.affectationId, { 
        include: [{ model: Bien, as: 'bien' }] 
      });

      if (!affectation) throw new Error(`Affectation ${l.affectationId} introuvable.`);

      const calculated = calculateLineData({
        ...l,
        qte_existante_ecriture: affectation.quantite_affectee,
        prix_unitaire: affectation.bien.prix_unitaire
      });

      totalDeficits += calculated.valeur_deficits;
      totalExistants += calculated.valeur_existants;

      lignesFinales.push({
        ...calculated,
        bienId: affectation.bienId,
        affectationId: affectation.id,
        code_bien: affectation.bien.code_bien
      });
    }

    const pv = await Recensement.create({
      date_pv: pvHeader.datePv,
      exercice: new Date(pvHeader.datePv).getFullYear().toString(),
      recenseurId: pvHeader.recenseurId,
      depositaireId: pvHeader.depositaireId,
      recenseur_qualite: pvHeader.recenseurQualite,
      total_general_deficits: totalDeficits,
      total_general_existants: totalExistants,
      statut: "TRANSMIS",
    }, { transaction });

    await LigneRecensement.bulkCreate(
      lignesFinales.map(l => ({ ...l, recensementId: pv.id })),
      { transaction }
    );

    await transaction.commit();
    res.status(201).json({ id: pv.id, message: "PV créé." });
  } catch (err) {
    if (transaction) await transaction.rollback();
    console.error("ERREUR CRÉATION PV:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// ===============================================
// 3️⃣ Transmettre PV
export const transmettreRecensement = async (req, res) => {
  try {
    const pv = await Recensement.findByPk(req.params.id);
    if (!pv) return res.status(404).json({ message: "PV introuvable." });
    if (pv.statut !== "BROUILLON") return res.status(400).json({ message: "Seul un PV en brouillon peut être transmis." });

    pv.statut = "TRANSMIS";
    pv.date_transmission = new Date();
    await pv.save();

    await AuditService.log(req, "TRANSMIT", "RECENSEMENT", `PV N°${pv.id} transmis au dépositaire`);
    res.status(200).json({ message: "PV transmis avec succès." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur lors de la transmission." });
  }
};

// ===============================================
// 4️⃣ Valider PV et générer PDFexport const validerRecensement = async (req, res) => {
// ===============================================
// 4️⃣ Valider PV et générer PDF
export const validerRecensement = async (req, res) => {
  let transaction;
  try {
    transaction = await sequelize.transaction();
    const pv = await Recensement.findByPk(req.params.id, {
      include: [{ model: LigneRecensement, as: "lignes" }],
      transaction
    });

    if (!pv || pv.statut !== "TRANSMIS") {
      throw new Error("PV introuvable ou non transmis.");
    }

    for (const ligne of pv.lignes) {
      const affectation = await Affectation.findByPk(ligne.affectationId, { 
        include: [{ model: Bien, as: 'bien' }],
        transaction 
      });

      if (affectation) {
        // Mise à jour de l'affectation
        affectation.quantite_affectee = ligne.qte_constatee;
        await affectation.save({ transaction });

        // Mise à jour de l'état du bien
        if (affectation.bien) {
          affectation.bien.etat = mapEtatRecensementToEtatBien(ligne.etat_recensement);
          await affectation.bien.save({ transaction });
        }
      }
    }

    pv.statut = "VALIDE";
    pv.date_validation = new Date();
    pv.valide_par = req.user ? req.user.id : null; // Sécurité si req.user est undefined
    await pv.save({ transaction });

    await transaction.commit();
    
    // ICI res est bien défini car il est dans les paramètres de la fonction ci-dessus
    return res.status(200).json({ message: "PV validé avec succès." });
    
  } catch (err) {
    if (transaction) await transaction.rollback();
    console.error("Erreur validation:", err.message);
    // Vérifiez bien que cette ligne est à l'intérieur du bloc catch de validerRecensement
    return res.status(500).json({ message: err.message });
  }
};