import {
  parseISO,
  isBefore,
  startOfHour,
  startOfDay,
  endOfDay,
} from 'date-fns';
import { Op } from 'sequelize';
import Meetup from '../models/Meetup';
import User from '../models/User';
import File from '../models/File';
import Enrollment from '../models/Enrollment';

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
    const { page = 1, date } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'Invalid date' });
    }

    const searchDate = Number(date);
    const meetups = await Meetup.findAll({
      where: {
        date: {
          [Op.between]: [startOfDay(searchDate), endOfDay(searchDate)],
        },
      },
      order: ['date'],
      limit: 10,
      offset: (page - 1) * 10,
      include: [
        { model: User, as: 'organizer', attributes: ['name', 'email'] },
        { model: File, as: 'banner', attributes: ['id', 'path', 'url'] },
      ],
    });

    const enrollments = await Enrollment.findAll({
      where: { enrolled_id: req.userId },
      include: [
        {
          model: Meetup,
          as: 'meetup',
          where: {
            date: {
              [Op.gt]: new Date(),
            },
          },
        },
      ],
    });

    const data = meetups.map(meetup => {
      const isEnrolled = !!enrollments.find(
        enrollment => enrollment.meetup_id === meetup.id
      );
      const json = meetup.toJSON();
      json.isEnrolled = isEnrolled;
      return json;
    });

    return res.json(data);
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

  async show(req, res) {
    const { id } = req.params;
    const meetup = await Meetup.findByPk(id, {
      include: [
        { model: File, as: 'banner', attributes: ['url', 'id', 'path'] },
      ],
    });

    if (!meetup) {
      return res.status(401).json({ error: `Meetup ID: ${id} not found` });
    }

    return res.json(meetup);
  }
}

export default new MeetupController();
