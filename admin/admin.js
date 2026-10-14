document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const loginOverlay = document.getElementById('admin-login');
    const dashboardWrapper = document.getElementById('dashboard-wrapper');
    const btnLogoutHeader = document.getElementById('btn-logout-header');
    const btnLogoutSidebar = document.getElementById('btn-logout-sidebar');
    const btnLogoutMobile = document.getElementById('btn-logout-mobile');
    const clientTableBody = document.querySelector('#client-table tbody');
    const modal = document.getElementById('modal');
    const btnAddClient = document.getElementById('btn-add-client');
    const btnSaveNew = document.getElementById('btn-save-new');
    const inputBrandName = document.getElementById('input-brand-name');
    const inputOwnerWA = document.getElementById('input-owner-wa');
    const pageTitle = document.getElementById('page-title');
    const pageSubtitle = document.getElementById('page-subtitle');
    
    // --- 0. FORCE APP SUBDOMAIN & DYNAMIC LOGO ---
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

    const rootDomain = hostname.replace('app.', '');
    const homeUrl = (isHostingPlatform || rootDomain === 'localhost' || rootDomain === '127.0.0.1') ? '/' : `https://${rootDomain}`;
    document.querySelectorAll('.brand-logo-link').forEach(link => link.href = homeUrl);

    const btnSaveSettings = document.getElementById('btn-save-settings');
    const modalConfirm = document.getElementById('modal-confirm');

    // 0. LOGOUT
    const logout = async () => {
        showConfirmModal({
            title: 'Konfirmasi Keluar',
            message: 'Apakah Anda yakin ingin keluar dari Dashboard Master?',
            confirmText: 'KELUAR SEKARANG',
            type: 'info',
            onConfirm: async () => {
                if (window.supabaseClient) await window.supabaseClient.auth.signOut();
                window.location.href = '/login/';
            }
        });
    };

    if (btnLogoutHeader) btnLogoutHeader.addEventListener('click', logout);
    if (btnLogoutSidebar) btnLogoutSidebar.addEventListener('click', logout);
    if (btnLogoutMobile) btnLogoutMobile.addEventListener('click', logout);

    // CHECK SESSION
    const checkSession = async (retries = 0) => {
        if (!window.supabaseClient) {
            if (retries < 10) setTimeout(() => checkSession(retries + 1), 500);
            return;
        }
        try {
            const { data: { session } } = await window.supabaseClient.auth.getSession();
            if (session) {
                // Verifikasi dengan getUser() untuk memastikan akun admin belum dihapus dari database
                const { data: { user }, error } = await window.supabaseClient.auth.getUser();
                if (user && !error) {
                    if (loginOverlay) loginOverlay.style.display = 'none';
                    if (dashboardWrapper) dashboardWrapper.style.display = 'block';
                    fetchClients();
                } else {
                    console.warn("Sesi ditemukan tetapi pengguna tidak valid (mungkin dihapus):", error);
                    if (window.supabaseClient) await window.supabaseClient.auth.signOut();
                    window.location.href = '/login/';
                }
            } else {
                window.location.href = '/login/';
            }
        } catch (err) { 
            console.error("Kesalahan cek sesi:", err);
            window.location.href = '/login/'; 
        }
    };
    checkSession();

    // INTERSEPTOR ERROR DATABASE
    const handleDbError = async (err) => {
        console.error("Operasi database gagal:", err);
        const errMsg = err?.message || err?.error_description || String(err);
        const isAuthError = errMsg.includes('JWT') || 
                            errMsg.toLowerCase().includes('invalid token') || 
                            errMsg.toLowerCase().includes('unauthorized') || 
                            errMsg.toLowerCase().includes('forbidden') || 
                            errMsg.toLowerCase().includes('user not found') ||
                            err?.status === 401 || 
                            err?.status === 403;
                            
        if (isAuthError) {
            showToast('Sesi Anda telah berakhir atau akun tidak lagi aktif. Mengalihkan Anda...', 'error', 'Sesi Berakhir');
            if (window.supabaseClient) await window.supabaseClient.auth.signOut();
            setTimeout(() => {
                window.location.href = '/login/';
            }, 2000);
        } else {
            showToast(errMsg, 'error');
        }
    };

    // NOTIFICATION
    const showToast = (message, type = 'success', customTitle = '') => {
        const container = document.getElementById('notification-container');
        if (!container) return;

        // Bersihkan prefix legasi jika ada
        const cleanMessage = message.replace(/^(Gagal:|Akses Ditolak:)\s*/i, '');

        // Tentukan judul berdasarkan tipe jika tidak ada judul kustom
        let title = customTitle;
        if (!title) {
            if (type === 'success') {
                title = 'Operasi Berhasil';
            } else if (type === 'error') {
                title = 'Terjadi Kendala';
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
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 500);
        }, 4000);
    };

    // CONFIRM MODAL
    function showConfirmModal(options) {
        const confirmModal = document.getElementById('modal-confirm');
        const confirmTitle = document.getElementById('confirm-title');
        const confirmMsg = document.getElementById('confirm-message');
        const confirmBtn = document.getElementById('btn-confirm-action');
        const iconDiv = document.getElementById('confirm-icon-wrapper');
        const iconI = document.getElementById('confirm-icon-i');

        confirmTitle.innerText = options.title || 'Konfirmasi';
        confirmMsg.innerText = options.message || 'Apakah Anda yakin?';
        confirmBtn.innerText = options.confirmText || 'YA, LANJUTKAN';
        
        if (options.type === 'info') {
            iconDiv.style.color = 'var(--primary)';
            iconDiv.style.borderColor = 'var(--primary)';
            iconDiv.style.background = 'rgba(184, 134, 11, 0.1)';
            iconI.className = 'fas fa-info-circle';
        } else {
            iconDiv.style.color = '#e74c3c';
            iconDiv.style.borderColor = '#e74c3c';
            iconDiv.style.background = 'rgba(231, 76, 60, 0.1)';
            iconI.className = 'fas fa-exclamation-triangle';
        }

        confirmModal.style.display = 'flex';
        confirmBtn.onclick = () => {
            confirmModal.style.display = 'none';
            if (options.onConfirm) options.onConfirm();
        };
    }

    // --- 1.7 TAB SWITCHING LOGIC ---
    window.switchTab = (tab) => {
        const sections = ['dashboard', 'clients', 'pricing', 'settings'];
        sections.forEach(s => {
            const el = document.getElementById(`section-${s}`);
            if (el) el.style.display = 'none';
            const nav = document.getElementById(`nav-${s}`);
            if (nav) nav.classList.remove('active');
            const navMob = document.getElementById(`nav-${s}-mobile`);
            if (navMob) navMob.classList.remove('active');
        });

        const targetSection = document.getElementById(`section-${tab}`);
        if (targetSection) {
            targetSection.style.display = 'block';
            const titles = {
                dashboard: { t: 'Master Dashboard', s: 'Ringkasan Statistik Bisnis Anda' },
                clients: { t: 'Daftar Klien', s: 'Manajemen Undangan & Konten Klien' },
                pricing: { t: 'Harga Tema', s: 'Atur Harga Berdasarkan Durasi & Tema' },
                settings: { t: 'Pengaturan Brand', s: 'Kustomisasi Nama Usaha Anda' }
            };
            if (pageTitle) pageTitle.innerText = titles[tab]?.t || 'Dashboard';
            if (pageSubtitle) pageSubtitle.innerText = titles[tab]?.s || '';
            const nav = document.getElementById(`nav-${tab}`);
            if (nav) nav.classList.add('active');
            const navMob = document.getElementById(`nav-${tab}-mobile`);
            if (navMob) navMob.classList.add('active');

            if (tab === 'pricing') initPricing();
        }
    };

    const handleNavClick = (e) => {
        const link = e.target.closest('.nav-link');
        if (!link) return;
        e.preventDefault();
        const id = link.id.replace('nav-', '').replace('-mobile', '');
        if (id) window.switchTab(id);
    };

    const sidebarMenu = document.querySelector('.nav-menu');
    const bottomNav = document.querySelector('.bottom-nav');
    if (sidebarMenu) sidebarMenu.addEventListener('click', handleNavClick);
    if (bottomNav) bottomNav.addEventListener('click', handleNavClick);

    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    if (sidebarToggle && sidebar) {
        sidebarToggle.onclick = () => sidebar.classList.toggle('collapsed');
    }

    // --- 2. FETCH DATA ---
    async function fetchClients() {
        try {
            const { data, error } = await window.supabaseClient
                .from('invitations')
                .select('id, slug, password, config, created_at, expiry_days')
                .order('created_at', { ascending: false });
            if (error) throw error;
            renderTable(data);
            updateStats(data);
            initBranding();
        } catch (err) { handleDbError(err); }
    }

    function renderTable(data) {
        clientTableBody.innerHTML = '';
        const hostname = window.location.hostname;
        data.forEach(item => {
            const theme = item.config.theme || 'royal-gold';
            const createdAt = new Date(item.created_at);
            const date = createdAt.toLocaleDateString('id-ID');
            
            const expiryDays = item.expiry_days || 90;
            const expiryDateObj = new Date(createdAt);
            expiryDateObj.setDate(expiryDateObj.getDate() + expiryDays);
            const expiryDate = expiryDateObj.toLocaleDateString('id-ID');

            const diffDays = Math.ceil(Math.abs(new Date() - createdAt) / (1000 * 60 * 60 * 24));
            const status = diffDays > expiryDays ? '<span class="badge" style="background:#ff4d4d">Expired</span>' : '<span class="badge" style="background:#2ecc71">Aktif</span>';

            let baseDomain = window.BASE_DOMAIN || hostname.replace('app.', '').replace('www.', '');
            const isLegacyTheme = ['royal-gold', 'floral-light', 'midnight-dark', 'v1'].includes(theme);
            const themePath = isLegacyTheme ? '/themes/v1/index.html' : `/themes/${theme}/index.html`;
            let previewUrl = (isHostingPlatform) ? `${themePath}?u=${item.slug}` : `${window.location.protocol}//${item.slug}.${baseDomain}`;
            if (hostname === 'localhost' || hostname === '127.0.0.1') previewUrl = `${themePath}?u=${item.slug}`;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="font-weight:700; color:var(--primary)">${item.slug}</td>
                <td style="font-family: monospace;">${item.password || '-'}</td>
                <td><span class="badge">${theme}</span></td>
                <td>${date}</td>
                <td>${expiryDate}</td>
                <td>${status}</td>
                <td class="actions">
                    <button class="btn-icon" onclick="openEditClientModal('${item.id}', '${item.slug}', '${theme}', '${(item.password || '').replace(/'/g, "\\'")}', ${JSON.stringify(item.config).replace(/"/g, '&quot;')})" title="Pengaturan Akun & Masa Aktif"><i class="fas fa-cog"></i></button>
                    <button class="btn-icon" onclick="openEditor('${item.slug}')" title="Edit Konten Undangan"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon" onclick="window.open('${previewUrl}', '_blank')" title="Lihat Hasil Undangan"><i class="fas fa-eye"></i></button>
                    <button class="btn-icon" onclick="deleteInvitation('${item.id}', '${item.slug}')" title="Hapus Undangan"><i class="fas fa-trash"></i></button>
                </td>
            `;
            clientTableBody.appendChild(tr);
        });
    }

    function updateStats(data) {
        document.getElementById('stat-total').innerText = data.length;
        document.getElementById('stat-royal').innerText = data.filter(i => (i.config.theme || 'royal-gold') === 'royal-gold').length;
        document.getElementById('stat-floral').innerText = data.filter(i => i.config.theme === 'floral-light').length;
        document.getElementById('stat-midnight').innerText = data.filter(i => i.config.theme === 'midnight-dark').length;
        const statHeritage = document.getElementById('stat-heritage');
        if (statHeritage) statHeritage.innerText = data.filter(i => i.config.theme === 'heritage-series' || i.config.theme === 'heritage').length;

        const recentBody = document.getElementById('recent-clients-body');
        if (recentBody) {
            recentBody.innerHTML = '';
            data.slice(0, 5).forEach(item => {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td style="padding:12px;">${item.slug}</td><td><span class="badge">${item.config.theme || 'royal-gold'}</span></td><td>${new Date(item.created_at).toLocaleDateString('id-ID')}</td>`;
                recentBody.appendChild(tr);
            });
        }
    }

    // --- 3. CREATE NEW ---
    const themeWrapper = document.getElementById('new-theme-wrapper');
    const themeTrigger = themeWrapper?.querySelector('.select-trigger');
    const themeOptions = themeWrapper?.querySelector('.select-options');
    if (themeTrigger) {
        themeTrigger.onclick = (e) => { e.stopPropagation(); themeOptions.classList.toggle('show'); };
        themeWrapper.querySelectorAll('.option').forEach(opt => {
            opt.onclick = () => {
                themeTrigger.setAttribute('data-value', opt.getAttribute('data-value'));
                themeTrigger.querySelector('span').innerText = opt.innerText;
                themeOptions.classList.remove('show');
            };
        });
    }

    const expiryWrapper = document.getElementById('new-expiry-wrapper');
    const expiryTrigger = expiryWrapper?.querySelector('.select-trigger');
    const expiryOptions = expiryWrapper?.querySelector('.select-options');
    if (expiryTrigger) {
        expiryTrigger.onclick = (e) => { e.stopPropagation(); expiryOptions.classList.toggle('show'); };
        expiryWrapper.querySelectorAll('.option').forEach(opt => {
            opt.onclick = () => {
                expiryTrigger.setAttribute('data-value', opt.getAttribute('data-value'));
                expiryTrigger.querySelector('span').innerText = opt.innerText;
                expiryOptions.classList.remove('show');
            };
        });
    }

    btnAddClient.onclick = () => modal.style.display = 'flex';
    btnSaveNew.onclick = async () => {
        const slug = document.getElementById('new-slug').value.trim().toLowerCase();
        const password = document.getElementById('new-pass').value.trim();
        const theme = themeTrigger.getAttribute('data-value') || 'royal-gold';
        const expiryDays = parseInt(expiryTrigger.getAttribute('data-value')) || 90;

        if (!slug || !password) return showToast('Harap lengkapi seluruh formulir data klien.', 'error', 'Data Belum Lengkap');
        btnSaveNew.disabled = true;

        try {
            const initialConfig = { theme, couples: { groom: { name: 'Pria' }, bride: { name: 'Wanita' } }, events: [], gallery: [], loveStory: [] };
            const { error } = await window.supabaseClient.from('invitations').insert([{ slug, password, config: initialConfig, expiry_days: expiryDays }]);
            if (error) throw error;
            showSuccessModal(slug, password);
            modal.style.display = 'none';
            fetchClients();
        } catch (err) { handleDbError(err); }
        finally { btnSaveNew.disabled = false; }
    };

    function showSuccessModal(slug, pass) {
        const modal = document.getElementById('modal-success');
        const hostname = window.location.hostname;
        let baseDomain = window.BASE_DOMAIN || hostname.replace('app.', '').replace('www.', '');
        let fullUrl = `${window.location.protocol}//${slug}.${baseDomain}`;
        let loginUrl = `${window.location.protocol}//app.${baseDomain}`;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            fullUrl = `${window.location.protocol}//${window.location.host}/${slug}`;
            loginUrl = `${window.location.protocol}//${window.location.host}/login/`;
        }

        document.getElementById('success-login-url').innerText = loginUrl;
        document.getElementById('success-slug').innerText = slug;
        document.getElementById('success-pass').innerText = pass;
        document.getElementById('success-url').innerText = fullUrl;
        modal.style.display = 'flex';

        document.getElementById('btn-copy-info').onclick = () => {
            const text = `URL Login: ${loginUrl}\nUsername/Slug: ${slug}\nPassword: ${pass}\nURL Undangan: ${fullUrl}`;
            navigator.clipboard.writeText(text).then(() => showToast('Tautan login dan kredensial klien berhasil disalin.', 'success', 'Informasi Disalin'));
        };
    }

    // --- 4. EDIT CLIENT MODAL ---
    let themeTargetId = null;
    let themeTargetConfig = null;
    
    // Initialize Edit Expiry Dropdown
    const editExpiryWrapper = document.getElementById('edit-expiry-wrapper');
    const editExpiryTrigger = editExpiryWrapper?.querySelector('.select-trigger');
    const editExpiryOptions = editExpiryWrapper?.querySelector('.select-options');
    if (editExpiryTrigger) {
        editExpiryTrigger.onclick = (e) => { 
            e.stopPropagation(); 
            editExpiryOptions.classList.toggle('show'); 
        };
        editExpiryWrapper.querySelectorAll('.option').forEach(opt => {
            opt.onclick = () => {
                editExpiryTrigger.setAttribute('data-value', opt.getAttribute('data-value'));
                editExpiryTrigger.querySelector('span').innerText = opt.innerText;
                
                editExpiryWrapper.querySelectorAll('.option').forEach(o => o.classList.remove('active'));
                opt.classList.add('active');
                
                editExpiryOptions.classList.remove('show');
            };
        });
    }

    // Close options on click outside
    window.addEventListener('click', () => {
        if (themeOptions) themeOptions.classList.remove('show');
        if (expiryOptions) expiryOptions.classList.remove('show');
        if (editExpiryOptions) editExpiryOptions.classList.remove('show');
    });

    window.openEditClientModal = (id, slug, currentTheme, password, config) => {
        themeTargetId = id;
        themeTargetConfig = config;
        
        document.getElementById('edit-client-slug').innerText = slug;
        document.getElementById('edit-client-pass').value = password || '';
        
        // Reset Expiry dropdown to 'keep'
        if (editExpiryTrigger) {
            editExpiryTrigger.setAttribute('data-value', 'keep');
            editExpiryTrigger.querySelector('span').innerText = 'Jangan Ubah (Tetap)';
        }
        if (editExpiryWrapper) {
            editExpiryWrapper.querySelectorAll('.option').forEach(opt => {
                if (opt.getAttribute('data-value') === 'keep') opt.classList.add('active');
                else opt.classList.remove('active');
            });
        }

        document.getElementById('modal-theme').style.display = 'flex';
        
        const wrapper = document.getElementById('theme-select-wrapper-admin');
        const themes = [
            { name: 'Royal Gold (Mewah & Gelap)', val: 'royal-gold', icon: 'fas fa-crown' },
            { name: 'Floral Light (Romantis & Terang)', val: 'floral-light', icon: 'fas fa-leaf' },
            { name: 'Midnight Dark (Modern & Futuristik)', val: 'midnight-dark', icon: 'fas fa-moon' },
            { name: 'Heritage Series (Klasik Tradisional)', val: 'heritage-series', icon: 'fas fa-landmark' },
            { name: 'Velvet Champagne (Luxury Glamour)', val: 'velvet-champagne', icon: 'fas fa-champagne-glasses' },
            { name: 'Nordic Minimalist (Clean & Elegant)', val: 'nordic-minimalist', icon: 'fas fa-feather-pointed' }
        ];

        wrapper.innerHTML = `
            <div class="custom-select" id="theme-select-admin">
                <div class="custom-select-trigger" data-value="${currentTheme}">
                    <span><i class="${themes.find(t => t.val === currentTheme)?.icon || 'fas fa-palette'}"></i> ${themes.find(t => t.val === currentTheme)?.name || currentTheme}</span>
                    <i class="fas fa-chevron-down"></i>
                </div>
                <div class="custom-options">
                    ${themes.map(t => `<div class="custom-option ${t.val === currentTheme ? 'active' : ''}" data-value="${t.val}"><i class="${t.icon}"></i> ${t.name}</div>`).join('')}
                </div>
            </div>
        `;
        const select = wrapper.querySelector('.custom-select');
        select.querySelector('.custom-select-trigger').onclick = (e) => {
            e.stopPropagation();
            select.classList.toggle('open');
        };
        
        select.querySelectorAll('.custom-option').forEach(opt => {
            opt.onclick = () => {
                const trigger = select.querySelector('.custom-select-trigger');
                trigger.setAttribute('data-value', opt.getAttribute('data-value'));
                trigger.innerHTML = `${opt.innerHTML} <i class="fas fa-chevron-down"></i>`;
                select.querySelectorAll('.custom-option').forEach(o => o.classList.remove('active'));
                opt.classList.add('active');
                select.classList.remove('open');
            };
        });

        window.addEventListener('click', () => select.classList.remove('open'));
    };

    document.getElementById('btn-save-theme').onclick = async () => {
        const newTheme = document.querySelector('#theme-select-admin .custom-select-trigger').getAttribute('data-value');
        const newPassword = document.getElementById('edit-client-pass').value.trim();
        const expiryVal = editExpiryTrigger.getAttribute('data-value');

        if (!newPassword) {
            showToast('Kata sandi baru tidak boleh kosong.', 'error', 'Validasi Gagal');
            return;
        }

        try {
            const updatedConfig = { ...themeTargetConfig, theme: newTheme };
            const updatePayload = {
                config: updatedConfig,
                password: newPassword
            };

            // If extending active period is selected
            if (expiryVal !== 'keep') {
                updatePayload.expiry_days = parseInt(expiryVal);
                updatePayload.created_at = new Date().toISOString(); // Reset start date to today
            }

            const { error } = await window.supabaseClient
                .from('invitations')
                .update(updatePayload)
                .eq('id', themeTargetId);

            if (error) throw error;

            showToast('Data akun klien dan masa aktif berhasil diperbarui.', 'success', 'Pembaruan Berhasil');
            document.getElementById('modal-theme').style.display = 'none';
            fetchClients();
        } catch (err) { 
            handleDbError(err); 
        }
    };

    // --- 5. BRANDING ---
    async function initBranding() {
        try {
            const { data } = await window.supabaseClient.from('admin_settings').select('key, value');
            if (data) {
                const name = data.find(d => d.key === 'business_name')?.value;
                const wa = data.find(d => d.key === 'owner_whatsapp')?.value;
                if (name) {
                    document.querySelectorAll('.brand-info span').forEach(el => el.innerText = name.toUpperCase());
                    if (inputBrandName) inputBrandName.value = name;
                    document.title = "Master Dashboard | " + name;
                }
                if (wa && inputOwnerWA) inputOwnerWA.value = wa;
            }
        } catch (err) {}
    }

    if (btnSaveSettings) {
        btnSaveSettings.onclick = async () => {
            const name = inputBrandName.value.trim();
            const wa = inputOwnerWA.value.trim();
            try {
                const { error } = await window.supabaseClient.from('admin_settings').upsert([{ key: 'business_name', value: name }, { key: 'owner_whatsapp', value: wa }], { onConflict: 'key' });
                if (error) throw error;
                showToast('Pengaturan umum aplikasi berhasil disimpan.', 'success', 'Konfigurasi Disimpan');
                initBranding();
            } catch (err) { handleDbError(err); }
        };
    }

    // --- 6. PRICING ---
    let themePricingData = {};
    async function initPricing() {
        const tbody = document.getElementById('pricing-table-body');
        if (!tbody) return;
        try {
            const { data } = await window.supabaseClient.from('admin_settings').select('value').eq('key', 'theme_pricing_json').maybeSingle();
            if (data && data.value) themePricingData = JSON.parse(data.value);
            const themes = [
                { id: 'global', name: 'GLOBAL' },
                { id: 'royal-gold', name: 'Royal Gold' },
                { id: 'floral-light', name: 'Floral Light' },
                { id: 'midnight-dark', name: 'Midnight Dark' },
                { id: 'heritage-series', name: 'Heritage Series' }
            ];
            tbody.innerHTML = '';
            themes.forEach(t => {
                const p = themePricingData[t.id] || {};
                const tr = document.createElement('tr');
                tr.innerHTML = `<td>${t.name}</td><td><input type="number" class="price-input" data-theme="${t.id}" data-dur="1" value="${p['1'] || ''}"></td><td><input type="number" class="price-input" data-theme="${t.id}" data-dur="2" value="${p['2'] || ''}"></td><td><input type="number" class="price-input" data-theme="${t.id}" data-dur="3" value="${p['3'] || ''}"></td><td><input type="number" class="price-input" data-theme="${t.id}" data-dur="orig" value="${p['orig'] || ''}"></td>`;
                tbody.appendChild(tr);
            });
        } catch (err) {}
    }

    const btnSavePricing = document.getElementById('btn-save-pricing');
    if (btnSavePricing) {
        btnSavePricing.onclick = async () => {
            const newPricing = {};
            document.querySelectorAll('.price-input').forEach(input => {
                const t = input.getAttribute('data-theme'), d = input.getAttribute('data-dur');
                if (!newPricing[t]) newPricing[t] = {};
                newPricing[t][d] = input.value.trim();
            });
            try {
                const { error } = await window.supabaseClient.from('admin_settings').upsert([{ key: 'theme_pricing_json', value: JSON.stringify(newPricing) }], { onConflict: 'key' });
                if (error) throw error;
                showToast('Pengaturan paket harga tema berhasil disimpan.', 'success', 'Konfigurasi Disimpan');
            } catch (err) { handleDbError(err); }
        };
    }

    // Global Helpers
    window.openEditor = (slug) => {
        localStorage.setItem('editorSlug', slug);
        localStorage.setItem('editorPassword', 'ADMIN_SESSION');
        window.open('/editor/', '_blank');
    };
    window.deleteInvitation = async (id, slug) => {
        showConfirmModal({ title: 'Hapus?', message: `Hapus ${slug}?`, onConfirm: async () => {
            try {
                const { error } = await window.supabaseClient.from('invitations').delete().eq('id', id);
                if (error) throw error;
                showToast('Akun undangan klien telah berhasil dihapus.', 'success', 'Penghapusan Berhasil');
                fetchClients();
            } catch (err) { handleDbError(err); }
        }});
    };
});
