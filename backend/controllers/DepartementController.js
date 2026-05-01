import Departement from '../modeles/Departement.js';
import Service from '../modeles/Service.js';

// Liste de tous les départements avec leur service
export const getAllDepartements = async (req, res) => {
  try {
    const departements = await Departement.findAll({
      include: [{ model: Service, as: 'service', attributes: ['id', 'nom'] }],
      order: [['nom', 'ASC']],
    });
    res.json(departements);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Récupérer un département par ID
export const getDepartementById = async (req, res) => {
  try {
    const departement = await Departement.findByPk(req.params.id, {
      include: [{ model: Service, as: 'service', attributes: ['id', 'nom'] }],
    });
    if (!departement) return res.status(404).json({ message: 'Département non trouvé' });
    res.json(departement);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Créer un département
export const createDepartement = async (req, res) => {
  try {
    const { nom, code, serviceId } = req.body;
    const departement = await Departement.create({ nom, code, serviceId });
    res.status(201).json(departement);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Modifier un département
export const updateDepartement = async (req, res) => {
  try {
    const { nom, code, serviceId } = req.body;
    const departement = await Departement.findByPk(req.params.id);
    if (!departement) return res.status(404).json({ message: 'Département non trouvé' });

    departement.nom = nom;
    departement.code = code;
    departement.serviceId = serviceId;
    await departement.save();
    res.json(departement);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Supprimer un département
export const deleteDepartement = async (req, res) => {
  try {
    const departement = await Departement.findByPk(req.params.id);
    if (!departement) return res.status(404).json({ message: 'Département non trouvé' });

    await departement.destroy();
    res.json({ message: 'Département supprimé' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
