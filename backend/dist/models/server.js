"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const modulos_1 = __importDefault(require("../routes/modulos"));
const tests_1 = __importDefault(require("../routes/tests"));
const notas_1 = __importDefault(require("../routes/notas"));
const associations_1 = require("./associations");
const actividad_2 = require("./actividad/actividad");
const actividad_asignada_1 = require("./actividad/actividad-asignada");
const psicologo_2 = require("./psicologo");
const paciente_2 = require("./paciente");
const agenda_2 = require("./agenda/agenda");
const cita_1 = require("./agenda/cita");
const recordatorio_1 = require("./agenda/recordatorio");
// ⚠️ AGREGAR ESTAS IMPORTACIONES PARA LOS TESTS
const test_1 = __importDefault(require("./test"));
const preguntaTest_1 = __importDefault(require("./preguntaTest"));
const aplicacionTest_1 = __importDefault(require("./aplicacionTest"));
const respuesta_test_1 = __importDefault(require("./respuesta-test"));
const resultado_test_1 = __importDefault(require("./resultado_test"));
const nota_1 = __importDefault(require("./nota"));
const cors_1 = __importDefault(require("cors"));
const node_cron_1 = __importDefault(require("node-cron"));
const sequelize_1 = require("sequelize");
class Server {
    constructor() {
        this.app = (0, express_1.default)();
        this.port = process.env.PORT || '3016';
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
            : ['http://localhost:4200', 'http://localhost:3000'];
        const corsOptions = {
            origin: (origin, callback) => {
                if (!origin || allowedOrigins.includes(origin)) {
                    callback(null, true);
                }
                else {
                    callback(new Error('No permitido por CORS'));
                }
            },
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'token']
        };
        this.app.use((0, cors_1.default)(corsOptions));
        // Endpoint de health check para Azure
        this.app.get('/health', (req, res) => {
            res.status(200).json({
                status: 'OK',
                message: 'Servidor funcionando correctamente',
                timestamp: new Date().toISOString(),
                environment: process.env.NODE_ENV || 'development'
            });
        });
        // Programar tarea cron para recordatorios
        node_cron_1.default.schedule('0 9 * * *', () => __awaiter(this, void 0, void 0, function* () {
            console.log('Ejecutando tarea de recordatorios...');
            try {
                const hoy = new Date();
                const tresDias = new Date();
                tresDias.setDate(tresDias.getDate() + 3);
                const citasProximas = yield cita_1.Cita.findAll({
                    where: {
                        fecha: {
                            [sequelize_1.Op.between]: [hoy, tresDias]
                        }
                    }
                });
                for (const cita of citasProximas) {
                    yield recordatorio_1.Recordatorio.create({
                        id_cita: cita.id_cita,
                        mensaje: `Recordatorio: Tienes una cita el ${cita.fecha}`,
                        fecha_envio: hoy,
                        tipo: 'email'
                    });
                }
                console.log(`✅ ${citasProximas.length} recordatorios generados`);
            }
            catch (error) {
                console.error('Error en cron de recordatorios:', error);
            }
        }));
        console.log('Cron de recordatorios programado.');
    }
    // Método para configurar las rutas
    routes() {
        // Ruta principal de health check para Azure
        this.app.get('/api/health', (req, res) => {
            connection_1.default.authenticate()
                .then(() => {
                res.json({
                    status: 'healthy',
                    database: 'connected',
                    timestamp: new Date().toISOString()
                });
            })
                .catch((error) => {
                res.status(503).json({
                    status: 'unhealthy',
                    database: 'disconnected',
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            });
        });
        this.app.get('/', (req, res) => {
            res.status(200).json({
                message: 'API MiDuelo está funcionando',
                version: '1.0.0',
                environment: process.env.NODE_ENV || 'development',
                timestamp: new Date().toISOString()
            });
        });
        this.app.use(psicologo_1.default);
        this.app.use(paciente_1.default);
        this.app.use(agenda_1.default);
        this.app.use(disponibilidad_1.default);
        this.app.use(chat_1.default);
        this.app.use(admin_1.default);
        this.app.use(chat_admin_1.default);
        this.app.use(actividad_1.default);
        this.app.use(modulos_1.default);
        this.app.use(tests_1.default);
        this.app.use(notas_1.default);
    }
    // Método para iniciar el servidor
    listen() {
        this.app.listen(this.port, () => {
            console.log(`Servidor ejecutándose en el puerto: ${this.port}`);
            console.log(`Entorno: ${process.env.NODE_ENV || 'development'}`);
            console.log(`Iniciado: ${new Date().toISOString()}`);
        });
    }
    // Método para conectar a la base de datos
    connetionBaseDatos() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Sincronizar modelos principales
                yield psicologo_2.Psicologo.sync({ alter: false })
                    .then(() => console.log("Tabla Psicologo sincronizada"))
                    .catch(err => console.error("Error al sincronizar Psicologo:", err));
                yield paciente_2.Paciente.sync({ force: false });
                yield agenda_2.Agenda.sync({ alter: false });
                yield cita_1.Cita.sync({ alter: false });
                yield recordatorio_1.Recordatorio.sync({ alter: false });
                // Sincronizar modelos de actividades
                yield actividad_2.Actividad.sync({ alter: false });
                yield actividad_asignada_1.ActividadAsignada.sync({ alter: false });
                // Importar y sincronizar modelos de módulos
                const { Modulo } = yield Promise.resolve().then(() => __importStar(require('./modulo')));
                const { ActividadModulo } = yield Promise.resolve().then(() => __importStar(require('./actividad-modulo')));
                const { Evidencia } = yield Promise.resolve().then(() => __importStar(require('./evidencia')));
                yield Modulo.sync({ alter: false });
                yield ActividadModulo.sync({ alter: false });
                yield Evidencia.sync({ alter: false });
                // ⚠️ AGREGAR SINCRONIZACIÓN DE MODELOS DE TESTS
                yield test_1.default.sync({ alter: false });
                yield preguntaTest_1.default.sync({ alter: false });
                yield aplicacionTest_1.default.sync({ alter: false });
                yield respuesta_test_1.default.sync({ alter: false });
                yield resultado_test_1.default.sync({ alter: false });
                yield nota_1.default.sync({ alter: false });
                console.log('Tablas de tests sincronizadas correctamente.');
                // ⚠️ LLAMAR AMBAS FUNCIONES DE CONFIGURACIÓN
                (0, associations_1.setupAssociations)(); // Asociaciones de módulos y actividades
                //configurarAsociaciones();  // Asociaciones de tests y notas
                console.log('Conexión a la base de datos exitosa.');
                console.log('Tablas sincronizadas correctamente.');
                yield connection_1.default.authenticate();
                console.log('Conexión autenticada con éxito.');
            }
            catch (error) {
                console.error('Error conectando a la base de datos:', error);
                throw new Error('No se pudo conectar a la base de datos');
            }
        });
    }
}
exports.default = Server;
