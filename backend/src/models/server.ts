// backend/src/models/server.ts
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
    private midlewares() {
        this.app.use(express.json());

        // Configuración CORS para producción
        const allowedOrigins = process.env.NODE_ENV === 'production'
            ? (process.env.FRONTEND_URL?.split(',') || ['https://www.miduelo.com', 'https://miduelo.com'])
            : '*';

        const corsOptions = {
            origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
                // Permitir requests sin origin (como mobile apps o curl requests)
                if (!origin) return callback(null, true);

                if (allowedOrigins === '*' || allowedOrigins.includes(origin)) {
                    callback(null, true);
                } else {
                    callback(new Error('No permitido por CORS'));
                }
            },
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization']
        };

        this.app.use(cors(corsOptions));
    }

    // Método para configurar las rutas
    private routes() {
        // Health check endpoints
        this.app.get('/health', async (req: Request, res: Response) => {
            try {
                await sequelize.authenticate();
                res.status(200).json({
                    status: 'OK',
                    timestamp: new Date().toISOString(),
                    database: 'connected',
                    environment: process.env.NODE_ENV
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
                environment: process.env.NODE_ENV,
                timestamp: new Date().toISOString()
            });
        });

        // Rutas de la aplicación
        this.app.use('/api', routerPsico);
        this.app.use('/api', pacienteRouter);
        this.app.use('/api', agendaRoutes);
        this.app.use('/api', disponibilidadRoutes);
        this.app.use('/api', chatRoutes);
        this.app.use('/api', adminRoutes);
        this.app.use('/api', chatAdminRoutes);
        this.app.use('/api', actividadRoutes);

        // Ruta 404
        this.app.use('*', (req: Request, res: Response) => {
            res.status(404).json({
                message: 'Ruta no encontrada',
                path: req.originalUrl
            });
        });
    }

    // Método para iniciar el servidor
    private listen() {
        this.app.listen(this.port, () => {
            console.log(`🚀 Servidor ejecutándose en el puerto: ${this.port}`);
            console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
            console.log(`📅 Iniciado: ${new Date().toISOString()}`);
        });
    }

    // Método para conectar a la base de datos
    private async connetionBaseDatos() {
        try {
            await Psicologo.sync({ alter: false })
                .then(() => console.log("✅ Tabla Psicologo sincronizada"))
                .catch(err => console.error("❌ Error al sincronizar Psicologo", err));

            await Paciente.sync({ force: false });
            console.log("✅ Tabla Paciente sincronizada");

            await Agenda.sync({ alter: false });
            await Cita.sync({ alter: false });
            await Recordatorio.sync({ alter: false });
            console.log("✅ Tablas de Agenda sincronizadas");

            // Sincronizar modelos de actividades
            await Actividad.sync({ alter: false });
            await ActividadAsignada.sync({ alter: false });
            console.log("✅ Tablas de Actividades sincronizadas");

            console.log('✅ Conexión a la base de datos exitosa');
            console.log('✅ Todas las tablas sincronizadas correctamente');

        } catch (error) {
            console.error('❌ Error al conectar con la base de datos:', error);
            // No lanzar error para que el servidor siga corriendo
        }
    }
}

export default Server;