// backend/src/models/aplicacionTest.ts

import { DataTypes } from "sequelize";
import db from "../database/connection";

const AplicacionTest = db.define('aplicacion_test', {
  id_aplicacion: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_test: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'test',
      key: 'id_test'
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
  id_psicologo: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'psicologo',
      key: 'id_psicologo'
    }
  },
  fecha: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  fecha_creacion: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  estado: {
    type: DataTypes.ENUM('pendiente', 'completado'),
    allowNull: false,
    defaultValue: 'completado'
  }
}, {
  tableName: 'aplicacion_test',
  timestamps: false
});

export default AplicacionTest;