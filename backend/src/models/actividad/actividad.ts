// backend/src/models/actividad/actividad.ts
import { DataTypes } from 'sequelize';
import sequelize from '../../database/connection';
import { Psicologo } from '../psicologo';

export const Actividad = sequelize.define('actividad', {
  id_actividad: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  titulo: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  tipo: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  obligatoria: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  repetitiva: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  periodo: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  archivo_url: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  origen: {
    type: DataTypes.ENUM('personalizada', 'modulo'),
    allowNull: false
  },
  id_psicologo_creador: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'psicologo',
      key: 'id_psicologo'
    }
  }
}, {
  tableName: 'actividad',
  timestamps: false
});

// Relación con Psicólogo
Actividad.belongsTo(Psicologo, {
  foreignKey: 'id_psicologo_creador',
  as: 'creador'
});