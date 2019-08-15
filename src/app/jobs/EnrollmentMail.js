import Mail from '../../lib/Mail';

class EnrollmentMail {
  get key() {
    return 'EnrollmentMail';
  }

  async handle({ data }) {
    const { enrolled, meetup } = data;

    await Mail.sendMail({
      to: `${meetup.organizer.name} <${meetup.organizer.email}>`,
      subject: 'Novo inscrito',
      template: 'enrollment',
      context: {
        organizerName: meetup.organizer.name,
        userName: enrolled.name,
        userEmail: enrolled.email,
      },
    });
  }
}

export default new EnrollmentMail();
