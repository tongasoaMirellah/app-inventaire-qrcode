/*import db from '../modeles/index.js';
import Bien from '../modeles/Bien.js';
import Service from '../modeles/Service.js';
import Nomenclature from '../modeles/Nomenclature.js';
import Departement from '../modeles/Departement.js';

import { Op } from 'sequelize';
import AuditService from '../services/auditService.js';
import QRCode from 'qrcode';
import Entree from '../modeles/Entree.js';
import Sortie from '../modeles/Sortie.js';

const sequelize = db.sequelize;

// 🔥🔥🔥 CREATE BIEN + AUDIT
/*export const createBien = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { designation, nomenclatureId, prix_unitaire, quantite, date_acquisition, etat, mode_acquisition, serviceId, departementId, origine } = req.body;

        const quantiteInitiale = quantite || 1;

        // Vérifier que le service existe
        const service = await Service.findByPk(serviceId, { transaction: t });
        if (!service) {
            await t.rollback();
            return res.status(400).json({ message: `Service (ID: ${serviceId}) invalide ou inexistant.` });
        }
        let departement = null;

        if (departementId) {
            departement = await Departement.findByPk(departementId, { transaction: t });
            if (!departement) {
                await t.rollback();
                return res.status(400).json({ message: `Département (ID: ${departementId}) invalide ou inexistant.` });
            }
        }

        const annee = new Date(date_acquisition).getFullYear();

        // Générer le numéro et code unique du bien
        const count = await Bien.count({
            where: {
                serviceId,
                date_acquisition: { [Op.between]: [`${annee}-01-01`, `${annee}-12-31`] }
            }
        });
        const numero = String(count + 1).padStart(3, '0');
        const prefix = designation ? designation.substring(0, 3).toUpperCase() : 'AUT';
        const code_bien = `${prefix}${annee}-${numero}`;

        // Définir le mode d'acquisition : Achat ou Don (par défaut Achat)
        const mode = mode_acquisition && ['Achat', 'Don'].includes(mode_acquisition) ? mode_acquisition : 'Achat';

        // Créer le bien
        const bien = await Bien.create({
            designation: designation || 'Bien issu de demande',
            nomenclatureId,
            prix_unitaire: prix_unitaire || 0,
            date_acquisition: date_acquisition || new Date(),
            etat: etat || 'Neuf',
            mode_acquisition: mode,
            serviceId,
            departementId,
            code_bien,
            origine: origine || null // Exemple : "Demande validée"
        }, { transaction: t });

        // Créer l'entrée initiale (quantité)
        await Entree.create({
            bien_id: bien.id,
            quantite: quantiteInitiale,
            date: date_acquisition || new Date(),
            motif: `Acquisition initiale (${mode})`,
            prix_unitaire: prix_unitaire || 0
        }, { transaction: t });

        await t.commit();

        // Récupérer le bien complet avec associations
        const bienComplet = await Bien.findByPk(bien.id, {
            include: [
                { model: Service, as: 'service' },
                { model: Nomenclature, as: 'nomenclature', attributes: ['id', 'code'] }
            ]
        });

        await AuditService.log(req,
            "Création",
            "Biens",
            `Bien créé : ${bien.designation} (${bien.code_bien})`
        );

        const qrCodeDataUrl = await QRCode.toDataURL(bien.code_bien, { type: 'image/png', width: 150 });

        res.status(201).json({
            message: 'Bien créé avec succès.',
            bien: bienComplet,
            qrCodeDataUrl
        });

    } catch (err) {
        await t.rollback();
        console.error("Erreur création bien:", err);
        res.status(500).json({ message: err.message });
    }

};**
export const createBien = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const {
            designation,
            nomenclatureId,
            prix_unitaire,
            quantite,
            date_acquisition,
            etat,
            mode_acquisition,
            serviceId,
            departementId,
            origine,
            demandeId
        } = req.body;

        // Quantité minimale
        const quantiteInitiale = quantite || 1;

        // Vérifier le service
        const service = await Service.findByPk(serviceId, { transaction: t });
        if (!service) {
            await t.rollback();
            return res.status(400).json({ message: `Service (ID: ${serviceId}) invalide ou inexistant.` });
        }

        // Vérifier le département si fourni
        let departement = null;
        if (departementId) {
            departement = await Departement.findByPk(departementId, { transaction: t });
            if (!departement) {
                await t.rollback();
                return res.status(400).json({ message: `Département (ID: ${departementId}) invalide ou inexistant.` });
            }
        }

        const annee = new Date(date_acquisition).getFullYear();

        // Générer le numéro et code unique
        const count = await Bien.count({
            where: {
                serviceId,
                date_acquisition: { [Op.between]: [`${annee}-01-01`, `${annee}-12-31`] }
            }
        });
        const numero = String(count + 1).padStart(3, '0');
        const prefix = designation ? designation.substring(0, 3).toUpperCase() : 'AUT';
        const code_bien = `${prefix}${annee}-${numero}`;

        // Définir le mode d'acquisition
        const mode = mode_acquisition && ['Achat', 'Don'].includes(mode_acquisition) ? mode_acquisition : 'Achat';

        // Validation du prix unitaire
        let prixFinal = prix_unitaire || 0;
        if (mode === 'Achat') {
            if (!prix_unitaire || prix_unitaire < 50000) {
                await t.rollback();
                return res.status(400).json({
                    message: "Pour un achat, le prix unitaire doit être supérieur ou égal à 50 000."
                });
            }
        } else if (mode === 'Don') {
            prixFinal = 0; // Les dons n'ont pas de prix
        }

        // Création du bien
        const bien = await Bien.create({
            designation: designation || 'Bien issu de demande',
            nomenclatureId,
            prix_unitaire: prixFinal,
            quantite: quantiteInitiale,
            date_acquisition: date_acquisition || new Date(),
            etat: etat || 'Neuf',
            mode_acquisition: mode,
            serviceId,
            departementId,
            code_bien,
            origine: origine || null
        }, { transaction: t });

        await t.commit();

        // Récupérer le bien complet avec associations
        const bienComplet = await Bien.findByPk(bien.id, {
            include: [
                { model: Service, as: 'service' },
                { model: Nomenclature, as: 'nomenclature', attributes: ['id', 'code'] }
            ]
        });

        // Audit
        await AuditService.log(req,
            "Création",
            "Biens",
            `Bien créé : ${bien.designation} (${bien.code_bien}). Stock initial : ${quantiteInitiale}.`
        );

        // Génération QR Code
        const qrCodeDataUrl = await QRCode.toDataURL(bien.code_bien, { type: 'image/png', width: 150 });

        res.status(201).json({
            message: `Bien créé avec succès. Stock initial : ${quantiteInitiale}.`,
            bien: bienComplet,
            qrCodeDataUrl,
            demandeId
        });

    } catch (err) {
        await t.rollback();
        console.error("Erreur création bien:", err);
        res.status(500).json({ message: err.message });
    }
};



/*export const createBien = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        // Récupération des données, y compris les valeurs d'initialisation
        const { designation, nomenclatureId, prix_unitaire, quantite, date_acquisition, etat, mode_acquisition, serviceId, departementId, origine, demandeId } = req.body; 

        // 🚨 Utilisation des valeurs fournies pour l'initialisation
        const quantiteInitiale = quantite || 1; // Si non fourni, au moins 1
        const prixUnitaireInitial = prix_unitaire || 0; 

        // --- 1. Vérifications (à implémenter si ce n'est pas fait ailleurs) ---
        // Ex: Vérification de l'existence de Service et Département...
        
        // ... (Vérifications service et département, comme dans le code commenté précédent)

        const annee = new Date(date_acquisition).getFullYear();

        // Générer le numéro et code unique du bien (Logique inchangée)
        const count = await Bien.count({
            where: {
                serviceId,
                date_acquisition: { [Op.between]: [`${annee}-01-01`, `${annee}-12-31`] }
            }
        });
        const numero = String(count + 1).padStart(3, '0');
        const prefix = designation ? designation.substring(0, 3).toUpperCase() : 'AUT';
        const code_bien = `${prefix}${annee}-${numero}`;

        // Définir le mode d'acquisition : Achat ou Don (par défaut Achat)
        const mode = mode_acquisition && ['Achat', 'Don'].includes(mode_acquisition) ? mode_acquisition : 'Achat';

        // Créer le bien (Enregistrement de l'actif)
        const bien = await Bien.create({
            designation: designation || 'Bien issu de demande',
            nomenclatureId,
            prix_unitaire: prixUnitaireInitial, // 🚨 Utilise le prix unitaire initial fourni
            quantite: quantiteInitiale, // 🚨 Utilise la quantité initiale fournie
            date_acquisition: date_acquisition || new Date(),
            etat: etat || 'Neuf',
            mode_acquisition: mode,
            serviceId,
            departementId,
            code_bien,
            origine: origine || null // Exemple : "Demande validée"
        }, { transaction: t });

        // 🚫 RETRAIT DE LA CRÉATION AUTOMATIQUE D'ENTRÉE (Séparation stricte maintenue)

        await t.commit();

        // Récupérer le bien complet avec associations
        const bienComplet = await Bien.findByPk(bien.id, {
            include: [
                { model: Service, as: 'service' },
                { model: Nomenclature, as: 'nomenclature', attributes: ['id', 'code'] }
            ]
        });

        await AuditService.log(req,
            "Création",
            "Biens",
            `Bien créé : ${bien.designation} (${bien.code_bien}). Stock initial fixé à ${quantiteInitiale}.`
        );

        const qrCodeDataUrl = await QRCode.toDataURL(bien.code_bien, { type: 'image/png', width: 150 });

        res.status(201).json({
            message: `Bien créé avec succès. Stock initial : ${quantiteInitiale}. L'enregistrement de l'entrée est requis pour la traçabilité.`,
            bien: bienComplet,
            qrCodeDataUrl,
            demandeId: demandeId 
        });

    } catch (err) {
        await t.rollback();
        console.error("Erreur création bien:", err);
        res.status(500).json({ message: err.message });
    }
};
*
// 📋 GET ALL BIENS + AUDIT
export const getAllBiens = async (req, res) => {
    try {
        const biens = await Bien.findAll({
            include: [
                { model: Service, as: 'service' },
                { model: Nomenclature, as: 'nomenclature', attributes: ['id', 'code'] },
                { model: Departement, as: 'departement', attributes: ['id', 'nom', 'code'] }
            ],
            order: [['id', 'ASC']]
        });

        await AuditService.log(req, "Consultation", "Biens", "Affichage de la liste complète des biens");
        res.json(biens);
    } catch (err) {
        console.error("Erreur getAllBiens:", err);
        res.status(500).json({ message: err.message });
    }
};

// 🔍 GET BIEN BY ID + AUDIT
export const getBienById = async (req, res) => {
    try {
        const bien = await Bien.findByPk(req.params.id, {
            include: [
                { model: Service, as: 'service' },
                { model: Nomenclature, as: 'nomenclature', attributes: ['id', 'code'] },
                { model: Departement, as: 'departement', attributes: ['id', 'nom', 'code'] },
                {
                    model: Sortie,
                    as: 'sorties',
                    limit: 1,
                    order: [['date', 'DESC']],
                    required: false
                }
            ]
        });

        if (!bien) return res.status(404).json({ message: 'Bien non trouvé' });

        await AuditService.log(req,
            "Consultation",
            "Biens",
            `Consultation du bien ID ${req.params.id}`
        );

        res.json(bien);
    } catch (err) {
        console.error("Erreur getBienById:", err);
        res.status(500).json({ message: err.message });
    }
};

// ✏️ UPDATE BIEN + AUDIT
/*export const updateBien = async (req, res) => {
    try {
        const bien = await Bien.findByPk(req.params.id);
        if (!bien) return res.status(404).json({ message: 'Bien non trouvé' });

        await bien.update(req.body);

        await AuditService.log(req,
            "Modification",
            "Biens",
            `Bien modifié : ${bien.designation} (${bien.code_bien})`
        );

        res.json({ message: 'Bien mis à jour avec succès', bien });
    } catch (err) {
        console.error("Erreur updateBien:", err);
        res.status(500).json({ message: err.message });
    }
};**
export const updateBien = async (req, res) => {
    try {
        const bien = await Bien.findByPk(req.params.id);
        if (!bien) return res.status(404).json({ message: 'Bien non trouvé' });

        const {
            designation,
            nomenclatureId,
            prix_unitaire,
            quantite,
            date_acquisition,
            etat,
            mode_acquisition,
            serviceId,
            departementId,
            origine
        } = req.body;

        // Définir le mode d'acquisition actuel ou celui fourni
        const mode = mode_acquisition && ['Achat', 'Don'].includes(mode_acquisition) ? mode_acquisition : bien.mode_acquisition;

        // Validation du prix unitaire
        let prixFinal = prix_unitaire !== undefined ? prix_unitaire : bien.prix_unitaire;
        if (mode === 'Achat') {
            if (!prixFinal || prixFinal < 50000) {
                return res.status(400).json({
                    message: "Pour un achat, le prix unitaire doit être supérieur ou égal à 50 000."
                });
            }
        } else if (mode === 'Don') {
            prixFinal = 0; // Les dons n'ont pas de prix
        }

        // Mise à jour du bien
        await bien.update({
            designation: designation !== undefined ? designation : bien.designation,
            nomenclatureId: nomenclatureId !== undefined ? nomenclatureId : bien.nomenclatureId,
            prix_unitaire: prixFinal,
            quantite: quantite !== undefined ? quantite : bien.quantite,
            date_acquisition: date_acquisition !== undefined ? date_acquisition : bien.date_acquisition,
            etat: etat !== undefined ? etat : bien.etat,
            mode_acquisition: mode,
            serviceId: serviceId !== undefined ? serviceId : bien.serviceId,
            departementId: departementId !== undefined ? departementId : bien.departementId,
            origine: origine !== undefined ? origine : bien.origine
        });

        // Audit
        await AuditService.log(req,
            "Modification",
            "Biens",
            `Bien modifié : ${bien.designation} (${bien.code_bien}).`
        );

        res.json({ message: 'Bien mis à jour avec succès', bien });

    } catch (err) {
        console.error("Erreur updateBien:", err);
        res.status(500).json({ message: err.message });
    }
};



// ❌ DELETE BIEN + AUDIT
export const deleteBien = async (req, res) => {
    try {
        const bien = await Bien.findByPk(req.params.id);
        if (!bien) return res.status(404).json({ message: 'Bien non trouvé' });

        await bien.destroy();

        await AuditService.log(req,
            "Suppression",
            "Biens",
            `Bien supprimé : ${bien.designation} (${bien.code_bien})`
        );

        res.json({ message: 'Bien supprimé avec succès' });
    } catch (err) {
        console.error("Erreur deleteBien:", err);
        res.status(500).json({ message: err.message });
    }
};

// 🔎 GET BIENS POUR RECENSEMENT
export const getBiensToRecensement = async (req, res) => {
    try {
        const biens = await Bien.findAll({
            attributes: ['id', 'code_bien', 'designation', 'nomenclatureId', 'prix_unitaire', 'quantite', 'date_acquisition'],
            where: { quantite: { [Op.gt]: 0 } },
            order: [['code_bien', 'ASC']],
        });

        if (!biens || biens.length === 0) {
            return res.status(404).json({ message: "Aucun bien trouvé" });
        }

        await AuditService.log(req,
            "Consultation",
            "Recensement",
            "Récupération des biens pour recensement"
        );

        res.status(200).json(biens);

    } catch (error) {
        console.error("Erreur recensement:", error);
        res.status(500).json({ message: "Erreur serveur lors de la récupération des biens à recenser." });
    }
};

// 🖼️ GENERATE QR CODE
export const generateQrCode = async (req, res) => {
    const { code } = req.params;

    if (!code) {
        return res.status(400).json({ message: "Le code du bien est requis." });
    }

    try {
        const qrCodeDataUrl = await QRCode.toDataURL(code, {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            width: 300
        });

        res.status(200).json({ dataUrl: qrCodeDataUrl, code });

    } catch (err) {
        console.error("Erreur de génération QR:", err);
        res.status(500).json({ message: "Échec de la génération du QR Code." });
    }
};

// 🔎 GET BIEN BY IDENTIFIER
export const findBienByIdentifier = async (req, res) => {
    const { identifier } = req.params;

    try {
        if (!identifier) {
            return res.status(400).json({ message: "L'identifiant est manquant." });
        }

        const cleanedIdentifier = identifier.trim().toUpperCase();
        let bien;

        if (!isNaN(parseInt(identifier)) && parseInt(identifier) > 0) {
            bien = await Bien.findByPk(parseInt(identifier), {
                include: [
                    { model: Service, as: 'service' },
                    { model: Nomenclature, as: 'nomenclature', attributes: ['id', 'code'] }
                ]
            });
        }

        if (!bien) {
            bien = await Bien.findOne({
                where: { code_bien: cleanedIdentifier },
                include: [
                    { model: Service, as: 'service' },
                    { model: Nomenclature, as: 'nomenclature', attributes: ['id', 'code'] }
                ]
            });
        }

        if (!bien) return res.status(404).json({ message: `Bien '${identifier}' non trouvé.` });

        await AuditService.log(req,
            "Recherche Rapide",
            "Biens",
            `Recherche rapide du bien par identifiant : ${identifier}`
        );

        res.status(200).json(bien);

    } catch (err) {
        console.error("Erreur findBienByIdentifier:", err);
        res.status(500).json({ message: err.message });
    }
};
// GET /api/biens/decision
export const getBiensDecision = async (req, res) => {
    try {
        const biens = await Bien.findAll({
            where: {
                etat: ['mauvais', 'à reformer'],
                statut: ['ACTIF', 'MAINTENANCE', 'REMPLACE'] // 🔥 clé
            },
            order: [['updatedAt', 'DESC']]
        });

        res.status(200).json(biens);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Erreur serveur lors de récupération des biens à décision."
        });
    }
};

// POST /api/biens/:id/decision
// POST /api/biens/:id/decision
export const setDecisionBien = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const bien = await Bien.findByPk(req.params.id, { transaction });
        if (!bien) {
            await transaction.rollback();
            return res.status(404).json({ message: "Bien introuvable." });
        }

        const { decision } = req.body; // maintenance | remplacement | aucune
        if (!['maintenance', 'remplacement', 'aucune'].includes(decision)) {
            await transaction.rollback();
            return res.status(400).json({ message: "Décision invalide." });
        }

        // 🔥 IMPACT MÉTIER
        let nouveauStatut = 'ACTIF';

        if (decision === 'maintenance') {
            nouveauStatut = 'MAINTENANCE';
        } else if (decision === 'remplacement') {
            nouveauStatut = 'REMPLACE';
        }

        // Mise à jour du bien
        await bien.update({
            decision_post_recensement: decision,
            statut: nouveauStatut
        }, { transaction });

        // Audit
        await AuditService.log(
            req,
            "DECISION",
            "BIEN",
            `Décision '${decision}' appliquée → statut '${nouveauStatut}' pour le bien N°${bien.id}`
        );

        await transaction.commit();

        res.status(200).json({
            message: "Décision appliquée avec succès.",
            statut: nouveauStatut
        });

    } catch (error) {
        await transaction.rollback();
        console.error(error);
        res.status(500).json({
            message: "Erreur serveur lors de l'application de la décision."
        });
    }
};
// POST /api/biens/:id/remettre-service
export const remettreBienEnService = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const bien = await Bien.findByPk(req.params.id, { transaction });
        if (!bien) {
            await transaction.rollback();
            return res.status(404).json({ message: "Bien introuvable." });
        }

        if (bien.statut !== 'MAINTENANCE') {
            await transaction.rollback();
            return res.status(400).json({ message: "Le bien n'est pas en maintenance." });
        }

        bien.statut = 'ACTIF';
        bien.decision_post_recensement = null;
        await bien.save({ transaction });

        await AuditService.log(
            req,
            "REMISE_SERVICE",
            "BIEN",
            `Bien N°${bien.id} remis en service`
        );

        await transaction.commit();
        res.status(200).json({ message: "Bien remis en service avec succès." });

    } catch (error) {
        await transaction.rollback();
        console.error(error);
        res.status(500).json({ message: "Erreur serveur." });
    }
};

// GET /api/biens/maintenance
export const getBiensEnMaintenance = async (req, res) => {
    try {
        const biens = await Bien.findAll({
            where: { statut: 'MAINTENANCE' },
            order: [['updatedAt', 'DESC']]
        });

        res.status(200).json(biens);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur récupération biens en maintenance." });
    }
};
*/
import db from '../modeles/index.js';
import Bien from '../modeles/Bien.js';
import Nomenclature from '../modeles/Nomenclature.js';
import { Op } from 'sequelize';
import AuditService from '../services/auditService.js';
import QRCode from 'qrcode';
import moment from 'moment';


const sequelize = db.sequelize;

// 🔥 CREATE BIEN
export const createBien = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { designation, nomenclatureId, prix_unitaire, quantite, etat, mode_acquisition, origine, demandeId } = req.body;

        // Quantité initiale
        const quantiteInitiale = quantite || 1;

        // Génération simple du code unique du bien
        const prefix = designation ? designation.substring(0, 3).toUpperCase() : 'AUT';
        const code_bien = `${prefix}-${Date.now()}`;

        // Mode d'acquisition et validation prix
        const mode = mode_acquisition && ['Achat', 'Don'].includes(mode_acquisition) ? mode_acquisition : 'Achat';
        let prixFinal = prix_unitaire || 0;

        if (mode === 'Achat' && prixFinal < 50000) {
            await t.rollback();
            return res.status(400).json({ message: "Pour un achat, le prix unitaire doit être ≥ 50 000." });
        } else if (mode === 'Don') {
            prixFinal = 0;
        }

        // Création du bien
        const bien = await Bien.create({
            designation: designation || 'Bien issu de demande',
            nomenclatureId,
            prix_unitaire: prixFinal,
            quantite: quantiteInitiale,
            date_acquisition: new Date(),
            etat: etat || 'bon',
            mode_acquisition: mode,
            code_bien,
            origine: origine || null
        }, { transaction: t });

        await t.commit();

        // Récupération complet avec associations
        const bienComplet = await Bien.findByPk(bien.id, {
            include: [{ model: Nomenclature, as: 'nomenclature', attributes: ['id', 'code'] }]
        });

        // QR Code
        
        const qrCodeDataUrl = await QRCode.toDataURL(bien.code_bien, { type: 'image/png', width: 150 });

        // Audit
        await AuditService.log(req, "Création", "Biens", `Bien créé : ${bien.designation} (${bien.code_bien}).`);

        res.status(201).json({
            message: `Bien créé avec succès. Stock initial : ${quantiteInitiale}.`,
            bien: bienComplet,
            qrCodeDataUrl,
            demandeId
        });

    } catch (err) {
        await t.rollback();
        console.error("Erreur création bien:", err);
        res.status(500).json({ message: err.message });
    }
};

// 📋 GET ALL BIENS
export const getAllBiens = async (req, res) => {
    try {
        const biens = await Bien.findAll({
            include: [{ model: Nomenclature, as: 'nomenclature', attributes: ['id', 'code'] }],
            order: [['id', 'ASC']]
        });

        await AuditService.log(req, "Consultation", "Biens", "Affichage de la liste complète des biens");
        res.json(biens);
    } catch (err) {
        console.error("Erreur getAllBiens:", err);
        res.status(500).json({ message: err.message });
    }
};

// 🔍 GET BIEN BY ID
export const getBienById = async (req, res) => {
    try {
        const bien = await Bien.findByPk(req.params.id, {
            include: [{ model: Nomenclature, as: 'nomenclature', attributes: ['id', 'code'] }]
        });

        if (!bien) return res.status(404).json({ message: 'Bien non trouvé' });

        await AuditService.log(req, "Consultation", "Biens", `Consultation du bien ID ${req.params.id}`);
        res.json(bien);
    } catch (err) {
        console.error("Erreur getBienById:", err);
        res.status(500).json({ message: err.message });
    }
};

// ✏️ UPDATE BIEN
export const updateBien = async (req, res) => {
    try {
        const bien = await Bien.findByPk(req.params.id);
        if (!bien) return res.status(404).json({ message: 'Bien non trouvé' });

        const { designation, nomenclatureId, prix_unitaire, quantite, date_acquisition, etat, mode_acquisition, origine } = req.body;

        const mode = mode_acquisition && ['Achat', 'Don'].includes(mode_acquisition) ? mode_acquisition : bien.mode_acquisition;
        let prixFinal = prix_unitaire !== undefined ? prix_unitaire : bien.prix_unitaire;

        if (mode === 'Achat' && prixFinal < 50000) {
            return res.status(400).json({ message: "Pour un achat, le prix unitaire doit être ≥ 50 000." });
        } else if (mode === 'Don') {
            prixFinal = 0;
        }

        await bien.update({
            designation: designation !== undefined ? designation : bien.designation,
            nomenclatureId: nomenclatureId !== undefined ? nomenclatureId : bien.nomenclatureId,
            prix_unitaire: prixFinal,
            quantite: quantite !== undefined ? quantite : bien.quantite,
            date_acquisition: date_acquisition !== undefined ? date_acquisition : bien.date_acquisition,
            etat: etat !== undefined ? etat : bien.etat,
            mode_acquisition: mode,
            origine: origine !== undefined ? origine : bien.origine
        });

        await AuditService.log(req, "Modification", "Biens", `Bien modifié : ${bien.designation} (${bien.code_bien}).`);
        res.json({ message: 'Bien mis à jour avec succès', bien });

    } catch (err) {
        console.error("Erreur updateBien:", err);
        res.status(500).json({ message: err.message });
    }
};

// ❌ DELETE BIEN
export const deleteBien = async (req, res) => {
    try {
        const bien = await Bien.findByPk(req.params.id);
        if (!bien) return res.status(404).json({ message: 'Bien non trouvé' });

        await bien.destroy();
        await AuditService.log(req, "Suppression", "Biens", `Bien supprimé : ${bien.designation} (${bien.code_bien})`);

        res.json({ message: 'Bien supprimé avec succès' });
    } catch (err) {
        console.error("Erreur deleteBien:", err);
        res.status(500).json({ message: err.message });
    }
};

// 🖼️ GENERATE QR CODE
export const generateQrCode = async (req, res) => {
    const { code } = req.params;
    if (!code) return res.status(400).json({ message: "Le code du bien est requis." });

    try {
        const qrCodeDataUrl = await QRCode.toDataURL(code, { errorCorrectionLevel: 'H', type: 'image/png', width: 300 });
        res.status(200).json({ dataUrl: qrCodeDataUrl, code });
    } catch (err) {
        console.error("Erreur de génération QR:", err);
        res.status(500).json({ message: "Échec de la génération du QR Code." });
    }
};

// 🔎 FIND BIEN BY IDENTIFIER
export const findBienByIdentifier = async (req, res) => {
    const { identifier } = req.params;
    try {
        if (!identifier) return res.status(400).json({ message: "L'identifiant est manquant." });

        const cleanedIdentifier = identifier.trim().toUpperCase();
        let bien;

        if (!isNaN(parseInt(identifier)) && parseInt(identifier) > 0) {
            bien = await Bien.findByPk(parseInt(identifier), {
                include: [{ model: Nomenclature, as: 'nomenclature', attributes: ['id', 'code'] }]
            });
        }

        if (!bien) {
            bien = await Bien.findOne({
                where: { code_bien: cleanedIdentifier },
                include: [{ model: Nomenclature, as: 'nomenclature', attributes: ['id', 'code'] }]
            });
        }

        if (!bien) return res.status(404).json({ message: `Bien '${identifier}' non trouvé.` });

        await AuditService.log(req, "Recherche Rapide", "Biens", `Recherche rapide du bien par identifiant : ${identifier}`);
        res.status(200).json(bien);
    } catch (err) {
        console.error("Erreur findBienByIdentifier:", err);
        res.status(500).json({ message: err.message });
    }
};
