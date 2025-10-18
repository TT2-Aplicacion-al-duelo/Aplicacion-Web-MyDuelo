import { DataTypes } from "sequelize";
import db from "../database/connection";

const ResultadoTest = db.define('resultado_test', {
  id_resultado: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_aplicacion: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true, // Una aplicación solo puede tener un resultado
    references: {
      model: 'aplicacion_test',
      key: 'id_aplicacion'
    }
  },
  puntaje_total: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  interpretacion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  pdf_url: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  fecha_creacion: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'resultado_test',
  timestamps: false
});

export default ResultadoTest;