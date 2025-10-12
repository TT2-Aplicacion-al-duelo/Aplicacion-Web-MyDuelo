// backend/src/models/actividad/actividad-asignada.ts
import { DataTypes } from 'sequelize';
import sequelize from '../../database/connection';
import { Actividad } from './actividad';
import { Paciente } from '../paciente';

export const ActividadAsignada = sequelize.define('actividad_asignada', {
  id_asignacion: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_actividad: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'actividad',
      key: 'id_actividad'
    }
  },
  id_paciente: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'paciente',
      key: 'id_paciente'
    }
  },
  estado: {
    type: DataTypes.ENUM('en_proceso', 'finalizada'),
    defaultValue: 'en_proceso',
    allowNull: false
  },
  fecha_asignacion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  fecha_limite: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  instrucciones_personalizadas: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  prioridad: {
    type: DataTypes.ENUM('baja', 'media', 'alta'),
    defaultValue: 'media'
  }
}, {
  tableName: 'actividad_asignada',
  timestamps: false
});

// Relaciones
ActividadAsignada.belongsTo(Actividad, {
  foreignKey: 'id_actividad',
  as: 'actividad'
});

ActividadAsignada.belongsTo(Paciente, {
  foreignKey: 'id_paciente',
  as: 'paciente'
});

Actividad.hasMany(ActividadAsignada, {
  foreignKey: 'id_actividad',
  as: 'asignaciones'
});

Paciente.hasMany(ActividadAsignada, {
  foreignKey: 'id_paciente',
  as: 'actividades_asignadas'
});