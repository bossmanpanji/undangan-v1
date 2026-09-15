
console.log('🚀 ENV Configuration loading...');
var SUPABASE_URL = "";
var SUPABASE_ANON_KEY = "";
var EDITOR_PASSWORD = "";

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
