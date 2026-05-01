/*import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Departement = sequelize.define('Departement', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  nom: {
    type: DataTypes.STRING,
    allowNull: false
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false
  },
  serviceId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  responsableId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  }
}, {
  tableName: 'departements',
  timestamps: true
});

export default Departement;
*/

// modeles/Departement.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import Service from './Service.js';
import Utilisateur from './Utilisateur.js';

const Departement = sequelize.define('Departement', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  nom: { type: DataTypes.STRING, allowNull: false },
  code: { type: DataTypes.STRING, allowNull: false },
  serviceId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  responsableId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true }
}, {
  tableName: 'departements',
  timestamps: true
});

// Associations


export default Departement;
