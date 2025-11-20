import express, { Application, Request, Response } from 'express';
import cleanupService from '../services/cleanup.service';
import sequelize from '../database/connection';
import routerPsico from '../routes/psicologo';
import pacienteRouter from '../routes/paciente';
import agendaRoutes from '../routes/agenda';
import disponibilidadRoutes from '../routes/disponibilidad';
import chatRoutes from '../routes/chat';
import adminRoutes from '../routes/admin';
import chatAdminRoutes from '../routes/chat-admin';
import actividadRoutes from '../routes/actividad';
import modulosRoutes from '../routes/modulos';
import testRoutes from '../routes/tests';
import notasRoutes from '../routes/notas';
import foroRoutes from '../routes/foro';
import notificacionesRoutes from '../routes/notificaciones';
import { Notificacion } from './notificacion';
import { crearNotificacion } from '../controllers/notificaciones';
import { setupAssociations } from './associations';
import { Actividad } from './actividad/actividad';
import { ActividadAsignada } from './actividad/actividad-asignada';
import { Psicologo } from './psicologo';
import { Paciente } from './paciente';
import { Agenda } from './agenda/agenda';
import { Cita } from './agenda/cita';
import { Recordatorio } from './agenda/recordatorio';
import Test from './test';
import PreguntaTest from './preguntaTest';
import AplicacionTest from './aplicacionTest';
import RespuestaTest from './respuesta-test';
import ResultadoTest from './resultado_test';
import Nota from './nota';
import cors from 'cors';
import cron from 'node-cron';
import { Op } from 'sequelize';
import path from 'path';
import multer from 'multer';
import fs from 'fs';
import os from 'os';

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

        
        const homeDir = os.homedir();
        const uploadsDir = path.join(homeDir, 'ServerApp', 'server', 'uploads');

        // Verificar que el directorio existe
        if (!fs.existsSync(uploadsDir)) {
        console.error('❌ ERROR: Directorio de uploads no existe:', uploadsDir);
        console.log('📁 Creando directorio:', uploadsDir);
        fs.mkdirSync(uploadsDir, { recursive: true });
        }

        // Servir archivos estáticos desde ServerApp
        this.app.use('/uploads', express.static(uploadsDir));
        console.log('✅ Archivos estáticos configurados desde:', uploadsDir);
        console.log('📂 URL de acceso: http://74.179.81.122:3017/uploads/');

        // Configuración CORS para producción
        const allowedOrigins = process.env.NODE_ENV === 'production'
            ? (process.env.FRONTEND_URL_CORS?.split(',') || ['https://www.midueloapp.com', 'https://midueloapp.com'])
            : ['http://localhost:4200', 'http://localhost:3000'];

        const corsOptions = {
            origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
                if (!origin || allowedOrigins.includes(origin)) {
                    callback(null, true);
                } else {
                    callback(new Error('No permitido por CORS'));
                }
            },
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'token']
        };

        this.app.use(cors(corsOptions));

        // Endpoint de health check para Azure
        this.app.get('/health', (req: Request, res: Response) => {
            res.status(200).json({
                status: 'OK',
                message: 'Servidor funcionando correctamente',
                timestamp: new Date().toISOString(),
                environment: process.env.NODE_ENV || 'development'
            });
        });

        // Programar tarea cron para recordatorios
        // cron.schedule('0 9 * * *', async () => {
        //     console.log('Ejecutando tarea de recordatorios...');
        //     try {
        //         const hoy = new Date();
        //         const tresDias = new Date();
        //         tresDias.setDate(tresDias.getDate() + 3);

        //         const citasProximas = await Cita.findAll({
        //             where: {
        //                 fecha: {
        //                     [Op.between]: [hoy, tresDias]
        //                 }
        //             }
        //         });

        //         for (const cita of citasProximas) {
        //             await Recordatorio.create({
        //                 id_cita: (cita as any).id_cita,
        //                 mensaje: `Recordatorio: Tienes una cita el ${(cita as any).fecha}`,
        //                 fecha_envio: hoy,
        //                 tipo: 'email'
        //             });
        //         }

        //         console.log(`✅ ${citasProximas.length} recordatorios generados`);
        //     } catch (error: unknown) {
        //         console.error('Error en cron de recordatorios:', error);
        //     }
        // });

        // En el método midlewares(), modificar el cron existente:
        cron.schedule('0 9 * * *', async () => {
        console.log('Ejecutando tarea de recordatorios...');
        try {
            const hoy = new Date();
            const tresDias = new Date();
            tresDias.setDate(tresDias.getDate() + 3);

            const citasProximas = await Cita.findAll({
            where: {
                fecha: {
                [Op.between]: [hoy, tresDias]
                },
                estado: {
                [Op.in]: ['pendiente', 'confirmada']
                }
            },
            include: [
                {
                model: Agenda,
                as: 'agenda',
                attributes: ['id_psicologo']
                },
                {
                model: Paciente,
                as: 'paciente',
                attributes: ['nombre', 'apellido_paterno', 'apellido_materno']
                }
            ]
            });

            for (const cita of citasProximas) {
            const citaData = cita as any;
            const fechaCita = new Date(citaData.fecha);
            const diffDias = Math.ceil((fechaCita.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
            
            // Crear recordatorio en la tabla
            await Recordatorio.create({
                id_cita: citaData.id_cita,
                mensaje: `Recordatorio: Tienes una cita el ${citaData.fecha}`,
                id_psicologo: citaData.agenda.id_psicologo,
                id_paciente: citaData.id_paciente,
                enviado: false,
                fecha_programada: hoy
            });

            // ✅ CREAR NOTIFICACIÓN para el psicólogo
            const nombrePaciente = `${citaData.paciente.nombre} ${citaData.paciente.apellido_paterno}`;
            await crearNotificacion({
                id_psicologo: citaData.agenda.id_psicologo,
                tipo: 'cita',
                titulo: diffDias === 0 ? 'Cita hoy' : `Cita en ${diffDias} día(s)`,
                mensaje: `Tienes una cita con ${nombrePaciente} el ${citaData.fecha} a las ${citaData.hora_inicio}`,
                id_relacionado: citaData.id_cita,
                enlace: '/agenda'
            });
            }

            console.log(`✅ ${citasProximas.length} recordatorios y notificaciones generados`);
        } catch (error: unknown) {
            console.error('Error en cron de recordatorios:', error);
        }
        });

        console.log('Cron de recordatorios programado.');
    }

    // Método para configurar las rutas
    private routes() {
        // Ruta principal de health check para Azure
        this.app.get('/api/health', (req: Request, res: Response) => {
            sequelize.authenticate()
                .then(() => {
                    res.json({
                        status: 'healthy',
                        database: 'connected',
                        timestamp: new Date().toISOString()
                    });
                })
                .catch((error: unknown) => {
                    res.status(503).json({
                        status: 'unhealthy',
                        database: 'disconnected',
                        error: error instanceof Error ? error.message : 'Unknown error'
                    });
                });
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
        this.app.use(modulosRoutes);
        this.app.use(testRoutes);
        this.app.use(notasRoutes);
        this.app.use('/api/foros', foroRoutes);
        this.app.use(notificacionesRoutes);
    }

    // Método para iniciar el servidor
    private listen() {
        this.app.listen(this.port, () => {
            console.log(`Servidor ejecutándose en el puerto: ${this.port}`);
            console.log(`Entorno: ${process.env.NODE_ENV || 'development'}`);
            console.log(`Iniciado: ${new Date().toISOString()}`);
            this.configurarCronJobs();
        });
    }

    // Método para conectar a la base de datos
    private async connetionBaseDatos() {
        try {
            // Sincronizar modelos principales
            await Psicologo.sync({ alter: false })
                .then(() => console.log("Tabla Psicologo sincronizada"))
                .catch(err => console.error("Error al sincronizar Psicologo:", err));

            await Paciente.sync({ force: false });
            
            await Agenda.sync({ alter: false });
            await Cita.sync({ alter: false });
            await Recordatorio.sync({ alter: false });

            // Sincronizar modelos de actividades
            await Actividad.sync({ alter: false });
            await ActividadAsignada.sync({ alter: false });

            // Importar y sincronizar modelos de módulos
            const { Modulo } = await import('./modulo');
            const { ActividadModulo } = await import('./actividad-modulo');
            const { Evidencia } = await import('./evidencia');
            
            await Modulo.sync({ alter: false });
            await ActividadModulo.sync({ alter: false });
            await Evidencia.sync({ alter: false });

            // ⚠️ AGREGAR SINCRONIZACIÓN DE MODELOS DE TESTS
            await Test.sync({ alter: false });
            await PreguntaTest.sync({ alter: false });
            await AplicacionTest.sync({ alter: false });
            await RespuestaTest.sync({ alter: false });
            await ResultadoTest.sync({ alter: false });
            await Nota.sync({ alter: false });
            console.log('Tablas de tests sincronizadas correctamente.');

            // ⚠️ LLAMAR AMBAS FUNCIONES DE CONFIGURACIÓN
            setupAssociations();  // Asociaciones de módulos y actividades
            //configurarAsociaciones();  // Asociaciones de tests y notas
            
            console.log('Conexión a la base de datos exitosa.');
            console.log('Tablas sincronizadas correctamente.');

            await sequelize.authenticate();
            console.log('Conexión autenticada con éxito.');
            
        } catch (error) {
            console.error('Error conectando a la base de datos:', error);
            throw new Error('No se pudo conectar a la base de datos');
        }
    }

    /**
   * Configurar tareas programadas (Cron Jobs)
   */
  configurarCronJobs(): void {
    // Ejecutar limpieza diaria a las 2:00 AM
    cron.schedule('0 2 * * *', async () => {
      console.log('🕐 Ejecutando limpieza programada - ' + new Date().toLocaleString());
      await cleanupService.ejecutarLimpieza();
    });

    console.log('⏰ Cron jobs configurados correctamente');
  }

  
}


export default Server;