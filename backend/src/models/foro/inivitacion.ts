import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../database/connection';

interface InvitacionForoAttributes {
  id_invitacion: number;
  id_foro: number;
  id_psicologo_invitado: number;
  id_psicologo_invitador: number;
  rol_ofrecido: 'moderador';
  estado: 'pendiente' | 'aceptada' | 'rechazada';
  mensaje?: string;
  fecha_invitacion: Date;
  fecha_respuesta?: Date;
}

interface InvitacionForoCreationAttributes 
  extends Optional<InvitacionForoAttributes, 'id_invitacion' | 'fecha_invitacion' | 'rol_ofrecido' | 'estado' | 'mensaje' | 'fecha_respuesta'> {}

class InvitacionForo extends Model<InvitacionForoAttributes, InvitacionForoCreationAttributes> 
  implements InvitacionForoAttributes {
  public id_invitacion!: number;
  public id_foro!: number;
  public id_psicologo_invitado!: number;
  public id_psicologo_invitador!: number;
  public rol_ofrecido!: 'moderador';
  public estado!: 'pendiente' | 'aceptada' | 'rechazada';
  public mensaje?: string;
  public fecha_invitacion!: Date;
  public fecha_respuesta?: Date;
}

InvitacionForo.init(
  {
    id_invitacion: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    id_foro: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'foro',
        key: 'id_foro',
      },
    },
    id_psicologo_invitado: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'psicologo',
        key: 'id_psicologo',
      },
    },
    id_psicologo_invitador: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'psicologo',
        key: 'id_psicologo',
      },
    },
    rol_ofrecido: {
      type: DataTypes.ENUM('moderador'),
      allowNull: false,
      defaultValue: 'moderador',
    },
    estado: {
      type: DataTypes.ENUM('pendiente', 'aceptada', 'rechazada'),
      allowNull: false,
      defaultValue: 'pendiente',
    },
    mensaje: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    fecha_invitacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    fecha_respuesta: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'invitacion_foro',
    timestamps: false,
  }
);

export default InvitacionForo;