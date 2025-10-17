// backend/src/models/nota.ts

import { DataTypes } from "sequelize";
import db from "../database/connection";

const Nota = db.define('nota', {
  id_nota: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_psicologo: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'psicologo',
      key: 'id_psicologo'
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
  id_aplicacion: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'aplicacion_test',
      key: 'id_aplicacion'
    }
  },
  titulo: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  contenido: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  tipo: {
    type: DataTypes.ENUM('general', 'test'),
    allowNull: false,
    defaultValue: 'general'
  },
  fecha_creacion: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  fecha_actualizacion: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'nota',
  timestamps: false
});

export default Nota;