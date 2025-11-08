import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../database/connection';

interface SolicitudUnionAttributes {
  id_solicitud: number;
  id_foro: number;
  tipo_usuario: 'psicologo' | 'paciente';
  id_psicologo?: number;
  id_paciente?: number;
  mensaje?: string;
  estado: 'pendiente' | 'aprobada' | 'rechazada';
  fecha_solicitud: Date;
  fecha_respuesta?: Date;
  id_moderador_respuesta?: number;
  razon_rechazo?: string;
}

interface SolicitudUnionCreationAttributes 
  extends Optional<SolicitudUnionAttributes, 'id_solicitud' | 'fecha_solicitud' | 'estado' | 'mensaje' | 'fecha_respuesta' | 'id_moderador_respuesta' | 'razon_rechazo'> {}

class SolicitudUnion extends Model<SolicitudUnionAttributes, SolicitudUnionCreationAttributes> 
  implements SolicitudUnionAttributes {
  public id_solicitud!: number;
  public id_foro!: number;
  public tipo_usuario!: 'psicologo' | 'paciente';
  public id_psicologo?: number;
  public id_paciente?: number;
  public mensaje?: string;
  public estado!: 'pendiente' | 'aprobada' | 'rechazada';
  public fecha_solicitud!: Date;
  public fecha_respuesta?: Date;
  public id_moderador_respuesta?: number;
  public razon_rechazo?: string;
}

SolicitudUnion.init(
  {
    id_solicitud: {
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
    tipo_usuario: {
      type: DataTypes.ENUM('psicologo', 'paciente'),
      allowNull: false,
    },
    id_psicologo: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'psicologo',
        key: 'id_psicologo',
      },
    },
    id_paciente: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'paciente',
        key: 'id_paciente',
      },
    },
    mensaje: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    estado: {
      type: DataTypes.ENUM('pendiente', 'aprobada', 'rechazada'),
      allowNull: false,
      defaultValue: 'pendiente',
    },
    fecha_solicitud: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    fecha_respuesta: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    id_moderador_respuesta: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'psicologo',
        key: 'id_psicologo',
      },
    },
    razon_rechazo: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'solicitud_union_foro',
    timestamps: false,
  }
);

export default SolicitudUnion;