const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
(async () => {
  const { data, error } = await supabase.from('milk_pcs_submissions').select('id, center_name, reporting_month, litres, withdrawal, balance, created_at, updated_at').order('created_at', { ascending: false }).limit(10);
  console.log(data);
})();
