import express from 'express';
import { createUser, getAllUsers, getUserById, updateUser, deleteUser} from '../controllers/UtilisateurController.js';
import { verifyToken, permit } from '../middleware/authMiddleware.js';
import multer from 'multer'; // <-- NOUVEL IMPORT
import path from 'path';    // <-- NOUVEL IMPORT
import fs from 'fs';        // Utile pour la vérification du dossier

const router = express.Router();

// Configuration Multer pour l'upload de fichiers
const UPLOAD_DIR = 'uploads/photos_profil';

// S'assurer que le dossier existe
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR); 
    },
    filename: (req, file, cb) => {
        // Sécurisation du nom de fichier : matricule_timestamp.ext
        const safeMatricule = req.body.matricule ? req.body.matricule.replace(/[^a-z0-9]/gi, '_') : 'temp';
        const ext = path.extname(file.originalname);
        cb(null, `${safeMatricule}_${Date.now()}${ext}`);
    }
});

const upload = multer({ storage: storage });

// Les routes CRUD sont modifiées pour inclure le middleware Multer
// 'photo' est le nom du champ de fichier dans le formulaire frontend (FormData)
router.post('/', verifyToken, permit('admin'), upload.single('photo'), createUser);
router.get('/', verifyToken, permit('admin'), getAllUsers);
router.get('/:id', verifyToken, permit('admin'), getUserById);
router.put('/:id', verifyToken, permit('admin'), upload.single('photo'), updateUser);
router.delete('/:id', verifyToken, permit('admin'), deleteUser);

export default router;