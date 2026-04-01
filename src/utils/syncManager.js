import NetInfo from '@react-native-community/netinfo';
import * as SecureStore from 'expo-secure-store';
import { saveMilkPcsSubmission, saveMpcsSubmission } from '../supabase';

const QUEUE_KEY = '@submission_queue';

/**
 * Adds a submission to the offline queue.
 * @param {string} type - 'MILK_PCS' | 'MPCS'
 * @param {object} data - Form data
 */
export const queueSubmission = async (type, data) => {
    try {
        const queueJson = await SecureStore.getItemAsync(QUEUE_KEY);
        const queue = queueJson ? JSON.parse(queueJson) : [];
        const item = {
            id: Date.now().toString(),
            type,
            data,
            timestamp: new Date().toISOString()
        };
        queue.push(item);
        await SecureStore.setItemAsync(QUEUE_KEY, JSON.stringify(queue));
        return true;
    } catch (e) {
        console.error('Queue error:', e);
        return false;
    }
};

/**
 * Processes the offline queue and attempts to sync with Supabase.
 */
export const processQueue = async (onStatusChange) => {
    const state = await NetInfo.fetch();
    if (!state.isConnected) return { synced: 0, pending: 0 };

    try {
        const queueJson = await SecureStore.getItemAsync(QUEUE_KEY);
        if (!queueJson) return { synced: 0, pending: 0 };

        let queue = JSON.parse(queueJson);
        if (queue.length === 0) return { synced: 0, pending: 0 };

        const remaining = [];
        let syncedCount = 0;

        for (const item of queue) {
            try {
                let error = null;
                if (item.type === 'MILK_PCS') {
                    const result = await saveMilkPcsSubmission(item.data);
                    error = result.error;
                } else if (item.type === 'MPCS') {
                    const result = await saveMpcsSubmission(item.data);
                    error = result.error;
                }

                if (!error) {
                    syncedCount++;
                } else {
                    remaining.push(item);
                }
            } catch (e) {
                remaining.push(item);
            }
        }

        await SecureStore.setItemAsync(QUEUE_KEY, JSON.stringify(remaining));
        
        if (onStatusChange) onStatusChange({ synced: syncedCount, pending: remaining.length });
        return { synced: syncedCount, pending: remaining.length };
    } catch (e) {
        console.error('Process queue error:', e);
        return { synced: 0, pending: 0 };
    }
};

/**
 * Gets the number of pending items in the queue.
 */
export const getQueueStatus = async () => {
    try {
        const queueJson = await SecureStore.getItemAsync(QUEUE_KEY);
        if (!queueJson) return 0;
        const queue = JSON.parse(queueJson);
        return queue.length;
    } catch (e) {
        return 0;
    }
};
