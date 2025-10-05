// backend/src/models/server.ts
import express, { Application } from 'express';
import sequelize from '../database/connection';
import routerPsico  from '../routes/psicologo';
import pacienteRouter  from '../routes/paciente';
import agendaRoutes from '../routes/agenda';
import disponibilidadRoutes from '../routes/disponibilidad';
import chatRoutes from '../routes/chat'; 
import adminRoutes from '../routes/admin';
import { Psicologo } from './psicologo';
import { Paciente } from './paciente';
import { Agenda } from './agenda/agenda';
import { Cita } from './agenda/cita';
import { Recordatorio } from './agenda/recordatorio';
import cors from 'cors';
import cron from 'node-cron';
import { Op } from 'sequelize';

class Server {
    private app: Application;
    private port: string;

    constructor() {
        this.app = express();
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
    private midlewares() {
        this.app.use(express.json());
        this.app.use(cors());
    }

    // Método para configurar las rutas
    private routes() {
        this.app.use(routerPsico);
        this.app.use(pacienteRouter);
        this.app.use(agendaRoutes);
        this.app.use(disponibilidadRoutes);
        this.app.use(chatRoutes); 
        this.app.use(adminRoutes); 
    }

    // Método para iniciar el servidor
    private listen() {
        this.app.listen(this.port, () => {
            console.log(`Servidor ejecutándose en el puerto: ${this.port}`);
        });
    }

    // Método para conectar a la base de datos
    private async connetionBaseDatos() {
        try {
           
            await Psicologo.sync({ alter: false })
                .then(() => console.log("Tablas actualizadas"))
                .catch(err => console.error("Error al sincronizar", err));

            await Paciente.sync({ force: false });
            
            await Agenda.sync({ alter: false });
            await Cita.sync({ alter: false });
            await Recordatorio.sync({ alter: false });
            console.log('Conexión a la base de datos exitosa.');
            console.log('Tablas sincronizadas correctamente.');

            // Programar cron: revisar citas para mañana a las 00:05
            cron.schedule('5 0 * * *', async () => {
                try {
                    const mañana = new Date();
                    mañana.setDate(mañana.getDate() + 1);
                    const fechaManana = mañana.toISOString().slice(0,10);

                    // buscar citas pendientes para mañana
                    const citas = await Cita.findAll({
                        where: {
                            fecha: fechaManana,
                            estado: { [Op.in]: ["pendiente","confirmada"] }
                        },
                        include: [{ model: Agenda }] // para obtener id_psicologo
                    });

                    for (const cita of citas) {
                        const id_cita = (cita as any).id_cita;
                        const id_agenda = (cita as any).id_agenda;
                        const agenda = await Agenda.findByPk(id_agenda);
                        const id_psicologo = (agenda as any).id_psicologo;
                        const id_paciente = (cita as any).id_paciente;

                        const mensaje = `Recordatorio: Tienes cita el ${fechaManana} de ${(cita as any).hora_inicio} a ${(cita as any).hora_fin}`;

                        await Recordatorio.create({
                            id_cita,
                            id_psicologo,
                            id_paciente,
                            mensaje,
                            fecha_programada: new Date() // ahora, o ajusta horario de envío
                        });

                        console.log("Recordatorio creado para cita:", id_cita, mensaje);
                        // Aquí podrías invocar un servicio de email/push
                    }
                } catch (err) {
                    console.error("Error en cron de recordatorios:", err);
                }
            }, {
                timezone: 'America/Mexico_City'
            });

            console.log('Cron de recordatorios programado.');
        } catch (error) {
            console.error('Error al sincronizar DB:', error);
        }
    }
    
}


export default Server;