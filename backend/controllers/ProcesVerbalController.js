import ProcesVerbal from '../modeles/ProcesVerbal.js';
import Recensement from '../modeles/Recensement.js';
import Utilisateur from '../modeles/Utilisateur.js';

export const createPV = async (req, res) => {
  const { recensement_id, validateur_id, date, statut } = req.body;

  try {
    const pv = await ProcesVerbal.create({ recensement_id, validateur_id, date, statut });
    res.status(201).json({ message: "Procès-verbal créé", pv });
  } catch(err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAllPV = async (req, res) => {
  try {
    const pvs = await ProcesVerbal.findAll({ include: ['recensement','validateur'] });
    res.json(pvs);
  } catch(err) {
    res.status(500).json({ message: err.message });
  }
};

export const getPVById = async (req, res) => {
  try {
    const pv = await ProcesVerbal.findByPk(req.params.id, { include: ['recensement','validateur'] });
    if(!pv) return res.status(404).json({ message: "Procès-verbal non trouvé" });
    res.json(pv);
  } catch(err) {
    res.status(500).json({ message: err.message });
  }
};
