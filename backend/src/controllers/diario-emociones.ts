// backend/src/controllers/diario-emociones.ts
import { Request, Response } from 'express';
import sequelize from '../database/connection';
import { QueryTypes } from 'sequelize';

interface RequestWithUser extends Request {
  user?: {
    id_psicologo?: number;
    [key: string]: any;
  };
}

/**
 * GET /api/psicologo/paciente/:id_paciente/diario-emociones
 * Obtener entradas del diario emocional compartidas del paciente
 */
export const getDiarioEmocionesPaciente = async (req: RequestWithUser, res: Response) => {
  try {
    const id_psicologo = req.user?.id_psicologo;
    const { id_paciente } = req.params;
    const { fecha, emocion } = req.query;

    if (!id_psicologo) {
      return res.status(401).json({ msg: 'No autorizado' });
    }

    // Verificar que el paciente pertenece al psicólogo
    const verificacion = await sequelize.query(
      'SELECT id_paciente FROM paciente WHERE id_paciente = ? AND id_psicologo = ?',
      {
        replacements: [id_paciente, id_psicologo],
        type: QueryTypes.SELECT
      }
    );

    if (verificacion.length === 0) {
      return res.status(404).json({ msg: 'Paciente no encontrado o no autorizado' });
    }

    // Construir query con filtros opcionales
    let query = `
      SELECT 
        id_diario,
        id_paciente,
        fecha,
        emocion,
        nota,
        compartido,
        creado_en,
        actualizado_en
      FROM diario_emociones
      WHERE id_paciente = ? AND compartido = 1
    `;

    const replacements: any[] = [id_paciente];

    // Filtro por fecha (exacta)
    if (fecha) {
      query += ' AND fecha = ?';
      replacements.push(fecha);
    }

    // Filtro por emoción
    if (emocion) {
      query += ' AND emocion = ?';
      replacements.push(emocion);
    }

    query += ' ORDER BY fecha DESC, creado_en DESC';

    const entradas = await sequelize.query(query, {
      replacements,
      type: QueryTypes.SELECT
    });

    res.json(entradas);
  } catch (error) {
    console.error('Error al obtener diario de emociones:', error);
    res.status(500).json({ msg: 'Error al obtener el diario de emociones' });
  }
};