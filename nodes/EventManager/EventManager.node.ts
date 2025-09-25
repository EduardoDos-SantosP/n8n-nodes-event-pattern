import {
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
	type NodeConnectionType,
	NodeExecutionWithMetadata,
	NodeOperationError,
} from 'n8n-workflow';
import { repositoryProvider } from '../../repositories/RepositoryProvider';
import { ICreateEventDto } from '../../types';

export class EventManager implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Event Manager',
		name: 'eventManager',
		icon: 'file:../EventEmitter/icon.svg',
		group: ['transform'],
		version: 1,
		description:
			'Manage events. Create, read, update or delete events to be emitted or listened to',
		defaults: {
			name: 'Event Manager',
		},
		inputs: [<NodeConnectionType>'main'],
		outputs: [<NodeConnectionType>'main'],
		credentials: [],
		properties: [
			{
				displayName: 'Persistence',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'File System',
						value: 'filesystem',
					},
				],
				default: 'filesystem',
				description: 'Where events are persisted',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Create', value: 'create' },
					{ name: 'Delete', value: 'delete' },
					{ name: 'Get Many', value: 'getAll' },
					{ name: 'Update', value: 'update' },
				],
				default: 'create',
			},

			{
				displayName: 'Event Name',
				name: 'name',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['create', 'update', 'delete'],
					},
				},
				placeholder: 'whatsapp.message.created',
				description: 'Unique name to identify the event',
				required: true,
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['create', 'update'],
					},
				},
				placeholder: 'When a new message is created in WhatsApp',
				description: 'Optional description',
			},
			{
				displayName: 'Return All',
				name: 'returnAll',
				type: 'boolean',
				default: true,
				description: 'Whether to return all results or only up to a given limit',
				displayOptions: {
					show: {
						operation: ['getAll'],
					},
				},
				required: true,
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 50,
				typeOptions: {
					minValue: 1,
				},
				description: 'Max number of results to return',
				displayOptions: {
					show: {
						operation: ['getAll'],
						returnAll: [false],
					},
				},
			},
			{
				displayName: 'Offset',
				name: 'offset',
				type: 'number',
				default: 0,
				typeOptions: {
					minValue: 0,
				},
				description: 'Offset for the results to return',
				displayOptions: {
					show: {
						operation: ['getAll'],
						returnAll: [false],
					},
				},
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items: INodeExecutionData[] = [];
		for (let i = 0; i < this.getInputData().length; i++) {
			try {
				const resource = this.getNodeParameter('resource', 0) as string;
				const operation = this.getNodeParameter('operation', 0) as string;

				if (resource !== 'filesystem') {
					throw new NodeOperationError(this.getNode(), `Resource ${resource} not supported`);
				}

				const repo = repositoryProvider.getRepository();

				const name = this.getNodeParameter('name', i) as string;
				const description = this.getNodeParameter('description', i) as string;
				const returnAll = this.getNodeParameter('returnAll', i) as boolean;
				const limit = this.getNodeParameter('limit', i) as number | undefined;
				const offset = this.getNodeParameter('offset', i) as number | undefined;

				switch (operation) {
					case 'create': {
						if (!name) throw new NodeOperationError(this.getNode(), 'Event name is required');
						const created = await repo.create({ name, description } as ICreateEventDto);
						items.push({ json: created });
						break;
					}
					case 'getAll': {
						const events = await (returnAll ? repo.getAll() : repo.getAll(limit, offset));
						for (const ev of events) items.push({ json: ev });
						break;
					}
					case 'update': {
						if (!name) throw new NodeOperationError(this.getNode(), 'Event name is required');
						const existing = await repo.get({ name });
						if (!existing)
							throw new NodeOperationError(this.getNode(), `Event with name '${name}' not found`);
						const updated = await repo.update({ ...existing, description });
						items.push({ json: updated });
						break;
					}
					case 'delete': {
						if (!name) throw new NodeOperationError(this.getNode(), 'Event name is required');
						const existing = await repo.get({ name });
						if (!existing)
							throw new NodeOperationError(this.getNode(), `Event with name '${name}' not found`);
						const removed = await repo.delete(existing.id);
						if (!removed) {
							// repository reported nothing was deleted, treat as not found
							throw new NodeOperationError(
								this.getNode(),
								`Event with id '${existing.id}' could not be deleted`,
							);
						}
						items.push({ json: removed });
						break;
					}
					default:
						throw new NodeOperationError(this.getNode(), `Operation ${operation} not supported`);
				}
			} catch (e: any) {
				if (this.continueOnFail()) {
					items.push({
						json: {
							error: e.message,
						},
						pairedItem: { item: i },
					});
				} else {
					throw new NodeOperationError(this.getNode(), e as Error, { itemIndex: i });
				}
			}
		}

		return [this.helpers.returnJsonArray(items.map((i) => i.json))];
	}
	methods = {
		loadOptions: {
			getEvents: async function (this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				try {
					const repo = repositoryProvider.getRepository();
					const events = await repo.getAll();
					return events.map((e) => ({ name: String(e.name), value: String(e.id) }));
				} catch (e) {
					return [];
				}
			},
		},
	};
	customOperations?:
		| {
				[resource: string]: {
					[operation: string]: (
						this: IExecuteFunctions,
					) => Promise<INodeExecutionData[][] | NodeExecutionWithMetadata[][] | null>;
				};
		  }
		| undefined;
}
