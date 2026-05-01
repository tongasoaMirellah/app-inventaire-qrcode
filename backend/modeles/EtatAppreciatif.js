import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import Utilisateur from './Utilisateur.js';

const EtatAppreciatif = sequelize.define('EtatAppreciatif', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  date_etat: { type: DataTypes.DATE, allowNull: false },
  total_existant: { type: DataTypes.INTEGER, allowNull: false },
  total_sortie: { type: DataTypes.INTEGER, allowNull: false },
  total_reste: { type: DataTypes.INTEGER, allowNull: false }
}, {
  tableName: 'etat_appreciatif',
  timestamps: false
});

Utilisateur.hasMany(EtatAppreciatif, { foreignKey: 'validePar' });
EtatAppreciatif.belongsTo(Utilisateur, { foreignKey: 'validePar' });

export default EtatAppreciatif;
