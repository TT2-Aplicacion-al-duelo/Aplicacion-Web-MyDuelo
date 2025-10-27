import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../database/connection';

interface ForoParticipanteAttributes {
  id_participante: number;
  id_foro: number;
  tipo_usuario: 'psicologo' | 'paciente';
  id_psicologo?: number;
  id_paciente?: number;
  rol: 'admin' | 'moderador' | 'miembro';
  fecha_union: Date;
}

interface ForoParticipanteCreationAttributes 
  extends Optional<ForoParticipanteAttributes, 'id_participante' | 'fecha_union' | 'rol'> {}

class ForoParticipante extends Model<ForoParticipanteAttributes, ForoParticipanteCreationAttributes> 
  implements ForoParticipanteAttributes {
  public id_participante!: number;
  public id_foro!: number;
  public tipo_usuario!: 'psicologo' | 'paciente';
  public id_psicologo?: number;
  public id_paciente?: number;
  public rol!: 'admin' | 'moderador' | 'miembro';
  public fecha_union!: Date;
}

ForoParticipante.init(
  {
    id_participante: {
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
    rol: {
      type: DataTypes.ENUM('admin', 'moderador', 'miembro'),
      allowNull: false,
      defaultValue: 'miembro',
    },
    fecha_union: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'foro_participante',
    timestamps: false,
    indexes: [
      {
        name: 'idx_participante_rol',
        fields: ['id_foro', 'rol'],
      },
    ],
  }
);

export default ForoParticipante;