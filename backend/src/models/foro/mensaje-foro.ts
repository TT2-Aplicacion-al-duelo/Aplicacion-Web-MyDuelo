// backend/src/models/mensaje-foro.model.ts
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../database/connection';

interface MensajeForoAttributes {
  id_mensaje_foro: number;
  id_tema: number;
  tipo_usuario: 'psicologo' | 'paciente';
  id_psicologo?: number;
  id_paciente?: number;
  contenido: string;
  fecha_envio: Date;
  editado: boolean;
  fecha_edicion?: Date;
  eliminado: boolean;
  fecha_eliminacion?: Date;
  id_moderador_eliminador?: number;
}

interface MensajeForoCreationAttributes 
  extends Optional<MensajeForoAttributes, 'id_mensaje_foro' | 'fecha_envio' | 'editado' | 'fecha_edicion' | 'eliminado' | 'fecha_eliminacion' | 'id_moderador_eliminador'> {}

class MensajeForo extends Model<MensajeForoAttributes, MensajeForoCreationAttributes> 
  implements MensajeForoAttributes {
  public id_mensaje_foro!: number;
  public id_tema!: number;
  public tipo_usuario!: 'psicologo' | 'paciente';
  public id_psicologo?: number;
  public id_paciente?: number;
  public contenido!: string;
  public fecha_envio!: Date;
  public editado!: boolean;
  public fecha_edicion?: Date;
  public eliminado!: boolean;
  public fecha_eliminacion?: Date;
  public id_moderador_eliminador?: number;
}

MensajeForo.init(
  {
    id_mensaje_foro: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    id_tema: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'tema',
        key: 'id_tema',
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
    contenido: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'El contenido del mensaje no puede estar vacío' },
      },
    },
    fecha_envio: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    editado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    fecha_edicion: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    eliminado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    fecha_eliminacion: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    id_moderador_eliminador: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'psicologo',
        key: 'id_psicologo',
      },
    },
  },
  
  {
    sequelize,
    tableName: 'mensaje_foro',
    timestamps: false,
  }
);

export default MensajeForo;