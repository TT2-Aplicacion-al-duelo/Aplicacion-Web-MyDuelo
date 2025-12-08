"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Paciente = void 0;
const sequelize_1 = require("sequelize");
const connection_1 = __importDefault(require("../database/connection"));
const psicologo_1 = require("./psicologo");
exports.Paciente = connection_1.default.define('paciente', {
    id_paciente: { type: sequelize_1.DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    apellido_paterno: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    apellido_materno: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    fecha_nacimiento: { type: sequelize_1.DataTypes.DATE, allowNull: true },
    email: { type: sequelize_1.DataTypes.STRING(150), allowNull: false, unique: true },
    contrasena: { type: sequelize_1.DataTypes.STRING(255), allowNull: false },
    telefono: { type: sequelize_1.DataTypes.STRING(15), allowNull: true },
    id_psicologo: { type: sequelize_1.DataTypes.INTEGER, allowNull: true },
    email_verificado: { type: sequelize_1.DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
}, {
    tableName: 'paciente',
    timestamps: false,
    freezeTableName: true,
});
// Relación con Psicologo
exports.Paciente.belongsTo(psicologo_1.Psicologo, {
    foreignKey: 'id_psicologo',
    targetKey: 'id_psicologo'
});
0;
