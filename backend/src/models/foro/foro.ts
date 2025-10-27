// backend/src/models/foro.model.ts
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../database/connection';

// Atributos del Foro
interface ForoAttributes {
  id_foro: number;
  titulo: string;
  descripcion?: string;
  publico: boolean;
  id_psicologo_creador: number;
  fecha_creacion: Date;
  activo: boolean;
}

// Atributos opcionales al crear (los que tienen valores por defecto)
interface ForoCreationAttributes extends Optional<ForoAttributes, 'id_foro' | 'fecha_creacion' | 'activo' | 'descripcion'> {}

// Clase del modelo
class Foro extends Model<ForoAttributes, ForoCreationAttributes> implements ForoAttributes {
  public id_foro!: number;
  public titulo!: string;
  public descripcion?: string;
  public publico!: boolean;
  public id_psicologo_creador!: number;
  public fecha_creacion!: Date;
  public activo!: boolean;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Foro.init(
  {
    id_foro: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    titulo: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'El título no puede estar vacío' },
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
    publico: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    id_psicologo_creador: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'psicologo',
        key: 'id_psicologo',
      },
    },
    fecha_creacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'foro',
    timestamps: false,
    indexes: [
      {
        name: 'idx_foro_publico_activo',
        fields: ['publico', 'activo'],
      },
      {
        name: 'idx_foro_creador',
        fields: ['id_psicologo_creador'],
      },
    ],
  }
);

export default Foro;