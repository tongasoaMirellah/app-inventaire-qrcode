import Service from '../modeles/Service.js';

// Lister tous les services
export const getServices = async (req, res) => {
  try {
    const services = await Service.findAll();
    res.json(services);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Ajouter un service
export const createService = async (req, res) => {
  try {
    const { nom, code } = req.body;
    const service = await Service.create({ nom, code });
    res.status(201).json(service);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Modifier un service
export const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, code } = req.body;
    const service = await Service.findByPk(id);
    if (!service) return res.status(404).json({ message: 'Service non trouvé' });
    await service.update({ nom, code });
    res.json(service);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Supprimer un service
export const deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    const service = await Service.findByPk(id);
    if (!service) return res.status(404).json({ message: 'Service non trouvé' });
    await service.destroy();
    res.json({ message: 'Service supprimé' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
