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
const psicologo_1 = __importDefault(require("../routes/psicologo"));
const paciente_1 = __importDefault(require("../routes/paciente"));
const agenda_1 = __importDefault(require("../routes/agenda"));
const disponibilidad_1 = __importDefault(require("../routes/disponibilidad"));
const chat_1 = __importDefault(require("../routes/chat"));
const admin_1 = __importDefault(require("../routes/admin"));
const psicologo_2 = require("./psicologo");
const paciente_2 = require("./paciente");
const agenda_2 = require("./agenda/agenda");
const cita_1 = require("./agenda/cita");
const recordatorio_1 = require("./agenda/recordatorio");
const cors_1 = __importDefault(require("cors"));
const node_cron_1 = __importDefault(require("node-cron"));
const sequelize_1 = require("sequelize");
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
        this.app.use(express_1.default.json());
        this.app.use((0, cors_1.default)());
    }
    // Método para configurar las rutas
    routes() {
        this.app.use(psicologo_1.default);
        this.app.use(paciente_1.default);
        this.app.use(agenda_1.default);
        this.app.use(disponibilidad_1.default);
        this.app.use(chat_1.default);
        this.app.use(admin_1.default);
    }
    // Método para iniciar el servidor
    listen() {
        this.app.listen(this.port, () => {
            console.log(`Servidor ejecutándose en el puerto: ${this.port}`);
        });
    }
    // Método para conectar a la base de datos
    connetionBaseDatos() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield psicologo_2.Psicologo.sync({ alter: false })
                    .then(() => console.log("Tablas actualizadas"))
                    .catch(err => console.error("Error al sincronizar", err));
                yield paciente_2.Paciente.sync({ force: false });
                yield agenda_2.Agenda.sync({ alter: false });
                yield cita_1.Cita.sync({ alter: false });
                yield recordatorio_1.Recordatorio.sync({ alter: false });
                console.log('Conexión a la base de datos exitosa.');
                console.log('Tablas sincronizadas correctamente.');
                // Programar cron: revisar citas para mañana a las 00:05
                node_cron_1.default.schedule('5 0 * * *', () => __awaiter(this, void 0, void 0, function* () {
                    try {
                        const mañana = new Date();
                        mañana.setDate(mañana.getDate() + 1);
                        const fechaManana = mañana.toISOString().slice(0, 10);
                        // buscar citas pendientes para mañana
                        const citas = yield cita_1.Cita.findAll({
                            where: {
                                fecha: fechaManana,
                                estado: { [sequelize_1.Op.in]: ["pendiente", "confirmada"] }
                            },
                            include: [{ model: agenda_2.Agenda }] // para obtener id_psicologo
                        });
                        for (const cita of citas) {
                            const id_cita = cita.id_cita;
                            const id_agenda = cita.id_agenda;
                            const agenda = yield agenda_2.Agenda.findByPk(id_agenda);
                            const id_psicologo = agenda.id_psicologo;
                            const id_paciente = cita.id_paciente;
                            const mensaje = `Recordatorio: Tienes cita el ${fechaManana} de ${cita.hora_inicio} a ${cita.hora_fin}`;
                            yield recordatorio_1.Recordatorio.create({
                                id_cita,
                                id_psicologo,
                                id_paciente,
                                mensaje,
                                fecha_programada: new Date() // ahora, o ajusta horario de envío
                            });
                            console.log("Recordatorio creado para cita:", id_cita, mensaje);
                            // Aquí podrías invocar un servicio de email/push
                        }
                    }
                    catch (err) {
                        console.error("Error en cron de recordatorios:", err);
                    }
                }), {
                    timezone: 'America/Mexico_City'
                });
                console.log('Cron de recordatorios programado.');
            }
            catch (error) {
                console.error('Error al sincronizar DB:', error);
            }
        });
    }
}
exports.default = Server;
