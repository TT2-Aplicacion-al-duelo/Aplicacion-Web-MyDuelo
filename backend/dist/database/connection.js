"use strict";
// import { Sequelize, QueryTypes  } from "sequelize";
// import dotenv from 'dotenv';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
//  const sequelize = new Sequelize('miduelo','root', 'root',{
//      host: 'localhost',
//      dialect: "mysql"
//  })
//  export default sequelize;
// backend/src/database/connection.ts
// Cargar variables de entorno
const sequelize_1 = require("sequelize");
const dotenv_1 = __importDefault(require("dotenv"));
// Cargar variables de entorno
dotenv_1.default.config();
const sequelize = new sequelize_1.Sequelize(process.env.DB_NAME || 'miduelo', process.env.DB_USER || 'Rodrigo', process.env.DB_PASSWORD || '', {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    dialect: "mysql",
    dialectOptions: {
        connectTimeout: 60000, // 60 segundos
        // SSL requerido para Azure MySQL en producción
        ssl: process.env.NODE_ENV === 'production'
            ? {
                require: true,
                rejectUnauthorized: false
            }
            : undefined
    },
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    logging: process.env.NODE_ENV === 'development' ? console.log : false
});
// Función para probar la conexión
sequelize.authenticate()
    .then(() => {
    console.log('✅ Conexión a MySQL establecida correctamente');
    console.log(`📍 Host: ${process.env.DB_HOST}`);
    console.log(`🗄️  Base de datos: ${process.env.DB_NAME}`);
    console.log(`🌍 Entorno: ${process.env.NODE_ENV}`);
})
    .catch((error) => {
    console.error('❌ Error al conectar con MySQL:', error);
});
exports.default = sequelize;
