import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../lib/supabase';
import type { SyncOperation } from '../types';
import { useStore } from '../store';

/**
 * Unified Offline Sync Engine
 * 
 * Deep module encapsulating online network mutations, offline queueing,
 * background retry processing, and cloud database reconciliation behind a simple dispatch interface.
 */
export const SyncEngine = {
    /**
     * Dispatch a database mutation command.
     * Executes immediately if online; queues for retry if offline or network error occurs.
     */
    dispatch: async (op: {
        table: string;
        action: 'insert' | 'update' | 'delete';
        payload: any;
        match?: { column: string; value: any };
    }): Promise<void> => {
        if (!navigator.onLine) {
            SyncEngine.queueOperation(op);
            return;
        }

        try {
            let query = supabase.from(op.table)[op.action](op.payload);
            if (op.match) {
                query = query.eq(op.match.column, op.match.value);
            }
            const { error } = await query;
            if (error) throw error;
        } catch (error) {
            console.warn(`Network mutation error, queuing ${op.action} on ${op.table}:`, error);
            SyncEngine.queueOperation(op);
        }
    },

    /**
     * Queue an operation to syncQueue state.
     */
    queueOperation: (op: {
        table: string;
        action: 'insert' | 'update' | 'delete';
        payload: any;
        match?: { column: string; value: any };
    }) => {
        const state = useStore.getState();
        state.queueSyncOperation(op);
    },

    /**
     * Replay queued offline operations sequentially.
     */
    processQueue: async (): Promise<void> => {
        const state = useStore.getState();
        const { syncQueue } = state;
        if (syncQueue.length === 0 || !navigator.onLine) return;

        console.log(`🔄 SyncEngine processing ${syncQueue.length} queued operations...`);
        let remainingQueue: SyncOperation[] = [...syncQueue];

        for (const op of syncQueue) {
            try {
                let error;
                if (op.table === 'rpc') {
                    const { error: rpcError } = await supabase.rpc(op.payload.function, op.payload.params);
                    error = rpcError;
                } else {
                    let query = supabase.from(op.table)[op.action](op.payload);
                    if (op.match) {
                        query = query.eq(op.match.column, op.match.value);
                    }
                    const { error: queryError } = await query;
                    error = queryError;
                }

                if (error) {
                    console.error(`Failed to process queued operation ${op.id}:`, error);
                    break;
                }
                remainingQueue = remainingQueue.filter(q => q.id !== op.id);
            } catch (error) {
                console.error(`Error processing queued operation ${op.id}:`, error);
                break;
            }
        }

        useStore.setState({ syncQueue: remainingQueue });
    },

    /**
     * Remote family wipe with offline fallback.
     */
    wipeFamilyData: async (familyId: string | null): Promise<void> => {
        const state = useStore.getState();

        if (familyId && navigator.onLine) {
            try {
                const { error } = await supabase.rpc('wipe_family_data', { target_family_id: familyId });
                if (error) throw error;
                console.log('✅ Remote family data wiped successfully.');
            } catch (error) {
                console.error('❌ Failed to wipe remote family data:', error);
            }
        } else if (familyId) {
            state.queueSyncOperation({
                id: uuidv4(),
                table: 'rpc',
                action: 'delete',
                payload: { function: 'wipe_family_data', params: { target_family_id: familyId } },
                timestamp: Date.now()
            } as any);
        }

        state.clearLocalData();
        const idb = await import('idb-keyval');
        await idb.del('linked-family-id');
    }
};
