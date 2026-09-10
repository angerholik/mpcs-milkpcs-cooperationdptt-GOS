import { createClient } from '@supabase/supabase-js';
import { decode } from 'base64-arraybuffer';
import * as Crypto from 'expo-crypto';

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

    const timeoutPromise = new Promise(res => setTimeout(() => res({ error: { message: 'Storage timeout' } }), 20000));
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

    const timeoutPromise = new Promise(res => setTimeout(() => res({ error: { message: 'Storage timeout' } }), 20000));
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
    const agmYearVal   = params?.agmYear   || params?.agm_year   || '';

    // Always merge audit_done/audit_year/agm_done into whatever activities payload was
    // passed in, rather than an either/or branch — previously, whenever `activities`
    // already looked like a JSON object (e.g. the activity log's own {activityList,
    // isCompleted} shape), this code used it as-is and silently dropped Audit/AGM data
    // entirely, even when the caller explicitly supplied it.
    let baseActivities = {};
    if (typeof activities === 'string' && activities.trim().startsWith('{')) {
      try {
        baseActivities = JSON.parse(activities);
      } catch (e) {
        baseActivities = { user_notes: activities };
      }
    } else {
      baseActivities = { user_notes: activities || '' };
    }
    const activitiesData = JSON.stringify({
      ...baseActivities,
      audit_done: auditDoneVal,
      audit_year: auditYearVal,
      agm_done: agmDoneVal,
      agm_year: agmYearVal
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
      // Exact (case-insensitive) match, not a substring search — `%name%`
      // matched ANY row whose center_name merely contained this one as a
      // substring (e.g. saving "Bermiok" matched the unrelated existing
      // "Bermiok Milk Pcs" row), silently overwriting a different real
      // institution's saved data instead of creating/updating its own row.
      let query = supabase
        .from('milk_pcs_submissions')
        .select('id')
        .ilike('center_name', cleanCenter);
      
      if (cleanMonth) {
        query = query.eq('reporting_month', cleanMonth);
      }

      const { data: existingRows } = await query
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
      // photo_url/pdf_url are only ever supplied by the actual Compile & Seal
      // flow (the upload itself is too expensive to repeat on every routine
      // background sync). Leaving them in `row` as null here would blank out
      // an already-uploaded photo/PDF the moment the inspector saved any
      // unrelated section afterward — so on update, only touch these columns
      // when this call was actually given a real value for them.
      if (!photoUrl) delete updatePayload.photo_url;
      if (!pdfUrl) delete updatePayload.pdf_url;
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
    // App.js's Compile & Seal flow already uploads the captured photo itself
    // (via uploadPhoto()) and passes the resulting URL here as formData.photoUrl
    // — this was previously ignored entirely, and the fallback re-upload below
    // read formData.evidence_image_base64/imageBase64, fields App.js never
    // actually populates, so no MPCS submission ever got a photo_url written
    // into form_data regardless of what the inspector captured.
    let photoUrl = formData.photoUrl || null;
    const socName = formData.societyName || formData.centerName || formData['1.1'] || 'MPCS Society';

    if (!photoUrl && (formData.evidence_image_base64 || formData.imageBase64)) {
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

    const gpuVal = formData.gpu || formData.gpuName || formData.district || '';

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
      is_profit: formData.profitOrLoss || formData.isProfit || formData['5.2'] || null,
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

// ─── Member Registry (persistent per-society roster, not a monthly return) ───
// Aadhaar is never sent to or stored in the database as plaintext — it's
// hashed with SHA-256 on-device first, and only the hash is written.
export async function hashAadhaar(aadhaarNumber) {
  const normalized = (aadhaarNumber || '').replace(/\s+/g, '');
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, normalized);
}

export async function fetchMembers(societyName, societyType) {
  if (!societyName || !societyType) return { data: [], error: null };
  const { data, error } = await supabase
    .from('member_registry')
    .select('id, member_name, mobile_number, ward_name, address, aadhaar_hash, aadhaar_number, flagged, flag_reason, flagged_by, resolved_by, resolved_at, resolution_note, created_at')
    .eq('society_type', societyType)
    .ilike('society_name', societyName.trim())
    .order('created_at', { ascending: false });
  if (error) console.error('[CORE] fetchMembers failed:', error.message);
  return { data: data || [], error };
}

export async function saveMember({ societyName, societyType, memberName, aadhaarNumber, mobileNumber, wardName, address, addedBy }) {
  try {
    const aadhaarHash = await hashAadhaar(aadhaarNumber);
    const { data, error } = await supabase.from('member_registry').insert([{
      society_name: societyName,
      society_type: societyType,
      member_name: memberName,
      aadhaar_hash: aadhaarHash,
      aadhaar_number: aadhaarNumber || null,
      mobile_number: mobileNumber || null,
      ward_name: wardName || null,
      address: address || null,
      added_by: addedBy || null,
    }]).select();
    if (error) console.error('[CORE] saveMember failed:', error.message);
    return { data, error };
  } catch (err) {
    console.error('[CORE] saveMember exception:', err);
    return { data: null, error: err };
  }
}

export async function updateMember(memberId, { memberName, aadhaarNumber, mobileNumber, wardName, address }) {
  try {
    const aadhaarHash = await hashAadhaar(aadhaarNumber);
    const { data, error } = await supabase.from('member_registry').update({
      member_name: memberName,
      aadhaar_hash: aadhaarHash,
      aadhaar_number: aadhaarNumber || null,
      mobile_number: mobileNumber || null,
      ward_name: wardName || null,
      address: address || null,
    }).eq('id', memberId).select();
    if (error) console.error('[CORE] updateMember failed:', error.message);
    return { data, error };
  } catch (err) {
    console.error('[CORE] updateMember exception:', err);
    return { data: null, error: err };
  }
}

// The CI's response to a district-admin flag: clears the flag and records
// who reviewed it and any note, without touching flag_reason/flagged_by —
// admin's original flag stays visible as history alongside the resolution.
export async function resolveMemberFlag(memberId, { resolvedBy, resolutionNote }) {
  const { data, error } = await supabase.from('member_registry').update({
    flagged: false,
    resolved_by: resolvedBy || null,
    resolved_at: new Date().toISOString(),
    resolution_note: (resolutionNote || '').trim() || null,
  }).eq('id', memberId).select();
  if (error) console.error('[CORE] resolveMemberFlag failed:', error.message);
  return { data, error };
}

export async function deleteMember(memberId) {
  const { error } = await supabase.from('member_registry').delete().eq('id', memberId);
  if (error) console.error('[CORE] deleteMember failed:', error.message);
  return { error };
}

// ─── Loan Beneficiaries (per-institution loan disbursement roster) ───────────
// Scoped the same way member_registry is — society_name + society_type — so a
// beneficiary added while the CI has Dentam MPCS open can never land against
// any other institution. Aadhaar is stored raw here, matching member_registry's
// aadhaar_number column (not its hash), per explicit product decision — no
// hashing needed for loan records.
export async function fetchLoanBeneficiaries(societyName, societyType) {
  if (!societyName || !societyType) return { data: [], error: null };
  const { data, error } = await supabase
    .from('loan_beneficiaries')
    .select('id, beneficiary_name, aadhaar_number, amount_taken, amount_paid, amount_remaining, created_at')
    .eq('society_type', societyType)
    .ilike('society_name', societyName.trim())
    .order('created_at', { ascending: false });
  if (error) console.error('[CORE] fetchLoanBeneficiaries failed:', error.message);
  return { data: data || [], error };
}

export async function saveLoanBeneficiary({ societyName, societyType, beneficiaryName, aadhaarNumber, amountTaken, amountPaid, amountRemaining }) {
  try {
    const { data, error } = await supabase.from('loan_beneficiaries').insert([{
      society_name: societyName,
      society_type: societyType,
      beneficiary_name: beneficiaryName,
      aadhaar_number: aadhaarNumber || null,
      amount_taken: amountTaken !== '' && amountTaken != null ? parseFloat(amountTaken) : null,
      amount_paid: amountPaid !== '' && amountPaid != null ? parseFloat(amountPaid) : 0,
      amount_remaining: amountRemaining !== '' && amountRemaining != null ? parseFloat(amountRemaining) : null,
    }]).select();
    if (error) console.error('[CORE] saveLoanBeneficiary failed:', error.message);
    return { data, error };
  } catch (err) {
    console.error('[CORE] saveLoanBeneficiary exception:', err);
    return { data: null, error: err };
  }
}

export async function updateLoanBeneficiary(beneficiaryId, { beneficiaryName, aadhaarNumber, amountTaken, amountPaid, amountRemaining }) {
  try {
    const { data, error } = await supabase.from('loan_beneficiaries').update({
      beneficiary_name: beneficiaryName,
      aadhaar_number: aadhaarNumber || null,
      amount_taken: amountTaken !== '' && amountTaken != null ? parseFloat(amountTaken) : null,
      amount_paid: amountPaid !== '' && amountPaid != null ? parseFloat(amountPaid) : 0,
      amount_remaining: amountRemaining !== '' && amountRemaining != null ? parseFloat(amountRemaining) : null,
      updated_at: new Date().toISOString(),
    }).eq('id', beneficiaryId).select();
    if (error) console.error('[CORE] updateLoanBeneficiary failed:', error.message);
    return { data, error };
  } catch (err) {
    console.error('[CORE] updateLoanBeneficiary exception:', err);
    return { data: null, error: err };
  }
}

export async function deleteLoanBeneficiary(beneficiaryId) {
  const { error } = await supabase.from('loan_beneficiaries').delete().eq('id', beneficiaryId);
  if (error) console.error('[CORE] deleteLoanBeneficiary failed:', error.message);
  return { error };
}

// ─── MPCS Daily Transactions ───────────────────────────────────────────────────
// A continuous running ledger per society — unlike the monthly submission
// tables, this is never reset or scoped to a reporting month; entries just
// accumulate, same as a real physical cash book.
export async function getMpcsDailyTransactions(societyName) {
  const { data, error } = await supabase
    .from('mpcs_daily_transactions')
    .select('*')
    .eq('society_name', societyName)
    .order('transaction_no', { ascending: false });
  if (error) console.error('[CORE] getMpcsDailyTransactions failed:', error.message);
  return { data: data || [], error };
}

export async function saveMpcsDailyTransaction(societyName, { transactionDate, particulars, amount }) {
  try {
    // Transaction No. is assigned here rather than via a DB sequence — this
    // app has no concurrent-editing scenario per institution (one inspector
    // at a time), matching the lightweight approach already used elsewhere.
    const { data: existing, error: fetchError } = await supabase
      .from('mpcs_daily_transactions')
      .select('transaction_no')
      .eq('society_name', societyName)
      .order('transaction_no', { ascending: false })
      .limit(1);
    if (fetchError) {
      console.error('[CORE] saveMpcsDailyTransaction lookup failed:', fetchError.message);
      return { data: null, error: fetchError };
    }
    const nextTransactionNo = (existing?.[0]?.transaction_no || 0) + 1;

    const { data, error } = await supabase.from('mpcs_daily_transactions').insert([{
      society_name: societyName,
      transaction_no: nextTransactionNo,
      transaction_date: transactionDate,
      particulars: particulars || '',
      amount: amount !== '' && amount != null ? parseFloat(amount) : null,
    }]).select();
    if (error) console.error('[CORE] saveMpcsDailyTransaction failed:', error.message);
    return { data, error };
  } catch (err) {
    console.error('[CORE] saveMpcsDailyTransaction exception:', err);
    return { data: null, error: err };
  }
}

export async function deleteMpcsDailyTransaction(transactionId) {
  const { error } = await supabase.from('mpcs_daily_transactions').delete().eq('id', transactionId);
  if (error) console.error('[CORE] deleteMpcsDailyTransaction failed:', error.message);
  return { error };
}

// ─── MPCS CSC Transactions ──────────────────────────────────────────────────────
// Previously kept only as in-memory draft state (cscTransData) that was
// discarded unless the monthly report happened to be compiled & sealed —
// CSC transactions can occur any day, so this is now its own continuous
// running ledger per society, same shape as MPCS Daily Transactions.
export async function getMpcsCscTransactions(societyName) {
  const { data, error } = await supabase
    .from('mpcs_csc_transactions')
    .select('*')
    .eq('society_name', societyName)
    .order('created_at', { ascending: false });
  if (error) console.error('[CORE] getMpcsCscTransactions failed:', error.message);
  return { data: data || [], error };
}

export async function saveMpcsCscTransaction(societyName, { transactionDate, serviceType, count, amount, commission }) {
  try {
    const { data, error } = await supabase.from('mpcs_csc_transactions').insert([{
      society_name: societyName,
      transaction_date: transactionDate,
      service_type: serviceType || '',
      transaction_count: count !== '' && count != null ? parseInt(count) : null,
      amount: amount !== '' && amount != null ? parseFloat(amount) : null,
      commission: commission !== '' && commission != null ? parseFloat(commission) : null,
    }]).select();
    if (error) console.error('[CORE] saveMpcsCscTransaction failed:', error.message);
    return { data, error };
  } catch (err) {
    console.error('[CORE] saveMpcsCscTransaction exception:', err);
    return { data: null, error: err };
  }
}

export async function deleteMpcsCscTransaction(transactionId) {
  const { error } = await supabase.from('mpcs_csc_transactions').delete().eq('id', transactionId);
  if (error) console.error('[CORE] deleteMpcsCscTransaction failed:', error.message);
  return { error };
}
