import AsyncStorage from '@react-native-async-storage/async-storage';

const MONTHLY_PARAMS_PREFIX = '@mpcs_monthly_params_';
const VISIT_RECORDS_PREFIX = '@mpcs_visit_records_';

/**
 * Returns a storage key based on society name and reporting month.
 */
function getMonthlyKey(societyName, reportingMonth) {
  const s = (societyName || 'default').toLowerCase().replace(/[^a-z0-9]/g, '_');
  const m = (reportingMonth || 'current').toLowerCase().replace(/[^a-z0-9]/g, '_');
  return `${MONTHLY_PARAMS_PREFIX}${s}_${m}`;
}

/**
 * Save submitted monthly parameters for a society and reporting month.
 */
export async function saveMonthlyParams(societyName, reportingMonth, paramsData) {
  try {
    const key = getMonthlyKey(societyName, reportingMonth);
    const data = {
      societyName,
      reportingMonth,
      paramsData,
      submittedAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (e) {
    console.warn('Failed to save monthly params:', e);
    return false;
  }
}

/**
 * Get submitted monthly parameters for a society and reporting month.
 */
export async function getMonthlyParams(societyName, reportingMonth) {
  try {
    const key = getMonthlyKey(societyName, reportingMonth);
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load monthly params:', e);
    return null;
  }
}

/**
 * Check whether monthly parameters have been completed for a given society & reporting month.
 */
export async function isMonthlyParamsCompleted(societyName, reportingMonth) {
  const data = await getMonthlyParams(societyName, reportingMonth);
  return !!data;
}

/**
 * Save an individual visit record under a society & month.
 */
export async function saveVisitRecord(societyName, reportingMonth, visitData) {
  try {
    const key = `${VISIT_RECORDS_PREFIX}${(societyName || 'default').toLowerCase()}_${(reportingMonth || 'current').toLowerCase()}`;
    const existingRaw = await AsyncStorage.getItem(key);
    const existing = existingRaw ? JSON.parse(existingRaw) : [];
    const updated = [visitData, ...existing];
    await AsyncStorage.setItem(key, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.warn('Failed to save visit record:', e);
    return [];
  }
}

const SECTION_STATES_PREFIX = '@mpcs_section_states_';

export async function saveSectionStates(societyName, reportingMonth, sectionStates) {
  try {
    const key = `${SECTION_STATES_PREFIX}${(societyName || 'default').toLowerCase()}_${(reportingMonth || 'current').toLowerCase()}`;
    await AsyncStorage.setItem(key, JSON.stringify(sectionStates));
    return true;
  } catch (e) {
    console.warn('Failed to save section states:', e);
    return false;
  }
}

export async function getSectionStates(societyName, reportingMonth) {
  try {
    const key = `${SECTION_STATES_PREFIX}${(societyName || 'default').toLowerCase()}_${(reportingMonth || 'current').toLowerCase()}`;
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load section states:', e);
    return null;
  }
}
