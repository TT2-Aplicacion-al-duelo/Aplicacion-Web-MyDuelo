// backend/src/models/actividad/actividad-paciente.ts
import { DataTypes } from 'sequelize';
import sequelize from '../../database/connection';
import { Actividad } from './actividad';
import { Paciente } from '../paciente';

export const ActividadPaciente = sequelize.define('actividad_paciente', {
  id_actividad_paciente: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_paciente: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'paciente',
      key: 'id_paciente'
    }
  },
  id_actividad: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'actividad',
      key: 'id_actividad'
    }
  },
  estado: {
    type: DataTypes.ENUM('pendiente', 'en progreso', 'completada'),
    defaultValue: 'pendiente'
  },
  evidencia_texto: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  evidencia_foto: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  duracion_segundos: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  fecha_realizacion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'actividad_paciente',
  timestamps: false
});