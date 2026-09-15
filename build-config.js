const fs = require('fs');

// Fungsi untuk menyamarkan kunci agar tidak bocor di log tapi bisa kita cek keberadaannya
const mask = (str) => {
    if (!str) return 'KOSONG/TIDAK ADA';
    return str.substring(0, 5) + '... (tersedia)';
};

const config = {
    SUPABASE_URL: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
    EDITOR_PASSWORD: process.env.EDITOR_PASSWORD || ''
};

console.log('--- Vercel Build Debug ---');
console.log('SUPABASE_URL:', mask(config.SUPABASE_URL));
console.log('SUPABASE_ANON_KEY:', mask(config.SUPABASE_ANON_KEY));
console.log('--------------------------');

const content = `
console.log('🚀 ENV Configuration loading...');
var SUPABASE_URL = ${JSON.stringify(config.SUPABASE_URL)};
var SUPABASE_ANON_KEY = ${JSON.stringify(config.SUPABASE_ANON_KEY)};
var EDITOR_PASSWORD = ${JSON.stringify(config.EDITOR_PASSWORD)};

if (typeof supabase !== 'undefined' && SUPABASE_URL && SUPABASE_ANON_KEY) {
    window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase Client initialized! URL:', SUPABASE_URL.substring(0, 10) + '...');
} else {
    console.error('❌ Failed to initialize Supabase! Variabel mungkin kosong di Vercel.', { 
        urlLength: SUPABASE_URL.length,
        keyLength: SUPABASE_ANON_KEY.length
    });
}
window.EDITOR_PASSWORD = EDITOR_PASSWORD;
`;

fs.writeFileSync('supabase-config.js', content);
// Hapus file cadangan agar tidak bentrok
if (fs.existsSync('env-config.js')) fs.unlinkSync('env-config.js');

console.log('✅ supabase-config.js generated.');
