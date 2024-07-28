import mongoose from 'mongoose';
import config from '../utils/config';

export * from './models/Note';
export * from './models/Reminder';

mongoose.set('strictQuery', true);
export const connection = mongoose.connect(config.database_uri);
