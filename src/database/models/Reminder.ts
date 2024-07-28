import { DocumentType, getModelForClass, modelOptions, prop, Severity } from '@typegoose/typegoose';

@modelOptions({ schemaOptions: { collection: 'reminders' }, options: { allowMixed: Severity.ALLOW } })
export class ReminderSchema {
    @prop({ type: String, required: true }) user_id!: string;
    @prop({ type: String, required: true }) content!: string;
    @prop({ type: Number, required: true }) time!: number;
    @prop({ type: Number, required: true }) time_created!: number;
}

export type ReminderDocument = DocumentType<ReminderSchema>;

export const Reminder = getModelForClass(ReminderSchema);
