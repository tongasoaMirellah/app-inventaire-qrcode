// modeles/Demande.js
/*import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';  // <- ton instance sequelize
import Utilisateur from './Utilisateur.js';

const Demande = sequelize.define('Demande', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    designation: { type: DataTypes.STRING, allowNull: false },
    quantite: { type: DataTypes.INTEGER, allowNull: false },
    justification: { type: DataTypes.STRING, allowNull: false },
    statut: { 
        type: DataTypes.ENUM('En attente', 'Validée', 'Refusée'), 
        defaultValue: 'En attente' 
    },
    demandeurId: { 
        type: DataTypes.INTEGER.UNSIGNED, 
        allowNull: false, 
        references: { model: Utilisateur, key: 'id' } 
    },
    departementId: { 
        type: DataTypes.INTEGER.UNSIGNED, 
        allowNull: false
    },
    depositaireCommentaire: { type: DataTypes.STRING, allowNull: true }
}, {
    tableName: 'demandes',
    timestamps: true
});

// ⚠️ Ne pas définir les associations ici
export default Demande;
*/

// modeles/Demande.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import Utilisateur from './Utilisateur.js';

const Demande = sequelize.define('Demande', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  designation: { type: DataTypes.STRING, allowNull: false },
  quantite: { type: DataTypes.INTEGER, allowNull: false },
  justification: { type: DataTypes.STRING, allowNull: false },
  statut: { type: DataTypes.ENUM('En attente','Validée','Refusée'), defaultValue: 'En attente' },
  demandeurId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  departementId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  depositaireCommentaire: { type: DataTypes.STRING, allowNull: true }
}, {
  tableName: 'demandes',
  timestamps: true
});

// Association
//Demande.belongsTo(Utilisateur, { foreignKey: 'demandeurId', as: 'demandeur' });

export default Demande;
