import { Sequelize, QueryTypes  } from "sequelize";
import dotenv from 'dotenv';

// const sequelize = new Sequelize('miduelo','root', 'root',{

//     host: 'localhost',
//     dialect: "mysql"
// })
// export default sequelize;


// backend/src/database/connection.ts



// Cargar variables de entorno
dotenv.config();

// backend/src/database/connection.ts


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
            // Si necesitas SSL (común en Azure):
            // ssl: {
            //     require: true,
            //     rejectUnauthorized: false
            // }
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
    })
    .catch((error) => {
        console.error('❌ Error al conectar con MySQL:', error);
    });

export default sequelize;


// const sequelize = new Sequelize('miduelo', 'Rodrigo', 'Zp@9F&uQ!7oRbXs0', {
//     host: '52.188.186.87',
//     port: 3306,
//     dialect: "mysql",
//     dialectOptions: {
//         connectTimeout: 60000 // 60 segundos de timeout
//     },
//     pool: {
//         max: 5,
//         min: 0,
//         acquire: 30000,
//         idle: 10000
//     },
//     logging: console.log // Para debugging, quitar en producción
// });

// export default sequelize;