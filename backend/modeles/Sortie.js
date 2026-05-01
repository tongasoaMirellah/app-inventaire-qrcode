// modeles/Sortie.js (CORRIGÉ)
/*import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import Bien from './Bien.js';
import Service from './Service.js';

const Sortie = sequelize.define('Sortie', {
  bien_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    
  },
  service_id: {
    // 👇 CORRECTION ESSENTIELLE : Ajout de .UNSIGNED pour correspondre à services.id
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    references: { model: 'services', key: 'id' },
  },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  motif: { type: DataTypes.STRING(255), allowNull: false },
  quantite: { type: DataTypes.INTEGER, allowNull: false },
  valeur: { type: DataTypes.FLOAT, allowNull: true },
  type: {
    type: DataTypes.ENUM('vente', 'don', 'destruction', 'transfert'),
    allowNull: false,
  },
}, {
  tableName: 'sorties',
  timestamps: true,
});

// Associations
//Sortie.belongsTo(Bien, { foreignKey: 'bien_id', as: 'bien' });
//Bien.hasMany(Sortie, { foreignKey: 'bien_id', as: 'sorties' });

// L'association ci-dessous utilisait la définition de service_id ci-dessus, donc elle est désormais correcte
//Sortie.belongsTo(Service, { foreignKey: 'service_id', as: 'service' });

Sortie.afterCreate(async (sortie, options) => {
  await Bien.decrement('quantite', {
    by: sortie.quantite,
    where: { id: sortie.bien_id },
    transaction: options.transaction
  });
});

// 2. Ré-incrémente le stock si la sortie est annulée
Sortie.afterDestroy(async (sortie, options) => {
  await Bien.increment('quantite', {
    by: sortie.quantite,
    where: { id: sortie.bien_id },
    transaction: options.transaction
  });
});

export default Sortie;*/
// modeles/Sortie.jsimport { DataTypes } from 'sequelize';

import sequelize from '../config/db.js';
import Affectation from './Affectation.js';
import { DataTypes } from 'sequelize';

const Sortie = sequelize.define('Sortie', {
  quantite: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1 }
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  motif: {
    type: DataTypes.STRING,
    allowNull: false
  },
  valeur: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM('vente', 'don', 'destruction', 'transfert'),
    allowNull: false
  },
  affectation_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: {
      model: Affectation,
      key: 'id'
    },
    onDelete: 'CASCADE'
  }
}, {
  tableName: 'sorties',
  timestamps: true
});

// 🔗 Association UNIQUE
Sortie.belongsTo(Affectation, { foreignKey: 'affectation_id', as: 'affectation' });

/* 🔁 Hooks métier */
Sortie.afterCreate(async (sortie, options) => {
  const affectation = await Affectation.findByPk(sortie.affectation_id, {
    transaction: options.transaction
  });

  if (!affectation) {
    throw new Error("Affectation introuvable lors de la sortie");
  }

  if (sortie.quantite > affectation.quantite_affectee) {
    throw new Error("Quantité sortie supérieure à la quantité affectée");
  }

  await affectation.decrement('quantite_affectee', {
    by: sortie.quantite,
    transaction: options.transaction
  });
});

Sortie.afterDestroy(async (sortie, options) => {
  const affectation = await Affectation.findByPk(sortie.affectation_id, {
    transaction: options.transaction
  });

  if (affectation) {
    await affectation.increment('quantite_affectee', {
      by: sortie.quantite,
      transaction: options.transaction
    });
  }
});

export default Sortie;
