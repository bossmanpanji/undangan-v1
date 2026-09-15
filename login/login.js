document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const btnSubmit = document.getElementById('btn-submit');

    // --- 0. FORCE APP SUBDOMAIN ---
    let hostname = window.location.hostname;
    if (hostname.startsWith('www.')) hostname = hostname.replace('www.', '');
    
    const isHostingPlatform = hostname === 'localhost' || 
                              hostname === '127.0.0.1' || 
                              hostname.includes('run.app') || 
                              hostname.includes('webcontainer') || 
                              hostname.includes('aistudio') || 
                              hostname.includes('google') || 
                              hostname.includes('vercel.app') || 
                              hostname.includes('pages.dev') || 
                              hostname.includes('netlify.app');

    if (!isHostingPlatform && !hostname.startsWith('app.')) {
        window.location.href = `https://app.${hostname}${window.location.pathname}${window.location.search}`;
        return;
    }

    // --- 0.5 DINAMISKAN TOMBOL KEMBALI ---
    const btnBackHome = document.getElementById('btn-back-home');
    if (btnBackHome) {
        let root = hostname.replace('app.', '');
        btnBackHome.href = (isHostingPlatform || root === 'localhost' || root === '127.0.0.1') ? '/' : `https://${root}`;
    }

    const safeRedirect = (path) => {
        // Karena kita sudah pasti di app. subdomain berkat pengecekan di atas
        window.location.href = path;
    };

    // --- CHECK ACTIVE SESSION ON LOAD ---
    const checkActiveSession = async () => {
        if (!window.supabaseClient) return; 
        try {
            const { data: { session } } = await window.supabaseClient.auth.getSession();
            if (session) {
                // Verifikasi ke server jika akun admin masih ada
                const { data: { user }, error } = await window.supabaseClient.auth.getUser();
                if (user && !error) {
                    safeRedirect('/admin/');
                } else {
                    console.warn("Sesi admin ditemukan tapi pengguna tidak valid (dihapus/tidak aktif):", error);
                    await window.supabaseClient.auth.signOut();
                    checkClientSession();
                }
            } else {
                checkClientSession();
            }
        } catch (err) {
            console.error("Gagal memeriksa sesi aktif:", err);
            checkClientSession();
        }
    };

    const checkClientSession = () => {
        const clientSlug = localStorage.getItem('editorSlug');
        const clientPass = localStorage.getItem('editorPassword');
        if (clientSlug && clientPass) {
            safeRedirect('/editor/');
        }
    };

    checkActiveSession();

    const showToast = (message, type = 'success', customTitle = '') => {
        const container = document.getElementById('notification-container');
        if (!container) return;

        // Bersihkan prefix legasi jika ada
        const cleanMessage = message.replace(/^(Gagal:|Akses Ditolak:)\s*/i, '');

        // Tentukan judul berdasarkan tipe jika tidak ada judul kustom
        let title = customTitle;
        if (!title) {
            if (type === 'success') {
                title = 'Akses Diterima';
            } else if (type === 'error') {
                title = 'Autentikasi Gagal';
            } else {
                title = 'Informasi';
            }
        }

        // Pilih ikon FontAwesome yang sesuai
        let icon = 'fa-info-circle';
        if (type === 'success') {
            icon = 'fa-check-circle';
        } else if (type === 'error') {
            icon = 'fa-exclamation-circle';
        }

        const toast = document.createElement('div');
        toast.className = `toast-notification ${type}`;
        toast.innerHTML = `
            <div class="toast-icon">
                <i class="fas ${icon}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${cleanMessage}</div>
            </div>
        `;

        container.appendChild(toast);

        // Triger transisi masuk
        setTimeout(() => toast.classList.add('show'), 100);

        // Hapus otomatis setelah 4 detik
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 500);
        }, 4000);
    };

    // --- BRANDING LOGIC ---
    async function initBranding() {
        if (!window.supabaseClient) return;
        try {
            const cachedBrand = localStorage.getItem('bizBrandName');
            if (cachedBrand) {
                document.querySelectorAll('.logo').forEach(el => el.innerText = cachedBrand);
                document.title = "Login Panel | " + cachedBrand;
            }

            const { data } = await window.supabaseClient
                .from('admin_settings')
                .select('value')
                .eq('key', 'business_name')
                .maybeSingle();

            if (data && data.value) {
                const name = data.value.toUpperCase();
                localStorage.setItem('bizBrandName', name);
                document.querySelectorAll('.logo').forEach(el => el.innerText = name);
                document.title = "Login Panel | " + data.value;
            }
        } catch (err) {
            console.error('Error fetching brand:', err);
        }
    }
    initBranding();

    loginForm.onsubmit = async (e) => {
        e.preventDefault();
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();

        if (!username || !password) return showToast('Mohon lengkapi email/slug dan kata sandi Anda.', 'error', 'Kredensial Tidak Lengkap');

        btnSubmit.disabled = true;
        btnSubmit.innerText = 'MEMVERIFIKASI...';

        try {
            if (username.includes('@')) {
                // --- LOGIN SEBAGAI ADMIN (Supabase Auth) ---
                const { data, error } = await window.supabaseClient.auth.signInWithPassword({
                    email: username,
                    password: password
                });

                if (error) throw error;

                showToast('Sesi terverifikasi. Mengalihkan Anda ke Dashboard Master...', 'success', 'Masuk Berhasil');
                setTimeout(() => { safeRedirect('/admin/'); }, 1200);

            } else {
                // --- LOGIN SEBAGAI KLIEN (Slug & Pass) ---
                const slug = username.toLowerCase();
                const { data, error } = await window.supabaseClient
                    .from('invitations')
                    .select('slug, password, created_at, expiry_days')
                    .eq('slug', slug)
                    .maybeSingle();

                if (error) throw error;

                if (data && data.password === password) {
                    // Cek Expiry
                    const created = new Date(data.created_at);
                    const expiry = data.expiry_days || 90;
                    const diff = (new Date() - created) / (1000 * 60 * 60 * 24);
                    
                    if (diff > expiry) {
                        throw new Error('EXPIRY_EXPIRED');
                    }

                    // Simpan sesi klien di localStorage (agar /editor/ otomatis login)
                    localStorage.setItem('editorSlug', data.slug);
                    localStorage.setItem('editorPassword', data.password);
                    
                    showToast('Identitas terverifikasi. Membuka Panel Editor undangan Anda...', 'success', 'Akses Diberikan');
                    setTimeout(() => { safeRedirect('/editor/'); }, 1200);
                } else {
                    throw new Error('INVALID_CLIENT_CREDENTIALS');
                }
            }
        } catch (err) {
            let msg = err.message || String(err);
            if (msg === 'Invalid login credentials') {
                msg = 'Email atau kata sandi tidak cocok. Mohon periksa kembali.';
            } else if (msg === 'INVALID_CLIENT_CREDENTIALS') {
                msg = 'Nama tautan (slug) atau kata sandi undangan kurang tepat.';
            } else if (msg === 'EXPIRY_EXPIRED') {
                msg = 'Masa berlaku undangan telah berakhir. Silakan hubungi admin untuk perpanjangan.';
            } else if (msg.toLowerCase().includes('rate limit')) {
                msg = 'Terlalu banyak percobaan masuk. Silakan tunggu beberapa saat sebelum mencoba kembali.';
            } else if (msg.toLowerCase().includes('email not confirmed')) {
                msg = 'Alamat email Anda belum terverifikasi. Mohon konfirmasi email Anda terlebih dahulu.';
            }
            showToast(msg, 'error');
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.innerText = 'MASUK SEKARANG';
        }
    };
});
