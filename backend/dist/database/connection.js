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
const sequelize_1 = require("sequelize");
const dotenv_1 = __importDefault(require("dotenv"));
// Cargar variables de entorno
dotenv_1.default.config();
const sequelize = new sequelize_1.Sequelize(process.env.DB_NAME || 'miduelo', process.env.DB_USER || 'Rodrigo', process.env.DB_PASSWORD || '', {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    dialect: "mysql",
    timezone: '-06:00',
    dialectOptions: {
        timezone: '-06:00',
        connectTimeout: 60000,
        charset: 'utf8mb4',
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
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    // 🆕 HOOK para configurar la sesión de MySQL
    hooks: {
        beforeConnect: (config) => __awaiter(void 0, void 0, void 0, function* () {
            console.log('🔄 Configurando zona horaria de la sesión MySQL...');
        }),
        afterConnect: (connection) => __awaiter(void 0, void 0, void 0, function* () {
            // Establecer la zona horaria de la sesión a México
            yield connection.query("SET time_zone = '-06:00';");
            console.log('✅ Zona horaria de MySQL configurada a América/México (-06:00)');
        })
    }
});
// Función para probar la conexión y verificar zona horaria
sequelize.authenticate()
    .then(() => __awaiter(void 0, void 0, void 0, function* () {
    console.log('✅ Conexión a MySQL establecida correctamente');
    console.log(`📍 Host: ${process.env.DB_HOST}`);
    console.log(`🗄️  Base de datos: ${process.env.DB_NAME}`);
    console.log(`🌍 Entorno: ${process.env.NODE_ENV}`);
    // 🆕 Verificar la zona horaria actual
    try {
        const [result] = yield sequelize.query("SELECT NOW() as fecha_servidor, @@session.time_zone as zona_horaria");
        console.log('🕐 Hora del servidor MySQL:', result);
    }
    catch (error) {
        console.error('⚠️ No se pudo verificar la zona horaria:', error);
    }
}))
    .catch((error) => {
    console.error('❌ Error al conectar con MySQL:', error);
});
exports.default = sequelize;
