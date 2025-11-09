import { DataTypes, Model } from 'sequelize';
import sequelize from '../database/connection';

export class Notificacion extends Model {}

Notificacion.init(
  {
    id_notificacion: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_psicologo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'psicologo',
        key: 'id_psicologo'
      }
    },
    tipo: {
      type: DataTypes.ENUM('chat', 'actividad', 'cita', 'foro', 'recordatorio', 'sistema'),
      allowNull: false
    },
    titulo: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    mensaje: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    leida: {
      type: DataTypes.TINYINT,
      defaultValue: 0,
    },
    id_relacionado: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    enlace: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    fecha_creacion: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    fecha_leida: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'notificacion',
    timestamps: false,
  }
);

export default Notificacion;