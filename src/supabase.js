import { createClient } from '@supabase/supabase-js';
import { decode } from 'base64-arraybuffer';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── Upload photo to Supabase Storage ────────────────────────────────────────
export async function uploadPhoto(base64Data) {
  if (!base64Data) return null;
  try {
    const fileName = `milk-pcs/${Date.now()}.jpg`;
    const { error } = await supabase.storage
      .from('milk-pcs-photos')
      .upload(fileName, decode(base64Data), {
        contentType: 'image/jpeg',
        upsert: false,
      });
    if (error) {
      console.warn('Photo upload error:', error.message);
      return null;
    }
    const { data: { publicUrl } } = supabase.storage
      .from('milk-pcs-photos')
      .getPublicUrl(fileName);
    return publicUrl;
  } catch (e) {
    console.warn('Photo upload exception:', e);
    return null;
  }
}

// ─── Upload multiple evidence photos ──────────────────────────────────────────
export async function uploadEvidence(base64Data, societyName = 'general') {
  if (!base64Data) return null;
  try {
    const cleanName = societyName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const fileName = `evidence-vault/${cleanName}/${Date.now()}.jpg`;
    const { error } = await supabase.storage
      .from('milk-pcs-photos')
      .upload(fileName, decode(base64Data), {
        contentType: 'image/jpeg',
        upsert: false,
      });
    if (error) {
      console.warn('Evidence upload error:', error.message);
      return null;
    }
    const { data: { publicUrl } } = supabase.storage
      .from('milk-pcs-photos')
      .getPublicUrl(fileName);
    return publicUrl;
  } catch (e) {
    console.warn('Evidence upload exception:', e);
    return null;
  }
}

// ─── Save Milk PCS submission ─────────────────────────────────────────────────
export async function saveMilkPcsSubmission({
  centerName, centerId, reportingMonth, reportedBy,
  litres, withdrawal, balance,
  mSc, fSc, mSt, fSt, mObc, fObc, mGen, fGen,
  totalMale, totalFemale, totalMembers,
  hasLoan, loanName, loanAmount, paidAmount, remainingDue,
  activities, gpsLat, gpsLng, capturedAt, photoUrl, pdfUrl, district
}) {
  const { data, error } = await supabase
    .from('milk_pcs_submissions')
    .insert([{
      center_name: centerName,
      center_id: centerId,
      reporting_month: reportingMonth,
      reported_by: reportedBy,
      litres: parseFloat(litres) || null,
      withdrawal: parseFloat(withdrawal) || null,
      balance: parseFloat(balance) || null,
      m_sc: parseInt(mSc) || 0, f_sc: parseInt(fSc) || 0,
      m_st: parseInt(mSt) || 0, f_st: parseInt(fSt) || 0,
      m_obc: parseInt(mObc) || 0, f_obc: parseInt(fObc) || 0,
      m_gen: parseInt(mGen) || 0, f_gen: parseInt(fGen) || 0,
      total_male: parseInt(totalMale) || 0,
      total_female: parseInt(totalFemale) || 0,
      total_members: parseInt(totalMembers) || 0,
      has_loan: hasLoan,
      loan_name: loanName,
      loan_amount: parseFloat(loanAmount) || null,
      paid_amount: parseFloat(paidAmount) || null,
      remaining_due: parseFloat(remainingDue) || null,
      activities,
      gps_lat: gpsLat, gps_lng: gpsLng,
      captured_at: capturedAt,
      photo_url: photoUrl || null,
      pdf_url: pdfUrl || null,
      district: district || null,
    }]);
  return { data, error };
}

// ─── Save MPCS submission ─────────────────────────────────────────────────────
export async function saveMpcsSubmission(formData) {
  const totalMembers = ['3.1','3.2','3.3','3.4','3.5','3.6','3.7','3.8']
    .reduce((s, id) => s + (parseInt(formData[id]) || 0), 0);

  const { data, error } = await supabase
    .from('mpcs_submissions')
    .insert([{
      society_name: formData['1.1'] || null,
      registration_number: formData['1.5'] || null,
      registration_authority: formData['1.4'] || null,
      president_name: formData['2.1'] || null,
      president_mobile: formData['2.3'] || null,
      manager_mobile: formData['2.4'] || null,
      audit_done: formData['4.1'] || null,
      audit_year: formData['4.2'] || null,
      audit_category: formData['4.3'] || null,
      annual_turnover: parseFloat(formData['5.1']) || null,
      is_profit: formData['5.2'] || null,
      net_profit_loss: parseFloat(formData['5.3']) || null,
      bank_balance: parseFloat(formData['7.5']) || null,
      bank_name: formData['7.2'] || null,
      has_loan: formData['8.0'] === 'Yes',
      total_members: totalMembers || 0,
      form_data: formData,
    }]);
  return { data, error };
}
