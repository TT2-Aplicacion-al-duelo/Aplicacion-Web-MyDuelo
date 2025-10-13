import express, { Application, Request, Response } from 'express';
import sequelize from '../database/connection';
import routerPsico from '../routes/psicologo';
import pacienteRouter from '../routes/paciente';
import agendaRoutes from '../routes/agenda';
import disponibilidadRoutes from '../routes/disponibilidad';
import chatRoutes from '../routes/chat';
import adminRoutes from '../routes/admin';
import chatAdminRoutes from '../routes/chat-admin';
import actividadRoutes from '../routes/actividad';
import { Actividad } from './actividad/actividad';
import { ActividadAsignada } from './actividad/actividad-asignada';
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

        // Configuración CORS para producción
        const allowedOrigins = process.env.NODE_ENV === 'production'
            ? (process.env.FRONTEND_URL?.split(',') || ['https://www.miduelo.com', 'https://miduelo.com'])
            : ['http://localhost:4200', 'http://localhost:3000'];

        const corsOptions = {
            origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
                // Permitir requests sin origin (como mobile apps o curl requests)
                if (!origin) return callback(null, true);

                if (Array.isArray(allowedOrigins)) {
                    if (allowedOrigins.includes(origin)) {
                        callback(null, true);
                    } else {
                        callback(new Error('No permitido por CORS'));
                    }
                } else {
                    // Si es '*', permitir todo
                    callback(null, true);
                }
            },
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization']
        };


        this.app.use(cors());
    }

    // Método para configurar las rutas
    private routes() {

        this.app.get('/health', async (req: Request, res: Response) => {
            try {
                await sequelize.authenticate();
                res.status(200).json({
                    status: 'OK',
                    timestamp: new Date().toISOString(),
                    database: 'connected',
                    environment: process.env.NODE_ENV || 'development'
                });
            } catch (error) {
                res.status(503).json({
                    status: 'ERROR',
                    timestamp: new Date().toISOString(),
                    database: 'disconnected',
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });

        this.app.get('/', (req: Request, res: Response) => {
            res.status(200).json({
                message: 'API MiDuelo está funcionando',
                version: '1.0.0',
                environment: process.env.NODE_ENV || 'development',
                timestamp: new Date().toISOString()
            });
        });



        this.app.use(routerPsico);
        this.app.use(pacienteRouter);
        this.app.use(agendaRoutes);
        this.app.use(disponibilidadRoutes);
        this.app.use(chatRoutes); 
        this.app.use(adminRoutes); 
        this.app.use(chatAdminRoutes);
        this.app.use(actividadRoutes);

        // Ruta 404 crashea con ña siguiente linea
        // this.app.use('*', (req: Request, res: Response) => {
        //     res.status(404).json({
        //         message: 'Ruta no encontrada',
        //         path: req.originalUrl
        //     });
        // });
      
    }

    // Método para iniciar el servidor
    private listen() {
        this.app.listen(this.port, () => {
            console.log(`Servidor ejecutándose en el puerto: ${this.port}`);
            console.log(`Entorno: ${process.env.NODE_ENV || 'development'}`);
            console.log(`Iniciado: ${new Date().toISOString()}`);
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

             //Sincronizar modelos de actividades
            await Actividad.sync({ alter: false });
            await ActividadAsignada.sync({ alter: false });

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