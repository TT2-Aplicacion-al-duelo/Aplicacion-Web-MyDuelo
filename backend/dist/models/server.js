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
// backend/src/models/server.ts
const express_1 = __importDefault(require("express"));
const connection_1 = __importDefault(require("../database/connection"));
const psicologo_1 = __importDefault(require("../routes/psicologo"));
const paciente_1 = __importDefault(require("../routes/paciente"));
const agenda_1 = __importDefault(require("../routes/agenda"));
const disponibilidad_1 = __importDefault(require("../routes/disponibilidad"));
const chat_1 = __importDefault(require("../routes/chat"));
const admin_1 = __importDefault(require("../routes/admin"));
const chat_admin_1 = __importDefault(require("../routes/chat-admin"));
const actividad_1 = __importDefault(require("../routes/actividad"));
const actividad_2 = require("./actividad/actividad");
const actividad_asignada_1 = require("./actividad/actividad-asignada");
const psicologo_2 = require("./psicologo");
const paciente_2 = require("./paciente");
const agenda_2 = require("./agenda/agenda");
const cita_1 = require("./agenda/cita");
const recordatorio_1 = require("./agenda/recordatorio");
const cors_1 = __importDefault(require("cors"));
class Server {
    constructor() {
        this.app = (0, express_1.default)();
        this.port = process.env.PORT || '3017';
        // 1. Conectar a la base de datos
        this.connetionBaseDatos();
        // 2. Configurar middlewares
        this.midlewares();
        // 3. Configurar las rutas
        this.routes();
        // 4. Iniciar el servidor
        this.listen();
    }
    // Método para configurar middlewares
    midlewares() {
        var _a;
        this.app.use(express_1.default.json());
        // Configuración CORS para producción
        const allowedOrigins = process.env.NODE_ENV === 'production'
            ? (((_a = process.env.FRONTEND_URL) === null || _a === void 0 ? void 0 : _a.split(',')) || ['https://www.miduelo.com', 'https://miduelo.com'])
            : '*';
        const corsOptions = {
            origin: (origin, callback) => {
                // Permitir requests sin origin (como mobile apps o curl requests)
                if (!origin)
                    return callback(null, true);
                if (allowedOrigins === '*' || allowedOrigins.includes(origin)) {
                    callback(null, true);
                }
                else {
                    callback(new Error('No permitido por CORS'));
                }
            },
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization']
        };
        this.app.use((0, cors_1.default)(corsOptions));
    }
    // Método para configurar las rutas
    routes() {
        // Health check endpoints
        this.app.get('/health', (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                yield connection_1.default.authenticate();
                res.status(200).json({
                    status: 'OK',
                    timestamp: new Date().toISOString(),
                    database: 'connected',
                    environment: process.env.NODE_ENV
                });
            }
            catch (error) {
                res.status(503).json({
                    status: 'ERROR',
                    timestamp: new Date().toISOString(),
                    database: 'disconnected',
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }));
        this.app.get('/', (req, res) => {
            res.status(200).json({
                message: 'API MiDuelo está funcionando',
                version: '1.0.0',
                environment: process.env.NODE_ENV,
                timestamp: new Date().toISOString()
            });
        });
        // Rutas de la aplicación
        this.app.use('/api', psicologo_1.default);
        this.app.use('/api', paciente_1.default);
        this.app.use('/api', agenda_1.default);
        this.app.use('/api', disponibilidad_1.default);
        this.app.use('/api', chat_1.default);
        this.app.use('/api', admin_1.default);
        this.app.use('/api', chat_admin_1.default);
        this.app.use('/api', actividad_1.default);
        // Ruta 404
        this.app.use('*', (req, res) => {
            res.status(404).json({
                message: 'Ruta no encontrada',
                path: req.originalUrl
            });
        });
    }
    // Método para iniciar el servidor
    listen() {
        this.app.listen(this.port, () => {
            console.log(`🚀 Servidor ejecutándose en el puerto: ${this.port}`);
            console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
            console.log(`📅 Iniciado: ${new Date().toISOString()}`);
        });
    }
    // Método para conectar a la base de datos
    connetionBaseDatos() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield psicologo_2.Psicologo.sync({ alter: false })
                    .then(() => console.log("✅ Tabla Psicologo sincronizada"))
                    .catch(err => console.error("❌ Error al sincronizar Psicologo", err));
                yield paciente_2.Paciente.sync({ force: false });
                console.log("✅ Tabla Paciente sincronizada");
                yield agenda_2.Agenda.sync({ alter: false });
                yield cita_1.Cita.sync({ alter: false });
                yield recordatorio_1.Recordatorio.sync({ alter: false });
                console.log("✅ Tablas de Agenda sincronizadas");
                // Sincronizar modelos de actividades
                yield actividad_2.Actividad.sync({ alter: false });
                yield actividad_asignada_1.ActividadAsignada.sync({ alter: false });
                console.log("✅ Tablas de Actividades sincronizadas");
                console.log('✅ Conexión a la base de datos exitosa');
                console.log('✅ Todas las tablas sincronizadas correctamente');
            }
            catch (error) {
                console.error('❌ Error al conectar con la base de datos:', error);
                // No lanzar error para que el servidor siga corriendo
            }
        });
    }
}
exports.default = Server;
