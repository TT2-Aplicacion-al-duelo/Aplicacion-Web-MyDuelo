"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const sequelize_1 = require("sequelize");
const connection_1 = __importDefault(require("../database/connection"));
exports.User = connection_1.default.define('user', {
    id: { type: sequelize_1.DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    apellidoPaterno: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    apellidoMaterno: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    correo: { type: sequelize_1.DataTypes.STRING, unique: true, allowNull: false },
    contrasena: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    cedula: { type: sequelize_1.DataTypes.STRING, unique: true, allowNull: false },
    status: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
});
