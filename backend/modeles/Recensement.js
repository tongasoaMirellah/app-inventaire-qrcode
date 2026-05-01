/*import { DataTypes } from 'sequelize';

// Utiliser une fonction standard qui définit le modèle
const RecensementModel = (sequelize) => {
    const Recensement = sequelize.define('Recensement', {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            primaryKey: true,
            autoIncrement: true,
        },
        fichier_pdf: {
            type: DataTypes.STRING, allowNull: true
        }
        ,
        date_pv: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        exercice: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        // 🛑 CORRECTION : AJOUT DES CLÉS ÉTRANGÈRES AVEC LE TYPE CORRECT
        recenseurId: {
            type: DataTypes.INTEGER.UNSIGNED, // Correspond à Utilisateur.id
            allowNull: true,
        },
        depositaireId: {
            type: DataTypes.INTEGER.UNSIGNED, // Correspond à Utilisateur.id
            allowNull: true,
        },
        // ---------------------------------------------------------------

        recenseur_nom: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        recenseur_qualite: {
            type: DataTypes.STRING,
        },
        total_general_deficits: {
            type: DataTypes.DECIMAL(18, 2),
            defaultValue: 0.00,
        },
        total_general_existants: {
            type: DataTypes.DECIMAL(18, 2),
            defaultValue: 0.00,
        },

        statut: {
            type: DataTypes.STRING,
            defaultValue: 'BROUILLON', // EN_ATTENTE | VALIDE | REJETE
        },
        date_validation: {
            type: DataTypes.DATE,
            allowNull: true
        },
        valide_par: {
            type: DataTypes.INTEGER,
            allowNull: true
        }
        ,
        date_transmission: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        tableName: 'Recensements',
        timestamps: true,
    });

    return Recensement;
};

// ✅ EXPORTATION EN UTILISANT LA SYNTAXE ESM PAR DÉFAUT
export default RecensementModel;*/
// modeles/Recensement.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const RecensementModel = (sequelize) => {
  const Recensement = sequelize.define('Recensement', {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    fichier_pdf: { type: DataTypes.STRING, allowNull: true },
    date_pv: { type: DataTypes.DATEONLY, allowNull: false },
    exercice: { type: DataTypes.STRING, allowNull: false },
    recenseurId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    depositaireId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    recenseur_qualite: {
            type: DataTypes.STRING,
        },
        total_general_deficits: {
            type: DataTypes.DECIMAL(18, 2),
            defaultValue: 0.00,
        },
        total_general_existants: {
            type: DataTypes.DECIMAL(18, 2),
            defaultValue: 0.00,
        },
    statut: { type: DataTypes.STRING, defaultValue: 'BROUILLON' },
    date_validation: { type: DataTypes.DATE, allowNull: true },
    valide_par: { type: DataTypes.INTEGER, allowNull: true },
    date_transmission: { type: DataTypes.DATE, allowNull: true }
  }, {
    tableName: 'Recensements',
    timestamps: true
  });

  return Recensement;
};

export default RecensementModel;
