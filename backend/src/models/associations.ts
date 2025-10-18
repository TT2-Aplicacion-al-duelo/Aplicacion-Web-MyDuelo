// backend/src/models/associations.ts
// Archivo unificado de asociaciones

import { ActividadModulo } from "./actividad-modulo";
import { Modulo } from "./modulo";
import { Actividad } from "./actividad/actividad";
import { ActividadAsignada } from "./actividad/actividad-asignada";
import { Evidencia } from "./evidencia";
import Test from './test';
import PreguntaTest from './preguntaTest';
import AplicacionTest from './aplicacionTest';
import RespuestaTest from './respuesta-test';
import ResultadoTest from './resultado_test';
import Nota from './nota';
import { Paciente } from './paciente';
import { Psicologo } from './psicologo';

export function setupAssociations() {
  console.log('🔧 Iniciando configuración de asociaciones...');

  // ==================== ASOCIACIONES DE TESTS ====================
  console.log('📊 Configurando asociaciones de Tests...');
  
  // Test <-> PreguntaTest
  Test.hasMany(PreguntaTest, { 
    foreignKey: 'id_test', 
    as: 'preguntas' 
  });
  PreguntaTest.belongsTo(Test, { 
    foreignKey: 'id_test', 
    as: 'test' 
  });

  // AplicacionTest <-> Test
  AplicacionTest.belongsTo(Test, { 
    foreignKey: 'id_test', 
    as: 'test' 
  });
  Test.hasMany(AplicacionTest, { 
    foreignKey: 'id_test', 
    as: 'aplicaciones' 
  });

  // AplicacionTest <-> Paciente
  AplicacionTest.belongsTo(Paciente, { 
    foreignKey: 'id_paciente', 
    as: 'paciente' 
  });
  Paciente.hasMany(AplicacionTest, { 
    foreignKey: 'id_paciente', 
    as: 'tests_aplicados' 
  });

  // AplicacionTest <-> Psicologo
  AplicacionTest.belongsTo(Psicologo, { 
    foreignKey: 'id_psicologo', 
    as: 'psicologo' 
  });
  Psicologo.hasMany(AplicacionTest, { 
    foreignKey: 'id_psicologo', 
    as: 'tests_aplicados' 
  });

  // AplicacionTest <-> ResultadoTest
  AplicacionTest.hasOne(ResultadoTest, { 
    foreignKey: 'id_aplicacion', 
    as: 'resultado' 
  });
  ResultadoTest.belongsTo(AplicacionTest, { 
    foreignKey: 'id_aplicacion', 
    as: 'aplicacion' 
  });

  // RespuestaTest <-> AplicacionTest
  RespuestaTest.belongsTo(AplicacionTest, { 
    foreignKey: 'id_aplicacion', 
    as: 'aplicacion' 
  });
  AplicacionTest.hasMany(RespuestaTest, { 
    foreignKey: 'id_aplicacion', 
    as: 'respuestas' 
  });

  // RespuestaTest <-> PreguntaTest
  RespuestaTest.belongsTo(PreguntaTest, { 
    foreignKey: 'id_pregunta', 
    as: 'pregunta' 
  });
  PreguntaTest.hasMany(RespuestaTest, { 
    foreignKey: 'id_pregunta', 
    as: 'respuestas' 
  });

  console.log('✅ Asociaciones de Tests configuradas');

  // ==================== ASOCIACIONES DE NOTAS ====================
  console.log('📝 Configurando asociaciones de Notas...');
  
  // Nota <-> Paciente
  Nota.belongsTo(Paciente, { 
    foreignKey: 'id_paciente', 
    as: 'paciente' 
  });
  Paciente.hasMany(Nota, { 
    foreignKey: 'id_paciente', 
    as: 'notas' 
  });

  // Nota <-> Psicologo
  Nota.belongsTo(Psicologo, { 
    foreignKey: 'id_psicologo', 
    as: 'psicologo' 
  });
  Psicologo.hasMany(Nota, { 
    foreignKey: 'id_psicologo', 
    as: 'notas' 
  });

  // Nota <-> AplicacionTest (opcional)
  Nota.belongsTo(AplicacionTest, { 
    foreignKey: 'id_aplicacion', 
    as: 'aplicacion' 
  });
  AplicacionTest.hasMany(Nota, { 
    foreignKey: 'id_aplicacion', 
    as: 'notas' 
  });

  console.log('✅ Asociaciones de Notas configuradas');

  // ==================== ASOCIACIONES DE MÓDULOS Y ACTIVIDADES ====================
  console.log('📚 Configurando asociaciones de Módulos y Actividades...');
  
  // ActividadModulo <-> Modulo
  ActividadModulo.belongsTo(Modulo, {
    foreignKey: 'id_modulo',
    as: 'modulo'
  });

  // ActividadModulo <-> Actividad
  ActividadModulo.belongsTo(Actividad, {
    foreignKey: 'id_actividad',
    as: 'actividad'
  });

  // Modulo <-> ActividadModulo
  Modulo.hasMany(ActividadModulo, {
    foreignKey: 'id_modulo',
    as: 'actividades_modulo'
  });

  // Modulo <-> Actividad (through ActividadModulo)
  Modulo.belongsToMany(Actividad, {
    through: ActividadModulo,
    foreignKey: 'id_modulo',
    otherKey: 'id_actividad',
    as: 'actividades'
  });

  // Actividad <-> ActividadModulo
  Actividad.hasMany(ActividadModulo, {
    foreignKey: 'id_actividad',
    as: 'modulos_actividad'
  });

  // Actividad <-> Modulo (through ActividadModulo)
  Actividad.belongsToMany(Modulo, {
    through: ActividadModulo,
    foreignKey: 'id_actividad',
    otherKey: 'id_modulo',
    as: 'modulos'
  });

  console.log('✅ Asociaciones de Módulos y Actividades configuradas');

  // ==================== ASOCIACIONES DE EVIDENCIAS ====================
  console.log('📸 Configurando asociaciones de Evidencias...');
  
  // Evidencia <-> ActividadAsignada
  Evidencia.belongsTo(ActividadAsignada, {
    foreignKey: 'id_asignacion',
    as: 'asignacion'
  });

  ActividadAsignada.hasMany(Evidencia, {
    foreignKey: 'id_asignacion',
    as: 'evidencias'
  });

  console.log('✅ Asociaciones de Evidencias configuradas');

  console.log('🎉 TODAS las asociaciones configuradas exitosamente');
}