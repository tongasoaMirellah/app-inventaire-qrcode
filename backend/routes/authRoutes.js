import express from 'express';
// 👈 Réintégrez l'importation de la fonction de login réelle
// Assurez-vous que le chemin vers votre contrôleur est correct
import { login } from '../controllers/authController.js'; 

const router = express.Router();

// 👈 Utilisez la fonction de login réelle à la place du test
router.post('/login', login); 

export default router; 
