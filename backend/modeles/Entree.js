/*import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import Bien from './Bien.js';
import Service from './Service.js'; // Importation nécessaire

const Entree = sequelize.define('Entree', {
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
        allowNull: true // Ex: Acquisition Initiale, Achat, Don
    },
    valeur: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true // Valeur unitaire de l'entrée
    },
    bien_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        references: { model: 'Biens', key: 'id' },
        onDelete: 'CASCADE'
    },
    // 🚨 AJOUT CRITIQUE: Référence au service
    service_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'services', key: 'id' },
    }
}, {
    tableName: 'entrees',
    timestamps: true,
});

// Définition des associations
Entree.belongsTo(Bien, { foreignKey: 'bien_id', as: 'bien' });
Bien.hasMany(Entree, { foreignKey: 'bien_id', as: 'entrees' });

// 🚨 AJOUT CRITIQUE: Association au service
Entree.belongsTo(Service, { foreignKey: 'service_id', as: 'service' });

Entree.afterCreate(async (entree, options) => {
    await Bien.increment('quantite', {
        by: entree.quantite,
        where: { id: entree.bien_id },
        transaction: options.transaction
    });
});

// 2. Décrémente le stock si l'entrée est supprimée
Entree.afterDestroy(async (entree, options) => {
    await Bien.decrement('quantite', {
        by: entree.quantite,
        where: { id: entree.bien_id },
        transaction: options.transaction
    });
});

export default Entree;*/

import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import Bien from './Bien.js';
import Service from './Service.js';
import Affectation from './Affectation.js';

const Entree = sequelize.define('Entree', {
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
        allowNull: true // Ex: Achat, Don
    },
    valeur: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    },
    bien_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: Bien, key: 'id' },
        onDelete: 'CASCADE'
    },
    service_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: Service, key: 'id' }
    },
    departement_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true
    },
    depositaire_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true
    }
}, {
    tableName: 'entrees',
    timestamps: true
});

// Associations
Entree.belongsTo(Bien, { foreignKey: 'bien_id', as: 'bien' });
Entree.belongsTo(Service, { foreignKey: 'service_id', as: 'service' });
Entree.belongsTo(Affectation, { foreignKey: 'affectation_id', as: 'affectation' });

// Hooks pour mettre à jour la quantité dans Affectation
/*Entree.afterCreate(async (entree, options) => {
    // Trouver l'affectation correspondante
    let affectation = await Affectation.findOne({
        where: { 
            bienId: entree.bien_id, 
            departementId: entree.departement_id, 
            serviceId: entree.service_id 
        },
        transaction: options.transaction
    });

    if (affectation) {
        // Incrémente la quantité affectée
        await affectation.increment('quantite_affectee', { by: entree.quantite, transaction: options.transaction });
    } else {
        // Crée une nouvelle affectation si inexistante
        await Affectation.create({
            bienId: entree.bien_id,
            departementId: entree.departement_id,
            serviceId: entree.service_id,
            quantite_affectee: entree.quantite,
            depositaireId: entree.depositaire_id || null
        }, { transaction: options.transaction });
    }

    // Décrémente le stock global du bien
    const bien = await Bien.findByPk(entree.bien_id, { transaction: options.transaction });
    if (bien) {
        await bien.decrement('quantite', { by: entree.quantite, transaction: options.transaction });
    }
});

Entree.afterDestroy(async (entree, options) => {
    let affectation = await Affectation.findOne({
        where: { 
            bienId: entree.bien_id, 
            departementId: entree.departement_id, 
            serviceId: entree.service_id 
        },
        transaction: options.transaction
    });

    if (affectation) {
        await affectation.decrement('quantite_affectee', { by: entree.quantite, transaction: options.transaction });
    }

    // Remettre le stock du bien
    const bien = await Bien.findByPk(entree.bien_id, { transaction: options.transaction });
    if (bien) {
        await bien.increment('quantite', { by: entree.quantite, transaction: options.transaction });
    }
});
*/
export default Entree;
