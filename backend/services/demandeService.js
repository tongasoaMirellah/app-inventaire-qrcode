/*import Demande from '../modeles/Demande.js';
import Utilisateur from '../modeles/Utilisateur.js';
import Departement from '../modeles/Departement.js';
import Bien from '../modeles/Bien.js';
import Entree from '../modeles/Entree.js';
import QRCode from 'qrcode';
import { Op } from 'sequelize';
import db from '../modeles/index.js';

export const demandeService = {
    creerDemande: async (data, demandeurId) => {
        const demandeur = await Utilisateur.findByPk(demandeurId);
        if (!demandeur) throw new Error('Utilisateur non trouvé');
        if (!demandeur.departementId) throw new Error('Le demandeur n’a pas de département assigné');

        const demande = await Demande.create({
            ...data,
            demandeurId,
            departementId: demandeur.departementId,
            statut: 'En attente'
        });

        return demande;
    },

    validerDemande: async (demandeId, depositaireId) => {
        // Récupérer la demande avec le demandeur et son département
        const demande = await Demande.findByPk(demandeId, {
            include: [{ model: Utilisateur, as: 'demandeur', include: [{ model: Departement, as: 'departementMembre' }] }]
        });
        if (!demande) throw new Error('Demande non trouvée');
        if (demande.statut !== 'En attente') throw new Error('Demande déjà traitée');

        // Mettre la demande à "Validée"
        demande.statut = 'Validée';
        demande.depositaireId = depositaireId;
        await demande.save();

        // Créer le bien automatiquement et l’affecter
        const { designation, quantite } = demande;
        const departementId = demande.demandeur.departementId;
        const serviceId = demande.demandeur.serviceId || null;

        const annee = new Date().getFullYear();
        const count = await Bien.count({
            where: {
                serviceId,
                date_acquisition: { [Op.between]: [`${annee}-01-01`, `${annee}-12-31`] }
            }
        });
        const numero = String(count + 1).padStart(3, '0');
        const prefix = designation ? designation.substring(0, 3).toUpperCase() : 'AUT';
        const code_bien = `${prefix}${annee}-${numero}`;

        const bien = await Bien.create({
            designation,
            quantite: quantite || 1,
            prix_unitaire: 0,
            date_acquisition: new Date(),
            etat: 'bon',
            mode_acquisition: 'don',
            departementId,
            serviceId,
            code_bien,
            origine: 'Demande validée'
        });

        await Entree.create({
            bien_id: bien.id,
            quantite: quantite || 1,
            date: new Date(),
            motif: 'Création depuis demande validée',
            prix_unitaire: 0
        });

        const qrCodeDataUrl = await QRCode.toDataURL(bien.code_bien, { width: 150 });

        return { demande, bien, qrCodeDataUrl };
    },

    refuserDemande: async (demandeId, commentaire, depositaireId) => {
        const demande = await Demande.findByPk(demandeId);
        if (!demande) throw new Error('Demande non trouvée');

        demande.statut = 'Refusée';
        demande.depositaireCommentaire = commentaire || '';
        demande.depositaireId = depositaireId;
        await demande.save();
        return demande;
    },

    getDemandesEnAttente: async () => {
        return await Demande.findAll({
            where: { statut: 'En attente' },
            order: [['createdAt', 'ASC']],
            include: [
                {
                    model: Utilisateur,
                    as: 'demandeur',
                    attributes: ['id', 'nom', 'email'],
                    include: [
                        { model: Departement, as: 'departementMembre', attributes: ['id', 'nom'], required: false }
                    ]
                }
            ]
        });
    }
};*//*
import Demande from '../modeles/Demande.js';
import Utilisateur from '../modeles/Utilisateur.js';
import Departement from '../modeles/Departement.js';
import Bien from '../modeles/Bien.js';
import Affectation from '../modeles/Affectation.js';
import Entree from '../modeles/Entree.js';
import QRCode from 'qrcode';
import { Op } from 'sequelize';

export const demandeService = {
  creerDemande: async (data, demandeurId) => {
    const demandeur = await Utilisateur.findByPk(demandeurId);
    if (!demandeur) throw new Error('Utilisateur non trouvé');
    if (!demandeur.departementId) throw new Error('Le demandeur n’a pas de département assigné');

    const demande = await Demande.create({
      ...data,
      demandeurId,
      departementId: demandeur.departementId,
      statut: 'En attente'
    });

    return demande;
  },

  validerDemande: async (demandeId, depositaireId) => {
    const demande = await Demande.findByPk(demandeId, {
      include: [{ model: Utilisateur, as: 'demandeur' }]
    });
    if (!demande) throw new Error('Demande non trouvée');
    if (demande.statut !== 'En attente') throw new Error('Demande déjà traitée');

    // Valider la demande
    demande.statut = 'Validée';
    demande.depositaireId = depositaireId;
    await demande.save();

    const { designation, quantite } = demande;
    const departementId = demande.demandeur.departementId;
    const serviceId = demande.demandeur.serviceId || null;

    // Vérifier si le bien existe déjà dans ce département
    let affectation = await Affectation.findOne({
      where: { departementId },
      include: [{
        model: Bien,
        where: { designation }
      }]
    });

    let bien, qrCodeDataUrl;
    if (affectation) {
      // Bien déjà affecté au département → créer une entrée pour augmenter la quantité
      await Entree.create({
        bienId: affectation.bienId,
        departementId,
        quantite,
        date: new Date(),
        motif: 'Augmentation suite à demande validée'
      });
    } else {
      // Bien n'existe pas dans le département → créer le bien et affectation
      const annee = new Date().getFullYear();
      const count = await Bien.count({
        where: { date_acquisition: { [Op.between]: [`${annee}-01-01`, `${annee}-12-31`] } }
      });
      const numero = String(count + 1).padStart(3, '0');
      const prefix = designation ? designation.substring(0,3).toUpperCase() : 'AUT';
      const code_bien = `${prefix}${annee}-${numero}`;

      bien = await Bien.create({
        designation,
        quantite: quantite || 0,
        prix_unitaire: 0,
        date_acquisition: new Date(),
        etat: 'bon',
        mode_acquisition: 'don',
        code_bien,
        statut: 'ACTIF'
      });

      affectation = await Affectation.create({
        bienId: bien.id,
        departementId,
        serviceId,
        depositaireId,
        quantite_affectee: quantite,
        statut: 'ACTIVE'
      });

      qrCodeDataUrl = await QRCode.toDataURL(code_bien, { width: 150 });
    }

    return { demande, bien: bien || null, affectation, qrCodeDataUrl: qrCodeDataUrl || null };
  },

  refuserDemande: async (demandeId, commentaire, depositaireId) => {
    const demande = await Demande.findByPk(demandeId);
    if (!demande) throw new Error('Demande non trouvée');

    demande.statut = 'Refusée';
    demande.depositaireCommentaire = commentaire || '';
    demande.depositaireId = depositaireId;
    await demande.save();
    return demande;
  },

  getDemandesEnAttente: async () => {
    return await Demande.findAll({
      where: { statut: 'En attente' },
      order: [['createdAt','ASC']],
      include: [
        { model: Utilisateur, as: 'demandeur', attributes: ['id','nom','email'],
          include: [{ model: Departement, as: 'departementMembre', attributes:['id','nom'], required: false }]
        }
      ]
    });
  }
};
*/
import Demande from '../modeles/Demande.js';
import Utilisateur from '../modeles/Utilisateur.js';
import Departement from '../modeles/Departement.js';
import Bien from '../modeles/Bien.js';
import Affectation from '../modeles/Affectation.js';
import sequelize from '../config/db.js';
import Entree from '../modeles/Entree.js';
import QRCode from 'qrcode';
import { Op } from 'sequelize';

export const demandeService = {
  creerDemande: async (data, demandeurId) => {
    const demandeur = await Utilisateur.findByPk(demandeurId);
    if (!demandeur) throw new Error('Utilisateur non trouvé');
    if (!demandeur.departementId) throw new Error('Le demandeur n’a pas de département assigné');

    const demande = await Demande.create({
      ...data,
      demandeurId,
      departementId: demandeur.departementId,
      statut: 'En attente'
    });

    return demande;
  },validerDemande: async (demandeId, depositaireId, quantite_affectee) => {
  const demande = await Demande.findByPk(demandeId, {
    include: [{ model: Utilisateur, as: 'demandeur' }]
  });

  if (!demande) throw new Error('Demande non trouvée');
  if (demande.statut !== 'En attente') {
    throw new Error('Demande déjà traitée');
  }

  const designation = demande.designation.trim().toLowerCase();
  const departementId = demande.demandeur.departementId;
  const serviceId = demande.demandeur.serviceId || null;

  // 🔎 Chercher le bien (insensible à la casse)
  const bien = await Bien.findOne({
    where: sequelize.where(
      sequelize.fn('LOWER', sequelize.col('designation')),
      designation
    )
  });

  if (!bien) {
    throw new Error(`Le bien "${demande.designation}" n'existe pas dans l'inventaire.`);
  }

  if (quantite_affectee > bien.quantite) {
    throw new Error(`Stock insuffisant. Disponible : ${bien.quantite}`);
  }

  // 🔎 Chercher une affectation existante
  let affectation = await Affectation.findOne({
    where: {
      bienId: bien.id,
      departementId
    }
  });

  if (!affectation) {
    // ✅ CAS 1 : première affectation → PAS D’ENTRÉE
    affectation = await Affectation.create({
      bienId: bien.id,
      departementId,
      serviceId,
      depositaireId,
      etat: 'bon',
      quantite_affectee,
      statut: 'ACTIVE',
       origine: 'demande'
    });

  } else {
    // ✅ CAS 2 : déjà affecté → ENTRÉE + MAJ affectation
    affectation.quantite_affectee += quantite_affectee;
    await affectation.save();

    await Entree.create({
      bien_id: bien.id,
      departement_id: departementId,
      service_id: serviceId,
      quantite: quantite_affectee,
      date: new Date(),
      motif: 'Augmentation suite à demande validée'
    });
  }

  // 🔻 Mise à jour stock global
  bien.quantite -= quantite_affectee;
  await bien.save();

  // ✅ Valider la demande
  demande.statut = 'Validée';
  demande.depositaireId = depositaireId;
  await demande.save();

  return { demande, bien, affectation };
}
,
  refuserDemande: async (demandeId, commentaire, depositaireId) => {
    const demande = await Demande.findByPk(demandeId);
    if (!demande) throw new Error('Demande non trouvée');

    demande.statut = 'Refusée';
    demande.depositaireCommentaire = commentaire || '';
    demande.depositaireId = depositaireId;
    await demande.save();
    return demande;
  },

  getDemandesEnAttente: async () => {
    return await Demande.findAll({
      where: { statut: 'En attente' },
      order: [['createdAt','ASC']],
      include: [
        { model: Utilisateur, as: 'demandeur', attributes: ['id','nom','email'],
          include: [{ model: Departement, as: 'departementMembre', attributes:['id','nom'], required: false }]
        }
      ]
    });
  }
};
