import { Request, Response } from "express";
import { Agenda } from "../models/agenda/agenda";
import { Cita } from "../models/agenda/cita";
import { Recordatorio } from "../models/agenda/recordatorio";
import { Paciente } from "../models/paciente"; // ✅ AGREGAR IMPORT FALTANTE
import { Op } from "sequelize";

/**
 * GET /api/agenda/:id_psicologo
 * Devuelve la agenda (y opcionalmente las citas) para la semana actual
 * Query opcional: ?semana_inicio=YYYY-MM-DD
 */
export const getAgenda = async (req: Request, res: Response) => {
  try {
    const id_psicologo = Number(req.params.id_psicologo);
    if (!id_psicologo) return res.status(400).json({ msg: "id_psicologo requerido" });

    const semana_inicio = req.query.semana_inicio ? String(req.query.semana_inicio) : null;

    let agenda;
    if (semana_inicio) {
      agenda = await Agenda.findOne({
        where: {
          id_psicologo,
          semana_inicio: semana_inicio
        }
      });
    } else {
      // obtener agenda con semana que incluya hoy
      const hoy = new Date();
      const hoyIso = hoy.toISOString().slice(0,10);
      agenda = await Agenda.findOne({
        where: {
          id_psicologo,
          semana_inicio: { [Op.lte]: hoyIso },
          semana_fin: { [Op.gte]: hoyIso }
        }
      });
    }

    if (!agenda) return res.status(404).json({ msg: "Agenda no encontrada para la semana solicitada" });

    // Traer citas de la agenda
    const citas = await Cita.findAll({
      where: { id_agenda: (agenda as any).id_agenda },
      order: [["fecha", "ASC"], ["hora_inicio", "ASC"]]
    });

    res.json({ agenda, citas });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al obtener agenda", error });
  }
};

export const crearAgenda = async (req: Request, res: Response) => {
  try {
    const { id_psicologo, semana_inicio, semana_fin } = req.body;
    
    // Validar campos requeridos
    if (!id_psicologo || !semana_inicio || !semana_fin) {
      return res.status(400).json({ msg: "Faltan campos requeridos" });
    }

    console.log(`🔍 Verificando agenda para psicólogo ${id_psicologo}, semana ${semana_inicio}`);

    // ✅ VERIFICAR SI YA EXISTE UNA AGENDA PARA ESA SEMANA
    let agenda = await Agenda.findOne({
      where: {
        id_psicologo,
        semana_inicio
      }
    });

    // Si ya existe, devolver la existente
    if (agenda) {
      console.log(`✅ Agenda ya existe (ID: ${(agenda as any).id_agenda}) para semana ${semana_inicio}`);
      return res.json({ 
        msg: "Agenda ya existe para esta semana", 
        agenda,
        existente: true 
      });
    }

    // ✅ Si no existe, crear nueva agenda
    try {
      agenda = await Agenda.create({ 
        id_psicologo, 
        semana_inicio, 
        semana_fin 
      });
      
      console.log(`✅ Agenda nueva creada (ID: ${(agenda as any).id_agenda}) para semana ${semana_inicio}`);
      
      return res.json({ 
        msg: "Agenda creada exitosamente", 
        agenda,
        existente: false 
      });
      
    } catch (createError: any) {
      // ✅ Manejar error de duplicado por constraint (race condition)
      if (createError.name === 'SequelizeUniqueConstraintError') {
        console.warn('⚠️ Race condition detectada, buscando agenda existente...');
        
        // Buscar la agenda que se acaba de crear en otra petición
        agenda = await Agenda.findOne({
          where: {
            id_psicologo,
            semana_inicio
          }
        });
        
        if (agenda) {
          console.log(`✅ Agenda encontrada después de race condition (ID: ${(agenda as any).id_agenda})`);
          return res.json({ 
            msg: "Agenda ya existe para esta semana", 
            agenda,
            existente: true 
          });
        }
      }
      
      throw createError; // Si no es error de duplicado, relanzar
    }
    
  } catch (error: any) {
    console.error('❌ Error al crear/obtener agenda:', error);
    res.status(500).json({ 
      msg: "Error interno del servidor", 
      error: error.message 
    });
  }
};

export const getCitas = async (req: Request, res: Response) => {
  try {
    const id_agenda = Number(req.params.id_agenda);
    if (!id_agenda) return res.status(400).json({ msg: "id_agenda requerido" });

    // ✅ FIX: Incluir información del paciente con JOIN
    const citas = await Cita.findAll({
      where: { id_agenda },
      include: [{
        model: Paciente,
        as: 'paciente',
        attributes: ['id_paciente', 'nombre', 'apellido_paterno', 'apellido_materno']
      }],
      order: [["fecha", "ASC"], ["hora_inicio", "ASC"]]
    });

    res.json({ citas });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al obtener citas", error });
  }
};

export const crearCita = async (req: Request, res: Response) => {
  try {
    const { id_agenda, id_paciente, fecha, hora_inicio, hora_fin, modalidad, notas, estado } = req.body;
    
    // ✅ VALIDACIÓN MEJORADA
    if (!id_agenda || !id_paciente || !fecha || !hora_inicio || !hora_fin) {
      return res.status(400).json({ 
        msg: "Faltan campos requeridos",
        campos_requeridos: ["id_agenda", "id_paciente", "fecha", "hora_inicio", "hora_fin"],
        datos_recibidos: req.body
      });
    }

    // ✅ VERIFICAR QUE AGENDA EXISTE
    const agenda = await Agenda.findByPk(id_agenda);
    if (!agenda) {
      return res.status(400).json({ 
        msg: "Agenda inválida - no existe",
        id_agenda_buscado: id_agenda
      });
    }

    // ✅ NUEVA VALIDACIÓN: Verificar que la fecha de la cita está dentro del rango de la agenda
    const agendaData = agenda as any;
    const fechaCita = new Date(fecha + 'T00:00:00');
    const semanaInicio = new Date(agendaData.semana_inicio + 'T00:00:00');
    const semanaFin = new Date(agendaData.semana_fin + 'T00:00:00');
    
    console.log(`📅 Validando cita:
      - Fecha cita: ${fecha}
      - Semana agenda: ${agendaData.semana_inicio} a ${agendaData.semana_fin}
      - ID Agenda: ${id_agenda}`);

    if (fechaCita < semanaInicio || fechaCita > semanaFin) {
      console.error(`❌ Fecha de cita fuera del rango de la agenda`);
      return res.status(400).json({ 
        msg: "La fecha de la cita no corresponde al rango de la agenda seleccionada",
        fecha_cita: fecha,
        agenda_semana_inicio: agendaData.semana_inicio,
        agenda_semana_fin: agendaData.semana_fin,
        solucion: "El sistema debe calcular la agenda correcta según la fecha de la cita"
      });
    }

    // ✅ VALIDAR FORMATO DE TIEMPO
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(hora_inicio) || !timeRegex.test(hora_fin)) {
      return res.status(400).json({ 
        msg: "Formato de hora inválido. Use HH:mm",
        hora_inicio_recibida: hora_inicio,
        hora_fin_recibida: hora_fin
      });
    }

    if (hora_fin <= hora_inicio) {
      return res.status(400).json({ msg: "hora_fin debe ser mayor que hora_inicio" });
    }

    // ✅ VERIFICAR QUE PACIENTE EXISTE
    const paciente = await Paciente.findByPk(id_paciente);
    if (!paciente) {
      return res.status(400).json({ msg: "Paciente no encontrado" });
    }

    const id_psicologo = agendaData.id_psicologo;

    // Crear la cita
    const nueva = await Cita.create({ 
      id_agenda, 
      id_paciente, 
      fecha, 
      hora_inicio, 
      hora_fin, 
      modalidad: modalidad || 'Presencial',
      estado: estado || 'pendiente',
      notas 
    });

    console.log(`✅ Cita creada exitosamente en agenda ${id_agenda} para fecha ${fecha}`);
    res.json({ msg: "Cita creada exitosamente", cita: nueva });
    
  } catch (error: any) {
    console.error('Error detallado en crearCita:', error);
    res.status(500).json({ 
      msg: "Error interno del servidor", 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export const actualizarCita = async (req: Request, res: Response) => {
  try {
    const id_cita = Number(req.params.id_cita);
    const body = req.body;
    if (!id_cita) return res.status(400).json({ msg: "id_cita requerido" });

    const cita = await Cita.findByPk(id_cita);
    if (!cita) return res.status(404).json({ msg: "Cita no encontrada" });

    await cita.update(body);
    res.json({ msg: "Cita actualizada", cita });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error actualizando cita", error });
  }
};

export const eliminarCita = async (req: Request, res: Response) => {
  try {
    const id_cita = Number(req.params.id_cita);
    if (!id_cita) return res.status(400).json({ msg: "id_cita requerido" });

    const cita = await Cita.findByPk(id_cita);
    if (!cita) return res.status(404).json({ msg: "Cita no encontrada" });

    await cita.destroy();
    res.json({ msg: "Cita eliminada" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error eliminando cita", error });
  }
};