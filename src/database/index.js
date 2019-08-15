import Sequilize from 'sequelize';
import File from '../app/models/File';
import User from '../app/models/User';
import Meetup from '../app/models/Meetup';
import Enrollment from '../app/models/Enrollment';
import databaseConfig from '../config/database';

const models = [File, User, Meetup, Enrollment];

class Database {
  constructor() {
    this.init();
  }

  init() {
    this.connection = new Sequilize(databaseConfig);

    models
      .map(model => model.init(this.connection))
      .map(model => model.associate && model.associate(this.connection.models));
  }
}

export default new Database();
