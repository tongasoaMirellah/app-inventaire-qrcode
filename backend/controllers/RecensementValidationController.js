import db from '../modeles/index.js';
import AuditService from '../services/auditService.js';

const { Recensement, LigneRecensement, Bien, sequelize } = db;

export const validerRecensement = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const userId = req.user.id;

    const pv = await Recensement.findByPk(id, {
      include: [{ model: LigneRecensement, as: 'lignes' }],
      transaction
    });

    if (!pv) {
      await transaction.rollback();
      return res.status(404).json({ message: "PV introuvable." });
    }

    if (pv.statut === 'VALIDE') {
      await transaction.rollback();
      return res.status(400).json({ message: "Ce PV est déjà validé." });
    }

    // 🔁 APPLICATION DU PV
    for (const ligne of pv.lignes) {
      const bien = await Bien.findByPk(ligne.bienId, { transaction });
      if (!bien) continue;

      // ✅ RÈGLE MÉTIER
      bien.quantite = ligne.qte_constatee;
      bien.etat = ligne.etat_recensement;

      await bien.save({ transaction });
    }

    // ✅ Marquer le PV comme validé
    pv.statut = 'VALIDE';
    pv.date_validation = new Date();
    pv.valide_par = userId;

    await pv.save({ transaction });

    await transaction.commit();

    // 🔥 AUDIT
    await AuditService.log(
      req,
      "VALIDATE",
      "RECENSEMENT",
      `Validation du PV N°${pv.id}`
    );

    res.status(200).json({
      message: "PV validé avec succès. Les biens ont été mis à jour."
    });

  } catch (error) {
    await transaction.rollback();
    console.error("❌ Erreur validation PV:", error);

    await AuditService.log(
      req,
      "ERROR",
      "RECENSEMENT",
      `Erreur validation PV ${req.params.id}: ${error.message}`
    );

    res.status(500).json({ message: "Erreur serveur lors de la validation du PV." });
  }
};
