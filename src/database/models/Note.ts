import { DocumentType, getModelForClass, modelOptions, prop, Severity } from '@typegoose/typegoose';

@modelOptions({ schemaOptions: { collection: 'notes' }, options: { allowMixed: Severity.ALLOW } })
export class NoteSchema {
    @prop({ type: String, required: true }) user_id!: string;
    @prop({ type: Number, required: true }) time_created!: number;
    @prop({ type: String, required: true }) content!: string;
}

export type NoteDocument = DocumentType<NoteSchema>;

export const Note = getModelForClass(NoteSchema);
