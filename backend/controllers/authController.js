import Utilisateur from '../modeles/Utilisateur.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const login = async (req, res) => {
    const { email, mot_de_passe } = req.body;

    console.log("📥 Login request received:", req.body);

    try {
        // 1. Récupérer toutes les données nécessaires de l'utilisateur, y compris departementId
        const user = await Utilisateur.findOne({ where: { email } });

        if (!user) {
            console.log("❌ Utilisateur non trouvé pour l'email:", email);
            return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
        }

        const validPassword = await bcrypt.compare(mot_de_passe, user.mot_de_passe);
        if (!validPassword) {
            console.log("❌ Mot de passe incorrect pour l'email:", email);
            return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
        }

        // Le token peut rester simple, le rôle et l'ID suffisent pour l'autorisation
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '365h' }
        );
        const formatPhotoUrl = (baseURL, photoPath) => {
    if (!photoPath) return null;
    // Supprimer le slash final de baseURL et le slash initial de photoPath
    return `${baseURL.replace(/\/$/, '')}/${photoPath.replace(/^\/+/, '')}`;
};


        const baseURL = `https://192.168.1.197:5000`;

        // 2. 🛑 AJOUTER LE departementId à l'objet envoyé au frontend 🛑
        const userToSend = {
            id: user.id,
            email: user.email,
            role: user.role,
            nom: user.nom,
            prenom: user.prenom,
            // 💡 AJOUT CRITIQUE : Cette information est nécessaire pour le DashboardChef
            departementId: user.departementId, 
            photo: formatPhotoUrl(baseURL, user.photo_url),

        };

        // 🔹 Afficher les infos importantes dans la console
        console.log("✅ Utilisateur connecté :");
        console.log("   Nom :", user.nom);
        console.log("   Email :", user.email);
        console.log("   Role :", user.role);
        // 💡 Afficher l'ID du département dans les logs pour le débug
        console.log("   Departement ID :", user.departementId); 
        console.log("   URL complète :", userToSend.photo);

        return res.json({
            message: "Connexion réussie",
            user: userToSend,
            token
        });

    } catch (err) {
        console.error("💥 Erreur lors de la connexion:", err);
        return res.status(500).json({ message: "Erreur serveur interne." });
    }
};