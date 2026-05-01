import Groq from "groq-sdk";
import { Op } from 'sequelize'; // NÉCESSAIRE pour les requêtes de plages de dates et autres opérateurs

// Importations de vos modèles (Noms et chemins confirmés)
import Bien from '../modeles/Bien.js';
import Service from '../modeles/Service.js';
import Departement from '../modeles/Departement.js';
import Entree from '../modeles/Entree.js'; // Nouveau
import Sortie from '../modeles/Sortie.js'; // Nouveau

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

export const aiHandler = async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ answer: "Message requis." });

        const q = message.toLowerCase();
        let answer = null;

        // ---------------------------------------
        // 🔍 1. Requêtes INTELLIGENTES (SQL)
        // ---------------------------------------

        // ➤ A. Combien de biens d'un service ? (ID ou NOM)
        if (q.includes("combien") && q.includes("bien") && q.includes("service")) {

            let service = null;

            // Tentative 1: Extraire un ID numérique (ex: "service 2")
            const matchId = q.match(/service (\d+)/);
            if (matchId) {
                const serviceId = parseInt(matchId[1]);
                service = await Service.findByPk(serviceId, { attributes: ['id', 'nom'] });
            } else {
                // Tentative 2: Extraire un nom (lettres/chiffres)
                const matchName = q.match(/service\s+([a-zA-Z0-9]+)/);
                if (matchName) {
                    const serviceNom = matchName[1].toUpperCase();
                    service = await Service.findOne({ where: { nom: serviceNom }, attributes: ['id', 'nom'] });
                }
            }

            if (service) {
                // Utilisation de l'ID pour le comptage
                const count = await Bien.count({ where: { service_id: service.id } });
                answer = `Le service **${service.nom} (ID: ${service.id})** possède **${count}** biens enregistrés.`;
            } else {
                answer = "Veuillez spécifier un ID ou un nom de service valide (ex: 'combien de biens pour le service 2' ou 'combien de biens pour le service SRB').";
            }
        }

        // ----------------------------------------------------
        // ➤ B. Combien de mouvements (Sortie) dans une année ?
        // ----------------------------------------------------
        else if (q.includes("combien") && q.includes("sortie") && q.includes("annee")) {
            const matchYear = q.match(/annee (\d{4})/);
            if (matchYear) {
                const year = matchYear[1];
                const startDate = `${year}-01-01`;
                const endDate = `${year}-12-31`;

                try {
                    // Utilisation du modèle Sortie et de la colonne 'date'
                    const count = await Sortie.count({
                        where: {
                            date: { // Colonne 'date' du modèle Sortie
                                [Op.between]: [startDate, endDate]
                            }
                        }
                    });

                    answer = `Il y a eu **${count}** mouvements de sortie enregistrés pour l'année **${year}** 📅.`;

                } catch (e) {
                    console.error("Erreur SQL lors du comptage des sorties:", e);
                    answer = "🚫 Je n'ai pas pu accéder aux données de sortie. Assurez-vous d'avoir des données dans la table 'sorties'.";
                }
            } else {
                answer = "Veuillez spécifier l'année au format YYYY, par exemple : 'combien de sorties dans annee 2024'.";
            }
        }


        // ----------------------------------------------------
        // ➤ C. Détails d'un bien par son Code Bien
        // ----------------------------------------------------
        else if ((q.includes("détail") || q.includes("info")) && q.includes("bien") && q.includes("code")) {
            const matchCode = q.match(/code\s+(?:bien\s+)?([a-zA-Z0-9]+)/); // accepte 'code B001' ou 'code bien B001'
            if (matchCode) {
                const codeBien = matchCode[1].toUpperCase();

                try {
                    const bien = await Bien.findOne({
                        where: { code_bien: codeBien },
                        include: [
                            { model: Service, as: 'service', attributes: ['nom'] },
                            { model: Departement, as: 'departement', attributes: ['nom'] }
                        ]
                    });

                    if (bien) {
                        answer = `Détails pour le bien **${bien.code_bien}** (${bien.designation}) :
                        \n• **Quantité :** ${bien.quantite}
                        \n• **État :** ${bien.etat.charAt(0).toUpperCase() + bien.etat.slice(1)}
                        \n• **Service :** ${bien.service ? bien.service.nom : 'N/A'}
                        \n• **Département :** ${bien.departement ? bien.departement.nom : 'N/A'}
                        \n• **Acquisition :** ${bien.date_acquisition ? new Date(bien.date_acquisition).toLocaleDateString() : 'N/A'} (${bien.mode_acquisition})`;
                    } else {
                        answer = `Aucun bien trouvé avec le code **${codeBien}**.`;
                    }

                } catch (e) {
                    console.error("Erreur SQL lors de la recherche du bien:", e);
                    answer = "🚫 Je n'ai pas pu accéder aux détails du bien. Vérifiez les associations et les données.";
                }
            } else {
                answer = "Veuillez spécifier le code du bien, par exemple : 'détail du bien code B001'.";
            }
        }

        // ----------------------------------------------------
        // ➤ D. Historique (Entrées/Sorties) d'un bien
        // ----------------------------------------------------
        else if (q.includes("historique") && (q.includes("mouvement") || q.includes("transaction")) && q.includes("bien")) {
            const matchCode = q.match(/code\s+(?:bien\s+)?([a-zA-Z0-9]+)/);
            if (matchCode) {
                const codeBien = matchCode[1].toUpperCase();

                try {
                    const bien = await Bien.findOne({ where: { code_bien: codeBien }, attributes: ['id', 'designation'] });

                    if (!bien) {
                        answer = `Aucun bien trouvé avec le code **${codeBien}**.`;
                    } else {
                        // Utilisation du bien_id pour les jointures
                        const entreesCount = await Entree.count({ where: { bien_id: bien.id } });
                        const sortiesCount = await Sortie.count({ where: { bien_id: bien.id } });

                        answer = `Historique des mouvements pour **${bien.designation}** (Code: ${codeBien}) :
                        \n• **Nombre d'Entrées :** ${entreesCount} transactions.
                        \n• **Nombre de Sorties :** ${sortiesCount} transactions.
                        \nTotal : ${entreesCount + sortiesCount} mouvements enregistrés.`;
                    }
                } catch (e) {
                    console.error("Erreur SQL lors du comptage des mouvements:", e);
                    answer = "🚫 Je n'ai pas pu accéder aux données d'historique (Entrée/Sortie).";
                }
            } else {
                answer = "Veuillez spécifier le code du bien, par exemple : 'historique des mouvements pour le code B001'.";
            }
        }


        // ---------------------------------------
        // 🧠 2. Sinon → génération réponse IA Groq
        // ---------------------------------------
        else if (!answer) {
            const groqRes = await groq.chat.completions.create({
                model: "llama-3.3-70b-versatile",
                messages: [
                    {
                        role: "system",
                        content:
                            "Tu es l'assistant IA officiel de l'application de gestion d'inventaire. Réponds clairement et professionnellement. Utilise le gras et les emojis pour améliorer la lisibilité. Si la question concerne les données de l'inventaire, indique que tu ne peux pas y répondre car tu n'as pas l'accès direct aux données (à moins que ce soit déjà géré par les fonctions SQL intégrées)."
                    },
                    {
                        role: "user",
                        content: message
                    }
                ]
            });

            answer = groqRes.choices[0].message.content;
        }

        return res.json({ answer });

    } catch (error) {
        console.error("Erreur IA:", error);
        return res.status(500).json({ answer: "🚫 Erreur de communication interne. L'assistant a rencontré un problème." });
    }
};