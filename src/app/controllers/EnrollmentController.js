import { isBefore } from 'date-fns';
import { Op } from 'sequelize';
import Enrollment from '../models/Enrollment';
import Meetup from '../models/Meetup';
import User from '../models/User';
import EnrollmentMail from '../jobs/EnrollmentMail';
import Queue from '../../lib/Queue';
import File from '../models/File';

class EnrollmentController {
  async store(req, res) {
    const { id: meetup_id } = req.params;
    const user_id = req.userId;

    // Procura o meetup
    const meetup = await Meetup.findByPk(meetup_id, {
      include: [{ model: User, as: 'organizer' }],
    });
    if (!meetup) {
      return res.status(401).json({ error: 'Meetup not found' });
    }

    // Verifica se organizador e o inscrito é o mesmo usuário
    if (meetup.user_id === user_id) {
      return res
        .status(401)
        .json({ error: "You can't enroll in a meetup what you organize" });
    }

    // Verifica se o meetup já passou
    if (isBefore(meetup.date, new Date())) {
      return res
        .status(400)
        .json({ error: "You can't enroll in past meetups" });
    }

    // Verifica se o usuário já se cadastrou nesse meetup
    const alreadyEnrolled = await Enrollment.findOne({
      where: { meetup_id, enrolled_id: user_id },
    });
    if (alreadyEnrolled) {
      return res
        .status(400)
        .json({ error: 'You already enrolled at this meetup' });
    }

    // Verifica se usuário já está cadastrado em um meetup no mesmo horário
    const meetupAtSomeHour = await Enrollment.findOne({
      where: { enrolled_id: user_id },
      include: [{ model: Meetup, as: 'meetup', where: { date: meetup.date } }],
    });
    if (meetupAtSomeHour) {
      return res
        .status(400)
        .json({ error: 'You already enrolled at a meetup in the same hour' });
    }

    // Cria o registro
    const enrollment = await Enrollment.create({
      enrolled_id: user_id,
      meetup_id,
    });

    // Recupera o inscrito para o e-mail
    const enrolled = await User.findByPk(user_id);

    // Envia o e-mail de inscrição
    await Queue.add(EnrollmentMail.key, {
      enrolled,
      meetup,
    });

    return res.json(enrollment);
  }

  async index(req, res) {
    const enrolled_id = req.userId;

    const enrollments = await Enrollment.findAll({
      where: { enrolled_id },
      include: [
        {
          model: Meetup,
          as: 'meetup',
          where: {
            date: {
              [Op.gt]: new Date(),
            },
          },
          include: [
            { model: File, as: 'banner', attributes: ['id', 'path', 'url'] },
            { model: User, as: 'organizer', attributes: ['id', 'name'] },
          ],
        },
      ],
      order: [[{ model: Meetup, as: 'meetup' }, 'date', 'asc']],
    });

    return res.json(enrollments);
  }

  async destroy(req, res) {
    const { id: meetup_id } = req.params;
    const enrolled_id = req.userId;

    // Procura o cadastro no Meetup
    const enrollment = await Enrollment.findOne({
      where: { enrolled_id, meetup_id },
    });

    if (!enrollment) {
      return res
        .status(401)
        .json({ error: 'Enrollment not found for this user and Meetup' });
    }

    // Remove o Meetup
    await enrollment.destroy();

    return res.send();
  }
}

export default new EnrollmentController();
