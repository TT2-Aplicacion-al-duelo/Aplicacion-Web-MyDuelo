import {Request, Response} from 'express';
import { Paciente } from '../models/paciente';
import sequelize from '../database/connection';
import { QueryTypes } from 'sequelize';

// ✅ INTERFACE PARA REQUEST CON USER INFO
interface AuthRequest extends Request {
    user?: any;
}

export const registroPaciente = async ( req: Request, res: Response) => {
    const { nombre, apellidoPaterno, apellidoMaterno } = req.body;
    
    try {
        Paciente.create({
        nombre: nombre,
        apellidoPaterno: apellidoPaterno,
        apellidoMaterno: apellidoMaterno,
        status: 1,
    }); 

    res.json({
        msg:'User ${nombre} ${apellido} create success...'
    });
        
    } catch (error) {
        res.status(400).json(
            {msg: 'El usuario ya existe ${correo} o la credencial ${cedula}'}
        )
    }
}

// ✅ FUNCIÓN CORREGIDA PARA FILTRAR POR PSICÓLOGO
export const getPacientes = async (req: AuthRequest, res: Response) => {
    try {
        // Extraer id_psicologo del token decodificado
        const id_psicologo = req.user?.id_psicologo;
        
        if (!id_psicologo) {
            return res.status(400).json({
                msg: 'No se pudo identificar al psicólogo'
            });
        }
        
        console.log(`Buscando pacientes para psicólogo ID: ${id_psicologo}`);
        
        // const listaPacientes = await Paciente.findAll({
        //     where: { 
        //         id_psicologo: id_psicologo 
        //     },
        //     attributes: [
        //         'id_paciente', 
        //         'nombre', 
        //         'apellido_paterno', 
        //         'apellido_materno', 
        //         'email',
        //         'telefono',          
        //         'email_verificado',
        //         'foto_perfil'    
        //     ]
        // });
        
        // console.log(`Encontrados ${listaPacientes.length} pacientes`);
        
        // res.json(listaPacientes); 
        const listaPacientes = await Paciente.findAll({
            where: { 
                id_psicologo: id_psicologo 
            },
            attributes: [
                'id_paciente', 
                'nombre', 
                'apellido_paterno', 
                'apellido_materno', 
                'email',
                'telefono',          
                'email_verificado',
                'foto_perfil'  // ✅ DESCOMENTADO
            ]
        });

        // ✅ LIMPIAR URLs ANTIGUAS Y CONSTRUIR CORRECTAMENTE
        const baseUrl = process.env.NODE_ENV === 'production' 
            ? 'https://api.midueloapp.com'
            : `http://localhost:${process.env.PORT || '3017'}`;

        const pacientesFormateados = listaPacientes.map((paciente: any) => {
            const pacienteJson = paciente.toJSON();
            
            // Limpiar foto_perfil
            if (pacienteJson.foto_perfil) {
                // Si es URL antigua de Azure/móvil, limpiarla
                if (pacienteJson.foto_perfil.startsWith('http://192.168') || 
                    pacienteJson.foto_perfil.startsWith('http://20.') ||
                    pacienteJson.foto_perfil.startsWith('http://') ||
                    pacienteJson.foto_perfil.includes(':3000/')) {
                    
                    // Extraer solo el nombre del archivo
                    const fileName = pacienteJson.foto_perfil.split('/').pop();
                    pacienteJson.foto_perfil = fileName;
                }
                
                // Construir URL completa si no es ya una URL
                if (!pacienteJson.foto_perfil.startsWith('http')) {
                    pacienteJson.foto_perfil = `${baseUrl}/uploads/${pacienteJson.foto_perfil}`;
                }
            }
            
            return pacienteJson;
        });

        console.log(`Encontrados ${pacientesFormateados.length} pacientes`);

        res.json(pacientesFormateados);
        
    } catch (error) {
        console.error('Error al obtener pacientes:', error);
        res.status(500).json({
            msg: 'Error interno del servidor'
        });
    }
}

// Obtener un paciente específico
export const getPacientePorId = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const id_psicologo = req.user?.id_psicologo;
        
        if (!id_psicologo) {
            return res.status(400).json({
                msg: 'No se pudo identificar al psicólogo'
            });
        }
        
        const paciente = await Paciente.findOne({
            where: { 
                id_paciente: id,
                id_psicologo: id_psicologo 
            }
        });
        
        if (!paciente) {
            return res.status(404).json({
                msg: 'Paciente no encontrado'
            });
        }
        
        res.json(paciente);
        
    } catch (error) {
        console.error('Error al obtener paciente:', error);
        res.status(500).json({
            msg: 'Error interno del servidor'
        });
    }
}

// Obtener próxima cita del paciente
export const getProximaCitaPaciente = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const id_psicologo = req.user?.id_psicologo;
        
        // Query para obtener la próxima cita
        const proximaCita = await sequelize.query(`
            SELECT c.* 
            FROM cita c
            JOIN agenda a ON a.id_agenda = c.id_agenda
            WHERE c.id_paciente = ? 
            AND a.id_psicologo = ?
            AND c.fecha >= CURDATE()
            AND c.estado IN ('pendiente', 'confirmada')
            ORDER BY c.fecha ASC, c.hora_inicio ASC
            LIMIT 1
        `, {
            replacements: [id, id_psicologo],
            type: QueryTypes.SELECT
        });
        
        res.json(proximaCita[0] || null);
        
    } catch (error) {
        console.error('Error al obtener próxima cita:', error);
        res.status(500).json({
            msg: 'Error interno del servidor'
        });
    }
   

    
}

/**
     * GET /api/psicologo/paciente/:id/foto-perfil
     * Obtener la URL de la foto de perfil del paciente (Azure o local)
     */
    export const getFotoPerfilPaciente = async (req: Request, res: Response) => {
    try {
        const id_psicologo = (req as any).user?.id_psicologo;
        const { id } = req.params;

        if (!id_psicologo) {
        return res.status(401).json({ msg: "No autorizado" });
        }

        // Verificar que el paciente pertenece al psicólogo
        const paciente = await Paciente.findOne({
        where: {
            id_paciente: id,
            id_psicologo
        },
        attributes: ['foto_perfil']
        });

        if (!paciente) {
        return res.status(404).json({ msg: "Paciente no encontrado" });
        }

        let fotoUrl = (paciente as any).foto_perfil;

        // Si la foto no tiene protocolo HTTP, construir la URL local
        if (fotoUrl && !fotoUrl.startsWith('http')) {
        const baseUrl = process.env.NODE_ENV === 'production' 
            ? 'https://api.midueloapp.com'
            : `http://localhost:${process.env.PORT || '3017'}`;
        fotoUrl = `${baseUrl}/uploads/${fotoUrl}`;
        }

        res.json({ 
        foto_url: fotoUrl || null 
        });

    } catch (error) {
        console.error("Error al obtener foto de perfil:", error);
        res.status(500).json({ msg: "Error al obtener foto de perfil" });
    }
    };