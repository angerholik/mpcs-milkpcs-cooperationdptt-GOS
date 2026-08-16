const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://elwuvjmtawinbcudkeez.supabase.co',
  'sb_publishable_Hp-BaZJxVi4RWizr0Ul2Ew_Llg7mlYe'
);
async function run() {
  const { data, error } = await supabase.from('milk_pcs_submissions').select('*').limit(3).order('created_at', { ascending: false });
  console.log("Error:", error);
  console.log("Data:", JSON.stringify(data, null, 2));
}
run();
