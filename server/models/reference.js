const sequelize = require('../sequelize');
const { DataTypes } = require('sequelize');

const Reference = sequelize.define('reference', {
    ReferenceId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    ReferenceTitlu: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            len: {
                args: [5, 100],
                msg: "Titlul trebuie sa aiba minim 5 caractere!"
        },
    },
    ReferenceData: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
            isDate: {
                msg: "Data nu respecta formatul YYYY-MM-DD!"
            }
        },
    },
    ListaAutori: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    ArticolId: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}});

module.exports = Reference;