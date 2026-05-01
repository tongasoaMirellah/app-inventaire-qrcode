import  Nomenclature  from '../modeles/Nomenclature.js';

// Liste
export const getAllNomenclatures = async (req, res) => {
  try {
    const nomenclatures = await Nomenclature.findAll({ order: [['code', 'ASC']] });
    res.json(nomenclatures);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Récupérer par ID
export const getNomenclatureById = async (req, res) => {
  try {
    const nomenclature = await Nomenclature.findByPk(req.params.id);
    if (!nomenclature) return res.status(404).json({ message: 'Nomenclature non trouvée' });
    res.json(nomenclature);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Créer
export const createNomenclature = async (req, res) => {
  try {
    const { code, type_bien, description } = req.body;
    const nomenclature = await Nomenclature.create({ code, type_bien, description });
    res.status(201).json(nomenclature);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Modifier
export const updateNomenclature = async (req, res) => {
  try {
    const { code, type_bien, description } = req.body;
    const nomenclature = await Nomenclature.findByPk(req.params.id);
    if (!nomenclature) return res.status(404).json({ message: 'Nomenclature non trouvée' });

    nomenclature.code = code;
    nomenclature.type_bien = type_bien;
    nomenclature.description = description;
    await nomenclature.save();
    res.json(nomenclature);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Supprimer
export const deleteNomenclature = async (req, res) => {
  try {
    const nomenclature = await Nomenclature.findByPk(req.params.id);
    if (!nomenclature) return res.status(404).json({ message: 'Nomenclature non trouvée' });

    await nomenclature.destroy();
    res.json({ message: 'Nomenclature supprimée' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
