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
  const { data, error } = await supabase.from('mpcs_submissions').select('form_data').order('created_at', { ascending: false }).limit(1);
  if (error) {
    console.error(error);
  } else {
    const fd = data[0].form_data;
    console.log('Has businessPerformanceData?', Object.hasOwn(fd, 'businessPerformanceData'));
    console.log('Has totalIncome?', Object.hasOwn(fd, 'totalIncome'));
    if (Object.hasOwn(fd, 'totalIncome')) console.log('totalIncome value:', fd.totalIncome);
  }
}
test();
