// models/associations.ts
import { ActividadModulo } from "./actividad-modulo";
import { Modulo } from "./modulo";
import { Actividad } from "./actividad/actividad";
import { ActividadAsignada } from "./actividad/actividad-asignada";
import { Evidencia } from "./evidencia";

export function setupAssociations() {
  // ============ ACTIVIDAD-MODULO ============
  ActividadModulo.belongsTo(Modulo, {
    foreignKey: 'id_modulo',
    as: 'modulo'
  });

  ActividadModulo.belongsTo(Actividad, {
    foreignKey: 'id_actividad',
    as: 'actividad'
  });

  // ============ MODULO ============
  Modulo.hasMany(ActividadModulo, {
    foreignKey: 'id_modulo',
    as: 'actividades_modulo'
  });

  Modulo.belongsToMany(Actividad, {
    through: ActividadModulo,
    foreignKey: 'id_modulo',
    otherKey: 'id_actividad',
    as: 'actividades'
  });

  // ============ ACTIVIDAD ============
  Actividad.hasMany(ActividadModulo, {
    foreignKey: 'id_actividad',
    as: 'modulos_actividad'
  });

  Actividad.belongsToMany(Modulo, {
    through: ActividadModulo,
    foreignKey: 'id_actividad',
    otherKey: 'id_modulo',
    as: 'modulos'
  });

  // ============ EVIDENCIA - ACTIVIDAD ASIGNADA ============
  Evidencia.belongsTo(ActividadAsignada, {
    foreignKey: 'id_asignacion',
    as: 'asignacion'
  });

  ActividadAsignada.hasMany(Evidencia, {
    foreignKey: 'id_asignacion',
    as: 'evidencias'
  });

  console.log('✅ Asociaciones configuradas exitosamente');
}