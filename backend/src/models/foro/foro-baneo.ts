import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../database/connection';

interface ForoBaneoAttributes {
  id_baneo: number;
  id_foro: number;
  tipo_usuario: 'psicologo' | 'paciente';
  id_psicologo?: number;
  id_paciente?: number;
  id_moderador: number;
  tipo_baneo: 'silencio' | 'baneo';
  razon: string;
  fecha_baneo: Date;
  fecha_expiracion?: Date;
  activo: boolean;
  fecha_levantamiento?: Date;
  id_moderador_levantamiento?: number;
}

interface ForoBaneoCreationAttributes 
  extends Optional<ForoBaneoAttributes, 'id_baneo' | 'fecha_baneo' | 'activo' | 'fecha_expiracion' | 'fecha_levantamiento' | 'id_moderador_levantamiento'> {}

class ForoBaneo extends Model<ForoBaneoAttributes, ForoBaneoCreationAttributes> 
  implements ForoBaneoAttributes {
  public id_baneo!: number;
  public id_foro!: number;
  public tipo_usuario!: 'psicologo' | 'paciente';
  public id_psicologo?: number;
  public id_paciente?: number;
  public id_moderador!: number;
  public tipo_baneo!: 'silencio' | 'baneo';
  public razon!: string;
  public fecha_baneo!: Date;
  public fecha_expiracion?: Date;
  public activo!: boolean;
  public fecha_levantamiento?: Date;
  public id_moderador_levantamiento?: number;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ForoBaneo.init(
  {
    id_baneo: {
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
    id_moderador: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'psicologo',
        key: 'id_psicologo',
      },
    },
    tipo_baneo: {
      type: DataTypes.ENUM('silencio', 'baneo'),
      allowNull: false,
      defaultValue: 'silencio',
    },
    razon: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'La razón del baneo no puede estar vacía' },
      },
    },
    fecha_baneo: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    fecha_expiracion: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'NULL = baneo permanente',
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    fecha_levantamiento: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    id_moderador_levantamiento: {
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
    tableName: 'foro_baneo',
    timestamps: false,
    indexes: [
      {
        name: 'idx_baneo_foro_usuario',
        fields: ['id_foro', 'tipo_usuario', 'id_psicologo', 'id_paciente', 'activo'],
      },
      {
        name: 'idx_baneo_activo',
        fields: ['activo', 'fecha_expiracion'],
      },
      {
        name: 'idx_baneo_moderador',
        fields: ['id_moderador'],
      },
      // ✅ CORREGIDO: Formato correcto para índice con orden
      {
        name: 'idx_baneo_fecha',
        fields: [
          {
            name: 'fecha_baneo',
            order: 'DESC'
          }
        ],
      },
    ],
  }
);

export default ForoBaneo;