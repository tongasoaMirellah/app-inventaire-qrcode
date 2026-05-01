// app.js (Backend Node.js) - Version complète avec Socket.IO

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import https from 'https';
import fs from 'fs';
import { Server } from 'socket.io';

dotenv.config();

// Initialisation de l'application
const app = express();

// Import de la base de données et des modèles
import db from './modeles/index.js';

// IMPORT DES ROUTES
import authRoutes from './routes/authRoutes.js';
import utilisateurRoutes from './routes/utilisateurRoutes.js';
import bienRoutes from './routes/bienRoutes.js';
import entreeRoutes from './routes/entreeRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import nomenclatureRoutes from './routes/nomenclatureRoutes.js';
import departementRoutes from './routes/departementRoutes.js';
import inventaireRoutes from './routes/inventaireRoutes.js';
import sortieRoutes from './routes/sortieRoutes.js';
import recensementRoutes from './routes/recensementRoutes.js';
import recensementScanRoutes from './routes/recensementScanRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import demandeRoutes from './routes/demandeRoutes.js';
import dashboardChefRoutes from './routes/dashboardChefRoutes.js';
import etatAppreciatifRoutes from './routes/etatAppreciatifRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import chefRoutes from './routes/chefRoutes.js';
import affectationRoutes from './routes/affectationRoutes.js';
import path from 'path';
const __dirname = path.resolve();

// MIDDLEWARES
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static((path.join(__dirname, "uploads"))));
app.use((req, res, next) => {
  console.log("📂 Requête fichier :", req.originalUrl);
  next();
});


// ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/utilisateurs', utilisateurRoutes);
app.use('/api/biens', bienRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/entrees', entreeRoutes);
app.use('/api/departements', departementRoutes);
app.use('/api/nomenclatures', nomenclatureRoutes);
app.use('/api/inventaire', inventaireRoutes);
app.use('/api/sorties', sortieRoutes);
app.use('/api/affectations', affectationRoutes);
app.use('/api/chef', dashboardChefRoutes);
app.use('/api/recensements', recensementRoutes);
app.use('/api/recensements', recensementScanRoutes);
app.use('/api/etat-appreciatif', etatAppreciatifRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api', dashboardRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/demandes', demandeRoutes);
app.use('/api/chef', chefRoutes);

// GESTIONNAIRE 404
app.use((req, res, next) => {
    res.status(404).json({
        message: `Erreur 404: La route demandée ${req.originalUrl} n'existe pas.`,
        error: "Not Found"
    });
});

// CONFIG SSL
const PORT = process.env.PORT || 5000;
const keyPath = process.env.SSL_KEY_FILE || 'cert.key';
const certPath = process.env.SSL_CRT_FILE || 'cert.crt';

let server;
let httpsOptions = null;

if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    httpsOptions = {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
    };
    server = https.createServer(httpsOptions, app);
    console.log(`✅ Fichiers SSL chargés: ${keyPath} et ${certPath}`);
} else {
    server = app.listen(PORT, '0.0.0.0', () => {
        console.log(`⚠️ Serveur HTTP démarré sur http://0.0.0.0:${PORT} - Risque Mixed Content`);
    });
}

// INITIALISATION SOCKET.IO
const io = new Server(server, {
    cors: { origin: '*' }
});

io.on('connection', (socket) => {
    console.log('Nouvelle connexion Socket.IO :', socket.id);

    socket.on('joinDepartement', (departementId) => {
        socket.join(`departement-${departementId}`);
        console.log(`Socket ${socket.id} a rejoint le département ${departementId}`);
    });

    socket.on('disconnect', () => {
        console.log('Utilisateur déconnecté :', socket.id);
    });
});

export { io };

// DÉMARRAGE DU SERVEUR ET CONNEXION BDD

const startServer = async () => {
    try {
        await db.sequelize.authenticate();
        console.log('🔗 Base de données connectée');

        await db.sequelize.sync({ alter: true });
        console.log('🧩 Base de données synchronisée');

        if (httpsOptions) {
            server.listen(PORT, '0.0.0.0', () => {
                console.log(`🚀 Serveur HTTPS démarré sur https://0.0.0.0:${PORT}`);
            });
        }
    } catch (err) {
        console.error('❌ Échec critique au démarrage du serveur ou de la BDD :', err);
    }
};

startServer();
/*
const startServer = async () => {
    try {
        await db.sequelize.authenticate();
        console.log('🔗 Base de données connectée');

        // Désactiver temporairement les vérifications de FK pour éviter les erreurs
        await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

        // Synchronisation dans l'ordre correct : parent -> enfant
        await db.Bien.sync({ alter: true });
        await db.Affectation.sync({ alter: true });
        await db.Recensement.sync({ alter: true });
        await db.LigneRecensement.sync({ alter: true });
        await db.Utilisateur.sync({ alter: true });  // si nécessaire pour les FK
        await db.Departement.sync({ alter: true });
        await db.Service.sync({ alter: true });

        // Réactiver les FK
        await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

        console.log('🧩 Base de données synchronisée avec succès');

        if (httpsOptions) {
            server.listen(PORT, '0.0.0.0', () => {
                console.log(`🚀 Serveur HTTPS démarré sur https://0.0.0.0:${PORT}`);
            });
        } else {
            server.listen(PORT, '0.0.0.0', () => {
                console.log(`🚀 Serveur HTTP démarré sur http://0.0.0.0:${PORT}`);
            });
        }

    } catch (err) {
        console.error('❌ Échec critique au démarrage du serveur ou de la BDD :', err);
    }
};*/
