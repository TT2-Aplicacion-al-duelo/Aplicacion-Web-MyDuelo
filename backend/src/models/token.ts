// backend/src/models/token.ts
import { DataTypes } from "sequelize";
import sequelize from "../database/connection";
import { Psicologo } from "./psicologo";

export const Token = sequelize.define('token', {
  id_token: {
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
  token: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
  tipo: {
    type: DataTypes.ENUM('activacion', 'recuperacion'),
    allowNull: false
  },
  fecha_expiracion: {
    type: DataTypes.DATE,
    allowNull: false
  },
  usado: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  fecha_creacion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'token',
  timestamps: false
});

// Relación con Psicólogo
Token.belongsTo(Psicologo, {
  foreignKey: 'id_psicologo',
  as: 'psicologo'
});

Psicologo.hasMany(Token, {
  foreignKey: 'id_psicologo',
  as: 'tokens'
});