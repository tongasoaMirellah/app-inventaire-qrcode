/*import { DataTypes } from 'sequelize'; // Conversion de 'require' à 'import'

// La fonction qui définit le modèle (peut prendre des paramètres d'association si nécessaire)
const LigneRecensementModel = (sequelize, Bien) => {
    const LigneRecensement = sequelize.define('LigneRecensement', {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            primaryKey: true,
            autoIncrement: true,
        },
        // 'recensementId' est automatiquement ajouté par l'association
        
        bienId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            // Assurez-vous que Bien existe et est correctement importé/associé
        },
        
        // Données d'inventaire
        code_bien: { type: DataTypes.STRING, allowNull: false },
        designation: { type: DataTypes.STRING, allowNull: false },
        nomenclature: { type: DataTypes.STRING },
        prix_unitaire: { type: DataTypes.DECIMAL(18, 2), allowNull: false },
        qte_existante_ecriture: { type: DataTypes.INTEGER, allowNull: false }, 

        // Saisie/Calcul
        qte_constatee: { type: DataTypes.INTEGER, allowNull: false },
        etat_recensement: { 
            type: DataTypes.ENUM('Neuf', 'Bon état', 'Moyen', 'Mauvais état', 'À réformer'),
            allowNull: false,
        }, 
        qte_excedent: { type: DataTypes.INTEGER, defaultValue: 0 },
        qte_deficit: { type: DataTypes.INTEGER, defaultValue: 0 },
        valeur_deficits: { type: DataTypes.DECIMAL(18, 2), defaultValue: 0.00 },
        valeur_existants: { type: DataTypes.DECIMAL(18, 2), defaultValue: 0.00 },
    }, {
        tableName: 'LignesRecensement',
        timestamps: true,
    });

    // Note: Si vous aviez une fonction associate ici, elle doit être conservée
    // LigneRecensement.associate = (models) => { /* ... * }; 

    return LigneRecensement;
};

// ✅ EXPORTATION PAR DÉFAUT (Nécessaire pour l'importation dans RecensementController)
export default LigneRecensementModel;*/

// modeles/LigneRecensement.js
import { DataTypes } from 'sequelize';

const LigneRecensementModel = (sequelize) => {
  const LigneRecensement = sequelize.define('LigneRecensement', {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    recensementId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    affectationId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    bienId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    code_bien: { type: DataTypes.STRING, allowNull: false },
    designation: { type: DataTypes.STRING, allowNull: false },
    nomenclature: { type: DataTypes.STRING },
    prix_unitaire: { type: DataTypes.DECIMAL(18,2), allowNull: false },
    qte_existante_ecriture: { type: DataTypes.INTEGER, allowNull: false },
    qte_constatee: { type: DataTypes.INTEGER, allowNull: false },
    etat_recensement: { type: DataTypes.ENUM('Neuf','Bon état','Moyen','Mauvais état','À réformer'), allowNull: false },
    qte_excedent: { type: DataTypes.INTEGER, defaultValue: 0 },
    qte_deficit: { type: DataTypes.INTEGER, defaultValue: 0 },
    valeur_deficits: { type: DataTypes.DECIMAL(18,2), defaultValue: 0 },
    valeur_existants: { type: DataTypes.DECIMAL(18,2), defaultValue: 0 }
  }, {
    tableName: 'LignesRecensement',
    timestamps: true
  });

  return LigneRecensement;
};

export default LigneRecensementModel;
