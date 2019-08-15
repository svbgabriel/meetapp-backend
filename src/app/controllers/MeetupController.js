import { parseISO, isBefore, startOfHour } from 'date-fns';
import Meetup from '../models/Meetup';

class MeetupController {
  async store(req, res) {
    const { title, description, localization, date, banner_id } = req.body;
    const user_id = req.userId;

    // Verifica se a data já passou
    const isoDate = parseISO(date);
    if (isBefore(isoDate, new Date())) {
      return res.status(400).json({ error: 'Past dates are not permitted' });
    }

    // Passa a data para o "ínicio"
    const startHour = startOfHour(parseISO(date));

    const meetup = await Meetup.create({
      title,
      description,
      localization,
      date: startHour,
      banner_id,
      user_id,
    });

    return res.json(meetup);
  }

  async update(req, res) {
    const { id } = req.params;
    const meetup = await Meetup.findOne({ where: { id, user_id: req.userId } });

    if (!meetup) {
      return res
        .status(403)
        .json({ error: 'Meetup not found for the current user' });
    }

    // Verifica se o meetup já passou
    if (isBefore(meetup.date, new Date())) {
      return res
        .status(400)
        .json({ error: 'Update past meetups are not permitted' });
    }

    // Verifica se a nova data já passou
    const { date } = req.body;
    const isoDate = parseISO(date);
    if (isBefore(isoDate, new Date())) {
      return res.status(400).json({ error: 'Past dates are not permitted' });
    }

    await meetup.update(req.body);

    return res.json(meetup);
  }

  async index(req, res) {
    const id = req.userId;
    const meetups = await Meetup.findAll({ where: { user_id: id } });

    res.json(meetups);
  }

  async destroy(req, res) {
    const { id } = req.params;
    const meetup = await Meetup.findOne({ where: { id, user_id: req.userId } });

    if (!meetup) {
      return res
        .status(403)
        .json({ error: 'Meetup not found for the current user' });
    }

    // Verifica se o meetup já passou
    if (isBefore(meetup.date, new Date())) {
      return res
        .status(400)
        .json({ error: 'Delete past meetups are not permitted' });
    }

    await meetup.destroy();

    return res.send();
  }
}

export default new MeetupController();
