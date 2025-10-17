import { DataTypes } from "sequelize";
import db from "../database/connection";
import { Actividad } from "./actividad/actividad";
import { ActividadModulo } from "./actividad-modulo";

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

//  Modulo.belongsToMany(Actividad, {
//     through: ActividadModulo,
//     foreignKey: 'id_modulo',
//     otherKey: 'id_actividad',
//     as: 'actividades'
//   });

//   Actividad.belongsToMany(Modulo, {
//     through: ActividadModulo,
//     foreignKey: 'id_actividad',
//     otherKey: 'id_modulo',
//     as: 'modulos'
//   });