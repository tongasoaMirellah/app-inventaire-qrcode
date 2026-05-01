/*import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

// --- 1. IMPORT DES MODÈLES ---

// Modèles Racines / Nœuds
import Service from './Service.js';
import Nomenclature from './Nomenclature.js';
import Departement from './Departement.js'; 
import Utilisateur from './Utilisateur.js'; 

// Autres Modèles
import Bien from './Bien.js'; 
import Sortie from './Sortie.js';
import Inventaire from './Inventaire.js';
import EtatAppreciatif from './EtatAppreciatif.js';

// Modèles fonctions
import RecensementModel from './Recensement.js';
import LigneRecensementModel from './LigneRecensement.js';
import Demande from './Demande.js';

// --- 2. INITIALISATION DES MODÈLES (ORDRE OPTIMISÉ ET FINAL) ---

const db = {
    sequelize,
    Sequelize: sequelize.Sequelize, 

    // A. Modèles Racines
    Service: Service,
    Nomenclature: Nomenclature,
    
    // B. Modèles Nœuds (Circulaires)
    Departement: Departement, 
    Utilisateur: Utilisateur,
    
    // C. Modèles Enfants
    Demande: Demande,
    Bien: Bien, 
    Sortie: Sortie,
    Inventaire: Inventaire,
    EtatAppreciatif: EtatAppreciatif,

    // D. Modèles fonctions
    Recensement: RecensementModel(sequelize), 
    LigneRecensement: LigneRecensementModel(sequelize, Bien),
};


// --- 3. DÉFINITION DES ASSOCIATIONS (Utilisation exclusive de l'objet db) ---
// Toutes les associations précédentes ont été consolidées ici.

// 3.1 Associations Bien (Dépend de Nomenclature, Departement, Service)
db.Bien.belongsTo(db.Nomenclature, { foreignKey: 'nomenclatureId', as: 'nomenclature' });
db.Bien.belongsTo(db.Departement, { foreignKey: 'departementId', as: 'departement' });
db.Bien.belongsTo(db.Service, { foreignKey: 'serviceId', as: 'service' });
db.Nomenclature.hasMany(db.Bien, { foreignKey: 'nomenclatureId', as: 'biens' }); 

// 3.2 Associations Service / Departement
db.Departement.belongsTo(db.Service, { foreignKey: 'serviceId', as: 'service' });
db.Service.hasMany(db.Departement, { foreignKey: 'serviceId', as: 'departements' });
Sortie.belongsTo(Bien, { foreignKey: 'bien_id', as: 'bien' });
Bien.hasMany(Sortie, { foreignKey: 'bien_id', as: 'sorties' });

// L'association ci-dessous utilisait la définition de service_id ci-dessus, donc elle est désormais correcte
Sortie.belongsTo(Service, { foreignKey: 'service_id', as: 'service' });

// 3.3 Associations Utilisateur (Dépend de Service, Departement)
db.Utilisateur.belongsTo(db.Service, { foreignKey: 'serviceId', as: 'serviceMembre' }); // Nouvelle Alias pour éviter conflit
db.Utilisateur.belongsTo(db.Departement, { foreignKey: 'departementId', as: 'departementMembre' });
db.Service.hasMany(db.Utilisateur, { foreignKey: 'serviceId', as: 'utilisateurs' });
db.Departement.hasMany(db.Utilisateur, { foreignKey: 'departementId', as: 'membres' });
db.Demande.belongsTo(db.Utilisateur, { as: 'demandeur', foreignKey: 'demandeurId' });


// 3.4 Association Circulaire : Departement -> Utilisateur (Responsable)
db.Departement.belongsTo(db.Utilisateur, { 
    foreignKey: 'responsableId', 
    as: 'responsable' 
});
db.Utilisateur.hasMany(db.Departement, { foreignKey: 'responsableId', as: 'departementsResponsables' });

// 3.5 Associations Recensement (Dépendances multiples)
db.Recensement.hasMany(db.LigneRecensement, { 
    foreignKey: { name: 'recensementId', type: DataTypes.INTEGER.UNSIGNED },
    as: 'lignes', onDelete: 'CASCADE' 
});
db.LigneRecensement.belongsTo(db.Recensement, { foreignKey: 'recensementId' });

db.Bien.hasMany(db.LigneRecensement, { 
    foreignKey: { name: 'bienId', type: DataTypes.INTEGER.UNSIGNED },
    as: 'lignesRecensement', onDelete: 'NO ACTION' 
});
db.LigneRecensement.belongsTo(db.Bien, { foreignKey: 'bienId' });

// Associations Recensement <-> Utilisateur
db.Recensement.belongsTo(db.Utilisateur, { foreignKey: 'recenseurId', as: 'AgentRecenseur' });
db.Recensement.belongsTo(db.Utilisateur, { foreignKey: 'depositaireId', as: 'Depositaire' });

// NOTE: Les associations vers le modèle 'Demande' ne sont pas incluses car le modèle 'Demande' n'est pas importé ici.
// Si vous avez un modèle 'Demande', assurez-vous de l'importer et de l'ajouter à l'objet 'db'.

// Export
export default db;*/
import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

// --- 1. IMPORT DES MODÈLES ---

// Modèles Racines / Nœuds
import Service from './Service.js';
import Nomenclature from './Nomenclature.js';
import Departement from './Departement.js'; 
import Utilisateur from './Utilisateur.js'; 

// Autres Modèles
import Bien from './Bien.js'; 
import Affectation from './Affectation.js'; // 🚨 AJOUT
import Sortie from './Sortie.js';
import Entree from './Entree.js';
import Inventaire from './Inventaire.js';
import EtatAppreciatif from './EtatAppreciatif.js';

// Modèles fonctions
import RecensementModel from './Recensement.js';
import LigneRecensementModel from './LigneRecensement.js';
import Demande from './Demande.js';

// --- 2. INITIALISATION DES MODÈLES (ORDRE OPTIMISÉ ET FINAL) ---
const db = {
    sequelize,
    Sequelize: sequelize.Sequelize, 

    // A. Modèles Racines
    Service,
    Nomenclature,
    
    // B. Modèles Nœuds (Circulaires)
    Departement, 
    Utilisateur,
    
    // C. Modèles Enfants
    Demande,
    Bien, 
    Affectation, // 🚨 AJOUT
    Sortie,
    Inventaire,
    EtatAppreciatif,

    // D. Modèles fonctions
    Recensement: RecensementModel(sequelize), 
    LigneRecensement: LigneRecensementModel(sequelize, Bien),
};
Affectation.hasMany(Entree, { foreignKey: 'affectation_id', as: 'entrees' });
Affectation.hasMany(Sortie, { foreignKey: 'affectation_id', as: 'sorties' });
Entree.belongsTo(Affectation, { foreignKey: 'affectation_id', as: 'affectationEntree' });

// -------------------------
// 3. DÉFINITION DES ASSOCIATIONS
// -------------------------

// 3.1 Associations Bien (Dépend de Nomenclature, Departement, Service)
db.Bien.belongsTo(db.Nomenclature, { foreignKey: 'nomenclatureId', as: 'nomenclature' });
db.Bien.belongsTo(db.Departement, { foreignKey: 'departementId', as: 'departement' });
db.Bien.belongsTo(db.Service, { foreignKey: 'serviceId', as: 'service' });
db.Nomenclature.hasMany(db.Bien, { foreignKey: 'nomenclatureId', as: 'biens' }); 

// 3.2 Associations Service / Departement
db.Departement.belongsTo(db.Service, { foreignKey: 'serviceId', as: 'service' });
db.Service.hasMany(db.Departement, { foreignKey: 'serviceId', as: 'departements' });

Sortie.belongsTo(Bien, { foreignKey: 'bien_id', as: 'bienSortie' });
Bien.hasMany(Sortie, { foreignKey: 'bien_id', as: 'sorties' });
Sortie.belongsTo(Service, { foreignKey: 'service_id', as: 'serviceSortie' });

// 3.3 Associations Utilisateur (Dépend de Service, Departement)
db.Utilisateur.belongsTo(db.Service, { foreignKey: 'serviceId', as: 'serviceMembre' });
db.Utilisateur.belongsTo(db.Departement, { foreignKey: 'departementId', as: 'departementMembre' });
db.Service.hasMany(db.Utilisateur, { foreignKey: 'serviceId', as: 'utilisateurs' });
db.Departement.hasMany(db.Utilisateur, { foreignKey: 'departementId', as: 'membres' });

db.Demande.belongsTo(db.Utilisateur, { as: 'demandeur', foreignKey: 'demandeurId' });
db.Utilisateur.hasMany(db.Demande, { foreignKey: 'demandeurId', as: 'demandes' });

// 3.4 Association Circulaire : Departement -> Utilisateur (Responsable)
db.Departement.belongsTo(db.Utilisateur, { foreignKey: 'responsableId', as: 'responsable' });
db.Utilisateur.hasMany(db.Departement, { foreignKey: 'responsableId', as: 'departementsResponsables' });

// 3.5 Associations Recensement (Dépendances multiples)
db.Recensement.hasMany(db.LigneRecensement, { 
    foreignKey: { name: 'recensementId', type: DataTypes.INTEGER.UNSIGNED },
    as: 'lignes', onDelete: 'CASCADE' 
});
db.LigneRecensement.belongsTo(db.Recensement, { foreignKey: 'recensementId' });

db.Bien.hasMany(db.LigneRecensement, { 
    foreignKey: { name: 'bienId', type: DataTypes.INTEGER.UNSIGNED },
    as: 'lignesRecensement', onDelete: 'NO ACTION' 
});
db.LigneRecensement.belongsTo(db.Bien, { foreignKey: 'bienId' });
db.LigneRecensement.belongsTo(db.Affectation, {
  foreignKey: 'affectationId',
  as: 'affectation'
});
db.Affectation.hasMany(db.LigneRecensement, {
  foreignKey: 'affectationId',
  as: 'lignes'
});


// Associations Recensement <-> Utilisateur
db.Recensement.belongsTo(db.Utilisateur, { foreignKey: 'recenseurId', as: 'AgentRecenseur' });
db.Recensement.belongsTo(db.Utilisateur, { foreignKey: 'depositaireId', as: 'Depositaire' });

// -------------------------
// 3.6 Associations Affectation (NOUVEAU)
// -------------------------

// Bien <-> Affectation
db.Affectation.belongsTo(db.Bien, { foreignKey: 'bienId', as: 'bien' });
db.Bien.hasMany(db.Affectation, { foreignKey: 'bienId', as: 'affectations' });

// Affectation <-> Departement / Service / Utilisateur
db.Affectation.belongsTo(db.Departement, { foreignKey: 'departementId', as: 'departement' });
db.Affectation.belongsTo(db.Service, { foreignKey: 'serviceId', as: 'service' });
db.Affectation.belongsTo(db.Utilisateur, { foreignKey: 'depositaireId', as: 'depositaire' });

db.Departement.hasMany(db.Affectation, { foreignKey: 'departementId', as: 'affectations' });
db.Service.hasMany(db.Affectation, { foreignKey: 'serviceId', as: 'affectations' });
db.Utilisateur.hasMany(db.Affectation, { foreignKey: 'depositaireId', as: 'affectations' });

// -------------------------
// Export final
// -------------------------
export default db;
