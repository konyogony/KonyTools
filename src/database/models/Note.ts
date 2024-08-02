import { DocumentType, getModelForClass, modelOptions, prop, Severity } from '@typegoose/typegoose';
import { Attachment } from 'discord.js';

@modelOptions({ schemaOptions: { collection: 'notes' }, options: { allowMixed: Severity.ALLOW } })
export class NoteSchema {
    @prop({ type: String, required: true }) user_id!: string;
    @prop({ type: String, required: true }) content!: string;
    @prop({ type: Number, required: true }) time_created!: number;
    @prop({ type: Attachment, required: false }) attachment!: Attachment;
}

export type NoteDocument = DocumentType<NoteSchema>;

export const Note = getModelForClass(NoteSchema);
