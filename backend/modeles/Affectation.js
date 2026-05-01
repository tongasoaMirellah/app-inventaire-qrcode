/*import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Affectation = sequelize.define('Affectation', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  date_debut: { type: DataTypes.DATEONLY, allowNull: false },
  date_fin: { type: DataTypes.DATEONLY, allowNull: true },
  emplacement: { type: DataTypes.STRING(255), allowNull: true },
  bienId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  responsableId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  departementId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  serviceId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  demandeId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true }
}, {
  tableName: 'affectations',
  timestamps: true
});

export default Affectation;
*/
// modeles/Affectation.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Affectation = sequelize.define('Affectation', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  bienId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  departementId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  serviceId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  depositaireId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  quantite_affectee: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
  etat: { type: DataTypes.ENUM('bon','moyen','mauvais'), defaultValue: 'bon' },
  statut: { type: DataTypes.ENUM('ACTIVE','MAINTENANCE'), defaultValue: 'ACTIVE' },
    reparable: {
    type: DataTypes.BOOLEAN,
    defaultValue: true 
  },
  origine: {
  type: DataTypes.STRING,
  allowNull: true 
}
,
  decision_post_recensement: { type: DataTypes.ENUM('maintenance','remplacement','aucune'), allowNull: true }
}, {
  tableName: 'affectations',
  timestamps: true
});

export default Affectation;
