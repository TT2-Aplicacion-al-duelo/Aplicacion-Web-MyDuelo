// backend/src/models/actividad-modulo.ts
import { DataTypes } from "sequelize";
import db from "../database/connection";

export const ActividadModulo = db.define('actividad_modulo', {
  id_actividad_modulo: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_modulo: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'modulo',
      key: 'id_modulo'
    }
  },
  id_actividad: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'actividad',
      key: 'id_actividad'
    }
  }
}, {
  tableName: 'actividad_modulo',
  timestamps: false
});