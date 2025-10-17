// backend/src/models/associations.ts
import { Modulo } from "./modulo";
import { Actividad } from "./actividad/actividad";
import { ActividadModulo } from "./actividad/actividad-modulo";
import { ActividadAsignada } from "./actividad/actividad-asignada";
import { Evidencia } from "./evidencia";
import { Paciente } from "./paciente";

/**
 * Configuración de todas las asociaciones entre modelos
 * Este archivo debe ser importado en el servidor principal
 */
export function setupAssociations() {
  
  // ==================== MÓDULOS Y ACTIVIDADES ====================
  
  // Relación Módulo <-> Actividad (Many-to-Many a través de ActividadModulo)
  Modulo.belongsToMany(Actividad, {
    through: ActividadModulo,
    foreignKey: 'id_modulo',
    otherKey: 'id_actividad',
    as: 'actividades'
  });

  Actividad.belongsToMany(Modulo, {
    through: ActividadModulo,
    foreignKey: 'id_actividad',
    otherKey: 'id_modulo',
    as: 'modulos'
  });

  // Relación directa para ActividadModulo
  ActividadModulo.belongsTo(Modulo, {
    foreignKey: 'id_modulo',
    as: 'modulo'
  });

  ActividadModulo.belongsTo(Actividad, {
    foreignKey: 'id_actividad',
    as: 'actividad'
  });

  Modulo.hasMany(ActividadModulo, {
    foreignKey: 'id_modulo',
    as: 'actividades_modulo'
  });

  Actividad.hasMany(ActividadModulo, {
    foreignKey: 'id_actividad',
    as: 'modulos_actividad'
  });

  // ==================== ACTIVIDADES ASIGNADAS ====================
  
  // Relación ActividadAsignada <-> Actividad
  ActividadAsignada.belongsTo(Actividad, {
    foreignKey: 'id_actividad',
    as: 'actividad'
  });

  Actividad.hasMany(ActividadAsignada, {
    foreignKey: 'id_actividad',
    as: 'asignaciones'
  });

  // Relación ActividadAsignada <-> Paciente
  ActividadAsignada.belongsTo(Paciente, {
    foreignKey: 'id_paciente',
    as: 'paciente'
  });

  Paciente.hasMany(ActividadAsignada, {
    foreignKey: 'id_paciente',
    as: 'actividades_asignadas'
  });

  // ==================== EVIDENCIAS ====================
  
  // Relación Evidencia <-> ActividadAsignada
  Evidencia.belongsTo(ActividadAsignada, {
    foreignKey: 'id_asignacion',
    as: 'asignacion'
  });

  ActividadAsignada.hasMany(Evidencia, {
    foreignKey: 'id_asignacion',
    as: 'evidencias'
  });

  console.log('✅ Asociaciones de modelos configuradas correctamente');
}