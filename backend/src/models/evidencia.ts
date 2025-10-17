import { DataTypes } from "sequelize";
import db from "../database/connection";
import { ActividadAsignada } from "./actividad/actividad-asignada";

export const Evidencia = db.define('evidencia', {
  id_evidencia: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_asignacion: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'actividad_asignada',
      key: 'id_asignacion'
    }
  },
  archivo_url: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  comentario: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  visible_para_psicologo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  fecha_subida: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'evidencia',
  timestamps: false
});

// Evidencia.belongsTo(ActividadAsignada, {
//     foreignKey: 'id_asignacion',
//     as: 'asignacion'
//   });

//   ActividadAsignada.hasMany(Evidencia, {
//     foreignKey: 'id_asignacion',
//     as: 'evidencias'
//   }); 