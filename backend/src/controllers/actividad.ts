// backend/src/controllers/actividad.ts
import { Request, Response } from "express";
import { Actividad } from "../models/actividad/actividad";
import { ActividadAsignada } from "../models/actividad/actividad-asignada";
import { Paciente } from "../models/paciente";
import { Op } from "sequelize";

// ==================== PLANTILLAS GLOBALES ====================

/**
 * GET /api/psicologo/actividades
 * Obtener todas las plantillas de actividades del psicólogo
 */
export const getActividadesGlobales = async (req: Request, res: Response) => {
  try {
    const id_psicologo = (req as any).user?.id_psicologo;
    
    if (!id_psicologo) {
      return res.status(401).json({ msg: "No autorizado" });
    }

    const actividades = await Actividad.findAll({
      where: {
        id_psicologo_creador: id_psicologo,
        origen: 'personalizada'
      },
      order: [['id_actividad', 'DESC']]
    });

    res.json(actividades);
  } catch (error) {
    console.error("Error al obtener actividades:", error);
    res.status(500).json({ msg: "Error al obtener actividades" });
  }
};

/**
 * POST /api/psicologo/actividades
 * Crear una nueva plantilla de actividad
 */
export const crearActividadGlobal = async (req: Request, res: Response) => {
  try {
    const id_psicologo = (req as any).user?.id_psicologo;
    
    if (!id_psicologo) {
      return res.status(401).json({ msg: "No autorizado" });
    }

    const { titulo, descripcion, tipo, obligatoria, repetitiva, periodo, archivo_url } = req.body;

    if (!titulo) {
      return res.status(400).json({ msg: "El título es requerido" });
    }

    const nuevaActividad = await Actividad.create({
      titulo,
      descripcion,
      tipo,
      obligatoria: obligatoria || false,
      repetitiva: repetitiva || false,
      periodo,
      archivo_url,
      origen: 'personalizada',
      id_psicologo_creador: id_psicologo
    });

    res.status(201).json(nuevaActividad);
  } catch (error) {
    console.error("Error al crear actividad:", error);
    res.status(500).json({ msg: "Error al crear actividad" });
  }
};

/**
 * PUT /api/psicologo/actividades/:id_actividad
 * Actualizar una plantilla de actividad
 */
export const actualizarActividadGlobal = async (req: Request, res: Response) => {
  try {
    const id_psicologo = (req as any).user?.id_psicologo;
    const { id_actividad } = req.params;
    
    if (!id_psicologo) {
      return res.status(401).json({ msg: "No autorizado" });
    }

    const actividad = await Actividad.findOne({
      where: {
        id_actividad,
        id_psicologo_creador: id_psicologo
      }
    });

    if (!actividad) {
      return res.status(404).json({ msg: "Actividad no encontrada" });
    }

    const { titulo, descripcion, tipo, obligatoria, repetitiva, periodo, archivo_url } = req.body;

    await actividad.update({
      titulo,
      descripcion,
      tipo,
      obligatoria,
      repetitiva,
      periodo,
      archivo_url
    });

    res.json(actividad);
  } catch (error) {
    console.error("Error al actualizar actividad:", error);
    res.status(500).json({ msg: "Error al actualizar actividad" });
  }
};

/**
 * DELETE /api/psicologo/actividades/:id_actividad
 * Eliminar una plantilla de actividad
 */
export const eliminarActividadGlobal = async (req: Request, res: Response) => {
  try {
    const id_psicologo = (req as any).user?.id_psicologo;
    const { id_actividad } = req.params;
    
    if (!id_psicologo) {
      return res.status(401).json({ msg: "No autorizado" });
    }

    const actividad = await Actividad.findOne({
      where: {
        id_actividad,
        id_psicologo_creador: id_psicologo
      }
    });

    if (!actividad) {
      return res.status(404).json({ msg: "Actividad no encontrada" });
    }

    await actividad.destroy();
    res.json({ msg: "Actividad eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar actividad:", error);
    res.status(500).json({ msg: "Error al eliminar actividad" });
  }
};

// ==================== ASIGNACIÓN DE ACTIVIDADES ====================

/**
 * GET /api/psicologo/paciente/:id_paciente/actividades
 * Obtener actividades asignadas a un paciente específico
 */
export const getActividadesPaciente = async (req: Request, res: Response) => {
  try {
    const id_psicologo = (req as any).user?.id_psicologo;
    const { id_paciente } = req.params;
    
    if (!id_psicologo) {
      return res.status(401).json({ msg: "No autorizado" });
    }

    // Verificar que el paciente pertenece al psicólogo
    const paciente = await Paciente.findOne({
      where: {
        id_paciente,
        id_psicologo
      }
    });

    if (!paciente) {
      return res.status(404).json({ msg: "Paciente no encontrado" });
    }

    const actividades = await ActividadAsignada.findAll({
      where: { id_paciente },
      include: [
        {
          model: Actividad,
          as: 'actividad',
          attributes: ['id_actividad', 'titulo', 'descripcion', 'tipo', 'archivo_url']
        }
      ],
      order: [['fecha_asignacion', 'DESC']]
    });

    res.json(actividades);
  } catch (error) {
    console.error("Error al obtener actividades del paciente:", error);
    res.status(500).json({ msg: "Error al obtener actividades" });
  }
};

/**
 * POST /api/psicologo/actividades/asignar
 * Asignar una o varias actividades a uno o varios pacientes
 * Body: {
 *   id_actividad: number,
 *   pacientes: number[],
 *   fecha_limite?: string,
 *   instrucciones_personalizadas?: string,
 *   prioridad?: 'baja' | 'media' | 'alta'
 * }
 */
export const asignarActividad = async (req: Request, res: Response) => {
  try {
    const id_psicologo = (req as any).user?.id_psicologo;
    
    if (!id_psicologo) {
      return res.status(401).json({ msg: "No autorizado" });
    }

    const { id_actividad, pacientes, fecha_limite, instrucciones_personalizadas, prioridad } = req.body;

    if (!id_actividad || !pacientes || !Array.isArray(pacientes) || pacientes.length === 0) {
      return res.status(400).json({ msg: "Datos inválidos" });
    }

    // Verificar que la actividad existe y pertenece al psicólogo
    const actividad = await Actividad.findOne({
      where: {
        id_actividad,
        id_psicologo_creador: id_psicologo
      }
    });

    if (!actividad) {
      return res.status(404).json({ msg: "Actividad no encontrada" });
    }

    // Verificar que todos los pacientes pertenecen al psicólogo
    const pacientesValidos = await Paciente.findAll({
      where: {
        id_paciente: {
          [Op.in]: pacientes
        },
        id_psicologo
      }
    });

    if (pacientesValidos.length !== pacientes.length) {
      return res.status(400).json({ msg: "Algunos pacientes no son válidos" });
    }

    // Crear asignaciones
    const asignaciones = await Promise.all(
      pacientes.map(async (id_paciente: number) => {
        return await ActividadAsignada.create({
          id_actividad,
          id_paciente,
          fecha_limite,
          instrucciones_personalizadas,
          prioridad: prioridad || 'media',
          estado: 'en_proceso'
        });
      })
    );

    res.status(201).json({
      msg: `Actividad asignada a ${pacientes.length} paciente(s)`,
      asignaciones
    });
  } catch (error) {
    console.error("Error al asignar actividad:", error);
    res.status(500).json({ msg: "Error al asignar actividad" });
  }
};

/**
 * PUT /api/psicologo/actividades/asignadas/:id_asignacion
 * Actualizar una actividad asignada (instrucciones, estado, etc.)
 */
export const actualizarActividadAsignada = async (req: Request, res: Response) => {
  try {
    const id_psicologo = (req as any).user?.id_psicologo;
    const { id_asignacion } = req.params;
    
    if (!id_psicologo) {
      return res.status(401).json({ msg: "No autorizado" });
    }

    const asignacion = await ActividadAsignada.findOne({
      where: { id_asignacion },
      include: [
        {
          model: Actividad,
          as: 'actividad',
          where: { id_psicologo_creador: id_psicologo }
        }
      ]
    });

    if (!asignacion) {
      return res.status(404).json({ msg: "Asignación no encontrada" });
    }

    const { estado, fecha_limite, instrucciones_personalizadas, prioridad } = req.body;

    await asignacion.update({
      estado,
      fecha_limite,
      instrucciones_personalizadas,
      prioridad
    });

    res.json(asignacion);
  } catch (error) {
    console.error("Error al actualizar asignación:", error);
    res.status(500).json({ msg: "Error al actualizar asignación" });
  }
};

/**
 * DELETE /api/psicologo/actividades/asignadas/:id_asignacion
 * Eliminar una actividad asignada
 */
export const eliminarActividadAsignada = async (req: Request, res: Response) => {
  try {
    const id_psicologo = (req as any).user?.id_psicologo;
    const { id_asignacion } = req.params;
    
    if (!id_psicologo) {
      return res.status(401).json({ msg: "No autorizado" });
    }

    const asignacion = await ActividadAsignada.findOne({
      where: { id_asignacion },
      include: [
        {
          model: Actividad,
          as: 'actividad',
          where: { id_psicologo_creador: id_psicologo }
        }
      ]
    });

    if (!asignacion) {
      return res.status(404).json({ msg: "Asignación no encontrada" });
    }

    await asignacion.destroy();
    res.json({ msg: "Actividad desasignada correctamente" });
  } catch (error) {
    console.error("Error al eliminar asignación:", error);
    res.status(500).json({ msg: "Error al eliminar asignación" });
  }
};

/**
 * POST /api/psicologo/actividades/asignadas/:id_asignacion/recordatorio
 * Enviar recordatorio de actividad (placeholder para futura implementación)
 */
export const enviarRecordatorio = async (req: Request, res: Response) => {
  try {
    const id_psicologo = (req as any).user?.id_psicologo;
    const { id_asignacion } = req.params;
    
    if (!id_psicologo) {
      return res.status(401).json({ msg: "No autorizado" });
    }

    // TODO: Implementar lógica de envío de recordatorio
    // Por ahora solo retornamos éxito
    
    res.json({ msg: "Recordatorio enviado" });
  } catch (error) {
    console.error("Error al enviar recordatorio:", error);
    res.status(500).json({ msg: "Error al enviar recordatorio" });
  }
};