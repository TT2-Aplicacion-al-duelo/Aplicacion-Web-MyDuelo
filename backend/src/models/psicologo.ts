import { DataTypes } from "sequelize";
import sequelize from "../database/connection";

export const Psicologo = sequelize.define("psicologo", {
  id_psicologo: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true,
    autoIncrement: true // Muy importante para evitar que intente crear "id"
  },
  nombre: { type: DataTypes.STRING(100), allowNull: false },
  apellidoPaterno: { type: DataTypes.STRING(100), allowNull: false  },
  apellidoMaterno: { type: DataTypes.STRING(100), allowNull: true },
  fecha_nacimiento: { type: DataTypes.DATE, allowNull: false },
  especialidad: { type: DataTypes.STRING(100), allowNull: false },
  cedula: { type: DataTypes.STRING(20), allowNull: false, unique: true },
  telefono: {type: DataTypes.STRING(15), allowNull: true },
  correo: { type: DataTypes.STRING(100), allowNull: false, unique: true, validate: {  isEmail: true }  },
  contrasena: {type: DataTypes.STRING(255), allowNull: false },
  cedula_validada: { type: DataTypes.BOOLEAN, defaultValue: false },
  rol_admin: { type: DataTypes.BOOLEAN, defaultValue: false },
  codigo_vinculacion: { type: DataTypes.STRING(50), allowNull: true },
  foto_perfil: {  type: DataTypes.STRING(255),  allowNull: true},
  status: {type: DataTypes.ENUM("activo", "inactivo"),    defaultValue: "activo"}
},
  {
    tableName: 'psicologo',
    timestamps: true,
    freezeTableName: true,
    hooks: {
      beforeCreate: async (psicologo: any) => {
        // Genera un código único de 5 caracteres alfanuméricos
        const generarCodigo = () => {
          const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
          let result = "";
          for (let i = 0; i < 5; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
          }
          return result;
        };

        let codigo = generarCodigo();

        // Verificar que no exista en la BD
        let existe = await Psicologo.findOne({ where: { codigo_vinculacion: codigo } });
        while (existe) {
          codigo = generarCodigo();
          existe = await Psicologo.findOne({ where: { codigo_vinculacion: codigo } });
        }

        psicologo.codigo_vinculacion = codigo;
      },
    },
  }
);

 



