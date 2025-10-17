// backend/src/models/modulo.ts
import { DataTypes } from "sequelize";
import db from "../database/connection";

export const Modulo = db.define('modulo', {
  id_modulo: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  etapa_duelo: {
    type: DataTypes.ENUM('Negación', 'Ira', 'Negociación', 'Depresión', 'Aceptación'),
    allowNull: false
  }
}, {
  tableName: 'modulo',
  timestamps: false
});