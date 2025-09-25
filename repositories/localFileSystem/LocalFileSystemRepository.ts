import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'node:crypto';
import { ICreateEventDto, IEvent, IGetEventDto } from '../../types';
import { EventRepository } from '../EventRepository';

export class LocalFileSystemRepository extends EventRepository {
	private readonly basePath = '.events';
	private readonly indexFile = 'index.json';
	private readonly eventsDir = 'events';

	private resolvePath(...paths: string[]) {
		// Resolve relative to the current working directory so tests that chdir to a temp
		// directory (via withTempCwd) stay isolated and don't share the repo's .events folder.
		return path.resolve(process.cwd(), this.basePath, ...paths);
	}

	private async assertIndex(): Promise<Record<string, string>> {
		const indexFile = this.resolvePath(this.indexFile);
		let fileContent = '{}';
		try {
			fileContent = await fs.readFile(indexFile, 'utf8');
		} catch {
			await fs.mkdir(this.resolvePath(this.basePath), { recursive: true });
			await fs.writeFile(indexFile, fileContent);
		}
		return JSON.parse(fileContent);
	}
	private async upsertIndex(event: IEvent): Promise<void> {
		const index = await this.assertIndex();
		index[event.id] = event.name;
		const indexFilePath = this.resolvePath(this.indexFile);
		await fs.writeFile(indexFilePath, JSON.stringify(index, null, 2));
	}
	private async deleteIndex(id: string): Promise<void> {
		const index = await this.assertIndex();
		delete index[id];
		const indexFilePath = this.resolvePath(this.indexFile);
		await fs.writeFile(indexFilePath, JSON.stringify(index, null, 2));
	}

	private async upsert(event: IEvent): Promise<void> {
		await this.upsertIndex(event);
		const dir = this.resolvePath(this.eventsDir);
		await fs.mkdir(dir, { recursive: true });
		const fileContent = JSON.stringify(event, null, 2);
		await fs.writeFile(path.join(dir, `${event.name}.json`), fileContent);
	}

	async create(event: ICreateEventDto): Promise<IEvent> {
		const created: IEvent = {
			id: randomUUID(),
			...event,
		};
		await this.upsert(created);
		return created;
	}
	async get(param: IGetEventDto): Promise<IEvent | null> {
		let eventName: string | undefined;

		if ('name' in param) {
			eventName = param.name;
		} else if ('id' in param) {
			const index = await this.assertIndex();
			eventName = index[param.id];
		}
		if (!eventName) return null;

		const filePath = this.resolvePath(this.eventsDir, `${eventName}.json`);
		try {
			const content = await fs.readFile(filePath, 'utf8');
			return JSON.parse(content) as IEvent;
		} catch (e) {
			return null;
		}
	}
	async delete(id: string): Promise<IEvent | null> {
		const event = await this.get({ id });
		if (!event) return null;
		const filePath = this.resolvePath(this.eventsDir, `${event.name}.json`);
		await fs.rm(filePath);
		await this.deleteIndex(id);
		return event;
	}
	async getAll(limit?: number, offset?: number): Promise<IEvent[]> {
		const index = await this.assertIndex();
		const ids = Object.keys(index);

		const start = offset ?? 0;
		const end = limit ? start + limit : ids.length;
		const selectedIds = ids.slice(start, end);

		const results: IEvent[] = [];
		for (const id of selectedIds) {
			const name = index[id];
			if (!name) continue;
			const event = await this.get({ name });
			if (event) results.push(event);
		}

		return results;
	}
	async update(event: IEvent): Promise<IEvent> {
		const existing = await this.get({ id: event.id });
		if (!existing) {
			throw new Error(`Event with id '${event.id}' not found`);
		}
		await this.delete(existing.id);
		await this.upsert(event);
		return event;
	}
}
