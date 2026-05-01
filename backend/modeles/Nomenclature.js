/*import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Nomenclature = sequelize.define('Nomenclature', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  code: { type: DataTypes.STRING, allowNull: false, unique: true },
  type_bien: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.STRING }
}, {
  tableName: 'nomenclatures',
  timestamps: false
});

export default Nomenclature;
*/

// modeles/Nomenclature.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Nomenclature = sequelize.define('Nomenclature', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  code: { type: DataTypes.STRING, allowNull: false, unique: true },
  type_bien: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.STRING, allowNull: true }
}, {
  tableName: 'nomenclatures',
  timestamps: false
});

export default Nomenclature;
