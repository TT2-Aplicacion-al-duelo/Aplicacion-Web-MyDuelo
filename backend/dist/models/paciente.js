"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Paciente = void 0;
const sequelize_1 = require("sequelize");
const connection_1 = __importDefault(require("../database/connection"));
exports.Paciente = connection_1.default.define('paciente', {
    id_paciente: { type: sequelize_1.DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    apellido_paterno: { type: sequelize_1.DataTypes.STRING, allowNull: false }, // ✅ Coincidir con BD
    apellido_materno: { type: sequelize_1.DataTypes.STRING, allowNull: false }, // ✅ Coincidir con BD
    fecha_nacimiento: { type: sequelize_1.DataTypes.DATE, allowNull: true }, // ✅ Agregar campo de BD
    email: { type: sequelize_1.DataTypes.STRING(150), allowNull: false, unique: true }, // ✅ Coincidir con BD
    contrasena: { type: sequelize_1.DataTypes.STRING(255), allowNull: false }, // ✅ Agregar campo de BD
    telefono: { type: sequelize_1.DataTypes.STRING(15), allowNull: true }, // ✅ Agregar campo de BD
    id_psicologo: { type: sequelize_1.DataTypes.INTEGER, allowNull: true }, // ✅ CAMPO CLAVE
}, {
    tableName: 'paciente',
    timestamps: false, // ✅ Tu tabla no tiene timestamps
    freezeTableName: true,
});
