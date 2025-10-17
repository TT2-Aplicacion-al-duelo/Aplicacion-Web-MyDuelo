import { Request, Response } from "express";
import Nota from "../models/nota";
import { Paciente } from "../models/paciente";
import AplicacionTest from "../models/aplicacionTest";


/**
 * GET /api/psicologo/pacientes/:id_paciente/notas
 * Obtener todas las notas de un paciente
 */
export const getNotasPaciente = async (req: Request, res: Response) => {
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

    // Obtener notas
    const notas = await Nota.findAll({
      where: { 
        id_paciente,
        id_psicologo 
      },
      order: [['fecha_creacion', 'DESC']]
    });

    res.json(notas);
  } catch (error) {
    console.error("Error al obtener notas:", error);
    res.status(500).json({ msg: "Error al obtener notas" });
  }
};

/**
 * GET /api/psicologo/notas/:id_nota
 * Obtener una nota específica
 */
export const getNotaPorId = async (req: Request, res: Response) => {
  try {
    const id_psicologo = (req as any).user?.id_psicologo;
    const { id_nota } = req.params;

    if (!id_psicologo) {
      return res.status(401).json({ msg: "No autorizado" });
    }

    const nota = await Nota.findOne({
      where: { 
        id_nota,
        id_psicologo 
      }
    });

    if (!nota) {
      return res.status(404).json({ msg: "Nota no encontrada" });
    }

    res.json(nota);
  } catch (error) {
    console.error("Error al obtener nota:", error);
    res.status(500).json({ msg: "Error al obtener nota" });
  }
};

/**
 * POST /api/psicologo/notas
 * Crear una nueva nota
 */
export const crearNota = async (req: Request, res: Response) => {
  try {
    const id_psicologo = (req as any).user?.id_psicologo;
    const { id_paciente, id_aplicacion, titulo, contenido, tipo } = req.body;

    if (!id_psicologo) {
      return res.status(401).json({ msg: "No autorizado" });
    }

    // Validaciones
    if (!titulo || !contenido || !tipo) {
      return res.status(400).json({ msg: "Faltan datos requeridos" });
    }

    if (!['general', 'test'].includes(tipo)) {
      return res.status(400).json({ msg: "Tipo de nota inválido" });
    }

    // Verificar que el paciente pertenece al psicólogo
    const paciente = await Paciente.findOne({
      where: { id_paciente, id_psicologo }
    });

    if (!paciente) {
      return res.status(404).json({ msg: "Paciente no encontrado" });
    }

    // Si es nota de test, verificar la aplicación
    if (tipo === 'test' && id_aplicacion) {
      const aplicacion = await AplicacionTest.findOne({
        where: { 
          id_aplicacion,
          id_paciente,
          id_psicologo 
        }
      });

      if (!aplicacion) {
        return res.status(404).json({ msg: "Aplicación de test no encontrada" });
      }
    }

    // Crear nota
    const nota = await Nota.create({
      id_psicologo,
      id_paciente,
      id_aplicacion: tipo === 'test' ? id_aplicacion : null,
      titulo,
      contenido,
      tipo
    });

    res.status(201).json(nota);
  } catch (error) {
    console.error("Error al crear nota:", error);
    res.status(500).json({ msg: "Error al crear nota" });
  }
};

/**
 * PUT /api/psicologo/notas/:id_nota
 * Actualizar una nota existente
 */
export const actualizarNota = async (req: Request, res: Response) => {
  try {
    const id_psicologo = (req as any).user?.id_psicologo;
    const { id_nota } = req.params;
    const { titulo, contenido } = req.body;

    if (!id_psicologo) {
      return res.status(401).json({ msg: "No autorizado" });
    }

    // Buscar nota
    const nota = await Nota.findOne({
      where: { 
        id_nota,
        id_psicologo 
      }
    });

    if (!nota) {
      return res.status(404).json({ msg: "Nota no encontrada" });
    }

    // Actualizar campos
    if (titulo) (nota as any).titulo = titulo;
    if (contenido) (nota as any).contenido = contenido;
    (nota as any).fecha_actualizacion = new Date();

    await nota.save();

    res.json(nota);
  } catch (error) {
    console.error("Error al actualizar nota:", error);
    res.status(500).json({ msg: "Error al actualizar nota" });
  }
};

/**
 * DELETE /api/psicologo/notas/:id_nota
 * Eliminar una nota
 */
export const eliminarNota = async (req: Request, res: Response) => {
  try {
    const id_psicologo = (req as any).user?.id_psicologo;
    const { id_nota } = req.params;

    if (!id_psicologo) {
      return res.status(401).json({ msg: "No autorizado" });
    }

    const nota = await Nota.findOne({
      where: { 
        id_nota,
        id_psicologo 
      }
    });

    if (!nota) {
      return res.status(404).json({ msg: "Nota no encontrada" });
    }

    await nota.destroy();

    res.json({ msg: "Nota eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar nota:", error);
    res.status(500).json({ msg: "Error al eliminar nota" });
  }
};

/**
 * GET /api/psicologo/tests/aplicaciones/:id_aplicacion/notas
 * Obtener notas relacionadas con una aplicación de test
 */
export const getNotasTest = async (req: Request, res: Response) => {
  try {
    const id_psicologo = (req as any).user?.id_psicologo;
    const { id_aplicacion } = req.params;

    if (!id_psicologo) {
      return res.status(401).json({ msg: "No autorizado" });
    }

    // Verificar que la aplicación pertenece al psicólogo
    const aplicacion = await AplicacionTest.findOne({
      where: { 
        id_aplicacion,
        id_psicologo 
      }
    });

    if (!aplicacion) {
      return res.status(404).json({ msg: "Aplicación no encontrada" });
    }

    // Obtener notas
    const notas = await Nota.findAll({
      where: { 
        id_aplicacion,
        id_psicologo,
        tipo: 'test'
      },
      order: [['fecha_creacion', 'DESC']]
    });

    res.json(notas);
  } catch (error) {
    console.error("Error al obtener notas del test:", error);
    res.status(500).json({ msg: "Error al obtener notas del test" });
  }
};