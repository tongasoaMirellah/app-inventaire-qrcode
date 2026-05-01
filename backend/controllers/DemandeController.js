/*import { demandeService } from '../services/demandeService.js';

export const creerDemande = async (req, res) => {
    try {
        const { designation, quantite, justification } = req.body;

        if (!designation || !quantite || !justification) {
            return res.status(400).json({ message: "Tous les champs sont requis" });
        }

        const demandeurId = req.user.id;
        const departementId = req.user.departementId;

        const demande = await demandeService.creerDemande(
            { designation, quantite, justification, departementId },
            demandeurId
        );

        res.status(201).json({ message: 'Demande créée', data: demande });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};

export const validerDemande = async (req, res) => {
    try {
        const { demandeId } = req.params;
        const depositaireId = req.user.id;

        const result = await demandeService.validerDemande(demandeId, depositaireId);
        res.status(200).json({ message: 'Demande validée et bien créé', data: result });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};

export const refuserDemande = async (req, res) => {
    try {
        const { demandeId } = req.params;
        const { commentaire } = req.body;

        const demande = await demandeService.refuserDemande(demandeId, commentaire);
        res.status(200).json({ message: 'Demande refusée', data: demande });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};

export const getDemandesEnAttente = async (req, res) => {
    try {
        const demandes = await demandeService.getDemandesEnAttente();
        res.status(200).json(demandes);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};


export const getDemandesPourDepositaire = async (req, res) => {
    try {
        // Toutes les demandes en attente
        const demandes = await demandeService.getDemandesEnAttente();
        res.json(demandes);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};*/
/*
import { demandeService } from '../services/demandeService.js';

export const creerDemande = async (req, res) => {
    try {
        const { designation, quantite, justification } = req.body;
        if (!designation || !quantite || !justification) {
            return res.status(400).json({ message: "Tous les champs sont requis" });
        }
        const demandeurId = req.user.id;
        const demande = await demandeService.creerDemande({ designation, quantite, justification }, demandeurId);
        res.status(201).json({ message: 'Demande créée', data: demande });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};

export const validerDemande = async (req, res) => {
    try {
        const { demandeId } = req.params;
        const depositaireId = req.user.id;
        const result = await demandeService.validerDemande(demandeId, depositaireId);
        res.status(200).json({ message: 'Demande validée et bien créé/affecté automatiquement', data: result });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};

export const refuserDemande = async (req, res) => {
    try {
        const { demandeId } = req.params;
        const { commentaire } = req.body;
        const depositaireId = req.user.id;
        const demande = await demandeService.refuserDemande(demandeId, commentaire, depositaireId);
        res.status(200).json({ message: 'Demande refusée', data: demande });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};

export const getDemandesEnAttente = async (req, res) => {
    try {
        const demandes = await demandeService.getDemandesEnAttente();
        res.status(200).json(demandes);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};
 export const getDemandesPourDepositaire = async (req, res) => {
    try {
        // Toutes les demandes en attente
        const demandes = await demandeService.getDemandesEnAttente();
        res.json(demandes);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};*//*
import { demandeService } from '../services/demandeService.js';

export const creerDemande = async (req,res) => {
  try {
    const { designation, quantite, justification } = req.body;
    if (!designation || !quantite || !justification) return res.status(400).json({ message: "Tous les champs sont requis" });
    const demande = await demandeService.creerDemande({ designation, quantite, justification }, req.user.id);
    res.status(201).json({ message: 'Demande créée', data: demande });
  } catch(err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

export const validerDemande = async (req,res) => {
  try {
    const { demandeId } = req.params;
    const result = await demandeService.validerDemande(demandeId, req.user.id);
    res.status(200).json({ message: 'Demande validée et bien affecté/entrée automatiquement', data: result });
  } catch(err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

export const refuserDemande = async (req,res) => {
  try {
    const { demandeId } = req.params;
    const { commentaire } = req.body;
    const demande = await demandeService.refuserDemande(demandeId, commentaire, req.user.id);
    res.status(200).json({ message: 'Demande refusée', data: demande });
  } catch(err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

export const getDemandesEnAttente = async (req,res) => {
  try {
    const demandes = await demandeService.getDemandesEnAttente();
    res.status(200).json(demandes);
  } catch(err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
// Dans DemandeController.js
export const getDemandesPourDepositaire = async (req, res) => {
    try {
        const demandes = await demandeService.getDemandesPourDepositaire(req.user.id);
        res.status(200).json(demandes);
    } catch(err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};
*/
/*
import { demandeService } from '../services/demandeService.js';
import { io } from '../app.js';


export const creerDemande = async (req,res) => {
  try {
    const { designation, quantite, justification } = req.body;
    if (!designation || !quantite || !justification) 
      return res.status(400).json({ message: "Tous les champs sont requis" });

    const demande = await demandeService.creerDemande({ designation, quantite, justification }, req.user.id);
    const departementId = req.user.departementId;
    io.to(`departement-${departementId}`).emit('nouvelleDemande', {
      id: demande.id,
      designation: demande.designation,
      quantite: demande.quantite,
      status: demande.status || 1, // 1 = en attente
    });

    res.status(201).json({ message: 'Demande créée', data: demande });
  } catch(err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

export const validerDemande = async (req,res) => {
  try {
    const { demandeId } = req.params;
    const { quantite_affectee } = req.body;

    const result = await demandeService.validerDemande(demandeId, req.user.id, quantite_affectee);
    res.status(200).json({ message: 'Demande validée et affectation réalisée', data: result });
  } catch(err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

export const refuserDemande = async (req,res) => {
  try {
    const { demandeId } = req.params;
    const { commentaire } = req.body;

    const demande = await demandeService.refuserDemande(demandeId, commentaire, req.user.id);
    res.status(200).json({ message: 'Demande refusée', data: demande });
  } catch(err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

export const getDemandesEnAttente = async (req,res) => {
  try {
    const demandes = await demandeService.getDemandesEnAttente();
    res.status(200).json(demandes);
  } catch(err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
export const getDemandesPourDepositaire = async (req, res) => {
    try {
        const demandes = await demandeService.getDemandesPourDepositaire(req.user.id);
        res.status(200).json(demandes);
    } catch(err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};
*/
import { demandeService } from '../services/demandeService.js';
import { io } from '../app.js'; // socket.io déjà initialisé dans app.js

// --- Créer une demande ---
export const creerDemande = async (req, res) => {
  try {
    const { designation, quantite, justification } = req.body;
    if (!designation || !quantite || !justification) 
      return res.status(400).json({ message: "Tous les champs sont requis" });

    const demande = await demandeService.creerDemande(
      { designation, quantite, justification },
      req.user.id
    );

    // --- Notification Socket.IO ---
    const departementId = String(req.user.departementId); // 🔹 forcer string
    const room = `departement-${departementId}`;
    console.log(`Envoi notification dans la room : ${room}`);

    io.to(room).emit('nouvelleDemande', {
      id: demande.id,
      designation: demande.designation,
      quantite: demande.quantite,
      status: demande.status || 1,
      demandeur: {
        nom: req.user.nom,
        departement: req.user.departementMembre?.nom || ""
      }
    });

    res.status(201).json({ message: 'Demande créée', data: demande });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// --- Valider une demande ---
export const validerDemande = async (req,res) => {
  try {
    const { demandeId } = req.params;
    const { quantite_affectee } = req.body;

    const result = await demandeService.validerDemande(demandeId, req.user.id, quantite_affectee);
    res.status(200).json({ message: 'Demande validée et affectation réalisée', data: result });
  } catch(err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// --- Refuser une demande ---
export const refuserDemande = async (req,res) => {
  try {
    const { demandeId } = req.params;
    const { commentaire } = req.body;

    const demande = await demandeService.refuserDemande(demandeId, commentaire, req.user.id);
    res.status(200).json({ message: 'Demande refusée', data: demande });
  } catch(err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// --- Obtenir les demandes en attente ---
export const getDemandesEnAttente = async (req,res) => {
  try {
    const demandes = await demandeService.getDemandesEnAttente();
    res.status(200).json(demandes);
  } catch(err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
export const getDemandesPourDepositaire = async (req, res) => {
    try {
        const demandes = await demandeService.getDemandesPourDepositaire(req.user.id);
        res.status(200).json(demandes);
    } catch(err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};