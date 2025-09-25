import { ApplicationError, INodeType, IVersionedNodeType } from 'n8n-workflow';
import { eventListenerNodeBaseDescription } from '../../utils';
import { EventListenerTriggerV1 } from './EventListenerTriggerV1';

export class EventListenerTrigger implements IVersionedNodeType {
	nodeVersions: IVersionedNodeType['nodeVersions'] = {
		1: new EventListenerTriggerV1(),
	};

	description = eventListenerNodeBaseDescription;

	get currentVersion(): number {
		return Math.max(...Object.keys(this.nodeVersions).map((k) => +k));
	}

	getNodeType(version?: number): INodeType {
		const node = this.nodeVersions[version ?? this.currentVersion];
		if (!node) {
			throw new ApplicationError(
				`The version "${version}" of the node "${this.description.displayName}" does not exist!`,
			);
		}
		return node;
	}
}
