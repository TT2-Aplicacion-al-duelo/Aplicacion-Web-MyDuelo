// backend/src/models/tema.model.ts
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../database/connection';

interface TemaAttributes {
  id_tema: number;
  id_foro: number;
  titulo: string;
  descripcion?: string;
  fecha_creacion: Date;
}

interface TemaCreationAttributes extends Optional<TemaAttributes, 'id_tema' | 'fecha_creacion' | 'descripcion'> {}

class Tema extends Model<TemaAttributes, TemaCreationAttributes> implements TemaAttributes {
  public id_tema!: number;
  public id_foro!: number;
  public titulo!: string;
  public descripcion?: string;
  public fecha_creacion!: Date;
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
  },
  {
    sequelize,
    tableName: 'tema',
    timestamps: false,
  }
);

export default Tema;