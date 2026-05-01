import Affectation from '../modeles/Affectation.js';
import Bien from '../modeles/Bien.js';
import Departement from '../modeles/Departement.js';
import { Op } from 'sequelize';
import db from '../modeles/index.js';
import sequelize from '../config/db.js';
import Sortie from '../modeles/Sortie.js';
//import Service from '../modeles/Service.js';
import Entree from '../modeles/Entree.js';
//import Sortie from '../modeles/Sortie.js'; // si tu l'utilises aussi
import Service from '../modeles/Service.js';
//import Departement from '../modeles/Departement.js';
//import Bien from '../modeles/Bien.js';
//import Affectation from '../modeles/Affectation.js';


// Lister toutes les affectations

export const getAffectations = async (req, res) => {
    try {
        console.log("Requête reçue pour getAffectations");

        const affectations = await db.Affectation.findAll({
            include: [
                { model: db.Bien, as: 'bien', attributes: ['code_bien', 'designation'] },
                { model: db.Departement, as: 'departement', attributes: ['nom'] }
            ],
            order: [['createdAt', 'DESC']]
        });

        console.log("Affectations récupérées :", affectations.length);
        res.json(affectations);

    } catch (err) {
        console.error("Erreur Sequelize complète :", err);
        res.status(500).json({
            message: "Erreur interne du serveur",
            erreur: err.message,
            stack: err.stack
        });
    }
};
export const getAffectationById = async (req, res) => {
    try {
        const { id } = req.params;
        const affectation = await Affectation.findByPk(id, {
            include: [
                { model: Bien, as: 'bien' },
                { model: Departement, as: 'departement' },
                //{ model: Service, as: 'service' }, // si tu veux le service
            ]
        });
        if (!affectation) return res.status(404).json({ message: 'Affectation non trouvée' });
        res.json(affectation);
    } catch (err) {
        console.error('Erreur getAffectationById:', err);
        res.status(500).json({ message: err.message });
    }
};
export const createAffectation = async (req, res) => {
    try {
        const { bienId, departementId, serviceId, depositaireId, quantite_affectee, etat } = req.body;
        const affectation = await Affectation.create({
            bienId,
            departementId,
            serviceId,
            etat: 'bon',
            depositaireId,
            quantite_affectee,
            statut: 'ACTIVE'
        });
        res.status(201).json(affectation);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
export const getBiensEnMaintenance = async (req, res) => {
    try {
        const biens = await Affectation.findAll({
            where: { decision_post_recensement: 'maintenance' },
            include: [Bien, Departement]
        });
        res.json(biens);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
export const remettreBienEnService = async (req, res) => {
    try {
        const { affectationId } = req.params;
        const affectation = await Affectation.findByPk(affectationId);
        if (!affectation) return res.status(404).json({ message: 'Affectation non trouvée' });

        affectation.decision_post_recensement = 'aucune';
        affectation.statut = 'ACTIVE';
        await affectation.save();

        res.json({ message: 'Bien remis en service', affectation });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const getBiensToRecensement = async (req, res) => {
    try {
        // Récupérer les affectations actives sans décision post-recensement
        const affectations = await db.Affectation.findAll({
            where: {
                statut: 'ACTIVE'
               // decision_post_recensement: null
            },
            include: [
                {
                    model: db.Bien,
                    as: 'bien', // Important : utiliser l'alias défini dans ton modèle
                    attributes: ['id', 'code_bien', 'designation', 'prix_unitaire', 'quantite']
                },
                {
                    model: db.Departement,
                    as: 'departement', // idem pour l'alias
                    attributes: ['id', 'nom']
                }
            ]
        });

        const affectationsValides = affectations.filter(a => a.bien);
        const biens = affectationsValides.map(a => ({
            id: a.bien.id,
            code_bien: a.bien.code_bien,
            designation: a.bien.designation,
            quantite: a.quantite_affectee,
            prix_unitaire: a.bien.prix_unitaire,
            departement: a.departement?.nom || null,
            affectationId: a.id // référence à l'affectation
        }));

        res.status(200).json(biens);

    } catch (err) {
        console.error("Erreur getBiensToRecensement:", err);
        res.status(500).json({
            message: "Erreur serveur lors de la récupération des biens à recenser.",
            erreur: err.message
        });
    }
};

export const updateAffectation = async (req, res) => {
    try {
        const { id } = req.params;
        const { quantite_affectee, statut, decision_post_recensement } = req.body;
        const affectation = await Affectation.findByPk(id);
        if (!affectation) return res.status(404).json({ message: 'Affectation non trouvée' });

        if (quantite_affectee !== undefined) affectation.quantite_affectee = quantite_affectee;
        if (statut) affectation.statut = statut;
        if (decision_post_recensement) affectation.decision_post_recensement = decision_post_recensement;

        await affectation.save();
        res.json(affectation);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


// Biens nécessitant une décision post-recensement
/*export const getBiensDecision = async (req, res) => {
  try {
    const biens = await Affectation.findAll({
      where: { decision_post_recensement: { [Op.ne]: null } },
      include: [Bien, Departement]
    });
    res.json(biens);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
*/export const getBiensDecision = async (req, res) => {
    try {
        const affectations = await Affectation.findAll({
            where: {
                etat: {
                    [Op.in]: ['mauvais', 'à reformer']
                }
            },
            include: [
                {
                    model: Bien,
                    as: 'bien',
                    attributes: ['id', 'code_bien', 'designation']
                },
                {
                    model: Departement,
                    as: 'departement',
                    attributes: ['id', 'nom']
                }
            ],
            order: [['updatedAt', 'DESC']]
        });

        res.status(200).json(affectations);
    } catch (err) {
        console.error('Erreur getBiensDecision:', err);
        res.status(500).json({ message: err.message });
    }
};
export const deleteAffectation = async (req, res) => {
    try {
        const { id } = req.params;
        const affectation = await Affectation.findByPk(id);
        if (!affectation) return res.status(404).json({ message: 'Affectation non trouvée' });
        await affectation.destroy();
        res.json({ message: 'Affectation supprimée' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Définir une décision post-recensement pour un bien
/*export const setDecisionBien = async (req, res) => {
  try {
    const { affectationId } = req.params;
    const { decision } = req.body;

    if (!['maintenance', 'remplacement', 'aucune'].includes(decision)) {
      return res.status(400).json({ message: 'Décision invalide' });
    }

    const affectation = await Affectation.findByPk(affectationId);
    if (!affectation) {
      return res.status(404).json({ message: 'Affectation non trouvée' });
    }

    affectation.decision_post_recensement = decision;

    // 🔁 mise à jour statut métier
    if (decision === 'maintenance') affectation.statut = 'MAINTENANCE';
    else if (decision === 'remplacement') affectation.statut = 'REFORME';
    else affectation.statut = 'ACTIVE';

    await affectation.save();

    res.json(affectation);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
*/
// Exemple dans ton controller setDecisionBien
/*
export const setDecisionBien = async (req, res) => {
    const { affectationId } = req.params;
    const { decision, reparable } = req.body; // réparabilité envoyée par le frontend

    const t = await sequelize.transaction();
    try {
        const affectation = await Affectation.findByPk(affectationId, { transaction: t });
        if (!affectation) return res.status(404).json({ message: 'Affectation non trouvée' });

        affectation.decision_post_recensement = decision;

        // 🔹 Maintenance réparable
        if (decision === 'maintenance' || decision === 'maintenance_reparable') {
            affectation.statut = 'MAINTENANCE';
            affectation.reparable = reparable ?? true;

        // 🔹 Maintenance irréparable → sortie automatique
        } else if (decision === 'maintenance_irreparable') {
            affectation.statut = 'MAINTENANCE';
            affectation.reparable = false;
            response.requiresSortie = true;

            // Création automatique de la sortie
            /*if (affectation.quantite_affectee > 0) {
                await Sortie.create({
                    affectation_id: affectation.id,
                    date: new Date(),
                    motif: 'Bien irréparable après maintenance',
                    quantite: affectation.quantite_affectee,
                    type: 'SORTIE_IRREPARABLE'
                }, { transaction: t });

                // On vide le stock actif
                affectation.quantite_affectee = 0;
            }*

        // 🔹 Remplacement
        } else if (decision === 'remplacement') {
            affectation.statut = 'REFORME';
            affectation.reparable = false;

        // 🔹 Aucun / autre
        } else {
            affectation.statut = 'ACTIVE';
            affectation.reparable = true;
        }

        await affectation.save({ transaction: t });
        await t.commit();

        console.log('MAJ Affectation:', affectation.toJSON());
        res.json(affectation);
    } catch (err) {
        await t.rollback();
        console.error(err);
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
};

*/
export const setDecisionBien = async (req, res) => {
    const { affectationId } = req.params;
    const { decision, reparable } = req.body;

    const t = await sequelize.transaction();
    try {
        const affectation = await Affectation.findByPk(affectationId, { transaction: t });
        if (!affectation) return res.status(404).json({ message: 'Affectation non trouvée' });

        affectation.decision_post_recensement = decision;

        let requiresSortie = false; // ⚡ nouveau flag pour le frontend

        if (decision === 'maintenance' || decision === 'maintenance_reparable') {
            affectation.statut = 'MAINTENANCE';
            affectation.reparable = reparable ?? true;

        } else if (decision === 'maintenance_irreparable') {
            affectation.statut = 'MAINTENANCE';
            affectation.reparable = false;
            requiresSortie = true; // ⚡ ici on signale la sortie

            // Création automatique de la sortie si nécessaire
            /*if (affectation.quantite_affectee > 0) {
                await Sortie.create({
                    affectation_id: affectation.id,
                    date: new Date(),
                    motif: 'Bien irréparable après maintenance',
                    quantite: affectation.quantite_affectee,
                    type: 'SORTIE_IRREPARABLE'
                }, { transaction: t });

                affectation.quantite_affectee = 0;
            }*/

        } else if (decision === 'remplacement') {
            affectation.statut = 'REFORME';
            affectation.reparable = false;

        } else {
            affectation.statut = 'ACTIVE';
            affectation.reparable = true;
            affectation.etat = 'bon';
        }

        await affectation.save({ transaction: t });
        await t.commit();

        console.log('MAJ Affectation:', affectation.toJSON());

        // ⚡ On renvoie l'affectation + flag requiresSortie
        res.json({ ...affectation.toJSON(), requiresSortie });

    } catch (err) {
        await t.rollback();
        console.error(err);
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
};

/*export const setDecisionBien = async (req, res) => {
  try {
    const { affectationId } = req.params;
    const { decision } = req.body;
    const affectation = await Affectation.findByPk(affectationId);
    if (!affectation) return res.status(404).json({ message: 'Affectation non trouvée' });

    affectation.decision_post_recensement = decision;
    await affectation.save();
    res.json(affectation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
*/
export const getAffectationDetail = async (req, res) => {
  try {
    const { id } = req.params;

    // Récupérer l'affectation avec ses relations
  const affectation = await Affectation.findByPk(id, {
  include: [
    { model: Bien, as: 'bien', attributes: ['id', 'code_bien', 'designation', 'quantite'] },
    { model: Departement, as: 'departement', attributes: ['id', 'nom'] },
    { model: Service, as: 'service', attributes: ['id', 'nom'] },
    { 
      model: Entree, 
      as: 'entrees', 
      attributes: ['id', 'quantite', 'date', 'motif', 'valeur'], 
      include: [{ model: Bien, as: 'bien', attributes: ['code_bien'] }]  // ✅ correspond à Entree
    },
    { 
      model: Sortie, 
      as: 'sorties', 
      attributes: ['id', 'quantite', 'date', 'motif', 'type'], 
      include: [{ model: Bien, as: 'bienSortie', attributes: ['code_bien'] }] // ✅ correction
    }
  ]
});


    if (!affectation) return res.status(404).json({ message: 'Affectation non trouvée' });

    res.json(affectation);

  } catch (err) {
    console.error('Erreur getAffectationDetail:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};