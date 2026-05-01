import { Sequelize, Op } from 'sequelize';
import Bien from '../modeles/Bien.js';
import Sortie from '../modeles/Sortie.js';
import Entree from '../modeles/Entree.js';
import Departement from '../modeles/Departement.js';
import Nomenclature from '../modeles/Nomenclature.js';
import sequelize from '../config/db.js';

import Affectation from '../modeles/Affectation.js';

// --- FONCTION DE CALCUL POUR LA CROISSANCE PATRIMOINE ANNUELLE ---
// --- FONCTION CORRIGÉE POUR LA CROISSANCE NETTE DU PATRIMOINE ---
// --- NOUVELLE LOGIQUE POUR getCroissancePatrimoineAnnuel ---
const getCroissancePatrimoineAnnuel = async () => {
    try {
        const result = await Affectation.findAll({
            attributes: [
                // On extrait l'année de la date (createdAt ou une date d'acquisition spécifique)
                [Sequelize.fn('YEAR', Sequelize.col('Affectation.createdAt')), 'annee'],
                [
                    Sequelize.fn(
                        'SUM',
                        Sequelize.literal('quantite_affectee * bien.prix_unitaire')
                    ),
                    'valeur'
                ]
            ],
            include: [{ 
                model: Bien, 
                as: 'bien', 
                attributes: [] // On n'a pas besoin des colonnes de Bien, juste du calcul
            }],
            where: {
                statut: 'ACTIVE',
                quantite_affectee: { [Op.gt]: 0 }
            },
            // On groupe par année pour avoir une ligne par an
            group: [Sequelize.fn('YEAR', Sequelize.col('Affectation.createdAt'))],
            // On trie par année croissante
            order: [[Sequelize.fn('YEAR', Sequelize.col('Affectation.createdAt')), 'ASC']],
            raw: true
        });

        // Formater le résultat pour le graphique (en millions)
        return result.map(item => ({
            annee: item.annee.toString(),
            valeur: parseFloat(item.valeur || 0) / 1000000 // Conversion en Millions d'Ar
        }));

    } catch (error) {
        console.error("Erreur calcul acquisitions annuelles:", error);
        return [];
    }
};
// --- CONTROLLER PRINCIPAL ---
export const getDashboardData = async (req, res) => {
    try {
        const today = new Date();
        const startOfYear = new Date(today.getFullYear(), 0, 1);

        // --- KPIs ---
        // --- KPIs ---
        const totalBiensResult = await Affectation.findOne({
            attributes: [
                [Sequelize.fn('SUM', Sequelize.col('quantite_affectee')), 'totalQuantite']
            ],
            where: {
                statut: 'ACTIVE',
                quantite_affectee: { [Op.gt]: 0 }
            },
            raw: true
        });

        const totalBiens = totalBiensResult?.totalQuantite || 0;


        const totalValueResult = await Affectation.findOne({
            attributes: [
                [
                    Sequelize.fn(
                        'SUM',
                        Sequelize.literal('quantite_affectee * bien.prix_unitaire')
                    ),
                    'valeur_nette'
                ]
            ],
            include: [
                {
                    model: Bien,
                    as: 'bien',
                    attributes: []
                }
            ],
            where: {
                statut: 'ACTIVE',
                quantite_affectee: { [Op.gt]: 0 }
            },
            raw: true
        });


        const valeurNette = totalValueResult?.valeur_nette || 0;


        /* const totalBiensResult = await Bien.findOne({
             attributes: [[Sequelize.fn('SUM', Sequelize.col('quantite')), 'totalQuantite']],
             where: {
                 statut: 'actif',                 // ✅ SEULEMENT ACTIFS
                 quantite: { [Op.gt]: 0 }
             },
             raw: true
         });
 
         /*const totalBiensResult = await Bien.findOne({
             attributes: [[Sequelize.fn('SUM', Sequelize.col('quantite')), 'totalQuantite']],
             where: { quantite: { [Op.gt]: 0 } },
             raw: true
         });*
         const totalValueResult = await Bien.findOne({
             attributes: [
                 [Sequelize.fn('SUM', Sequelize.literal('prix_unitaire * quantite')), 'valeur_nette']
             ],
             where: {
                 statut: 'actif',                 // ✅ ACTIFS UNIQUEMENT
                 quantite: { [Op.gt]: 0 }
             },
             raw: true
         });*/

        /*const totalBiens = totalBiensResult.totalQuantite || 0;

        const totalValueResult = await Bien.findOne({
            attributes: [[Sequelize.fn('SUM', Sequelize.literal('prix_unitaire * quantite')), 'valeur_nette']],
            where: { quantite: { [Op.gt]: 0 } },
            raw: true
        });*/
        // const valeurNette = totalValueResult.valeur_nette || 0;

        const sortiesAnneeResult = await Sortie.findOne({
            attributes: [
                [Sequelize.fn('SUM', Sequelize.col('quantite')), 'totalSorties']
            ],
            where: { date: { [Op.gte]: startOfYear } },
            raw: true
        });

        const sortiesAnnee = sortiesAnneeResult?.totalSorties || 0;


        const alertesMaintenance = await Affectation.count({
            where: { etat: 'mauvais' }
        });


        const mockTrend = (value) => ({ value: Math.round(Math.random() * 15) + 1, direction: Math.random() > 0.5 ? 'up' : 'down' });

        // --- Alertes détaillées ---
        const alertesDetaillesData = await Bien.findAll({
            where: { etat: 'mauvais' },
            attributes: ['designation', 'date_acquisition'],
            limit: 5,
            order: [['date_acquisition', 'ASC']],
            raw: true
        });

        const alertesDetailles = alertesDetaillesData.map(alert => {
            const priorite = alert.date_acquisition && (new Date(alert.date_acquisition).getTime() < today.getTime() - 90 * 24 * 60 * 60 * 1000) ? 'Élevée' : 'Moyenne';
            const dateEcheance = new Date();
            dateEcheance.setDate(today.getDate() + 14);
            return {
                nomBien: alert.designation,
                description: `Problème identifié sur le bien : ${alert.designation}`,
                dateEcheance: dateEcheance.toISOString().slice(0, 10),
                priorite
            };
        });

        // --- Répartition catégories (corrigé avec jointure Nomenclature) ---
        const repartitionCategoriesRaw = await sequelize.query(`
    SELECT
        N.code AS name,
        SUM(A.quantite_affectee) AS value
    FROM affectations A
    JOIN biens B ON A.bienId = B.id
    JOIN nomenclatures N ON B.nomenclatureId = N.id
    WHERE A.quantite_affectee > 0
    GROUP BY N.id, N.code
    ORDER BY value DESC
`, {
            type: Sequelize.QueryTypes.SELECT
        });

        const repartitionCategories = repartitionCategoriesRaw.map(item => ({
            name: item.name,
            value: Number(item.value)   // 🔥 OBLIGATOIRE
        }));


        // *******************************************************************
        // ** CONSOLE.LOG 1 : Afficher les données brutes (avant conversion) **
        // *******************************************************************
        console.log("Données brutes repartitionCategoriesRaw (ATTENDU : 'value' est une chaîne) :", repartitionCategories);


        // ** CORRECTION : CONVERSION EN NOMBRE POUR RECHARTS **
        /*const repartitionCategories = repartitionCategoriesRaw.map(item => ({
            ...item,
            value: Number(item.value)
        }));*/

        // *******************************************************************
        // ** CONSOLE.LOG 2 : Afficher les données converties (après correction) **
        // *******************************************************************
        console.log("Données converties repartitionCategories (ATTENDU : 'value' est un nombre) :", repartitionCategories);
        /*  const repartitionCategories = await Bien.findAll({
              attributes: [
                  [Sequelize.col('nomenclature.code'), 'name'],
                  [Sequelize.fn('SUM', Sequelize.col('quantite')), 'value']
              ],
              include: [
                  {
                      model: Nomenclature,
                      as: 'nomenclature',
                      attributes: []
                  }
              ],
              group: ['nomenclature.code'],
              having: Sequelize.literal('SUM(quantite) > 0'),
              order: [[Sequelize.literal('value'), 'DESC']],
              raw: true
          });*/

        // --- Répartition départements ---
        const repartitionDepartementsRaw = await sequelize.query(`
    SELECT
        D.nom AS name,
        D.code AS code,
        SUM(A.quantite_affectee) AS value
    FROM affectations A
    JOIN departements D ON A.departementId = D.id
    WHERE A.quantite_affectee > 0
    GROUP BY D.id, D.nom, D.code
    ORDER BY value DESC
`, {
            type: Sequelize.QueryTypes.SELECT
        });

        const repartitionDepartements = repartitionDepartementsRaw.map(item => ({
            name: item.name,
            code: item.code,
            value: Number(item.value)   // 🔥 OBLIGATOIRE
        }));

        /*const formattedDepartements = repartitionDepartements
            .filter(d => d.departement.nom)
            .map(d => ({ name: d.departement.nom, value: parseInt(d.value, 10) }));*/

        // --- Flux mensuel annuel ---
        const fluxAnnuel = await sequelize.query(`
    SELECT
        YEAR(m.date) AS annee,
        SUM(CASE WHEN m.type = 'ENTREE' THEN m.quantite ELSE 0 END) AS entrees,
        SUM(CASE WHEN m.type = 'SORTIE' THEN m.quantite ELSE 0 END) AS sorties
    FROM (
        SELECT E.date, E.quantite, 'ENTREE' AS type
        FROM entrees E
        JOIN affectations A ON E.affectation_id = A.id

        UNION ALL

        SELECT S.date, S.quantite, 'SORTIE' AS type
        FROM sorties S
        JOIN affectations A ON S.affectation_id = A.id
    ) m
    GROUP BY YEAR(m.date)
    ORDER BY annee
`, {
            type: Sequelize.QueryTypes.SELECT
        });

        const formattedFluxAnnuel = fluxAnnuel.map(f => ({
            annee: f.annee,
            Entrées: Number(f.entrees),
            Sorties: Number(f.sorties)
        }));
        console.log("FLUX ANNUEL FINAL 👉", formattedFluxAnnuel);

        const croissancePatrimoineAnnuel = await getCroissancePatrimoineAnnuel();

        // --- Dernières acquisitions ---
        const dernieresAcquisitions = await Entree.findAll({
            limit: 5,
            order: [['date', 'DESC']],
            attributes: ['id', 'date', 'quantite', 'motif'],
            include: [{ model: Bien, as: 'bien', attributes: ['designation'] }],
            raw: true,
            nest: true
        });

        // --- Classement départements simplifié ---
        const classementDepartements = await Bien.findAll({
            attributes: [[Sequelize.fn('SUM', Sequelize.col('Bien.quantite')), 'nombreBiens']],
            include: [{ model: Departement, as: 'departement', attributes: ['nom'] }],
            group: ['departement.nom', 'departement.id'],
            having: Sequelize.literal('SUM(Bien.quantite) > 0'),
            order: [[Sequelize.literal('nombreBiens'), 'DESC']],
            raw: true,
            nest: true
        });

        const formattedClassementDepartements = classementDepartements.map(d => ({
            departement: d.departement.nom,
            nombreBiens: parseInt(d.nombreBiens, 10)
        }));

        // --- Mock alertes récentes ---
        const mockAlertesRecentes = Array.from({ length: 7 }).map((_, i) => {
            const date = new Date();
            date.setDate(today.getDate() - (6 - i));
            return { jour: date.toISOString().slice(0, 10), nombre: Math.floor(Math.random() * 5) };
        });

        // --- Réponse finale ---
        res.status(200).json({
            kpis: {
                totalBiens,
                valeurNette: parseFloat(valeurNette).toFixed(2),
                sortiesAnnee,
                alertesMaintenance,
                trendTotalBiens: mockTrend(totalBiens),
                trendValeurNette: mockTrend(valeurNette),
                trendSortiesAnnee: mockTrend(sortiesAnnee),
                trendAlertesMaintenance: mockTrend(alertesMaintenance),
            },
            repartitionCategories,
            repartitionDepartements,
            fluxAnnuel: formattedFluxAnnuel,

            croissancePatrimoine: croissancePatrimoineAnnuel,
            alertesDetailles,
            alertesRecentes: mockAlertesRecentes,
            classementDepartements: formattedClassementDepartements,
            dernieresAcquisitions: dernieresAcquisitions.map(d => ({
                nom: d.bien.designation,
                date: d.date,
                quantite: d.quantite
            }))
        });

    } catch (error) {
        console.error("Erreur lors de la récupération des données du dashboard:", error);
        res.status(500).json({ message: "Erreur serveur lors du traitement des données du dashboard." });
    }
};
