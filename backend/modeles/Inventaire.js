// backend/models/Inventaire.js
/*import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import Service from './Service.js';

const Inventaire = sequelize.define('Inventaire', {
  periode_debut: { type: DataTypes.DATEONLY, allowNull: false },
  periode_fin: { type: DataTypes.DATEONLY, allowNull: false },
  date_generation: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  service_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  fichier_pdf: { type: DataTypes.STRING(500), allowNull: true },
  nb_biens: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  valeur_totale: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
  meta: { type: DataTypes.JSON, allowNull: true },
}, {
  tableName: 'inventaires',
  timestamps: true,
});

Inventaire.belongsTo(Service, { foreignKey: 'service_id', as: 'service' });

export default Inventaire;
*/

// modeles/Inventaire.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import Service from './Service.js';

const Inventaire = sequelize.define('Inventaire', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  periode_debut: { type: DataTypes.DATEONLY, allowNull: false },
  periode_fin: { type: DataTypes.DATEONLY, allowNull: false },
  date_generation: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  service_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  fichier_pdf: { type: DataTypes.STRING(500), allowNull: true },
  nb_biens: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  valeur_totale: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
  meta: { type: DataTypes.JSON, allowNull: true }
}, {
  tableName: 'inventaires',
  timestamps: true
});

// Association
Inventaire.belongsTo(Service, { foreignKey: 'service_id', as: 'service' });

export default Inventaire;
