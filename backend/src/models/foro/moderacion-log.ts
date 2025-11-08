// backend/src/models/foro/moderacion-log.ts
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../database/connection';

interface ModeracionLogAttributes {
  id_log: number;
  id_foro: number;
  id_moderador: number;
  tipo_accion: 
    | 'eliminar_mensaje'
    | 'restaurar_mensaje'
    | 'editar_mensaje'
    | 'cerrar_tema'
    | 'abrir_tema'
    | 'fijar_tema'
    | 'desfijar_tema'
    | 'banear_usuario'
    | 'desbanear_usuario'
    | 'aprobar_solicitud'
    | 'rechazar_solicitud';
  id_objetivo: number;
  tipo_objetivo: 'mensaje' | 'tema' | 'usuario' | 'solicitud';
  detalles?: any;
  fecha_accion: Date;
}

interface ModeracionLogCreationAttributes 
  extends Optional<ModeracionLogAttributes, 'id_log' | 'fecha_accion' | 'detalles'> {}

class ModeracionLog extends Model<ModeracionLogAttributes, ModeracionLogCreationAttributes> 
  implements ModeracionLogAttributes {
  public id_log!: number;
  public id_foro!: number;
  public id_moderador!: number;
  public tipo_accion!: ModeracionLogAttributes['tipo_accion'];
  public id_objetivo!: number;
  public tipo_objetivo!: 'mensaje' | 'tema' | 'usuario' | 'solicitud';
  public detalles?: any;
  public fecha_accion!: Date;
}

ModeracionLog.init(
  {
    id_log: {
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
    id_moderador: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'psicologo',
        key: 'id_psicologo',
      },
    },
    tipo_accion: {
      type: DataTypes.ENUM(
        'eliminar_mensaje',
        'restaurar_mensaje',
        'editar_mensaje',
        'cerrar_tema',
        'abrir_tema',
        'fijar_tema',
        'desfijar_tema',
        'banear_usuario',
        'desbanear_usuario',
        'aprobar_solicitud',
        'rechazar_solicitud'
      ),
      allowNull: false,
    },
    id_objetivo: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    tipo_objetivo: {
      type: DataTypes.ENUM('mensaje', 'tema', 'usuario', 'solicitud'),
      allowNull: false,
    },
    detalles: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    fecha_accion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'moderacion_log',
    timestamps: false,
    indexes: [
      {
        name: 'idx_log_foro',
        fields: ['id_foro'],
      },
      {
        name: 'idx_log_moderador',
        fields: ['id_moderador'],
      },
      {
        name: 'idx_log_fecha',
        fields: [{ name: 'fecha_accion', order: 'DESC' }],
      },
      {
        name: 'idx_log_tipo',
        fields: ['tipo_accion'],
      },
    ],
  }
);

export default ModeracionLog;