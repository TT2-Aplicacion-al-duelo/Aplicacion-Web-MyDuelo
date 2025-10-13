// import { Sequelize, QueryTypes  } from "sequelize";
// import dotenv from 'dotenv';

//  const sequelize = new Sequelize('miduelo','root', 'root',{
//      host: 'localhost',
//      dialect: "mysql"
//  })
//  export default sequelize;


// backend/src/database/connection.ts



// Cargar variables de entorno
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
    }
);

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

export default sequelize;
