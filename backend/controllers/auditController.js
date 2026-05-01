import Audit from "../modeles/Audit.js";

export const getAllAudits = async (req, res) => {
  try {
    const logs = await Audit.findAll({
      order: [["createdAt", "DESC"]],
      limit: 500
    });

    res.status(200).json(logs);
  } catch (error) {
    console.error("Erreur getAllAudits :", error);
    res.status(500).json({ message: error.message });
  }
};
