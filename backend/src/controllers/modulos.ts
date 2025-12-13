// backend/src/controllers/modulos.ts
// VERSIÓN ACTUALIZADA CON SOPORTE PARA ACTIVIDAD_PACIENTE
import { Request, Response } from "express";
import { Modulo } from "../models/modulo";
import { Actividad } from "../models/actividad/actividad";
import { ActividadModulo } from "../models/actividad-modulo";
import { ActividadAsignada } from "../models/actividad/actividad-asignada";
import { ActividadPaciente } from "../models/actividad/actividad-paciente"; // NUEVO
import { Evidencia } from "../models/evidencia";
import { Paciente } from "../models/paciente";
import { Op } from "sequelize";

/**
 * Función auxiliar para limpiar URLs de evidencias
 */
function limpiarUrlEvidencia(url: string): string {
  if (!url) return '';
  // Eliminar prefijo duplicado de uploads
  return url.replace(/^uploads\/uploads\//, 'uploads/');
}

/**
 * Función auxiliar para determinar tipo de archivo
 */
function determinarTipoArchivo(url: string): string {
  if (!url) return 'otro';
  const ext = url.split('.').pop()?.toLowerCase();
  
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return 'imagen';
  if (['mp4', 'avi', 'mov', 'wmv'].includes(ext || '')) return 'video';
  if (['mp3', 'wav', 'ogg'].includes(ext || '')) return 'audio';
  if (['pdf', 'doc', 'docx', 'txt'].includes(ext || '')) return 'documento';
  
  return 'otro';
}

/**
 * Función auxiliar para formatear evidencias de actividad_paciente
 */
function formatearEvidenciaPaciente(actividadPaciente: any, actividad: any) {
  const evidencias = [];
  
  // Evidencia de texto
  if (actividadPaciente.evidencia_texto) {
    evidencias.push({
      id_evidencia: `texto_${actividadPaciente.id_actividad_paciente}`,
      tipo_archivo: 'texto',
      contenido: actividadPaciente.evidencia_texto,
      comentario: null,
      fecha_subida: actividadPaciente.fecha_realizacion,
      visible_para_psicologo: true,
      origen: 'actividad_paciente'
    });
  }
  
  // Evidencia de foto
  if (actividadPaciente.evidencia_foto) {
    evidencias.push({
      id_evidencia: `foto_${actividadPaciente.id_actividad_paciente}`,
      archivo_url: limpiarUrlEvidencia(actividadPaciente.evidencia_foto), // ✅ Esta función debe existir
      tipo_archivo: 'imagen',
      comentario: null,
      fecha_subida: actividadPaciente.fecha_realizacion,
      visible_para_psicologo: true,
      origen: 'actividad_paciente'
    });
  }
  
  // Evidencia de duración (cronómetro)
  if (actividadPaciente.duracion_segundos) {
    const minutos = Math.floor(actividadPaciente.duracion_segundos / 60);
    const segundos = actividadPaciente.duracion_segundos % 60;
    
    evidencias.push({
      id_evidencia: `duracion_${actividadPaciente.id_actividad_paciente}`,
      tipo_archivo: 'cronometro',
      duracion_segundos: actividadPaciente.duracion_segundos,
      duracion_formato: `${minutos}m ${segundos}s`,
      comentario: null,
      fecha_subida: actividadPaciente.fecha_realizacion,
      visible_para_psicologo: true,
      origen: 'actividad_paciente'
    });
  }
  
  return evidencias;
}
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

        // Obtener actividades del paciente (NUEVO)
        const actividadesPaciente = await ActividadPaciente.findAll({
          where: {
            id_paciente,
            id_actividad: {
              [Op.in]: actividadesModulo.map((am: any) => am.id_actividad)
            },
            estado: 'completada'
          },
          // include: [
          //   {
          //     model: Actividad,
          //     as: 'actividad',
          //     attributes: ['id_actividad', 'titulo', 'descripcion', 'tipo']
          //   }
          // ]
          attributes: [
            'id_actividad_paciente',
            'id_paciente',
            'id_actividad',
            'estado',
            'evidencia_texto',      // ✅ AÑADIR
            'evidencia_foto',       // ✅ AÑADIR
            'duracion_segundos',    // ✅ AÑADIR
            'fecha_realizacion'
          ],
          include: [
            {
              model: Actividad,
              as: 'actividad',
              attributes: ['id_actividad', 'titulo', 'descripcion', 'tipo']
            }
          ]
        });

        // Obtener actividades asignadas (sistema antiguo)
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

        // Calcular actividades completadas (considerando ambas tablas)
        // const actividadesCompletadasPaciente = actividadesPaciente.length;
        // const actividadesCompletadasAsignadas = actividadesAsignadas.filter(
        //   (aa: any) => aa.estado === 'finalizada'
        // ).length;
        
        // const actividades_completadas = actividadesCompletadasPaciente + actividadesCompletadasAsignadas;

        // // Calcular progreso
        // const progreso = actividades_totales > 0
        //   ? Math.round((actividades_completadas / actividades_totales) * 100)
        //   : 0;
        // ✅ CAMBIO: Contar actividades ÚNICAS completadas (no realizaciones múltiples)
        const actividadesUnicasCompletadasPaciente = new Set(
          actividadesPaciente.map((ap: any) => ap.id_actividad)
        ).size;

        const actividadesUnicasCompletadasAsignadas = new Set(
          actividadesAsignadas
            .filter((aa: any) => aa.estado === 'finalizada')
            .map((aa: any) => aa.id_actividad)
        ).size;

        const actividades_completadas = actividadesUnicasCompletadasPaciente + actividadesUnicasCompletadasAsignadas;

        // Calcular progreso (máximo 100%)
        const progreso = actividades_totales > 0
          ? Math.min(100, Math.round((actividades_completadas / actividades_totales) * 100))
          : 0;
        // Mapear actividades con su estado (ACTUALIZADO)
        // const actividades = actividadesModulo.map((am: any) => {
        //   // Primero buscar en actividad_paciente
        //   const realizacionPaciente = actividadesPaciente.find(
        //     (ap: any) => ap.id_actividad === am.id_actividad
        //   );

        //   if (realizacionPaciente) {
        //     const rpData = realizacionPaciente as any;
        //     const evidencias = formatearEvidenciaPaciente(rpData, am.actividad);

        //     return {
        //       id_actividad: am.actividad.id_actividad,
        //       titulo: am.actividad.titulo,
        //       descripcion: am.actividad.descripcion,
        //       tipo: am.actividad.tipo,
        //       estado: 'finalizada',
        //       fecha_completada: rpData.fecha_realizacion,
        //       visible_para_psicologo: true,
        //       evidencias,
        //       origen: 'modulo_paciente'
        //     };
        //   }
        // Mapear actividades con su estado (ACTUALIZADO)
        // Mapear actividades con su estado (ACTUALIZADO)
        const actividades = actividadesModulo.map((am: any) => {
          // ✅ CAMBIO: Buscar TODAS las realizaciones de esta actividad (no solo la primera)
          const realizacionesPaciente = actividadesPaciente
            .filter((ap: any) => ap.id_actividad === am.id_actividad)
            .map((ap: any) => ap.get({ plain: true })); // ✅ Convertir a objeto plano

          if (realizacionesPaciente.length > 0) {
            // ✅ CAMBIO: Combinar evidencias de TODAS las realizaciones
            const todasLasEvidencias = realizacionesPaciente.flatMap((rpData: any) => 
              formatearEvidenciaPaciente(rpData, am.actividad)
            );
            
            // Usar la fecha de la realización más reciente
            const realizacionMasReciente = realizacionesPaciente.reduce((latest: any, current: any) => {
              return new Date(current.fecha_realizacion) > new Date(latest.fecha_realizacion) 
                ? current 
                : latest;
            });

            return {
              id_actividad: am.actividad.id_actividad,
              titulo: am.actividad.titulo,
              descripcion: am.actividad.descripcion,
              tipo: am.actividad.tipo,
              estado: 'finalizada',
              fecha_completada: realizacionMasReciente.fecha_realizacion,
              visible_para_psicologo: true,
              evidencias: todasLasEvidencias,
              origen: 'modulo_paciente',
              total_realizaciones: realizacionesPaciente.length
            };
          }

          // Si no está en actividad_paciente, buscar en actividad_asignada
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
              archivo_url: limpiarUrlEvidencia(ev.archivo_url), 
              tipo_archivo: determinarTipoArchivo(ev.archivo_url),
              comentario: ev.comentario,
              fecha_subida: ev.fecha_subida,
              visible_para_psicologo: ev.visible_para_psicologo,
              origen: 'asignacion'
            })) || [],
            origen: 'asignacion'
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

    // Obtener actividades del paciente (NUEVO)
    // const actividadesPaciente = await ActividadPaciente.findAll({
    //   where: {
    //     id_paciente,
    //     id_actividad: {
    //       [Op.in]: actividadesModulo.map((am: any) => am.id_actividad)
    //     }
    //   },
    //   include: [
    //     {
    //       model: Actividad,
    //       as: 'actividad'
    //     }
    //   ]
    // });
    // Obtener actividades del paciente (NUEVO)
    const actividadesPaciente = await ActividadPaciente.findAll({
      where: {
        id_paciente,
        id_actividad: {
          [Op.in]: actividadesModulo.map((am: any) => am.id_actividad)
        }
      },
      attributes: [
        'id_actividad_paciente',
        'id_paciente',
        'id_actividad',
        'estado',
        'evidencia_texto',      // ✅ AÑADIR
        'evidencia_foto',       // ✅ AÑADIR
        'duracion_segundos',    // ✅ AÑADIR
        'fecha_realizacion'
      ],
      include: [
        {
          model: Actividad,
          as: 'actividad'
        }
      ]
    });

    // Obtener actividades asignadas
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
    
    // Calcular actividades completadas (considerando ambas tablas)
    // const actividadesCompletadasPaciente = actividadesPaciente.filter(
    //   (ap: any) => ap.estado === 'completada'
    // ).length;
    // const actividadesCompletadasAsignadas = actividadesAsignadas.filter(
    //   (aa: any) => aa.estado === 'finalizada'
    // ).length;
    
    // const actividades_completadas = actividadesCompletadasPaciente + actividadesCompletadasAsignadas;

    // const progreso = actividades_totales > 0
    //   ? Math.round((actividades_completadas / actividades_totales) * 100)
    //   : 0;

    // ✅ CAMBIO: Contar actividades ÚNICAS completadas
    const actividadesUnicasCompletadasPaciente = new Set(
      actividadesPaciente
        .filter((ap: any) => ap.estado === 'completada')
        .map((ap: any) => ap.id_actividad)
    ).size;

    const actividadesUnicasCompletadasAsignadas = new Set(
      actividadesAsignadas
        .filter((aa: any) => aa.estado === 'finalizada')
        .map((aa: any) => aa.id_actividad)
    ).size;

    const actividades_completadas = actividadesUnicasCompletadasPaciente + actividadesUnicasCompletadasAsignadas;

    const progreso = actividades_totales > 0
      ? Math.min(100, Math.round((actividades_completadas / actividades_totales) * 100))
      : 0;

    // Mapear actividades (ACTUALIZADO)
    // const actividades = actividadesModulo.map((am: any) => {
    //   // Primero buscar en actividad_paciente
    //   const realizacionPaciente = actividadesPaciente.find(
    //     (ap: any) => ap.id_actividad === am.id_actividad
    //   );

    //   if (realizacionPaciente) {
    //     const rpData = realizacionPaciente as any;
    //     const evidencias = formatearEvidenciaPaciente(rpData, am.actividad);

    //     return {
    //       id_actividad: am.actividad.id_actividad,
    //       id_actividad_paciente: rpData.id_actividad_paciente,
    //       titulo: am.actividad.titulo,
    //       descripcion: am.actividad.descripcion,
    //       tipo: am.actividad.tipo,
    //       estado: rpData.estado === 'completada' ? 'finalizada' : rpData.estado,
    //       fecha_realizacion: rpData.fecha_realizacion,
    //       fecha_completada: rpData.estado === 'completada' ? rpData.fecha_realizacion : null,
    //       visible_para_psicologo: true,
    //       evidencias,
    //       origen: 'modulo_paciente'
    //     };
    //   }
    // Mapear actividades (ACTUALIZADO)
    // Mapear actividades (ACTUALIZADO)
    const actividades = actividadesModulo.map((am: any) => {
      // ✅ CAMBIO: Buscar TODAS las realizaciones de esta actividad
      const realizacionesPaciente = actividadesPaciente
        .filter((ap: any) => ap.id_actividad === am.id_actividad)
        .map((ap: any) => ap.get({ plain: true })); // ✅ Convertir a objeto plano

      if (realizacionesPaciente.length > 0) {
        // ✅ CAMBIO: Combinar evidencias de TODAS las realizaciones
        const todasLasEvidencias = realizacionesPaciente.flatMap((rpData: any) => 
          formatearEvidenciaPaciente(rpData, am.actividad)
        );
        
        // Usar la realización más reciente
        const realizacionMasReciente = realizacionesPaciente.reduce((latest: any, current: any) => {
          return new Date(current.fecha_realizacion) > new Date(latest.fecha_realizacion) 
            ? current 
            : latest;
        });

        return {
          id_actividad: am.actividad.id_actividad,
          id_actividad_paciente: realizacionMasReciente.id_actividad_paciente,
          titulo: am.actividad.titulo,
          descripcion: am.actividad.descripcion,
          tipo: am.actividad.tipo,
          estado: realizacionMasReciente.estado === 'completada' ? 'finalizada' : realizacionMasReciente.estado,
          fecha_realizacion: realizacionMasReciente.fecha_realizacion,
          fecha_completada: realizacionMasReciente.estado === 'completada' ? realizacionMasReciente.fecha_realizacion : null,
          visible_para_psicologo: true,
          evidencias: todasLasEvidencias,
          origen: 'modulo_paciente',
          total_realizaciones: realizacionesPaciente.length
        };
      }

      // Si no está en actividad_paciente, buscar en actividad_asignada
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
        visible_para_psicologo: true,
        evidencias: asignacionData.evidencias?.map((ev: any) => ({
          id_evidencia: ev.id_evidencia,
          archivo_url: limpiarUrlEvidencia(ev.archivo_url),
          tipo_archivo: determinarTipoArchivo(ev.archivo_url),
          comentario: ev.comentario,
          fecha_subida: ev.fecha_subida,
          visible_para_psicologo: ev.visible_para_psicologo,
          origen: 'asignacion'
        })) || [],
        origen: 'asignacion'
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
      archivo_url: limpiarUrlEvidencia(ev.archivo_url),
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
 * Marcar una actividad como revisada
 */
export const marcarActividadRevisada = async (req: Request, res: Response) => {
  try {
    const id_psicologo = (req as any).user?.id_psicologo;
    const { id_asignacion } = req.params;

    if (!id_psicologo) {
      return res.status(401).json({ msg: "No autorizado" });
    }

    // Verificar que la actividad pertenece a un paciente del psicólogo
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

    // Actualizar estado (puedes agregar un campo "revisada" si lo necesitas)
    // Por ahora solo retornamos éxito
    res.json({ msg: "Actividad marcada como revisada" });
  } catch (error) {
    console.error("Error al marcar actividad como revisada:", error);
    res.status(500).json({ msg: "Error al marcar actividad como revisada" });
  }
};