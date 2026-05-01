/*import Sortie from '../modeles/Sortie.js';
import Bien from '../modeles/Bien.js';
import Service from '../modeles/Service.js';
import sequelize from '../config/db.js';
import { Op } from 'sequelize'; // Importation nécessaire si vous deviez faire des requêtes WHERE complexes, mais non utilisé ici.

// ➕ Créer une sortie (déduction de stock)
/*export const createSortie = async (req, res) => {
  // 1. Démarrer la transaction
  const t = await sequelize.transaction();

  try {
    const { bien_id, date, motif, quantite, valeur, type, service_id } = req.body;

    // 🚨 Log de Diagnostic (Début)
    console.log(`--- TENTATIVE DE SORTIE ---`);
    console.log(`ID du Bien: ${bien_id} | Quantité demandée: ${quantite}`);

    // 2. Récupérer le bien dans la transaction
    const bien = await Bien.findByPk(bien_id, { transaction: t });

    if (!bien) {
      await t.rollback();
      return res.status(404).json({ message: "Bien non trouvé." });
    }

    // 🚨 Log de Diagnostic (Stock Actuel)
    console.log(`Quantité en STOCK (actuelle): ${bien.quantite}`);

    // 3. Vérification de la suffisance du stock
    if (quantite > bien.quantite) {
      await t.rollback();
      return res.status(400).json({ message: "Quantité demandée supérieure au stock disponible." });
    }

    // 4. Création de l'historique de sortie
    // Note: 'valeur' doit être le CMUP du bien, envoyé depuis le frontend.
    await Sortie.create({ bien_id, date, motif, quantite, valeur, type, service_id }, { transaction: t });

    // 5. Calcul de la nouvelle quantité
    const nouvelleQuantite = bien.quantite - quantite; // <-- DÉDUCTION DE STOCK

    // 🚨 Log de Diagnostic (Nouvelle Quantité)
    console.log(`Nouvelle Quantité CALCULÉE: ${nouvelleQuantite}`);

    // 6. Préparation de la mise à jour
    const updateFields = { quantite: nouvelleQuantite };
    // Logique optionnelle : si c'est une destruction, changer l'état
    if (type === 'destruction') updateFields.etat = 'mauvais';

    // 7. Mise à jour du Bien
    await Bien.update(updateFields, { where: { id: bien_id }, transaction: t });

    // 8. Finaliser la transaction
    await t.commit();

    // 🚨 Log de Diagnostic (Fin)
    console.log(`--- SORTIE ID ${bien_id} COMMITTÉE AVEC SUCCÈS (Nouveau stock: ${nouvelleQuantite}) ---`);

    res.status(201).json({ message: "Sortie enregistrée et bien mis à jour" });
  } catch (err) {
    // 9. Annuler la transaction en cas d'erreur
    await t.rollback();
    console.error("❌ Erreur critique de transaction lors de la sortie:", err);
    res.status(500).json({ message: "Échec critique de l'opération de sortie.", details: err.message });
  }
};*
export const createSortie = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { bien_id, date, motif, quantite, valeur, type, service_id, departement_id } = req.body;

    // Récupérer l'affectation correspondant
    const affectation = await Affectation.findOne({
      where: { bienId: bien_id, serviceId: service_id, departementId: departement_id },
      transaction: t
    });

    if (!affectation) {
      await t.rollback();
      return res.status(404).json({ message: "Affectation non trouvée pour ce bien/service/département." });
    }

    // Vérifier qu'il y a assez de quantite_affectee
    if (quantite > affectation.quantite_affectee) {
      await t.rollback();
      return res.status(400).json({ message: "Quantité demandée supérieure à la quantité affectée." });
    }

    // Créer l'entrée dans la table Sortie
    await Sortie.create({ bien_id, date, motif, quantite, valeur, type, service_id }, { transaction: t });

    // Décrémenter la quantité dans Affectation
    await affectation.decrement('quantite_affectee', { by: quantite, transaction: t });

    await t.commit();
    res.status(201).json({ message: "Sortie enregistrée et affectation mise à jour" });
  } catch (err) {
    await t.rollback();
    console.error("Erreur sortie:", err);
    res.status(500).json({ message: "Erreur lors de la sortie", details: err.message });
  }
};


// 📋 Récupérer toutes les sorties
export const getAllSorties = async (req, res) => {
  try {
    // ... (Logique inchangée)
    const sorties = await Sortie.findAll({
      include: [
        { model: Bien, as: 'bien' },
        { model: Service, as: 'service' }
      ],
      order: [['date', 'DESC']]
    });
    res.json(sorties);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔍 Récupérer une sortie par ID
export const getSortieById = async (req, res) => {
  try {
    // ... (Logique inchangée)
    const sortie = await Sortie.findByPk(req.params.id, {
      include: [
        { model: Bien, as: 'bien' },
        { model: Service, as: 'service' }
      ]
    });
    if (!sortie) return res.status(404).json({ message: "Sortie non trouvée" });
    res.json(sortie);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✏️ Mettre à jour une sortie (Note: la mise à jour complexe du stock nécessite une logique CMUP inverse)
export const updateSortie = async (req, res) => {
  try {
    // ... (Logique de mise à jour simple sans ajustement de stock ici)
    const { id } = req.params;
    const { bien_id, date, motif, valeur, type, service_id } = req.body;

    const sortie = await Sortie.findByPk(id);
    if (!sortie) return res.status(404).json({ message: "Sortie non trouvée" });

    // ATTENTION : Si la quantité était modifiée ici, une logique inverse CMUP serait nécessaire.
    await sortie.update({ bien_id, date, motif, valeur, type, service_id });

    res.json({ message: "Sortie mise à jour avec succès", sortie });
  } catch (err) {
    console.error("Erreur update sortie:", err);
    res.status(500).json({ message: "Erreur lors de la mise à jour de la sortie" });
  }
};

// 🗑️ Supprimer une sortie (Note: la suppression nécessite une logique CMUP inverse pour réintégrer le stock)
export const deleteSortie = async (req, res) => {
  // ... (Logique de suppression simple sans ajustement de stock ici)
  try {
    const { id } = req.params;

    const sortie = await Sortie.findByPk(id);
    if (!sortie) return res.status(404).json({ message: "Sortie non trouvée" });

    await sortie.destroy();
    res.json({ message: "Sortie supprimée avec succès" });
  } catch (err) {
    console.error("Erreur suppression sortie:", err);
    res.status(500).json({ message: "Erreur lors de la suppression de la sortie" });
  }
};*/

import Sortie from '../modeles/Sortie.js';
import Affectation from '../modeles/Affectation.js';
import sequelize from '../config/db.js';

/**
 * ➖ Créer une sortie
 * Diminue quantite_affectee dans affectation
 */
export const createSortie = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { affectation_id, date, motif, quantite, valeur,type , service_id} = req.body;

    // 1️⃣ Vérifier que l'affectation existe
    const affectation = await Affectation.findByPk(affectation_id, { transaction: t });
    if (!affectation) {
      await t.rollback();
      return res.status(404).json({ message: 'Affectation introuvable' });
    }

    // 2️⃣ Vérifier que le stock est suffisant
    if (quantite > affectation.quantite_affectee) {
      await t.rollback();
      return res.status(400).json({
        message: `Stock insuffisant (disponible : ${affectation.quantite_affectee})`
      });
    }

    // 3️⃣ Créer la sortie
    const sortie = await Sortie.create({
      affectation_id,
      date,
      motif,
      valeur,
      service_id,
      quantite,
      type
    }, { transaction: t });

    // 4️⃣ Décrémenter le stock affecté
    const nouvelleQuantite = affectation.quantite_affectee - quantite;
    await affectation.update({ quantite_affectee: nouvelleQuantite }, { transaction: t });

    await t.commit();
    res.status(201).json({
      message: 'Sortie enregistrée avec succès',
      sortie
    });

  } catch (error) {
    await t.rollback();
    console.error('Erreur création sortie:', error);
    res.status(500).json({ message: 'Erreur création sortie', error: error.message });
  }
};

/**
 * 📋 Liste de toutes les sorties
 */
/*export const getAllSorties = async (req, res) => {
  try {
    const sorties = await Sortie.findAll({
      include: [{ model: Affectation }],
      order: [['date', 'DESC']]
    });
    res.json(sorties);
    console.log("REQ BODY SORTIE =", req.body);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};*/
export const getAllSorties = async (req, res) => {
  try {
    const sorties = await Sortie.findAll({
      include: [
        { model: Affectation, as: 'affectation', include: ['bien', 'service'] }
      ],
      order: [['date', 'DESC']]
    });
    res.json(sorties);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};


/**
 * 🔍 Détail sortie par ID
 */
export const getSortieById = async (req, res) => {
  try {
    const sortie = await Sortie.findByPk(req.params.id, {
      include: [{ model: Affectation }]
    });

    if (!sortie) {
      return res.status(404).json({ message: 'Sortie non trouvée' });
    }

    res.json(sortie);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * ✏️ Modifier une sortie
 * Ajuste automatiquement quantite_affectee
 */
export const updateSortie = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { date, motif, quantite, type } = req.body;

    const sortie = await Sortie.findByPk(id, { transaction: t });
    if (!sortie) {
      await t.rollback();
      return res.status(404).json({ message: 'Sortie non trouvée' });
    }

    const affectation = await Affectation.findByPk(sortie.affectation_id, { transaction: t });
    if (!affectation) {
      await t.rollback();
      return res.status(404).json({ message: 'Affectation introuvable' });
    }

    // Différence de quantité
    const diff = quantite - sortie.quantite;

    if (diff > 0 && diff > affectation.quantite_affectee) {
      await t.rollback();
      return res.status(400).json({
        message: 'Quantité demandée supérieure au stock affecté disponible'
      });
    }

    // Ajustement stock
    if (diff > 0) {
      await affectation.decrement('quantite_affectee', { by: diff, transaction: t });
    } else if (diff < 0) {
      await affectation.increment('quantite_affectee', { by: Math.abs(diff), transaction: t });
    }

    // Mise à jour sortie
    await sortie.update({ date, motif, quantite, type }, { transaction: t });

    await t.commit();
    res.json({ message: 'Sortie mise à jour avec succès', sortie });

  } catch (error) {
    await t.rollback();
    console.error('Erreur update sortie:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * 🗑️ Supprimer une sortie
 * Réintègre la quantité dans affectation
 */
export const deleteSortie = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const sortie = await Sortie.findByPk(req.params.id, { transaction: t });
    if (!sortie) {
      await t.rollback();
      return res.status(404).json({ message: 'Sortie non trouvée' });
    }

    const affectation = await Affectation.findByPk(sortie.affectation_id, { transaction: t });
    if (affectation) {
      await affectation.increment('quantite_affectee', {
        by: sortie.quantite,
        transaction: t
      });
    }

    await sortie.destroy({ transaction: t });
    await t.commit();

    res.json({ message: 'Sortie supprimée et stock réintégré' });

  } catch (error) {
    await t.rollback();
    console.error('Erreur suppression sortie:', error);
    res.status(500).json({ message: error.message });
  }
};
