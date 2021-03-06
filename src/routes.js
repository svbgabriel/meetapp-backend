import { Router } from 'express';
import multer from 'multer';
import multerConfig from './config/multer';
import UserController from './app/controllers/UserController';
import SessionsController from './app/controllers/SessionController';
import FileController from './app/controllers/FileController';
import MeetupController from './app/controllers/MeetupController';
import EnrollmentController from './app/controllers/EnrollmentController';
import ScheduleController from './app/controllers/ScheduleController';
import authMiddleware from './app/middlewares/auth';

const routes = new Router();
const upload = multer(multerConfig);

routes.post('/users', UserController.store);
routes.post('/sessions', SessionsController.store);

routes.use(authMiddleware);

routes.put('/users', UserController.update);

routes.get('/meetups', MeetupController.index);
routes.get('/meetups/:id', MeetupController.show);
routes.post('/meetups', MeetupController.store);
routes.put('/meetups/:id', MeetupController.update);
routes.delete('/meetups/:id', MeetupController.destroy);

routes.post('/enrollments/:id', EnrollmentController.store);
routes.get('/enrollments', EnrollmentController.index);
routes.delete('/enrollments/:id', EnrollmentController.destroy);

routes.get('/schedules', ScheduleController.index);

routes.post('/files', upload.single('file'), FileController.store);

export default routes;
