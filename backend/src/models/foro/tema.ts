// backend/src/models/tema.model.ts
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../database/connection';

interface TemaAttributes {
  id_tema: number;
  id_foro: number;
  titulo: string;
  descripcion?: string;
  fecha_creacion: Date;
  cerrado: boolean;
  fijado: boolean;
  fecha_cierre?: Date;
  id_moderador_cierre?: number;
}

interface TemaCreationAttributes extends Optional<TemaAttributes, 'id_tema' | 'fecha_creacion' | 'descripcion' | 'cerrado' | 'fijado' | 'fecha_cierre' | 'id_moderador_cierre'> {}

class Tema extends Model<TemaAttributes, TemaCreationAttributes> implements TemaAttributes {
  public id_tema!: number;
  public id_foro!: number;
  public titulo!: string;
  public descripcion?: string;
  public fecha_creacion!: Date;
  public cerrado!: boolean;
  public fijado!: boolean;
  public fecha_cierre?: Date;
  public id_moderador_cierre?: number;
}

Tema.init(
  {
    id_tema: {
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
    titulo: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'El título del tema no puede estar vacío' },
        len: {
          args: [3, 255],
          msg: 'El título debe tener entre 3 y 255 caracteres',
        },
      },
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    fecha_creacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    cerrado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    fijado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    fecha_cierre: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    id_moderador_cierre: {
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
    tableName: 'tema',
    timestamps: false,
  }
);

export default Tema;