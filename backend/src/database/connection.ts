import { Sequelize, QueryTypes } from "sequelize";
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const sequelize = new Sequelize(
    process.env.DB_NAME || 'miduelo',
    process.env.DB_USER || 'Rodrigo',
    process.env.DB_PASSWORD || '',
    {
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
            beforeConnect: async (config: any) => {
                console.log('🔄 Configurando zona horaria de la sesión MySQL...');
            },
            afterConnect: async (connection: any) => {
                // Establecer la zona horaria de la sesión a México
                await connection.query("SET time_zone = '-06:00';");
                console.log('✅ Zona horaria de MySQL configurada a América/México (-06:00)');
            }
        }
    }
);

// Función para probar la conexión y verificar zona horaria
sequelize.authenticate()
    .then(async () => {
        console.log('✅ Conexión a MySQL establecida correctamente');
        console.log(`📍 Host: ${process.env.DB_HOST}`);
        console.log(`🗄️  Base de datos: ${process.env.DB_NAME}`);
        console.log(`🌍 Entorno: ${process.env.NODE_ENV}`);
        
        // 🆕 Verificar la zona horaria actual
        try {
            const [result] = await sequelize.query("SELECT NOW() as fecha_servidor, @@session.time_zone as zona_horaria");
            console.log('🕐 Hora del servidor MySQL:', result);
        } catch (error) {
            console.error('⚠️ No se pudo verificar la zona horaria:', error);
        }
    })
    .catch((error) => {
        console.error('❌ Error al conectar con MySQL:', error);
    });

export default sequelize;