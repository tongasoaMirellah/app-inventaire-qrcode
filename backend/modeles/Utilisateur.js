/*import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Utilisateur = sequelize.define('Utilisateur', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  matricule: { type: DataTypes.STRING, allowNull: false, unique: true },
  nom: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  mot_de_passe: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('admin', 'chef_departement', 'depositaire', 'agent'), allowNull: false },
  photo_url: { type: DataTypes.STRING, allowNull: true },
  serviceId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  departementId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true }
}, {
  tableName: 'utilisateurs',
  timestamps: true
});

export default Utilisateur;
*/
// modeles/Utilisateur.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import Service from './Service.js';
import Departement from './Departement.js';

const Utilisateur = sequelize.define('Utilisateur', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  matricule: { type: DataTypes.STRING, allowNull: false, unique: true },
  nom: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  mot_de_passe: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('admin','chef_departement','depositaire','agent'), allowNull: false },
  photo_url: { type: DataTypes.STRING, allowNull: true },
  serviceId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  departementId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true }
}, {
  tableName: 'utilisateurs',
  timestamps: true
});

// Associations


export default Utilisateur;
