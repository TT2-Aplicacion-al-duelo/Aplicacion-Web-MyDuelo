import { DataType, DataTypes } from "sequelize";
import sequelize from "../database/connection";
import { Psicologo } from "./psicologo";

export const Paciente = sequelize.define(
    'paciente', {
        id_paciente: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
        nombre: {type: DataTypes.STRING, allowNull: false},
        apellido_paterno: {type: DataTypes.STRING, allowNull: false}, // Coincidir con BD
        apellido_materno: {type: DataTypes.STRING, allowNull: false}, // Coincidir con BD
        fecha_nacimiento: {type: DataTypes.DATE, allowNull: true},     //  Agregar campo de BD
        email: {type: DataTypes.STRING(150), allowNull: false, unique: true}, //  Coincidir con BD
        contrasena: {type: DataTypes.STRING(255), allowNull: false},  // Agregar campo de BD
        telefono: {type: DataTypes.STRING(15), allowNull: true},      // Agregar campo de BD
        id_psicologo: {type: DataTypes.INTEGER, allowNull: true},     //  CAMPO CLAVE
        email_verificado: {type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false}, 
    },
    {
        tableName: 'paciente',
        timestamps: false, 
        freezeTableName: true,
    }
);
// Relación con Psicologo
Paciente.belongsTo(Psicologo, { 
  foreignKey: 'id_psicologo', 
  targetKey: 'id_psicologo' 
});
0