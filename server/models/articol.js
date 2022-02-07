const sequelize = require('../sequelize');
const { DataTypes } = require('sequelize');

const Articol = sequelize.define('articol', {
    ArticolId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    ArticolTitlu: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            len: {
                args: [5, 100],
                msg: "Titlul trebuie sa aiba minim 5 caractere!"
            }
        },
    },
    ArticolRezumat: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            len: {
                args: [10, 200],
                msg: "Rezumatul trebuie sa aiba minim 10 caractere!"
            }
        },
    },
    ArticolData: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
            isDate: {
                msg: "Data nu respecta formatul YYYY-MM-DD!"
            }
        },
    },  
});

module.exports = Articol;