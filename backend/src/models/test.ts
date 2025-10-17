// backend/src/models/test.ts

import { DataTypes } from "sequelize";
import db from "../database/connection";

const Test = db.define('test', {
  id_test: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  tipo_escala: {
    type: DataTypes.ENUM('likert_5', 'likert_7', 'si_no'),
    allowNull: false,
    defaultValue: 'likert_5'
  },
  activo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  fecha_creacion: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'test',
  timestamps: false
});

export default Test;