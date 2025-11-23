"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Psicologo = void 0;
const sequelize_1 = require("sequelize");
const connection_1 = __importDefault(require("../database/connection"));
exports.Psicologo = connection_1.default.define("psicologo", {
    id_psicologo: { type: sequelize_1.DataTypes.INTEGER, allowNull: false, primaryKey: true,
        autoIncrement: true // Muy importante para evitar que intente crear "id"
    },
    nombre: { type: sequelize_1.DataTypes.STRING(100), allowNull: false },
    apellidoPaterno: { type: sequelize_1.DataTypes.STRING(100), allowNull: false },
    apellidoMaterno: { type: sequelize_1.DataTypes.STRING(100), allowNull: true },
    fecha_nacimiento: { type: sequelize_1.DataTypes.DATE, allowNull: false },
    especialidad: { type: sequelize_1.DataTypes.STRING(100), allowNull: false },
    cedula: { type: sequelize_1.DataTypes.STRING(20), allowNull: false, unique: true },
    telefono: { type: sequelize_1.DataTypes.STRING(15), allowNull: true },
    correo: { type: sequelize_1.DataTypes.STRING(100), allowNull: false, unique: true, validate: { isEmail: true } },
    contrasena: { type: sequelize_1.DataTypes.STRING(255), allowNull: false },
    cedula_validada: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: false },
    rol_admin: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: false },
    codigo_vinculacion: { type: sequelize_1.DataTypes.STRING(50), allowNull: true },
    direccion_consultorio: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
    foto_perfil: { type: sequelize_1.DataTypes.STRING(255), allowNull: true },
    status: { type: sequelize_1.DataTypes.ENUM("activo", "inactivo"), defaultValue: "activo" }
}, {
    tableName: 'psicologo',
    timestamps: true,
    freezeTableName: true,
    hooks: {
        beforeCreate: (psicologo) => __awaiter(void 0, void 0, void 0, function* () {
            // Genera un código único de 5 caracteres alfanuméricos
            const generarCodigo = () => {
                const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
                let result = "";
                for (let i = 0; i < 5; i++) {
                    result += chars.charAt(Math.floor(Math.random() * chars.length));
                }
                return result;
            };
            let codigo = generarCodigo();
            // Verificar que no exista en la BD
            let existe = yield exports.Psicologo.findOne({ where: { codigo_vinculacion: codigo } });
            while (existe) {
                codigo = generarCodigo();
                existe = yield exports.Psicologo.findOne({ where: { codigo_vinculacion: codigo } });
            }
            psicologo.codigo_vinculacion = codigo;
        }),
    },
});
