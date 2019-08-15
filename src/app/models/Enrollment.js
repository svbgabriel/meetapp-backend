import { Model } from 'sequelize';

class Enrollment extends Model {
  static init(sequelize) {
    super.init({}, { sequelize });

    return this;
  }

  static associate(models) {
    this.belongsTo(models.Meetup, { foreignKey: 'meetup_id', as: 'meetup' });
    this.belongsTo(models.User, { foreignKey: 'enrolled_id', as: 'enrolled' });
  }
}

export default Enrollment;
