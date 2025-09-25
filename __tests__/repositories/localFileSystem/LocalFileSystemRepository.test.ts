import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { LocalFileSystemRepository } from '../../../repositories/localFileSystem/LocalFileSystemRepository';
import { ICreateEventDto, IEvent } from '../../../types';

// Helper to create a temporary working directory and chdir into it
async function withTempCwd(fn: (tmp: string) => Promise<void>) {
	const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'events-test-'));
	const originalCwd = process.cwd();
	try {
		process.chdir(tmp);
		await fn(tmp);
	} finally {
		process.chdir(originalCwd);
		// cleanup - remove tmp recursively
		try {
			await fs.rm(tmp, { recursive: true, force: true });
		} catch (e) {
			// ignore
		}
	}
}

describe('LocalFileSystemRepository', () => {
	test('create and get by name', async () => {
		await withTempCwd(async () => {
			const repo = new LocalFileSystemRepository();
			const dto: ICreateEventDto = { name: 'my-event', description: 'desc' };
			const created = await repo.create(dto);
			expect(created).toHaveProperty('id');
			expect(created.name).toBe(dto.name);
			const fetched = await repo.get({ name: 'my-event' });
			expect(fetched).not.toBeNull();
			expect(fetched!.id).toBe(created.id);
			expect(fetched!.name).toBe('my-event');
		});
	});

	test('get by id and delete', async () => {
		await withTempCwd(async () => {
			const repo = new LocalFileSystemRepository();
			const dto: ICreateEventDto = { name: 'e2', description: 'd2' };
			const created = await repo.create(dto);
			const byId = await repo.get({ id: created.id });
			expect(byId).not.toBeNull();
			expect(byId!.name).toBe(dto.name);

			const deleted = await repo.delete(created.id);
			expect(deleted).not.toBeNull();
			expect(deleted!.id).toBe(created.id);

			const after = await repo.get({ id: created.id });
			expect(after).toBeNull();
		});
	});

	test('getAll supports limit and offset', async () => {
		await withTempCwd(async () => {
			const repo = new LocalFileSystemRepository();
			const items: ICreateEventDto[] = [
				{ name: 'a', description: 'a' },
				{ name: 'b', description: 'b' },
				{ name: 'c', description: 'c' },
				{ name: 'd', description: 'd' },
			];
			for (const it of items) await repo.create(it);
			const all = await repo.getAll();
			expect(all.length).toBe(4);
			const firstTwo = await repo.getAll(2, 0);
			expect(firstTwo.length).toBe(2);
			const lastTwo = await repo.getAll(2, 2);
			expect(lastTwo.length).toBe(2);
		});
	});

	test('update changes name and description', async () => {
		await withTempCwd(async () => {
			const repo = new LocalFileSystemRepository();
			const created = await repo.create({ name: 'orig', description: 'o' });
			const updated: IEvent = { id: created.id, name: 'new-name', description: 'new' };
			const res = await repo.update(updated);
			expect(res.id).toBe(created.id);
			expect(res.name).toBe('new-name');
			const fetched = await repo.get({ id: created.id });
			expect(fetched).not.toBeNull();
			expect(fetched!.name).toBe('new-name');
		});
	});

	test('getAll returns empty when no events exist', async () => {
		await withTempCwd(async () => {
			const repo = new LocalFileSystemRepository();
			const all = await repo.getAll();
			expect(all).toEqual([]);
		});
	});

	test('create duplicate name should allow unique ids but index maps latest', async () => {
		await withTempCwd(async () => {
			const repo = new LocalFileSystemRepository();
			await repo.create({ name: 'dup', description: '1' });
			// create second with same name
			await repo.create({ name: 'dup', description: '2' });
			// Both files will be written with same filename; behavior depends on implementation - expect last wins
			const all = await repo.getAll();
			// ensure at least one present and its name is 'dup'
			expect(all.length).toBeGreaterThanOrEqual(1);
			expect(all[all.length - 1].name).toBe('dup');
		});
	});
});
