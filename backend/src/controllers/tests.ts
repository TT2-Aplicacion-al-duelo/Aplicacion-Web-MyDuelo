import { Request, Response } from "express";
import Test from "../models/test";
import PreguntaTest from '../models/preguntaTest';
import AplicacionTest from '../models/aplicacionTest';
import RespuestaTest from '../models/respuesta-test';
import ResultadoTest from '../models/Resultado_test';
import { Paciente } from "../models/paciente";

/**
 * GET /api/psicologo/tests
 * Obtener todos los tests disponibles y activos
 */
export const getTestsDisponibles = async (req: Request, res: Response) => {
  try {
    const tests = await Test.findAll({
      where: { activo: true },
      order: [['fecha_creacion', 'DESC']]
    });

    res.json(tests);
  } catch (error) {
    console.error("Error al obtener tests:", error);
    res.status(500).json({ msg: "Error al obtener tests disponibles" });
  }
};

/**
 * GET /api/psicologo/tests/:id_test
 * Obtener detalles de un test con sus preguntas
 */
export const getDetalleTest = async (req: Request, res: Response) => {
  try {
    const { id_test } = req.params;

    const test = await Test.findByPk(id_test, {
      include: [
        {
          model: PreguntaTest,
          as: 'preguntas',
          order: [['numero_pregunta', 'ASC']]
        }
      ]
    });

    if (!test) {
      return res.status(404).json({ msg: "Test no encontrado" });
    }

    res.json(test);
  } catch (error) {
    console.error("Error al obtener detalle del test:", error);
    res.status(500).json({ msg: "Error al obtener detalle del test" });
  }
};

/**
 * POST /api/psicologo/tests/aplicar
 * Aplicar un test a un paciente
 */
export const aplicarTest = async (req: Request, res: Response) => {
  try {
    const id_psicologo = (req as any).user?.id_psicologo;
    const { id_test, id_paciente, respuestas } = req.body;

    if (!id_psicologo) {
      return res.status(401).json({ msg: "No autorizado" });
    }

    // Verificar que el paciente pertenece al psicólogo
    const paciente = await Paciente.findOne({
      where: { id_paciente, id_psicologo }
    });

    if (!paciente) {
      return res.status(404).json({ msg: "Paciente no encontrado" });
    }

    // Verificar que el test existe
    const test = await Test.findByPk(id_test);
    if (!test) {
      return res.status(404).json({ msg: "Test no encontrado" });
    }

    // Crear aplicación del test
    const aplicacion = await AplicacionTest.create({
      id_test,
      id_paciente,
      id_psicologo,
      fecha: new Date(),
      estado: 'completado'
    });

    // Guardar respuestas si se proporcionaron
    if (respuestas && Array.isArray(respuestas)) {
      for (const respuesta of respuestas) {
        await RespuestaTest.create({
          id_aplicacion: (aplicacion as any).id_aplicacion,
          id_pregunta: respuesta.id_pregunta,
          respuesta: respuesta.respuesta
        });
      }

      // Calcular puntaje e interpretación
      const puntaje = calcularPuntaje(respuestas);
      const interpretacion = generarInterpretacion(puntaje, (test as any).nombre);

      // Crear resultado
      await ResultadoTest.create({
        id_aplicacion: (aplicacion as any).id_aplicacion,
        puntaje_total: puntaje,
        interpretacion
      });
    }

    // Cargar la aplicación completa con relaciones
    const aplicacionCompleta = await AplicacionTest.findByPk((aplicacion as any).id_aplicacion, {
      include: [
        { model: Test, as: 'test' },
        { model: ResultadoTest, as: 'resultado' }
      ]
    });

    res.status(201).json(aplicacionCompleta);
  } catch (error) {
    console.error("Error al aplicar test:", error);
    res.status(500).json({ msg: "Error al aplicar test" });
  }
};

/**
 * GET /api/psicologo/pacientes/:id_paciente/tests
 * Obtener historial de tests aplicados a un paciente
 */
export const getHistorialTests = async (req: Request, res: Response) => {
  try {
    const id_psicologo = (req as any).user?.id_psicologo;
    const { id_paciente } = req.params;

    if (!id_psicologo) {
      return res.status(401).json({ msg: "No autorizado" });
    }

    // Verificar que el paciente pertenece al psicólogo
    const paciente = await Paciente.findOne({
      where: { id_paciente, id_psicologo }
    });

    if (!paciente) {
      return res.status(404).json({ msg: "Paciente no encontrado" });
    }

    // Obtener historial
    const historial = await AplicacionTest.findAll({
      where: { id_paciente },
      include: [
        { model: Test, as: 'test' },
        { model: ResultadoTest, as: 'resultado' }
      ],
      order: [['fecha', 'DESC']]
    });

    res.json(historial);
  } catch (error) {
    console.error("Error al obtener historial:", error);
    res.status(500).json({ msg: "Error al obtener historial de tests" });
  }
};

/**
 * GET /api/psicologo/pacientes/:id_paciente/tests/graficas
 * Obtener datos para gráficas de evolución
 */
export const getDatosGraficas = async (req: Request, res: Response) => {
  try {
    const id_psicologo = (req as any).user?.id_psicologo;
    const { id_paciente } = req.params;
    const { id_test } = req.query;

    if (!id_psicologo) {
      return res.status(401).json({ msg: "No autorizado" });
    }

    // Construir where clause
    const whereClause: any = { id_paciente };
    if (id_test) {
      whereClause.id_test = id_test;
    }

    const aplicaciones = await AplicacionTest.findAll({
      where: whereClause,
      include: [
        { model: Test, as: 'test' },
        { model: ResultadoTest, as: 'resultado' }
      ],
      order: [['fecha', 'ASC']]
    });

    const datosGraficas = aplicaciones
      .filter((apl: any) => apl.resultado)
      .map((apl: any) => ({
        fecha: apl.fecha,
        puntaje: apl.resultado.puntaje_total,
        interpretacion: apl.resultado.interpretacion,
        nombre_test: apl.test.nombre
      }));

    res.json(datosGraficas);
  } catch (error) {
    console.error("Error al obtener datos de gráficas:", error);
    res.status(500).json({ msg: "Error al obtener datos para gráficas" });
  }
};

/**
 * GET /api/psicologo/tests/aplicaciones/:id_aplicacion/respuestas
 * Obtener respuestas de una aplicación de test
 */
export const getRespuestasTest = async (req: Request, res: Response) => {
  try {
    const id_psicologo = (req as any).user?.id_psicologo;
    const { id_aplicacion } = req.params;

    if (!id_psicologo) {
      return res.status(401).json({ msg: "No autorizado" });
    }

    // Verificar que la aplicación pertenece a un paciente del psicólogo
    const aplicacion = await AplicacionTest.findByPk(id_aplicacion, {
      include: [
        {
          model: Paciente,
          as: 'paciente',
          where: { id_psicologo }
        }
      ]
    });

    if (!aplicacion) {
      return res.status(404).json({ msg: "Aplicación no encontrada" });
    }

    // Obtener respuestas
    const respuestas = await RespuestaTest.findAll({
      where: { id_aplicacion },
      include: [
        {
          model: PreguntaTest,
          as: 'pregunta'
        }
      ],
      order: [['id_pregunta', 'ASC']]
    });

    res.json(respuestas);
  } catch (error) {
    console.error("Error al obtener respuestas:", error);
    res.status(500).json({ msg: "Error al obtener respuestas del test" });
  }
};

/**
 * GET /api/psicologo/tests/aplicaciones/:id_aplicacion/resultado
 * Obtener resultado de un test
 */
export const getResultadoTest = async (req: Request, res: Response) => {
  try {
    const id_psicologo = (req as any).user?.id_psicologo;
    const { id_aplicacion } = req.params;

    if (!id_psicologo) {
      return res.status(401).json({ msg: "No autorizado" });
    }

    const resultado = await ResultadoTest.findOne({
      where: { id_aplicacion },
      include: [
        {
          model: AplicacionTest,
          as: 'aplicacion',
          include: [
            {
              model: Paciente,
              as: 'paciente',
              where: { id_psicologo }
            }
          ]
        }
      ]
    });

    if (!resultado) {
      return res.status(404).json({ msg: "Resultado no encontrado" });
    }

    res.json(resultado);
  } catch (error) {
    console.error("Error al obtener resultado:", error);
    res.status(500).json({ msg: "Error al obtener resultado del test" });
  }
};

/**
 * GET /api/psicologo/tests/aplicaciones/:id_aplicacion/pdf
 * Generar y descargar PDF de respuestas (placeholder)
 */
export const generarPDFRespuestas = async (req: Request, res: Response) => {
  try {
    const id_psicologo = (req as any).user?.id_psicologo;
    const { id_aplicacion } = req.params;

    if (!id_psicologo) {
      return res.status(401).json({ msg: "No autorizado" });
    }

    // TODO: Implementar generación de PDF con una librería como pdfkit o puppeteer
    // Por ahora retornamos un mensaje
    res.status(501).json({ 
      msg: "Generación de PDF aún no implementada",
      nota: "Se implementará con pdfkit o puppeteer"
    });
  } catch (error) {
    console.error("Error al generar PDF:", error);
    res.status(500).json({ msg: "Error al generar PDF" });
  }
};

// ==================== FUNCIONES AUXILIARES ====================

/**
 * Calcular puntaje total del test
 */
function calcularPuntaje(respuestas: any[]): number {
  let puntaje = 0;
  for (const respuesta of respuestas) {
    const valor = parseInt(respuesta.respuesta);
    if (!isNaN(valor)) {
      puntaje += valor;
    }
  }
  return puntaje;
}

/**
 * Generar interpretación según puntaje
 */
function generarInterpretacion(puntaje: number, nombreTest: string): string {
  // Interpretación genérica basada en rangos
  // En producción, esto debería ser específico para cada test
  if (puntaje < 30) {
    return "Nivel bajo - Sin indicadores significativos";
  } else if (puntaje < 60) {
    return "Nivel moderado - Requiere seguimiento";
  } else {
    return "Nivel alto - Atención prioritaria recomendada";
  }
}