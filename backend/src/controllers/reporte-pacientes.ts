import { Request, Response } from "express";
import { Paciente } from "../models/paciente";
import AplicacionTest from "../models/aplicacionTest";
import ResultadoTest from "../models/resultado_test";
import Test from "../models/test";
import { ActividadAsignada } from "../models/actividad/actividad-asignada";
import { Actividad } from "../models/actividad/actividad";
import { ActividadModulo } from "../models/actividad-modulo";
import { Modulo } from "../models/modulo";
import { ActividadPaciente } from "../models/actividad/actividad-paciente";
import { Op } from "sequelize";

/**
 * GET /api/psicologo/reporte-general
 * Obtener reporte general de todos los pacientes del psicólogo
 */
export const getReporteGeneral = async (req: Request, res: Response) => {
  try {
    const id_psicologo = (req as any).user?.id_psicologo;

    if (!id_psicologo) {
      return res.status(401).json({ msg: "No autorizado" });
    }

    // Obtener todos los pacientes del psicólogo
    const pacientes = await Paciente.findAll({
      where: { id_psicologo },
      attributes: ['id_paciente', 'nombre', 'apellido_paterno', 'apellido_materno', 'email', 'creada_en'],
      order: [['nombre', 'ASC']]
    });

    if (!pacientes || pacientes.length === 0) {
      return res.json({
        total_pacientes: 0,
        pacientes: [],
        resumen_global: {
          total_tests_aplicados: 0,
          total_actividades_asignadas: 0,
          total_actividades_completadas: 0,
          total_actividades_pendientes: 0,
          promedio_progreso_modulos: 0
        }
      });
    }

    const ids_pacientes = pacientes.map((p: any) => p.id_paciente);

    // ==================== TESTS ====================
    const testsAplicados = await AplicacionTest.findAll({
      where: {
        id_paciente: { [Op.in]: ids_pacientes }
      },
      include: [
        {
          model: Test,
          as: 'test',
          attributes: ['nombre', 'descripcion']
        },
        {
          model: ResultadoTest,
          as: 'resultado',
          required: false
        }
      ],
      order: [['fecha', 'DESC']]
    });

    // ==================== ACTIVIDADES ====================
    const actividadesAsignadas = await ActividadAsignada.findAll({
      where: {
        id_paciente: { [Op.in]: ids_pacientes }
      },
      include: [
        {
          model: Actividad,
          as: 'actividad',
          attributes: ['titulo', 'tipo']
        }
      ]
    });

    // ==================== MÓDULOS ====================
    // Obtener todos los módulos
    const modulos = await Modulo.findAll({
      attributes: ['id_modulo', 'nombre']
    });

    // Calcular progreso por paciente
    const resumenPorPaciente = await Promise.all(
      pacientes.map(async (paciente: any) => {
        const id_paciente = paciente.id_paciente;

        // Tests del paciente
        const testsDelPaciente = testsAplicados.filter(
          (t: any) => t.id_paciente === id_paciente
        );

        const testsSummary = testsDelPaciente.map((t: any) => ({
          nombre_test: t.test?.nombre || 'Test desconocido',
          fecha: t.fecha,
          puntaje: t.resultado?.puntaje_total || null,
          interpretacion: t.resultado?.interpretacion || 'Sin resultado'
        }));

        // Actividades del paciente
        // const actividadesDelPaciente = actividadesAsignadas.filter(
        //   (a: any) => a.id_paciente === id_paciente
        // );

        // const actividades_completadas = actividadesDelPaciente.filter(
        //   (a: any) => a.estado === 'finalizada'
        // ).length;

        // const actividades_pendientes = actividadesDelPaciente.filter(
        //   (a: any) => a.estado === 'en_proceso' || a.estado === 'pendiente'
        // ).length;
        // Actividades del paciente (solo de actividad_asignada)
        const actividadesDelPaciente = actividadesAsignadas.filter(
          (a: any) => a.id_paciente === id_paciente
        );

        // ✅ CAMBIO: Contar actividades ÚNICAS completadas
        const idsActividadesCompletadas = new Set(
          actividadesDelPaciente
            .filter((a: any) => a.estado === 'finalizada')
            .map((a: any) => a.id_actividad)
        );

        const actividades_completadas = idsActividadesCompletadas.size;

        // ✅ CAMBIO: Contar actividades ÚNICAS pendientes
        const idsActividadesPendientes = new Set(
          actividadesDelPaciente
            .filter((a: any) => a.estado === 'en_proceso' || a.estado === 'pendiente')
            .map((a: any) => a.id_actividad)
        );

        const actividades_pendientes = idsActividadesPendientes.size;

        // Progreso en módulos
        const progresoModulos = await Promise.all(
          modulos.map(async (modulo: any) => {
            // Obtener actividades del módulo
            const actividadesModulo = await ActividadModulo.findAll({
              where: { id_modulo: modulo.id_modulo }
            });

            const ids_actividades = actividadesModulo.map((am: any) => am.id_actividad);
            const total_actividades = ids_actividades.length;

            if (total_actividades === 0) {
              return {
                nombre_modulo: modulo.nombre,
                progreso: 0,
                actividades_completadas: 0,
                actividades_totales: 0
              };
            }

            // Contar actividades completadas del paciente
            // const actividadesPacienteModulo = await ActividadPaciente.findAll({
            //   where: {
            //     id_paciente,
            //     id_actividad: { [Op.in]: ids_actividades },
            //     estado: 'completada'
            //   }
            // });

            // const actividadesAsignadasModulo = await ActividadAsignada.findAll({
            //   where: {
            //     id_paciente,
            //     id_actividad: { [Op.in]: ids_actividades },
            //     estado: 'finalizada'
            //   }
            // });

            // const completadas = actividadesPacienteModulo.length + actividadesAsignadasModulo.length;
            // const progreso = Math.round((completadas / total_actividades) * 100);
            // Contar actividades completadas del paciente
            const actividadesPacienteModulo = await ActividadPaciente.findAll({
              where: {
                id_paciente,
                id_actividad: { [Op.in]: ids_actividades },
                estado: 'completada'
              },
              attributes: ['id_actividad'] // ✅ Solo necesitamos el id
            });

            const actividadesAsignadasModulo = await ActividadAsignada.findAll({
              where: {
                id_paciente,
                id_actividad: { [Op.in]: ids_actividades },
                estado: 'finalizada'
              },
              attributes: ['id_actividad'] // ✅ Solo necesitamos el id
            });

            // ✅ CAMBIO: Contar actividades ÚNICAS completadas (no realizaciones múltiples)
            const idsActividadesCompletadas = new Set([
              ...actividadesPacienteModulo.map((ap: any) => ap.id_actividad),
              ...actividadesAsignadasModulo.map((aa: any) => aa.id_actividad)
            ]);

            const completadas = idsActividadesCompletadas.size;

            // ✅ CAMBIO: Limitar progreso al 100%
            const progreso = Math.min(100, Math.round((completadas / total_actividades) * 100));

            return {
              nombre_modulo: modulo.nombre,
              progreso,
              actividades_completadas: completadas,
              actividades_totales: total_actividades
            };
          })
        );

        const progreso_promedio = progresoModulos.length > 0
          ? Math.round(
              progresoModulos.reduce((sum, m) => sum + m.progreso, 0) / progresoModulos.length
            )
          : 0;

        return {
          id_paciente,
          nombre_completo: `${paciente.nombre} ${paciente.apellido_paterno} ${paciente.apellido_materno || ''}`.trim(),
          email: paciente.email,
          fecha_registro: paciente.creada_en,
          tests: {
            total: testsDelPaciente.length,
            detalles: testsSummary
          },
          actividades: {
            total_asignadas: actividadesDelPaciente.length,
            completadas: actividades_completadas,
            pendientes: actividades_pendientes
          },
          modulos: {
            progreso_promedio,
            detalles: progresoModulos
          }
        };
      })
    );

    // ==================== RESUMEN GLOBAL ====================
    // const total_tests_aplicados = testsAplicados.length;
    // const total_actividades_asignadas = actividadesAsignadas.length;
    // const total_actividades_completadas = actividadesAsignadas.filter(
    //   (a: any) => a.estado === 'finalizada'
    // ).length;
    // const total_actividades_pendientes = actividadesAsignadas.filter(
    //   (a: any) => a.estado === 'en_proceso' || a.estado === 'pendiente'
    // ).length;

    // const promedio_progreso_modulos = resumenPorPaciente.length > 0
    //   ? Math.round(
    //       resumenPorPaciente.reduce((sum, p) => sum + p.modulos.progreso_promedio, 0) /
    //         resumenPorPaciente.length
    //     )
    //   : 0;
    // ==================== RESUMEN GLOBAL ====================
    const total_tests_aplicados = testsAplicados.length;

    // ✅ CAMBIO: Contar actividades ÚNICAS asignadas
    const total_actividades_asignadas = new Set(
      actividadesAsignadas.map((a: any) => a.id_actividad)
    ).size;

    // ✅ CAMBIO: Contar actividades ÚNICAS completadas
    const total_actividades_completadas = new Set(
      actividadesAsignadas
        .filter((a: any) => a.estado === 'finalizada')
        .map((a: any) => a.id_actividad)
    ).size;

    // ✅ CAMBIO: Contar actividades ÚNICAS pendientes
    const total_actividades_pendientes = new Set(
      actividadesAsignadas
        .filter((a: any) => a.estado === 'en_proceso' || a.estado === 'pendiente')
        .map((a: any) => a.id_actividad)
    ).size;

    // ✅ CAMBIO: Limitar progreso promedio al 100%
    const promedio_progreso_modulos = resumenPorPaciente.length > 0
      ? Math.min(100, Math.round(
          resumenPorPaciente.reduce((sum, p) => sum + p.modulos.progreso_promedio, 0) /
            resumenPorPaciente.length
        ))
  : 0;

    // ==================== RESPUESTA ====================
    res.json({
      total_pacientes: pacientes.length,
      fecha_generacion: new Date(),
      pacientes: resumenPorPaciente,
      resumen_global: {
        total_tests_aplicados,
        total_actividades_asignadas,
        total_actividades_completadas,
        total_actividades_pendientes,
        promedio_progreso_modulos
      }
    });
  } catch (error) {
    console.error("Error al generar reporte general:", error);
    res.status(500).json({ msg: "Error al generar reporte general" });
  }
};