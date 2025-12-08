import { DataType, DataTypes } from "sequelize";
import sequelize from "../database/connection";
import { Psicologo } from "./psicologo";

export const Paciente = sequelize.define(
    'paciente', {
        id_paciente: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
        nombre: {type: DataTypes.STRING, allowNull: false},
        apellido_paterno: {type: DataTypes.STRING, allowNull: false}, 
        apellido_materno: {type: DataTypes.STRING, allowNull: false}, 
        fecha_nacimiento: {type: DataTypes.DATE, allowNull: true},     
        email: {type: DataTypes.STRING(150), allowNull: false, unique: true}, 
        contrasena: {type: DataTypes.STRING(255), allowNull: false},  
        telefono: {type: DataTypes.STRING(15), allowNull: true},      
        id_psicologo: {type: DataTypes.INTEGER, allowNull: true},     
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