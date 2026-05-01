// backend/controllers/UtilisateurController.js

import Utilisateur from '../modeles/Utilisateur.js';
import Service from '../modeles/Service.js';
import Departement from '../modeles/Departement.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

/* ==========================
   👤 CRUD UTILISATEURS
   ========================== */

// ➕ Créer un utilisateur
export const createUser = async (req, res) => {
    const { nom, email, mot_de_passe, role, matricule, serviceId, departementId } = req.body;
    const photo_url = req.file ? `/uploads/photos_profil/${req.file.filename}` : null;

    try {
        const existEmail = await Utilisateur.findOne({ where: { email } });
        const existMatricule = await Utilisateur.findOne({ where: { matricule } });

        if (existEmail || existMatricule) {
            if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            if (existEmail) return res.status(400).json({ message: "Cet email est déjà utilisé" });
            if (existMatricule) return res.status(400).json({ message: "Ce matricule est déjà utilisé" });
        }

        const hashedPassword = await bcrypt.hash(mot_de_passe, 10);

        const newUser = await Utilisateur.create({
            nom,
            email,
            mot_de_passe: hashedPassword,
            role,
            matricule,
            serviceId,
            departementId,
            photo_url
        });

        res.status(201).json({
            message: "Utilisateur créé avec succès",
            utilisateur: {
                id: newUser.id,
                nom: newUser.nom,
                email: newUser.email,
                role: newUser.role,
                matricule: newUser.matricule,
                photo_url: newUser.photo_url
            }
        });

    } catch (err) {
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        console.error("Erreur createUser :", err);
        res.status(500).json({ message: "Erreur serveur : " + err.message });
    }
};

// 📋 Récupérer tous les utilisateurs
export const getAllUsers = async (req, res) => {
    try {
        const users = await Utilisateur.findAll({
            attributes: ["id", "nom", "email", "role", "matricule", "serviceId", "departementId", "photo_url"],
            include: [
                { model: Service, as: 'serviceMembre' },
                { model: Departement, as: 'departementMembre' }
            ],
            order: [["id", "ASC"]],
        });
        res.json(users);
    } catch (err) {
        console.error("Erreur getAllUsers :", err);
        res.status(500).json({ message: "Erreur serveur", error: err.message });
    }
};

// 🔍 Récupérer un utilisateur par ID
export const getUserById = async (req, res) => {
    try {
        const user = await Utilisateur.findByPk(req.params.id, {
            attributes: ["id", "nom", "email", "role", "matricule", "serviceId", "departementId", "photo_url"],
            include: [
                { model: Service, as: 'serviceMembre' },
                { model: Departement, as: 'departementMembre' }
            ],
        });

        if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });
        res.json(user);
    } catch (err) {
        console.error("Erreur getUserById :", err);
        res.status(500).json({ message: "Erreur serveur", error: err.message });
    }
};

// ✏️ Mettre à jour un utilisateur
export const updateUser = async (req, res) => {
    const { nom, email, mot_de_passe, role, matricule, serviceId, departementId } = req.body;
    const new_photo_url = req.file ? `/uploads/photos_profil/${req.file.filename}` : undefined;

    try {
        const user = await Utilisateur.findByPk(req.params.id);
        if (!user) {
            if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }

        const hashedPassword = mot_de_passe ? await bcrypt.hash(mot_de_passe, 10) : user.mot_de_passe;

        if (req.file && user.photo_url) {
            const oldPath = path.join(process.cwd(), user.photo_url);
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }

        await user.update({
            nom,
            email,
            mot_de_passe: hashedPassword,
            role,
            matricule,
            serviceId,
            departementId,
            photo_url: new_photo_url !== undefined ? new_photo_url : user.photo_url
        });

        res.json({ message: "Utilisateur mis à jour avec succès" });
    } catch (err) {
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        console.error("Erreur updateUser :", err);
        res.status(500).json({ message: "Erreur serveur", error: err.message });
    }
};

// ❌ Supprimer un utilisateur
export const deleteUser = async (req, res) => {
    try {
        const user = await Utilisateur.findByPk(req.params.id);
        if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

        if (user.photo_url) {
            const photoPath = path.join(process.cwd(), user.photo_url);
            if (fs.existsSync(photoPath)) fs.unlinkSync(photoPath);
        }

        await user.destroy();
        res.json({ message: "Utilisateur supprimé avec succès" });
    } catch (err) {
        console.error("Erreur deleteUser :", err);
        res.status(500).json({ message: "Erreur serveur", error: err.message });
    }
};
