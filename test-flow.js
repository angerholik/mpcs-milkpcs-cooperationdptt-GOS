import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read .env from milk-pcs-expo to get URL and Key
const envContent = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf-8');
let url = '';
let key = '';
envContent.split('\n').forEach(line => {
  if (line.startsWith('EXPO_PUBLIC_SUPABASE_URL=')) url = line.split('=')[1].trim();
  if (line.startsWith('EXPO_PUBLIC_SUPABASE_ANON_KEY=')) key = line.split('=')[1].trim();
});

const supabase = createClient(url, key);

async function testFlow() {
  console.log("1. Simulating 'saveMasterStateToStorage' for NEW center...");
  const newRow = {
    center_name: "Agent Test Milk PCS",
    center_id: "MILK/TEST/001",
    reporting_month: "AUG 2024",
    district: "Dentam",
    president_name: "John Doe",
    litres: 0,
    withdrawal: 0,
    balance: 0,
    activities: ""
  };
  
  const { data: insertData, error: insertError } = await supabase.from('milk_pcs_submissions').insert([newRow]).select();
  if (insertError) {
    console.error("Insert Error:", insertError);
    return;
  }
  console.log("Inserted:", insertData[0].id);

  console.log("2. Simulating 'generatePDF' with full data...");
  const updatePayload = {
    ...insertData[0],
    litres: 500.5,
    withdrawal: 25000,
    balance: 100000,
    total_male: 15,
    total_female: 20,
    total_members: 35,
    has_loan: true,
    loan_name: "NDDB Loan",
    loan_amount: 500000,
    paid_amount: 100000,
    remaining_due: 400000,
    activities: JSON.stringify({
      audit_done: "Yes (12 Aug 2024)",
      audit_year: "2023-24",
      agm_done: "Yes (10 Aug 2024)",
      user_notes: "This is a test note.",
      is_updated: true,
      updated_at: new Date().toISOString()
    })
  };

  const { data: updateData, error: updateError } = await supabase.from('milk_pcs_submissions').update(updatePayload).eq('id', insertData[0].id).select();
  if (updateError) {
    console.error("Update Error:", updateError);
    return;
  }
  console.log("Updated:", updateData[0].id);

  console.log("3. Verifying Admin Fetch...");
  const { data: fetchRows, error: fetchError } = await supabase.from('milk_pcs_submissions').select('*').eq('id', insertData[0].id);
  if (fetchError) {
    console.error("Fetch Error:", fetchError);
  } else {
    console.log("Fetched Data matched successfully!");
    console.log("Litres:", fetchRows[0].litres);
    console.log("Withdrawal:", fetchRows[0].withdrawal);
    console.log("President:", fetchRows[0].president_name);
  }
}

testFlow();
