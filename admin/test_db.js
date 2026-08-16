import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envFile = fs.readFileSync('.env', 'utf-8');
const envVars = {};
envFile.split('\n').forEach(line => {
  if (line && line.includes('=')) {
    const [key, ...val] = line.split('=');
    envVars[key.trim()] = val.join('=').trim().replace(/['"]/g, '');
  }
});

const supabaseUrl = envVars['VITE_SUPABASE_URL'];
const supabaseKey = envVars['VITE_SUPABASE_ANON_KEY'];
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from('mpcs_submissions').select('created_at, society_name, form_data').order('created_at', { ascending: false }).limit(5);
  if (error) {
    console.error(error);
  } else {
    data.forEach((d, i) => {
      console.log(`--- Record ${i} ---`);
      console.log('Created At:', d.created_at);
      console.log('Center:', d.society_name);
      console.log('Biz Perf Present?', d.form_data.businessPerformanceData !== undefined);
      console.log('Total Income:', d.form_data.totalIncome);
    });
  }
}
test();
