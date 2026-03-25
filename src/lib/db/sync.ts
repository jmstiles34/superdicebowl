/**
 * Sync Layer Stub
 *
 * This module scaffolds the interface for future remote synchronization.
 * When ready to add a backend (e.g. Supabase), implement the SyncAdapter
 * interface and register it with Dexie Syncable.
 *
 * The local-first IndexedDB layer (database.ts) is the source of truth.
 * This sync layer will handle:
 * - Pushing local changes to a remote server
 * - Pulling remote changes to local IndexedDB
 * - Conflict resolution (last-write-wins or custom merge)
 */

export interface SyncAdapter {
	connect(): Promise<void>;
	disconnect(): Promise<void>;
	pushChanges(changes: SyncChange[]): Promise<void>;
	pullChanges(since: number): Promise<SyncChange[]>;
}

export interface SyncChange {
	table: string;
	key: number;
	type: 'create' | 'update' | 'delete';
	data?: Record<string, unknown>;
	timestamp: number;
}

export type SyncStatus = 'disconnected' | 'connecting' | 'connected' | 'syncing' | 'error';

/**
 * Placeholder — call this when a backend is available.
 * It will register the adapter with Dexie Syncable.
 */
export function registerSyncAdapter(_adapter: SyncAdapter): void {
	// Future: import 'dexie-observable' and 'dexie-syncable'
	// then register the adapter protocol with db.syncable.connect()
}
