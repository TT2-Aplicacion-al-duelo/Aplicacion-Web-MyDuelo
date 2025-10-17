// backend/src/controllers/modulos.ts
import { Request, Response } from "express";
import { Modulo } from "../models/modulo";
import { Actividad } from "../models/actividad/actividad";
import { ActividadModulo } from "../models/actividad-modulo";
import { ActividadAsignada } from "../models/actividad/actividad-asignada";
import { Evidencia } from "../models/evidencia";
import { Paciente } from "../models/paciente";
import { Op } from "sequelize";

/**
 * GET /api/psicologo/pacientes/:id_paciente/modulos
 * Obtener todos los módulos con su progreso para un paciente
 */
export const getModulosPorPaciente = async (req: Request, res: Response) => {
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

    // Obtener todos los módulos
    const modulos = await Modulo.findAll({
      order: [['etapa_duelo', 'ASC']]
    });

    // Para cada módulo, calcular el progreso
    const modulosConProgreso = await Promise.all(
      modulos.map(async (modulo: any) => {
        // Obtener todas las actividades del módulo
        const actividadesModulo = await ActividadModulo.findAll({
          where: { id_modulo: modulo.id_modulo },
          include: [
            {
              model: Actividad,
              as: 'actividad',
              attributes: ['id_actividad', 'titulo', 'descripcion', 'tipo']
            }
          ]
        });

        const actividades_totales = actividadesModulo.length;

        // Obtener actividades asignadas y completadas
        const actividadesAsignadas = await ActividadAsignada.findAll({
          where: {
            id_paciente,
            id_actividad: {
              [Op.in]: actividadesModulo.map((am: any) => am.id_actividad)
            }
          },
          include: [
            {
              model: Actividad,
              as: 'actividad',
              attributes: ['id_actividad', 'titulo', 'descripcion', 'tipo']
            },
            {
              model: Evidencia,
              as: 'evidencias',
              required: false
            }
          ]
        });

        const actividades_completadas = actividadesAsignadas.filter(
          (aa: any) => aa.estado === 'finalizada'
        ).length;

        // Calcular progreso
        const progreso = actividades_totales > 0
          ? Math.round((actividades_completadas / actividades_totales) * 100)
          : 0;

        // Mapear actividades con su estado
        const actividades = actividadesModulo.map((am: any) => {
          const asignacion = actividadesAsignadas.find(
            (aa: any) => aa.id_actividad === am.id_actividad
          );

          if (!asignacion) {
            return {
              id_actividad: am.actividad.id_actividad,
              titulo: am.actividad.titulo,
              descripcion: am.actividad.descripcion,
              tipo: am.actividad.tipo,
              estado: 'no_asignada',
              visible_para_psicologo: false
            };
          }

          const asignacionData = asignacion as any;

          return {
            id_actividad: am.actividad.id_actividad,
            id_asignacion: asignacionData.id_asignacion,
            titulo: am.actividad.titulo,
            descripcion: am.actividad.descripcion,
            tipo: am.actividad.tipo,
            estado: asignacionData.estado,
            fecha_asignacion: asignacionData.fecha_asignacion,
            fecha_completada: asignacionData.fecha_completada,
            visible_para_psicologo: true,
            evidencias: asignacionData.evidencias?.map((ev: any) => ({
              id_evidencia: ev.id_evidencia,
              archivo_url: ev.archivo_url,
              tipo_archivo: determinarTipoArchivo(ev.archivo_url),
              comentario: ev.comentario,
              fecha_subida: ev.fecha_subida,
              visible_para_psicologo: ev.visible_para_psicologo
            })) || []
          };
        });

        return {
          id_modulo: modulo.id_modulo,
          nombre: modulo.nombre,
          etapa_duelo: modulo.etapa_duelo,
          progreso,
          actividades_completadas,
          actividades_totales,
          actividades
        };
      })
    );

    res.json(modulosConProgreso);
  } catch (error) {
    console.error("Error al obtener módulos del paciente:", error);
    res.status(500).json({ msg: "Error al obtener módulos" });
  }
};

/**
 * GET /api/psicologo/pacientes/:id_paciente/modulos/:id_modulo
 * Obtener detalles de un módulo específico
 */
export const getDetalleModulo = async (req: Request, res: Response) => {
  try {
    const id_psicologo = (req as any).user?.id_psicologo;
    const { id_paciente, id_modulo } = req.params;

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

    // Obtener el módulo
    const modulo = await Modulo.findByPk(id_modulo);

    if (!modulo) {
      return res.status(404).json({ msg: "Módulo no encontrado" });
    }

    // Obtener actividades del módulo con más detalle
    const actividadesModulo = await ActividadModulo.findAll({
      where: { id_modulo },
      include: [
        {
          model: Actividad,
          as: 'actividad'
        }
      ]
    });

    const actividadesAsignadas = await ActividadAsignada.findAll({
      where: {
        id_paciente,
        id_actividad: {
          [Op.in]: actividadesModulo.map((am: any) => am.id_actividad)
        }
      },
      include: [
        {
          model: Actividad,
          as: 'actividad'
        },
        {
          model: Evidencia,
          as: 'evidencias'
        }
      ]
    });

    const actividades_totales = actividadesModulo.length;
    const actividades_completadas = actividadesAsignadas.filter(
      (aa: any) => aa.estado === 'finalizada'
    ).length;

    const progreso = actividades_totales > 0
      ? Math.round((actividades_completadas / actividades_totales) * 100)
      : 0;

    const actividades = actividadesModulo.map((am: any) => {
      const asignacion = actividadesAsignadas.find(
        (aa: any) => aa.id_actividad === am.id_actividad
      );

      if (!asignacion) {
        return {
          id_actividad: am.actividad.id_actividad,
          titulo: am.actividad.titulo,
          descripcion: am.actividad.descripcion,
          tipo: am.actividad.tipo,
          estado: 'no_asignada',
          visible_para_psicologo: false
        };
      }

      const asignacionData = asignacion as any;

      return {
        id_actividad: am.actividad.id_actividad,
        id_asignacion: asignacionData.id_asignacion,
        titulo: am.actividad.titulo,
        descripcion: am.actividad.descripcion,
        tipo: am.actividad.tipo,
        estado: asignacionData.estado,
        fecha_asignacion: asignacionData.fecha_asignacion,
        fecha_completada: asignacionData.fecha_completada,
        instrucciones_personalizadas: asignacionData.instrucciones_personalizadas,
        notas: asignacionData.notas,
        visible_para_psicologo: true,
        evidencias: asignacionData.evidencias?.map((ev: any) => ({
          id_evidencia: ev.id_evidencia,
          archivo_url: ev.archivo_url,
          tipo_archivo: determinarTipoArchivo(ev.archivo_url),
          comentario: ev.comentario,
          fecha_subida: ev.fecha_subida,
          visible_para_psicologo: ev.visible_para_psicologo
        })) || []
      };
    });

    const moduloData = modulo as any;

    res.json({
      id_modulo: moduloData.id_modulo,
      nombre: moduloData.nombre,
      etapa_duelo: moduloData.etapa_duelo,
      progreso,
      actividades_completadas,
      actividades_totales,
      actividades
    });
  } catch (error) {
    console.error("Error al obtener detalle del módulo:", error);
    res.status(500).json({ msg: "Error al obtener detalle del módulo" });
  }
};

/**
 * GET /api/psicologo/actividades/asignadas/:id_asignacion/evidencias
 * Obtener evidencias de una actividad asignada
 */
export const getEvidenciasActividad = async (req: Request, res: Response) => {
  try {
    const id_psicologo = (req as any).user?.id_psicologo;
    const { id_asignacion } = req.params;

    if (!id_psicologo) {
      return res.status(401).json({ msg: "No autorizado" });
    }

    // Verificar que la actividad asignada pertenece a un paciente del psicólogo
    const actividadAsignada = await ActividadAsignada.findByPk(id_asignacion, {
      include: [
        {
          model: Paciente,
          as: 'paciente',
          where: { id_psicologo }
        }
      ]
    });

    if (!actividadAsignada) {
      return res.status(404).json({ msg: "Actividad no encontrada" });
    }

    // Obtener evidencias
    const evidencias = await Evidencia.findAll({
      where: {
        id_asignacion,
        visible_para_psicologo: true
      },
      order: [['fecha_subida', 'DESC']]
    });

    const evidenciasFormateadas = evidencias.map((ev: any) => ({
      id_evidencia: ev.id_evidencia,
      archivo_url: ev.archivo_url,
      tipo_archivo: determinarTipoArchivo(ev.archivo_url),
      comentario: ev.comentario,
      fecha_subida: ev.fecha_subida,
      visible_para_psicologo: ev.visible_para_psicologo
    }));

    res.json(evidenciasFormateadas);
  } catch (error) {
    console.error("Error al obtener evidencias:", error);
    res.status(500).json({ msg: "Error al obtener evidencias" });
  }
};

/**
 * PUT /api/psicologo/actividades/asignadas/:id_asignacion/revisar
 * Marcar una actividad como revisada por el psicólogo
 */
export const marcarActividadRevisada = async (req: Request, res: Response) => {
  try {
    const id_psicologo = (req as any).user?.id_psicologo;
    const { id_asignacion } = req.params;

    if (!id_psicologo) {
      return res.status(401).json({ msg: "No autorizado" });
    }

    // Verificar que la actividad asignada pertenece a un paciente del psicólogo
    const actividadAsignada = await ActividadAsignada.findByPk(id_asignacion, {
      include: [
        {
          model: Paciente,
          as: 'paciente',
          where: { id_psicologo }
        }
      ]
    });

    if (!actividadAsignada) {
      return res.status(404).json({ msg: "Actividad no encontrada" });
    }

    // Aquí podrías agregar un campo 'revisado_por_psicologo' en la BD
    // Por ahora solo retornamos éxito
    res.json({ msg: "Actividad marcada como revisada" });
  } catch (error) {
    console.error("Error al marcar actividad como revisada:", error);
    res.status(500).json({ msg: "Error al marcar actividad como revisada" });
  }
};

/**
 * Función auxiliar para determinar el tipo de archivo
 */
function determinarTipoArchivo(url: string): 'imagen' | 'video' | 'audio' | 'documento' | 'otro' {
  const urlLower = url.toLowerCase();

  // Imágenes
  if (/\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(urlLower)) {
    return 'imagen';
  }

  // Videos
  if (/\.(mp4|webm|ogg|mov|avi|mkv)$/i.test(urlLower) || 
      urlLower.includes('youtube.com') || 
      urlLower.includes('youtu.be') || 
      urlLower.includes('vimeo.com')) {
    return 'video';
  }

  // Audio
  if (/\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(urlLower)) {
    return 'audio';
  }

  // Documentos
  if (/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt)$/i.test(urlLower)) {
    return 'documento';
  }

  return 'otro';
}