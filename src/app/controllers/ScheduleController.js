import Meetup from '../models/Meetup';

class ScheduleController {
  async index(req, res) {
    const id = req.userId;
    const meetups = await Meetup.findAll({ where: { user_id: id } });

    return res.json(meetups);
  }
}

export default new ScheduleController();
