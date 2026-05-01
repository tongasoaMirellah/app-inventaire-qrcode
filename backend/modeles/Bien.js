/*import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import Departement from './Departement.js';
import Service from './Service.js';
import Nomenclature from './Nomenclature.js';

const Bien = sequelize.define('Bien', {
    id: { 
        type: DataTypes.INTEGER.UNSIGNED, 
        primaryKey: true, 
        autoIncrement: true 
    },
  code_bien: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false
  },
  designation: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  nomenclatureId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  prix_unitaire: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  quantite: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  date_acquisition: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  etat: {
    type: DataTypes.ENUM('bon', 'moyen', 'mauvais'),
    defaultValue: 'bon'
  },
  mode_acquisition: {
    type: DataTypes.ENUM('achat', 'don'),
    allowNull: false
  },
  departementId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  // Bien.js
decision_post_recensement: {
  type: DataTypes.ENUM('maintenance', 'remplacement', 'aucune'),
  allowNull: true, // reste null tant que le dépositaire n’a pas décidé
  defaultValue: null
},
statut: {
  type: DataTypes.ENUM(
    'ACTIF',        // bien utilisable (inventaire + recensement)
    'MAINTENANCE',  // retiré temporairement
    'REMPLACE',     // remplacé définitivement
    'REFORME'       // sorti du patrimoine
  ),
  allowNull: false,
  defaultValue: 'ACTIF'
},


 serviceId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, field: 'serviceId' }

  
}, {
  tableName: 'biens',
  freezeTableName: true,
  timestamps: true
});

// Associations
//Bien.belongsTo(Nomenclature, { foreignKey: 'nomenclatureId', as: 'nomenclature' });
//Bien.belongsTo(Departement, { foreignKey: 'departementId', as: 'departement' });
//Bien.belongsTo(Service, { foreignKey: 'serviceId', as: 'service' });

export default Bien;
*/
// modeles/Bien.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Bien = sequelize.define('Bien', {
  id: { 
    type: DataTypes.INTEGER.UNSIGNED, 
    primaryKey: true, 
    autoIncrement: true 
  },
  code_bien: { type: DataTypes.STRING(50), unique: true, allowNull: false },
  designation: { type: DataTypes.STRING(255), allowNull: false },
  nomenclatureId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  prix_unitaire: { type: DataTypes.FLOAT, allowNull: false },
  quantite: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  date_acquisition: { type: DataTypes.DATEONLY, allowNull: false },
  etat: { type: DataTypes.ENUM('bon','moyen','mauvais'), defaultValue: 'bon' },
  mode_acquisition: { type: DataTypes.ENUM('achat','don'), allowNull: false },
  statut: { type: DataTypes.ENUM('ACTIF','MAINTENANCE','REMPLACE','REFORME'), defaultValue: 'ACTIF' }
}, {
  tableName: 'biens',
  freezeTableName: true,
  timestamps: true
});

export default Bien;
