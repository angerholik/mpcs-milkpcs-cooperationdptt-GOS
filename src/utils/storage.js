import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const STORAGE_KEYS = {
  MILK_PCS_PROFILES: '@milk_pcs_profiles_map', // Store multiple centers: { name: profileData }
  MPCS_PROFILE: '@mpcs_profile',
  MILK_CENTERS: '@milk_centers',
  MPCS_SOCIETIES: '@mpcs_societies',
  MPCS_SOCIETY_PROFILES: '@mpcs_society_profiles_map',
};

// ─── INTERNAL HELPER (Secure Migration) ──────────────────────────────────────
const setItemSecure = async (key, val) => {
  try {
    await SecureStore.setItemAsync(key, val);
  } catch (e) {
    // Falls back to AsyncStorage if SecureStore fails (e.g. storage limits)
    await AsyncStorage.setItem(key, val);
  }
};

const getItemSecure = async (key) => {
  try {
    let val = await SecureStore.getItemAsync(key);
    // Migration: If not in SecureStore but exists in AsyncStorage, move it.
    if (!val) {
      val = await AsyncStorage.getItem(key);
      if (val) {
        await setItemSecure(key, val);
        await AsyncStorage.removeItem(key);
      }
    }
    return val;
  } catch (e) {
    return await AsyncStorage.getItem(key);
  }
};

// ─── MILK PCS STORAGE ────────────────────────────────────────────────────────

export const saveMilkPcsProfile = async (centerName, data) => {
  if (!centerName) return;
  try {
    const existingProfilesJson = await getItemSecure(STORAGE_KEYS.MILK_PCS_PROFILES);
    const profiles = existingProfilesJson ? JSON.parse(existingProfilesJson) : {};
    
    profiles[centerName] = {
      centerName: data.centerName,
      centerId: data.centerId,
      district: data.district,
      reportedBy: data.reportedBy,
      mSc: data.mSc,
      fSc: data.fSc,
      mSt: data.mSt,
      fSt: data.fSt,
      mObc: data.mObc,
      fObc: data.fObc,
      mGen: data.mGen,
      fGen: data.fGen,
      hasLoan: data.hasLoan,
      loanName: data.loanName,
      loanAmount: data.loanAmount,
    };
    
    await setItemSecure(STORAGE_KEYS.MILK_PCS_PROFILES, JSON.stringify(profiles));
  } catch (e) {
    console.error('Error saving Milk PCS profile mapping:', e);
  }
};

export const loadMilkPcsProfileByName = async (centerName) => {
  if (!centerName) return null;
  try {
    const jsonValue = await getItemSecure(STORAGE_KEYS.MILK_PCS_PROFILES);
    const profiles = jsonValue != null ? JSON.parse(jsonValue) : {};
    return profiles[centerName] || null;
  } catch (e) {
    console.error('Error loading Milk PCS profile by name:', e);
    return null;
  }
};

export const loadMilkCenters = async () => {
  try {
    const jsonValue = await getItemSecure(STORAGE_KEYS.MILK_CENTERS);
    if (jsonValue == null) return [];
    const centers = JSON.parse(jsonValue);
    // Migration: ensure all centers are objects { name, district }
    return centers.map(c => typeof c === 'string' ? { name: c, district: null } : c);
  } catch (e) {
    console.error('Error loading milk centers:', e);
    return [];
  }
};

export const addMilkCenter = async (name, district) => {
  if (!name || name.trim() === '') return;
  try {
    const centers = await loadMilkCenters();
    const cleanName = name.trim();
    // Check if center already exists
    const exists = centers.some(c => c.name.toLowerCase() === cleanName.toLowerCase());
    
    if (!exists) {
      const updated = [...centers, { name: cleanName, district: district || null }].sort((a, b) => a.name.localeCompare(b.name));
      await setItemSecure(STORAGE_KEYS.MILK_CENTERS, JSON.stringify(updated));
      return updated;
    } else if (district) {
      // Update district if it was previously null
      let changed = false;
      const updated = centers.map(c => {
        if (c.name.toLowerCase() === cleanName.toLowerCase() && !c.district) {
          changed = true;
          return { ...c, district };
        }
        return c;
      });
      if (changed) {
        await setItemSecure(STORAGE_KEYS.MILK_CENTERS, JSON.stringify(updated));
        return updated;
      }
    }
    return centers;
  } catch (e) {
    console.error('Error saving milk center:', e);
  }
};

// ─── MPCS STORAGE ───────────────────────────────────────────────────────────

export const saveMpcsProfile = async (formData) => {
  try {
    const staticIds = [
      '1.1', '1.4', '1.5', '1.6', '1.8',
      '2.1', '2.2', '2.3', '2.4',
      '3.1', '3.2', '3.3', '3.4', '3.5', '3.6', '3.7', '3.8',
      '7.1', '7.2', '7.3', '7.4',
      '8.0', '9.1', '9.2', '9.3', '9.4', '9.5', '9.6', '9.7'
    ];
    const profile = {};
    staticIds.forEach(id => {
      if (formData[id]) profile[id] = formData[id];
    });
    await setItemSecure(STORAGE_KEYS.MPCS_PROFILE, JSON.stringify(profile));
  } catch (e) {
    console.error('Error saving MPCS profile:', e);
  }
};

export const loadMpcsProfile = async () => {
  try {
    const jsonValue = await getItemSecure(STORAGE_KEYS.MPCS_PROFILE);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (e) {
    console.error('Error loading MPCS profile:', e);
    return null;
  }
};

export const loadMpcsSocieties = async () => {
  try {
    const jsonValue = await getItemSecure(STORAGE_KEYS.MPCS_SOCIETIES);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error('Error loading MPCS societies:', e);
    return [];
  }
};

export const saveMpcsSocietyProfile = async (societyName, data) => {
  if (!societyName) return;
  try {
    const existingProfilesJson = await getItemSecure(STORAGE_KEYS.MPCS_SOCIETY_PROFILES);
    const profiles = existingProfilesJson ? JSON.parse(existingProfilesJson) : {};
    
    // Pick relevant profile fields
    const staticIds = [
        '1.1', '1.4', '1.5', '1.6', '1.8',
        '2.1', '2.2', '2.3', '2.4',
        '3.1', '3.2', '3.3', '3.4', '3.5', '3.6', '3.7', '3.8',
        '7.1', '7.2', '7.3', '7.4',
        '8.0', '8.1', '8.2', '8.3', '8.4', '8.5', '8.6',
        '9.1', '9.2', '9.3', '9.4', '9.5', '9.6', '9.7'
    ];
    
    const profile = {};
    staticIds.forEach(id => {
      if (data[id]) profile[id] = data[id];
    });
    
    profiles[societyName] = profile;
    await setItemSecure(STORAGE_KEYS.MPCS_SOCIETY_PROFILES, JSON.stringify(profiles));
  } catch (e) {
    console.error('Error saving MPCS society profile:', e);
  }
};

export const loadMpcsSocietyProfileByName = async (societyName) => {
  if (!societyName) return null;
  try {
    const jsonValue = await getItemSecure(STORAGE_KEYS.MPCS_SOCIETY_PROFILES);
    const profiles = jsonValue != null ? JSON.parse(jsonValue) : {};
    return profiles[societyName] || null;
  } catch (e) {
    console.error('Error loading MPCS society profile by name:', e);
    return null;
  }
};

export const addMpcsSociety = async (name) => {
  if (!name || name.trim() === '') return;
  try {
    const societies = await loadMpcsSocieties();
    if (!societies.includes(name)) {
      const updated = [...societies, name].sort();
      await setItemSecure(STORAGE_KEYS.MPCS_SOCIETIES, JSON.stringify(updated));
      return updated;
    }
    return societies;
  } catch (e) {
    console.error('Error saving MPCS society:', e);
  }
};
