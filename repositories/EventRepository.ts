import { ICreateEventDto, IEvent } from '../types';

export abstract class EventRepository {
	abstract create(event: ICreateEventDto): Promise<IEvent>;
	abstract update(event: IEvent): Promise<IEvent>;
	abstract get(param: ICreateEventDto): Promise<IEvent | null>;
	abstract getAll(limit?: number, offset?: number): Promise<IEvent[]>;
	/** @description Return deleted event or null if not exist */
	abstract delete(id: string): Promise<IEvent | null>;
}