// middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import Utilisateur from '../modeles/Utilisateur.js';

/**
 * Middleware pour vérifier le JWT et ajouter les infos de l'utilisateur
 */
export const verifyToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: "Accès refusé : token manquant" });
  }

  try {
    // Vérifie et décode le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'SECRET');

    // Option 1 : si le JWT contient déjà departementId
    // req.user = decoded;

    // Option 2 : récupérer le département depuis la BDD (recommandé si pas inclus dans le token)
    const utilisateur = await Utilisateur.findByPk(decoded.id);
    if (!utilisateur) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    req.user = {
      id: utilisateur.id,
      nom: utilisateur.nom,
      role: utilisateur.role,
      departementId: utilisateur.departementId // <-- important pour Demande
    };

    next();
  } catch (err) {
    return res.status(403).json({ message: "Token invalide ou expiré" });
  }
};

/**
 * Middleware pour vérifier les rôles
 * @param  {...string} roles Liste des rôles autorisés
 */
export const permit = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Accès refusé : rôle non autorisé" });
    }
    next();
  };
};
