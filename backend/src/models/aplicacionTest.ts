// backend/src/models/pregunta_test.ts

import { DataTypes } from "sequelize";
import db from "../database/connection";

const PreguntaTest = db.define('pregunta_test', {
  id_pregunta: {
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
  numero_pregunta: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  texto_pregunta: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  tipo_respuesta: {
    type: DataTypes.ENUM('escala', 'si_no', 'texto', 'multiple'),
    allowNull: false,
    defaultValue: 'escala'
  },
  opciones: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  tableName: 'pregunta_test',
  timestamps: false
});

export default PreguntaTest;