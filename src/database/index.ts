import mongoose from 'mongoose';
import config from '../utils/config';

export * from './models/Note';

export const connection = mongoose.connect(config.database_uri);
