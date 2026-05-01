import db from "../modeles/index.js"; // ton fichier db central
const { Affectation, Bien, Departement, Service, Utilisateur } = db;

export const getChefDashboardData = async (req, res) => {
  try {
    const chefDepartementId = req.user.departementId; // récupère le département du chef connecté
    console.log("Chef departementId:", chefDepartementId);

    // Récupération des affectations du département
    const affectations = await Affectation.findAll({
      where: { departementId: chefDepartementId },
      order: [["createdAt", "DESC"]],
      include: [
        { model: Bien, as: "bien", attributes: ["id", "etat"] },
        { model: Utilisateur, as: "depositaire", attributes: ["id", "nom"] },
      ],
    });

    console.log("Affectations trouvées:", affectations.length);

    // Calculs simples pour le dashboard
    const totalAffectations = affectations.length;
    const quantiteTotale = affectations.reduce(
      (acc, a) => acc + a.quantite_affectee,
      0
    );

    const parEtat = { bon: 0, moyen: 0, mauvais: 0 };
    affectations.forEach(a => {
      if (a.etat === "bon") parEtat.bon += 1;
      else if (a.etat === "moyen") parEtat.moyen += 1;
      else if (a.etat === "mauvais") parEtat.mauvais += 1;
    });

    console.log("Calcul par état:", parEtat);

    // Derniers affectations (5 derniers)
    const derniers = affectations.slice(0, 5).map(a => ({
      id: a.id,
      bienId: a.bienId,
      depositaireId: a.depositaireId,
      quantite_affectee: a.quantite_affectee,
      etat: a.etat,
      createdAt: a.createdAt,
    }));

    res.json({
      biens: {
        total: totalAffectations,
        quantiteTotale,
        parEtat,
        derniers,
      },
    });
  } catch (error) {
    console.error("Erreur dashboard chef:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};


export const getBiensAffectesByDepartement = async (req, res) => {
  try {
    const chefDepartementId = req.user.departementId;

    const affectations = await Affectation.findAll({
      where: { departementId: chefDepartementId },
      include: [
        { model: Bien, as: "bien", attributes: ["id", "designation", "quantite", "etat"] },
        { model: Utilisateur, as: "depositaire", attributes: ["id", "nom"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    // Transformer les données pour le front
    const data = affectations.map(a => ({
      id: a.id,
      designation: a.bien.designation,
      quantite_affectee: a.quantite_affectee,
      etat: a.etat,
      createdAt: a.createdAt,
      depositaire: a.depositaire ? a.depositaire.nom : null,
    }));

    res.json(data);
  } catch (error) {
    console.error("Erreur récupération biens affectés:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};
