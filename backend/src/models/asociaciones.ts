import Test from '../models/test';
import PreguntaTest from '../models/preguntaTest';
import AplicacionTest from '../models/aplicacionTest';
import RespuestaTest from '../models/respuesta-test';
import ResultadoTest from '../models/Resultado_test';
import Nota from '../models/nota';
import { Paciente } from '../models/paciente';
import { Psicologo } from '../models/psicologo';

export const configurarAsociaciones = () => {
  // ==================== ASOCIACIONES DE TESTS ====================
  
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

  // ==================== ASOCIACIONES DE NOTAS ====================
  
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

  console.log('✅ Asociaciones de modelos configuradas correctamente');
};

export default configurarAsociaciones;