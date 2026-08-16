import { saveMilkPcsSubmission } from './src/supabase.js';

async function run() {
  const { data, error } = await saveMilkPcsSubmission({
    centerName: 'Test from Node',
    centerId: 'Test from Node',
    reportingMonth: 'AUG 2024',
    district: 'Dentam',
    activities: 'Test activity string'
  });
  console.log('Data:', data);
  console.log('Error:', error);
}

run();
