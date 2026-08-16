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
    const uploadPromise = supabase.storage
      .from('milk-pcs-photos')
      .upload(fileName, decode(base64Data), {
        contentType: 'image/jpeg',
        upsert: false,
      });

    const timeoutPromise = new Promise(res => setTimeout(() => res({ error: { message: 'Storage timeout' } }), 2000));
    const { error } = await Promise.race([uploadPromise, timeoutPromise]);

    if (error) {
      console.warn('Photo upload warning:', error.message);
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
    const uploadPromise = supabase.storage
      .from('milk-pcs-photos')
      .upload(fileName, decode(base64Data), {
        contentType: 'image/jpeg',
        upsert: false,
      });

    const timeoutPromise = new Promise(res => setTimeout(() => res({ error: { message: 'Storage timeout' } }), 2000));
    const { error } = await Promise.race([uploadPromise, timeoutPromise]);

    if (error) {
      console.warn('Evidence upload warning:', error.message);
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
export async function saveMilkPcsSubmission(params) {
  try {
    const {
      centerName, centerId, registrationNumber, presidentName, presidentMobile, managerName, managerMobile, reportingMonth, reportedBy,
      litres, withdrawal, balance, district,
      mSc, fSc, mSt, fSt, mObc, fObc, mGen, fGen,
      totalMale, totalFemale, totalMembers,
      hasLoan, loanName, loanAmount, paidAmount, remainingDue,
      activities, gpsLat, gpsLng, capturedAt, photoUrl, pdfUrl
    } = params || {};

    let validTimestamp = new Date().toISOString();
    if (capturedAt) {
      const d = new Date(capturedAt);
      if (!isNaN(d.getTime())) {
        validTimestamp = d.toISOString();
      }
    }

    const auditDoneVal = params?.auditDone || params?.audit_done || '';
    const auditYearVal = params?.auditYear || params?.audit_year || '';
    const agmDoneVal   = params?.agmDone   || params?.agm_done   || '';

    const activitiesData = typeof activities === 'string' && activities.startsWith('{') 
      ? activities 
      : JSON.stringify({
          audit_done: auditDoneVal,
          audit_year: auditYearVal,
          agm_done: agmDoneVal,
          user_notes: activities || ''
        });

    const row = {
      center_name: centerName || 'Cooperative Collection Center',
      center_id: centerId || centerName || 'CCC-01',
      registration_number: registrationNumber || null,
      president_name: presidentName || null,
      president_mobile: presidentMobile || null,
      manager_name: managerName || null,
      manager_mobile: managerMobile || null,
      reporting_month: reportingMonth || new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' }),
      reported_by: reportedBy || 'Cooperative Inspector',
      district: district || 'Sikkim',
      litres: parseFloat(litres) || 0,
      withdrawal: parseFloat(withdrawal) || 0,
      balance: parseFloat(balance) || 0,
      m_sc: parseInt(mSc) || 0, f_sc: parseInt(fSc) || 0,
      m_st: parseInt(mSt) || 0, f_st: parseInt(fSt) || 0,
      m_obc: parseInt(mObc) || 0, f_obc: parseInt(fObc) || 0,
      m_gen: parseInt(mGen) || 0, f_gen: parseInt(fGen) || 0,
      total_male: parseInt(totalMale) || 0,
      total_female: parseInt(totalFemale) || 0,
      total_members: parseInt(totalMembers) || 0,
      has_loan: !!hasLoan,
      loan_name: loanName || null,
      loan_amount: parseFloat(loanAmount) || null,
      paid_amount: parseFloat(paidAmount) || null,
      remaining_due: parseFloat(remainingDue) || null,
      activities: activitiesData,
      gps_lat: gpsLat || null, 
      gps_lng: gpsLng || null,
      captured_at: validTimestamp,
      photo_url: photoUrl || null,
      pdf_url: pdfUrl || null,
    };

    // Check if an existing submission exists for this center & reporting month
    const cleanCenter = (row.center_name || '').trim();
    const cleanMonth = (row.reporting_month || '').trim();

    let existingId = null;
    if (cleanCenter && cleanCenter !== 'Cooperative Collection Center') {
      const { data: existingRows } = await supabase
        .from('milk_pcs_submissions')
        .select('id')
        .ilike('center_name', `%${cleanCenter}%`)
        .order('created_at', { ascending: false })
        .limit(1);

      if (existingRows && existingRows.length > 0) {
        existingId = existingRows[0].id;
      }
    }

    let data, error;
    if (existingId) {
      console.log('[CORE] Updating existing Milk PCS submission record with REVISED marker:', existingId);
      const updatePayload = {
        ...row,
        activities: JSON.stringify({
          ...(typeof activitiesData === 'string' && activitiesData.startsWith('{') ? JSON.parse(activitiesData) : (typeof activitiesData === 'object' ? activitiesData : { raw: activitiesData })),
          is_updated: true,
          updated_at: new Date().toISOString()
        })
      };
      const res = await supabase.from('milk_pcs_submissions').update(updatePayload).eq('id', existingId).select();
      data = res.data;
      error = res.error;
    } else {
      console.log('[CORE] Inserting new Milk PCS submission record for:', cleanCenter);
      const res = await supabase.from('milk_pcs_submissions').insert([row]).select();
      data = res.data;
      error = res.error;
    }

    if (error) {
      console.error('[CORE] Milk PCS submission failed:', error.code, error.message, error.hint);
    } else {
      console.log('[CORE] Milk PCS submission updated/inserted successfully to admin:', data?.[0]?.id);
    }
    return { data, error };
  } catch (err) {
    console.error('[CORE] saveMilkPcsSubmission exception:', err);
    return { data: null, error: err };
  }
}

// ─── Save MPCS submission ─────────────────────────────────────────────────────
export async function saveMpcsSubmission(formData) {
  try {
    let photoUrl = null;
    const socName = formData.societyName || formData.centerName || formData['1.1'] || 'MPCS Society';

    if (formData.evidence_image_base64 || formData.imageBase64) {
      try {
        photoUrl = await uploadEvidence(formData.evidence_image_base64 || formData.imageBase64, socName);
      } catch (e) {
        console.warn('Evidence upload failed:', e);
      }
    }

    const updatedFormData = {
      ...formData,
      ...(photoUrl ? { evidence_photo_url: photoUrl } : {}),
      '1.6': formData.regDate || formData.reg_date || formData['1.6'] || '',
      '1.8': formData.panCard || formData.pan_card || formData['1.8'] || '',
      regDate: formData.regDate || formData.reg_date || formData['1.6'] || '',
      panCard: formData.panCard || formData.pan_card || formData['1.8'] || ''
    };

    const totalMem = formData.totalMembers ? parseInt(formData.totalMembers) : ['3.1','3.2','3.3','3.4','3.5','3.6','3.7','3.8']
      .reduce((s, id) => s + (parseInt(formData[id]) || 0), 0);

    const gpuVal = formData.gpu || formData.gpuName || formData.district || 'Dentam GPU';

    const row = {
      society_name: socName,
      registration_number: formData.registrationNumber || formData['1.5'] || 'N/A',
      registration_authority: formData.registrationAuthority || formData['1.4'] || 'Department of Cooperation',
      president_name: formData.presidentName || formData['2.1'] || null,
      president_mobile: formData.presidentMobile || null,
      manager_mobile: formData.managerMobile || formData.secretaryMobile || formData['2.4'] || null,
      audit_done: formData.auditDone || formData['4.1'] || null,
      audit_year: formData.auditYear || formData['4.2'] || null,
      audit_category: formData.auditCategory || formData['4.3'] || null,
      annual_turnover: parseFloat(formData.annualTurnover || formData.withdrawal || formData['5.1']) || null,
      is_profit: formData.profitOrLoss || formData.isProfit || formData['5.2'] || 'PROFIT',
      net_profit_loss: formData.profitOrLoss === 'NO_PROFIT_NO_LOSS' ? null : (parseFloat(formData.netProfit || formData.netProfitLoss || formData.balance || formData['5.3']) || null),
      bank_balance: parseFloat(formData.balance || formData.bankBalance || formData['7.5']) || null,
      bank_name: formData.bankName || formData['7.2'] || 'N/A',
      has_loan: formData.hasLoan === true || formData['8.0'] === 'Yes',
      total_members: totalMem || 0,
      form_data: {
        ...updatedFormData,
        gpu: gpuVal,
        gpu_name: gpuVal,
        district: gpuVal,
      },
    };

    // Check if an existing submission exists for this society
    const cleanSociety = (row.society_name || '').trim();
    const cleanRegNo = (row.registration_number || '').trim();
    let existingId = null;

    if (cleanRegNo && cleanRegNo !== 'N/A' && cleanRegNo.length > 3) {
      const { data: existingRows } = await supabase
        .from('mpcs_submissions')
        .select('id')
        .eq('registration_number', cleanRegNo)
        .order('created_at', { ascending: false })
        .limit(1);

      if (existingRows && existingRows.length > 0) {
        existingId = existingRows[0].id;
      }
    }

    if (!existingId && cleanSociety && cleanSociety !== 'MPCS Society') {
      const { data: existingRows } = await supabase
        .from('mpcs_submissions')
        .select('id')
        .ilike('society_name', cleanSociety)
        .order('created_at', { ascending: false })
        .limit(1);

      if (existingRows && existingRows.length > 0) {
        existingId = existingRows[0].id;
      }
    }

    let data, error;
    if (existingId) {
      console.log('[CORE] Updating existing MPCS submission record with REVISED marker:', existingId);
      const updatePayload = {
        ...row,
        form_data: {
          ...updatedFormData,
          is_updated: true,
          updated_at: new Date().toISOString()
        }
      };
      const res = await supabase.from('mpcs_submissions').update(updatePayload).eq('id', existingId).select();
      data = res.data;
      error = res.error;
    } else {
      console.log('[CORE] Inserting new MPCS submission record for:', cleanSociety);
      const res = await supabase.from('mpcs_submissions').insert([row]).select();
      data = res.data;
      error = res.error;
    }

    if (error) {
      console.error('[CORE] MPCS submission failed:', error.code, error.message, error.hint);
    } else {
      console.log('[CORE] MPCS submission updated/inserted successfully to admin:', data?.[0]?.id);
    }
    return { data, error };
  } catch (err) {
    console.error('[CORE] saveMpcsSubmission exception:', err);
    return { data: null, error: err };
  }
}
