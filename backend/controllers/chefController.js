import db from '../modeles/index.js';
import { fn, col } from 'sequelize';

const { Bien, Demande, Utilisateur, Service, Nomenclature } = db;

/**
 * 📊 Tableau de bord du chef de département
 */
export const getChefDashboard = async (req, res) => {
  try {
    const departementId = req.user.departementId;

    // Total biens
    const totalBiens = await Bien.count({ where: { departementId } });

    // Biens par état
    const biensParEtat = await Bien.findAll({
      where: { departementId },
      attributes: [
        'etat',
        [fn('COUNT', col('id')), 'total']
      ],
      group: ['etat']
    });

    // Derniers biens ajoutés (5 derniers)
    const derniersBiens = await Bien.findAll({
      where: { departementId },
      include: [
        { model: Nomenclature, as: 'nomenclature', attributes: ['code'] },
        { model: Service, as: 'service', attributes: ['nom'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    // Demandes par statut
    const demandesParStatutRaw = await Demande.findAll({
      where: { departementId },
      attributes: [
        'statut',
        [fn('COUNT', col('id')), 'total']
      ],
      group: ['statut']
    });

    // Transformer en objet pour badges
    const demandesStatut = {
      total: 0,
      enAttente: 0,
      validees: 0,
      refusees: 0
    };
    demandesParStatutRaw.forEach(d => {
      const t = parseInt(d.get('total'));
      demandesStatut.total += t;
      if (d.statut === 'En attente') demandesStatut.enAttente = t;
      else if (d.statut === 'Validée') demandesStatut.validees = t;
      else if (d.statut === 'Refusée') demandesStatut.refusees = t;
    });

    // Dernières demandes (5 dernières)
    const dernieresDemandes = await Demande.findAll({
      where: { departementId },
      include: [
        {
          model: Utilisateur,
          as: 'demandeur',
          attributes: ['id', 'nom', 'matricule']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    res.json({
      biens: {
        total: totalBiens,
        parEtat: biensParEtat,
        derniers: derniersBiens
      },
      demandes: {
        ...demandesStatut,
        dernieres: dernieresDemandes
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur tableau de bord chef" });
  }
};

/**
 * 📦 Biens du département du chef
 */
export const getBiensChef = async (req, res) => {
  try {
    const departementId = req.user.departementId;

    const biens = await Bien.findAll({
      where: { departementId },
      include: [
        { model: Nomenclature, as: 'nomenclature' },
        { model: Service, as: 'service' }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(biens);

  } catch (error) {
    res.status(500).json({ message: "Erreur récupération biens" });
  }
};

/**
 * 📑 Demandes du département
 */
export const getDemandesChef = async (req, res) => {
  try {
    const departementId = req.user.departementId;

    const demandes = await Demande.findAll({
      where: { departementId },
      include: [
        {
          model: Utilisateur,
          as: 'demandeur',
          attributes: ['id', 'nom', 'matricule']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(demandes);

  } catch (error) {
    res.status(500).json({ message: "Erreur récupération demandes" });
  }
};
