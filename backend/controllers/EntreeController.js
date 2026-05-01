// backend/controllers/EntreeController.js
/*
import Bien from '../modeles/Bien.js';
import Entree from '../modeles/Entree.js';
import sequelize from '../config/db.js';

// ➕ Créer une entrée et mettre à jour la quantité et le CMUP du bien (avec transaction)
export const createEntree = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        // 'valeur' correspond ici au prix unitaire de la nouvelle entrée
        const { bien_id, date, motif, quantite, valeur } = req.body;

        const bien = await Bien.findByPk(bien_id, { transaction: t });
        if (!bien) {
            await t.rollback();
            return res.status(404).json({ message: "Bien introuvable." });
        }

        // --- 🚨 DÉBUT NOUVELLE LOGIQUE CMUP ---

        // 1. Calculer les valeurs totales
        // Note: bien.prix_unitaire contient le CMUP actuel du stock
        const ancienneValeurTotale = bien.quantite * bien.prix_unitaire;
        const nouvelleValeurEntree = quantite * valeur;
        
        const nouvelleQuantiteTotale = bien.quantite + quantite;
        
        let nouveauPrixUnitaireCMUP;

        if (nouvelleQuantiteTotale > 0) {
            // Formule CMUP : (Valeur Stock Actuel + Valeur Entrée) / Nouvelle Quantité
            nouveauPrixUnitaireCMUP = (ancienneValeurTotale + nouvelleValeurEntree) / nouvelleQuantiteTotale;
        } else {
            // Cas exceptionnel où la quantité totale est zéro (pour éviter division par zéro)
            nouveauPrixUnitaireCMUP = bien.prix_unitaire; 
        }
        
        // --- 🚨 FIN NOUVELLE LOGIQUE CMUP ---

        // 1. Création de l'historique d'entrée (utilise le prix de l'achat, 'valeur')
        await Entree.create({
            bien_id, date, motif, quantite, valeur
        }, { transaction: t });

        // 2. Mise à jour du stock réel et du CMUP (MODIFIÉ)
        await Bien.update(
            { 
                quantite: nouvelleQuantiteTotale,
                // 🚨 Mise à jour du prix unitaire avec le CMUP
                prix_unitaire: nouveauPrixUnitaireCMUP 
            }, 
            { where: { id: bien_id }, transaction: t }
        );

        await t.commit();
        res.status(201).json({ message: "Entrée enregistrée et stock mis à jour." });
    } catch (error) {
        await t.rollback();
        console.error("Erreur lors de la création de l'entrée :", error);
        res.status(500).json({ message: "Échec de l'opération d'entrée.", details: error.message });
    }
};*/

//import Entree from '../modeles/Entree.js';
//import Affectation from '../modeles/Affectation.js';
//import Bien from '../modeles/Bien.js';

import Entree from '../modeles/Entree.js';
import Affectation from '../modeles/Affectation.js';
import Bien from '../modeles/Bien.js';
import sequelize from '../config/db.js';
export const createEntree = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { affectation_id, quantite, motif } = req.body;

    if (!affectation_id || !quantite) {
      return res.status(400).json({ message: 'Champs obligatoires manquants' });
    }

    // Récupérer l'affectation existante
    const affectation = await Affectation.findByPk(affectation_id, { transaction: t });
    if (!affectation) {
      await t.rollback();
      return res.status(400).json({ message: 'Affectation inexistante' });
    }

    // Vérifier que le stock du bien associé est suffisant
    const bien = await Bien.findByPk(affectation.bienId, { transaction: t });
    if (!bien) {
      await t.rollback();
      return res.status(400).json({ message: 'Bien inexistant' });
    }

    if (bien.quantite < quantite) {
      await t.rollback();
      return res.status(400).json({ message: 'Quantité en stock insuffisante' });
    }

    // Créer l'entrée
    const entree = await Entree.create({
      affectation_id,
      bien_id: affectation.bienId,
      departement_id: affectation.departementId,
      service_id: affectation.serviceId,
      quantite,
      motif,
      date: new Date()
    }, { transaction: t });

    // Mettre à jour la quantité affectée
    await affectation.increment('quantite_affectee', { by: quantite, transaction: t });

    // Décrémenter le stock du bien
    await bien.decrement('quantite', { by: quantite, transaction: t });

    await t.commit();
    res.status(201).json(entree);

  } catch (err) {
    await t.rollback();
    console.error('Erreur createEntree:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};
