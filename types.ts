import { ChannelProvider } from './channels/ChannelProvider';

export type IEvent = {
	/** @description Internal ID */
	id: string;
	/** @description Unique name to identify the event */
	name: string;
	
	description?: string;
};

export type ICreateEventDto = Omit<IEvent, 'id'>;

export type IGetEventDto = Pick<IEvent, 'id'> | Pick<IEvent, 'name'>;

export type ChannelCredentialName = keyof ChannelProvider['channels'];
