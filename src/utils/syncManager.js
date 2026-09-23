import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveMilkPcsSubmission, saveMpcsSubmission, supabase, uploadPhoto } from '../supabase';

const QUEUE_KEY = 'submission_queue';

/**
 * Adds a submission to the offline queue.
 * @param {string} type - 'MILK_PCS' | 'MPCS' | 'RPC_ASSIGN'
 * @param {object} data - Form data. For 'RPC_ASSIGN', { institutionName }.
 *   For 'MILK_PCS'/'MPCS', an unuploaded photo goes in `imageBase64` — the
 *   photo itself (not just the DB row) is retried on the next processQueue
 *   pass, since a captured evidence photo is much harder to recapture than
 *   any other field is to retype.
 */
export const queueSubmission = async (type, data) => {
    try {
        const queueJson = await AsyncStorage.getItem(QUEUE_KEY);
        const queue = queueJson ? JSON.parse(queueJson) : [];
        const item = {
            id: Date.now().toString(),
            type,
            data,
            timestamp: new Date().toISOString()
        };
        queue.push(item);
        await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
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
    let isConnected = true;
    try {
        if (Platform.OS === 'web') {
            isConnected = typeof navigator !== 'undefined' ? navigator.onLine : true;
        } else {
            const state = await NetInfo.fetch();
            isConnected = !!state?.isConnected;
        }
    } catch (e) {
        isConnected = true;
    }

    if (!isConnected) return { synced: 0, pending: await getQueueStatus() };

    try {
        const queueJson = await AsyncStorage.getItem(QUEUE_KEY);
        if (!queueJson) return { synced: 0, pending: 0 };

        let queue = JSON.parse(queueJson);
        if (queue.length === 0) return { synced: 0, pending: 0 };

        const remaining = [];
        let syncedCount = 0;

        for (const item of queue) {
            try {
                let error = null;
                if (item.type === 'RPC_ASSIGN') {
                    const result = await supabase.rpc('self_assign_institution', { p_institution_name: item.data.institutionName });
                    error = result.error;
                } else if (item.type === 'MILK_PCS' || item.type === 'MPCS') {
                    // A captured evidence photo that failed to upload rides
                    // along as raw base64 instead of a URL — re-attempt the
                    // upload itself before the DB write, since a photo is
                    // far harder to recapture in the field than any other
                    // value here is to retype. If the photo still won't
                    // upload, the whole item stays queued rather than
                    // silently inserting the row with no photo attached.
                    if (item.data.imageBase64 && !item.data.photoUrl) {
                        const uploadedUrl = await uploadPhoto(item.data.imageBase64);
                        if (!uploadedUrl) {
                            throw new Error('Photo re-upload still failing');
                        }
                        item.data.photoUrl = uploadedUrl;
                        delete item.data.imageBase64;
                    }
                    const result = item.type === 'MILK_PCS'
                        ? await saveMilkPcsSubmission(item.data)
                        : await saveMpcsSubmission(item.data);
                    error = result.error;
                }

                if (!error) {
                    syncedCount++;
                } else {
                    console.warn('Sync item failed:', error.message || error);
                    // increment retry count, if retry > 3 remove from queue to unstick user
                    item.retryCount = (item.retryCount || 0) + 1;
                    if (item.retryCount <= 3) {
                        remaining.push(item);
                    } else {
                        console.error('Dropping un-syncable item after 3 retries:', item);
                        syncedCount++; // clear from queue
                    }
                }
            } catch (e) {
                console.error('Queue item sync exception:', e);
                item.retryCount = (item.retryCount || 0) + 1;
                if (item.retryCount <= 3) remaining.push(item);
            }
        }

        await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
        
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
        const queueJson = await AsyncStorage.getItem(QUEUE_KEY);
        if (!queueJson) return 0;
        const queue = JSON.parse(queueJson);
        return queue.length;
    } catch (e) {
        return 0;
    }
};

/**
 * Gets the full list of queued (not-yet-synced) submissions, newest first.
 */
export const getQueueItems = async () => {
    try {
        const queueJson = await AsyncStorage.getItem(QUEUE_KEY);
        if (!queueJson) return [];
        const queue = JSON.parse(queueJson);
        return [...queue].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (e) {
        return [];
    }
};
