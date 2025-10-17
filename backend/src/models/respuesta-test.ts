import { DataTypes } from "sequelize";
import db from "../database/connection";

const RespuestaTest = db.define('respuesta_test', {
  id_respuesta: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_aplicacion: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'aplicacion_test',
      key: 'id_aplicacion'
    }
  },
  id_pregunta: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'pregunta_test',
      key: 'id_pregunta'
    }
  },
  respuesta: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  tableName: 'respuesta_test',
  timestamps: false
});

export default RespuestaTest;