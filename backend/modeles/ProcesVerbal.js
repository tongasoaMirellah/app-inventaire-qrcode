/*import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import Recensement from './Recensement.js';
import Utilisateur from './Utilisateur.js';

const ProcesVerbal = sequelize.define('ProcesVerbal', {
  date: { type: DataTypes.DATEONLY, allowNull: false },
  statut: { type: DataTypes.ENUM('en_attente','valide'), defaultValue: 'en_attente' },
}, {
  tableName: 'proces_verbaux',
  timestamps: true,
});

ProcesVerbal.belongsTo(Recensement, { foreignKey: 'recensement_id', as: 'recensement' });
Recensement.hasOne(ProcesVerbal, { foreignKey: 'recensement_id', as: 'pv' });

ProcesVerbal.belongsTo(Utilisateur, { foreignKey: 'validateur_id', as: 'validateur' });

export default ProcesVerbal;
*/