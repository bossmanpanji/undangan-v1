document.addEventListener('DOMContentLoaded', async () => {
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

    // Set logo links to root domain
    const rootDomain = hostname.replace('app.', '');
    const homeUrl = (isHostingPlatform || rootDomain === 'localhost' || rootDomain === '127.0.0.1') ? '/' : `https://${rootDomain}`;
    document.querySelectorAll('.brand-logo-link').forEach(link => link.href = homeUrl);

    // 0. INITIALIZATION
    if (!window.supabaseClient) {
        console.error("Supabase Client tidak ditemukan!");
        return;
    }

    const editorForm = document.getElementById('editor-form');
    const mainContainer = document.getElementById('editor-main-container');
    const saveBtn = document.getElementById('save-btn');
    const adminOnlyTheme = document.getElementById('admin-only-theme');
    
    // Dashboard Navigation Elements
    const sectionEdit = document.getElementById('section-edit');
    const sectionWishes = document.getElementById('section-wishes');
    const sectionWhatsapp = document.getElementById('section-whatsapp');
    const pageTitle = document.getElementById('page-title');
    const pageSubtitle = document.getElementById('page-subtitle');
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');

    // Sidebar Toggle Logic
    if (sidebarToggle && sidebar) {
        sidebarToggle.onclick = () => {
            sidebar.classList.toggle('collapsed');
        };
    }

    let currentConfig = null;
    let invitationId = null;
    let currentSlug = null;
    let loginRole = null; // High scope
    let cropper = null; // Cropper Instance
    let croppedBlobs = {}; // To store cropped blobs by target ID
    let currentCropTarget = null;
    let selectedGalleryFiles = []; // To store newly selected gallery files
    let isDraftPending = false; // To prevent auto-save from overwriting draft

    const bankLogos = {
        'BCA': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Bank_Central_Asia.svg/960px-Bank_Central_Asia.svg.png',
        'BNI': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Bank_Negara_Indonesia_logo_%282004%29.svg/250px-Bank_Negara_Indonesia_logo_%282004%29.svg.png',
        'BRI': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/BRI_2025.svg/960px-BRI_2025.svg.png',
        'Mandiri': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Bank_Mandiri_logo_2016.svg/250px-Bank_Mandiri_logo_2016.svg.png',
        'BSI': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Bank_Syariah_Indonesia.svg/960px-Bank_Syariah_Indonesia.svg.png',
        'DANA': 'https://upload.wikimedia.org/wikipedia/commons/7/72/Logo_dana_blue.svg',
        'OVO': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Logo_ovo_purple.svg/960px-Logo_ovo_purple.svg.png',
        'GoPay': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Logo_Gopay.svg/960px-Logo_Gopay.svg.png'
    };

    // --- SESSION CHECK ON LOAD ---
    const checkSession = async () => {
        const savedSlug = localStorage.getItem('editorSlug');
        const savedPass = localStorage.getItem('editorPassword');

        if (savedSlug && savedPass) {
            console.log("Sesi ditemukan, mencoba login otomatis...");
            await performLogin(savedSlug, savedPass, true);
        } else {
            window.location.href = '/login/';
        }
    };

    // 0.1 NOTIFICATION LOGIC
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

    // 1.1 PREMIUM CONFIRMATION MODAL LOGIC
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
            iconI.className = 'fas fa-info-circle';
        } else {
            iconDiv.style.color = '#e74c3c';
            iconI.className = 'fas fa-exclamation-triangle';
        }

        confirmModal.style.display = 'flex';

        confirmBtn.onclick = () => {
            confirmModal.style.display = 'none';
            if (options.onConfirm) options.onConfirm();
        };
    }

    async function performLogin(slug, pass, isAutoLogin = false) {
        if (!isAutoLogin) {
            verifyBtn.disabled = true;
            verifyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memverifikasi...';
        }

        try {
            const { data, error } = await window.supabaseClient
                .from('invitations')
                .select('*')
                .ilike('slug', slug)
                .maybeSingle();

            if (error) throw error;

            if (data) {
                const userPassword = data.password || data.config.userPassword || data.config.password || "";
                loginRole = null;
                
                if (pass === userPassword) {
                    loginRole = 'user';
                } else {
                    // Cek apakah user sedang login via Supabase Auth (Admin)
                    const { data: { user } } = await window.supabaseClient.auth.getUser();
                    if (user) loginRole = 'admin';
                }

                if (loginRole) {
                    // Cek Expiry jika masuk sebagai Klien (User biasa)
                    if (loginRole === 'user') {
                        const created = new Date(data.created_at);
                        const expiry = data.expiry_days || 90;
                        const diff = (new Date() - created) / (1000 * 60 * 60 * 24);
                        
                        if (diff > expiry) {
                            console.warn("Masa aktif akun klien telah berakhir.");
                            clearSession();
                            if (!isAutoLogin) {
                                showToast('Masa aktif akun Anda telah berakhir. Silakan hubungi admin untuk perpanjangan.', 'error', 'Masa Aktif Berakhir');
                            } else {
                                alert('Sesi berakhir: Masa aktif akun Anda telah berakhir. Silakan hubungi admin.');
                                window.location.href = '/login/';
                            }
                            return;
                        }
                    }

                    if (!isAutoLogin) {
                        showToast('Identitas terverifikasi. Selamat bekerja di panel editor.', 'success', `Akses Diberikan (${loginRole.toUpperCase()})`);
                        // SAVE SESSION
                        localStorage.setItem('editorSlug', slug);
                        localStorage.setItem('editorPassword', pass);
                    }
                    
                    invitationId = data.id;
                    currentConfig = data.config;
                    currentSlug = data.slug;
                    
                    // --- UPDATE EXPIRY WIDGETS ---
                    const created = new Date(data.created_at);
                    const expiry = data.expiry_days || 90;
                    const diffMs = (new Date() - created);
                    const diffDaysRaw = diffMs / (1000 * 60 * 60 * 24);
                    const remainingDays = Math.max(0, Math.ceil(expiry - diffDaysRaw));

                    const sidebarExpiry = document.getElementById('sidebar-expiry');
                    const headerExpiry = document.getElementById('header-expiry-container');
                    const expiryText = document.getElementById('expiry-text');
                    const headerText = document.getElementById('header-expiry-text');
                    const expiryCard = document.getElementById('expiry-card');
                    const headerPill = document.getElementById('header-expiry-pill');

                    if (sidebarExpiry) sidebarExpiry.style.display = 'block';
                    if (headerExpiry) headerExpiry.style.display = 'block';
                    if (expiryText) expiryText.innerText = `${remainingDays} Hari Lagi`;
                    if (headerText) headerText.innerText = `${remainingDays} Hari`;

                    // Peringatan jika sisa < 3 hari
                    if (remainingDays <= 3) {
                        if (expiryCard) expiryCard.classList.add('warning');
                        if (headerPill) headerPill.classList.add('warning');
                    }

                    
                    if (loginRole === 'admin') {
                        if (adminOnlyTheme) adminOnlyTheme.style.display = 'block';
                        // Update text logout for Admin
                        const logoutBtnText = document.querySelectorAll('.btn-logout span, #btn-logout-mobile span');
                        logoutBtnText.forEach(span => span.innerText = 'Kembali ke Master');
                    } else {
                        if (adminOnlyTheme) adminOnlyTheme.style.display = 'none';
                    }

                    // UPDATE PREVIEW LINKS WITH SUBDOMAIN (HYBRID ARCHITECTURE)
                    let baseDomainUrl = window.location.hostname.replace('app.', '');
                    const clientTheme = data.config?.theme || 'royal-gold';
                    const themePath = (clientTheme === 'heritage-series' || clientTheme === 'heritage') ? '/themes/heritage-series/index.html' : '/themes/v1/index.html';
                    const previewUrl = (isHostingPlatform) ? `${themePath}?u=${currentSlug}` : `https://${currentSlug}.${baseDomainUrl}`;
                    const btnPreviewDesktop = document.getElementById('btn-preview-desktop');
                    const btnPreviewMobile = document.getElementById('btn-preview-mobile');
                    if (btnPreviewDesktop) btnPreviewDesktop.href = previewUrl;
                    if (btnPreviewMobile) btnPreviewMobile.href = previewUrl;

                    loadDataToForm(data);
                    fetchWishes();
                    
                    mainContainer.style.display = 'flex';
                } else {
                    if (!isAutoLogin) showToast('Kata sandi yang Anda masukkan tidak cocok.', 'error', 'Kata Sandi Salah');
                    else { clearSession(); window.location.href = '/login/'; }
                }
            } else {
                if (!isAutoLogin) showToast(`Nama tautan undangan '${slug}' tidak terdaftar di database.`, 'error', 'Tidak Ditemukan');
                else { clearSession(); window.location.href = '/login/'; }
            }
        } catch (err) {
            if (!isAutoLogin) showToast(err.message, 'error', 'Proses Gagal');
            else { clearSession(); window.location.href = '/login/'; }
            console.error("Login Error:", err);
        } finally {
            // Nothing to do for manual UI anymore
        }
    }

    function clearSession() {
        localStorage.removeItem('editorSlug');
        localStorage.removeItem('editorPassword');
    }

    // 1.5 LOGOUT LOGIC
    const logout = () => {
        const isAdm = loginRole === 'admin';
        showConfirmModal({
            title: isAdm ? 'Selesai Mengedit?' : 'Konfirmasi Keluar',
            message: isAdm 
                ? 'Apakah Anda ingin kembali ke Dashboard Master? Pastikan semua perubahan sudah disimpan.' 
                : 'Apakah Anda yakin ingin keluar dari Panel Client? Pastikan perubahan Anda telah disimpan.',
            confirmText: isAdm ? 'YA, KEMBALI SEKARANG' : 'YA, KELUAR SEKARANG',
            type: 'info',
            onConfirm: () => {
                clearSession();
                if (isAdm) {
                    window.close();
                    // Fallback jika tab tidak bisa ditutup otomatis
                    setTimeout(() => { window.location.href = '/admin/'; }, 500);
                } else {
                    window.location.href = '/login/';
                }
            }
        });
    };
    document.getElementById('btn-logout-desktop').onclick = logout;
    document.getElementById('btn-logout-mobile').onclick = logout;

    // 1.6 UNIFIED TAB SWITCHING (Desktop & Mobile)
    const allNavLinks = document.querySelectorAll('.nav-link[data-tab]');
    allNavLinks.forEach(link => {
        link.onclick = (e) => {
            e.preventDefault();
            const tab = link.getAttribute('data-tab');
            
            // Sync active state for both navs
            allNavLinks.forEach(l => l.classList.remove('active'));
            document.querySelectorAll(`.nav-link[data-tab="${tab}"]`).forEach(l => l.classList.add('active'));

            // Show section
            [sectionEdit, sectionWishes, sectionWhatsapp].forEach(s => s.style.display = 'none');
            
            if (tab === 'edit') {
                sectionEdit.style.display = 'block';
                pageTitle.innerText = 'Edit Undangan';
                pageSubtitle.innerText = 'Kelola data dan tampilan undangan Anda';
            } else if (tab === 'wishes') {
                sectionWishes.style.display = 'block';
                pageTitle.innerText = 'Manajemen Ucapan';
                pageSubtitle.innerText = 'Moderasi pesan dan konfirmasi kehadiran tamu';
                fetchWishes();
            } else if (tab === 'whatsapp') {
                sectionWhatsapp.style.display = 'block';
                pageTitle.innerText = 'Kirim Undangan WA';
                pageSubtitle.innerText = 'Kirim undangan otomatis ke kontak tamu';
                
                // Initialize Base URL (Auto Detection based on Admin Setting)
                const baseUrlInput = document.getElementById('wa-base-url');
                const urlInfo = document.getElementById('url-mode-info');

                function setupAutoUrl() {
                    if (!baseUrlInput || !currentSlug) return;
                    
                    const hostname = window.location.hostname;
                    const protocol = window.location.protocol;
                    
                    // Deteksi Root Domain (Cukup hapus app. dari hostname)
                    const rootDomain = hostname.startsWith('app.') ? hostname.replace('app.', '') : hostname;

                    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
                        // Format Subdomain Otomatis
                        baseUrlInput.value = `${protocol}//${currentSlug}.${rootDomain}`;
                        if (urlInfo) urlInfo.innerText = "Mode Subdomain Aktif (Auto-Detected)";
                    } else {
                        // Localhost / Fallback
                        baseUrlInput.value = `${window.location.origin}/${currentSlug}`;
                        if (urlInfo) urlInfo.innerText = "Mode Localhost Aktif";
                    }
                }

                setupAutoUrl();
            }

            // Scroll to top on mobile
            if (window.innerWidth <= 992) window.scrollTo({ top: 0, behavior: 'smooth' });
        };
    });

    // 2. WISHES MANAGEMENT
    async function fetchWishes() {
        if (!currentSlug) return;
        try {
            // Pastikan undangan masih ada di database
            const { data: inviteData, error: inviteError } = await window.supabaseClient
                .from('invitations')
                .select('id')
                .ilike('slug', currentSlug)
                .maybeSingle();

            if (inviteError) throw inviteError;
            if (!inviteData) {
                showToast('Undangan ini telah dihapus dari database. Sesi Anda dihentikan.', 'error', 'Sesi Berakhir');
                clearSession();
                setTimeout(() => { window.location.href = '/login/'; }, 2000);
                return;
            }

            const { data, error } = await window.supabaseClient
                .from('wishes')
                .select('*')
                .ilike('slug', currentSlug)
                .order('created_at', { ascending: false });

            if (error) throw error;
            renderWishesTable(data);
        } catch (err) {
            // Only show toast if it's a real error (not just empty)
            if (err.message && !err.message.includes('column')) {
                showToast(err.message, 'error', 'Gagal Memuat Ucapan');
            }
        }
    }

    function renderWishesTable(data) {
        const tbody = document.getElementById('wishes-table-body');
        tbody.innerHTML = '';
        document.getElementById('stat-total-wishes').innerText = data.length;
        document.getElementById('stat-hadir').innerText = data.filter(w => w.attendance === 'Hadir').length;

        data.forEach(wish => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="font-weight: 600;">${wish.name}</td>
                <td><span class="badge ${wish.attendance === 'Hadir' ? 'badge-gold' : 'badge-light'}">${wish.attendance}</span></td>
                <td style="max-width: 300px; white-space: normal; color: #ccc;">${wish.message}</td>
                <td style="text-align: right; display: flex; justify-content: flex-end;">
                    <button class="btn-icon btn-delete" onclick="deleteWish('${wish.id}')"><i class="fas fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    window.deleteWish = (id) => {
        showConfirmModal({
            title: 'Hapus Ucapan',
            message: 'Apakah Anda yakin ingin menghapus ucapan ini secara permanen? Tindakan ini tidak dapat dibatalkan.',
            confirmText: 'YA, HAPUS PERMANEN',
            type: 'danger',
            onConfirm: async () => {
                try {
                    const { error } = await window.supabaseClient.from('wishes').delete().eq('id', id);
                    if (error) throw error;
                    showToast('Pesan ucapan dan doa dari tamu telah berhasil dihapus.', 'success', 'Ucapan Dihapus');
                    fetchWishes();
                } catch (err) {
                    showToast(err.message, 'error', 'Gagal Menghapus');
                }
            }
        });
    };
    
    // 3. WHATSAPP SENDER LOGIC
    const btnGenerateWa = document.getElementById('btn-generate-wa');
    if (btnGenerateWa) {
        btnGenerateWa.onclick = () => {
            const guestListText = document.getElementById('wa-guest-list').value.trim();
            const baseUrl = document.getElementById('wa-base-url').value;
            const tableBody = document.getElementById('wa-table-body');
            const resultContainer = document.getElementById('wa-result-container');

            if (!guestListText) {
                showToast('Harap masukkan setidaknya satu nama tamu undangan.', 'error', 'Validasi Gagal');
                return;
            }

            // Hardcoded Anti-Spam Templates (Sopan, Ramah, Universal, Tanpa Sapaan Waktu, Berparagraf)
            const templates = [
                "Tanpa mengurangi rasa hormat, perkenankan kami membagikan kabar bahagia ini kepada Bapak/Ibu/Saudara/i *[nama_tamu]*.\n\nMerupakan suatu kehormatan dan kebahagiaan bagi kami apabila Anda berkenan hadir di momen spesial kami.\n\nDetail acara dan lokasi dapat dilihat melalui tautan undangan berikut:\n[link_undangan]\n\nAtas kehadiran dan doa restunya, kami mengucapkan terima kasih.\n\nHormat kami,\n*[nama_mempelai]*",
                
                "Kami memohon doa restu dari Bapak/Ibu/Saudara/i *[nama_tamu]* untuk hari pernikahan kami.\n\nAdalah suatu kehormatan besar bagi kami jika Anda berkenan meluangkan waktu untuk hadir dan memberikan doa restu secara langsung.\n\nSilakan buka tautan berikut untuk melihat informasi lengkap acara kami:\n[link_undangan]\n\nKehadiran Anda akan sangat berarti bagi kami.\n\nHormat kami,\n*[nama_mempelai]*",
                
                "Kepada Yth. Bapak/Ibu/Saudara/i *[nama_tamu]*,\n\nSuatu kebahagiaan bagi kami jika Anda dapat memberikan doa restu pada hari pernikahan kami yang sebentar lagi akan tiba.\n\nMerupakan kehormatan apabila Anda dapat hadir di tengah-tengah kami.\n\nInformasi lengkap mengenai resepsi dan akad nikah dapat diakses di:\n[link_undangan]\n\nTerima kasih banyak atas doa dan dukungannya.\n\nHormat kami,\n*[nama_mempelai]*",
                
                "Halo *[nama_tamu]*,\n\nMelalui pesan singkat ini, kami ingin berbagi kabar bahagia mengenai rencana pernikahan kami.\n\nKami akan sangat merasa terhormat apabila Anda dapat menyempatkan diri untuk hadir dan merayakan bersama kami.\n\nDetail undangan digital kami dapat Anda lihat pada tautan di bawah ini:\n[link_undangan]\n\nKami sangat menantikan kehadiran Anda.\n\nHormat kami,\n*[nama_mempelai]*",
                
                "Dengan segala kerendahan hati, izinkan kami mengabarkan hari bahagia kami kepada Bapak/Ibu/Saudara/i *[nama_tamu]*.\n\nSungguh suatu kehormatan bagi kami jika Anda dapat hadir untuk berbagi momen indah ini bersama kami.\n\nKunjungi tautan berikut untuk mengetahui detail acara selengkapnya:\n[link_undangan]\n\nTerima kasih atas segala perhatian dan doa restunya.\n\nHormat kami,\n*[nama_mempelai]*"
            ];

            const lines = guestListText.split('\n');
            tableBody.innerHTML = '';
            let count = 0;

            const coupleName = `${currentConfig.couple.groom.name} & ${currentConfig.couple.bride.name}`;

            lines.forEach(line => {
                if (!line.trim()) return;
                
                const parts = line.split(',');
                const guestName = parts[0]?.trim();
                let phone = parts[1]?.trim() || '';

                if (guestName && phone) {
                    phone = phone.replace(/[^0-9]/g, '');
                    if (phone.startsWith('0')) phone = '62' + phone.substring(1);

                    // Pick random template
                    const template = templates[Math.floor(Math.random() * templates.length)];

                    const encodedName = encodeURIComponent(guestName);
                    const invitationUrl = `${baseUrl}?to=${encodedName.replace(/%20/g, '+')}`;
                    
                    let finalMessage = template
                        .replace(/\[nama_tamu\]/g, guestName)
                        .replace(/\[link_undangan\]/g, invitationUrl)
                        .replace(/\[nama_mempelai\]/g, coupleName);
                    
                    const waLink = `https://wa.me/${phone}?text=${encodeURIComponent(finalMessage)}`;

                    const tr = document.createElement('tr');
                    tr.id = `wa-row-${count}`;
                    tr.innerHTML = `
                        <td><b style="color: var(--primary);">${guestName}</b></td>
                        <td>${phone}</td>
                        <td style="text-align: right;">
                            <a href="${waLink}" target="_blank" class="btn-wa-kirim" 
                               onclick="document.getElementById('wa-row-${count}').style.display='none';">
                                <i class="fab fa-whatsapp"></i> KIRIM WA
                            </a>
                        </td>
                    `;
                    tableBody.appendChild(tr);
                    count++;
                }
            });

            if (count > 0) {
                resultContainer.style.display = 'block';
                showToast(`${count} tautan khusus tamu undangan telah berhasil dibuat.`, 'success', 'Tautan Berhasil Dibuat');
                // Scroll to results
                resultContainer.scrollIntoView({ behavior: 'smooth' });
            } else {
                showToast('Gunakan format baris yang benar: Nama Tamu, Nomor WhatsApp (opsional).', 'error', 'Format Tidak Valid');
            }
        };
    }

    // --- DRAFT SYSTEM ---
    function getFormDataAsConfig() {
        const events = [];
        document.querySelectorAll('.event-item').forEach(item => {
            events.push({
                title: item.querySelector('.event-title').value,
                date: item.querySelector('.event-date').value,
                startTime: item.querySelector('.event-start').value,
                endTime: item.querySelector('.event-end').value,
                location: item.querySelector('.event-location').value,
                address: item.querySelector('.event-address').value,
                mapsUrl: item.querySelector('.event-maps').value,
                entertainment: item.querySelector('.event-ent').value
            });
        });

        const stories = [];
        document.querySelectorAll('.story-item').forEach(item => {
            stories.push({
                title: item.querySelector('.story-title').value,
                date: item.querySelector('.story-date').value,
                description: item.querySelector('.story-desc').value,
                image: item.querySelector('.story-image-url').value
            });
        });

        const gifts = [];
        document.querySelectorAll('.gift-item').forEach(item => {
            gifts.push({
                bank: item.querySelector('.gift-bank').value,
                accountNumber: item.querySelector('.gift-acc-num').value,
                accountName: item.querySelector('.gift-acc-name').value
            });
        });

        const galleryUrls = [];
        document.querySelectorAll('#gallery-preview .existing-img').forEach(img => {
            galleryUrls.push(img.src);
        });

        return {
            ...currentConfig,
            theme: document.querySelector('#theme-select-editor .custom-select-trigger')?.getAttribute('data-value') || 'royal-gold',
            couple: {
                groom: {
                    name: document.getElementById('groom-name').value,
                    fullname: document.getElementById('groom-fullname').value,
                    sonOf: `Putra dari Bpk. ${document.getElementById('groom-father').value} & Ibu ${document.getElementById('groom-mother').value}`,
                    instagram: '@' + document.getElementById('groom-social').value.replace('@', ''),
                    socialIcon: document.querySelector('#groom-social-select .custom-select-trigger')?.getAttribute('data-value') === 'tiktok' ? 'fab fa-tiktok' : (document.querySelector('#groom-social-select .custom-select-trigger')?.getAttribute('data-value') === 'whatsapp' ? 'fab fa-whatsapp' : 'fab fa-instagram'),
                    image: document.getElementById('groom-photo-url').value
                },
                bride: {
                    name: document.getElementById('bride-name').value,
                    fullname: document.getElementById('bride-fullname').value,
                    daughterOf: `Putri dari Bpk. ${document.getElementById('bride-father').value} & Ibu ${document.getElementById('bride-mother').value}`,
                    instagram: '@' + document.getElementById('bride-social').value.replace('@', ''),
                    socialIcon: document.querySelector('#bride-social-select .custom-select-trigger')?.getAttribute('data-value') === 'tiktok' ? 'fab fa-tiktok' : (document.querySelector('#bride-social-select .custom-select-trigger')?.getAttribute('data-value') === 'whatsapp' ? 'fab fa-whatsapp' : 'fab fa-instagram'),
                    image: document.getElementById('bride-photo-url').value
                }
            },
            events, stories, gifts,
            gallery: galleryUrls,
            quotes: document.getElementById('wedding-quotes').value,
            youtubeUrl: document.getElementById('youtube-url').value,
            coverImage: document.getElementById('cover-photo-url').value,
            ogImage: document.getElementById('thumb-photo-url').value,
            music: document.getElementById('music-url').value
        };
    }

    // 3. FORM LOADING & SAVE
    function loadDataToForm(data) {
        const config = data.config;
        if (!config) return;
        
        // --- INITIALIZE CUSTOM THEME SELECT (ADMIN ONLY) ---
        const themeWrapper = document.getElementById('theme-select-wrapper-editor');
        if (themeWrapper) {
            const themes = [
                { name: 'Royal Gold (Mewah & Gelap)', val: 'royal-gold', icon: 'fas fa-crown' },
                { name: 'Floral Light (Romantis & Terang)', val: 'floral-light', icon: 'fas fa-leaf' },
                { name: 'Midnight Dark (Modern & Futuristik)', val: 'midnight-dark', icon: 'fas fa-moon' },
                { name: 'Heritage Series (Klasik Tradisional)', val: 'heritage-series', icon: 'fas fa-landmark' },
                { name: 'Velvet Champagne (Luxury Glamour)', val: 'velvet-champagne', icon: 'fas fa-champagne-glasses' },
                { name: 'Nordic Minimalist (Clean & Elegant)', val: 'nordic-minimalist', icon: 'fas fa-feather-pointed' }
            ];
            const currentTheme = config.theme || 'royal-gold';
            const themeObj = themes.find(t => t.val === currentTheme) || themes[0];

            themeWrapper.innerHTML = `
                <div class="custom-select" id="theme-select-editor">
                    <div class="custom-select-trigger" data-value="${themeObj.val}">
                        <span><i class="${themeObj.icon}"></i> ${themeObj.name}</span>
                        <i class="fas fa-chevron-down"></i>
                    </div>
                    <div class="custom-options">
                        ${themes.map(t => `<div class="custom-option ${t.val === currentTheme ? 'active' : ''}" data-value="${t.val}"><i class="${t.icon}"></i> ${t.name}</div>`).join('')}
                    </div>
                </div>
            `;

            const select = themeWrapper.querySelector('.custom-select');
            const trigger = select.querySelector('.custom-select-trigger');
            const options = select.querySelectorAll('.custom-option');

            trigger.onclick = (e) => {
                e.stopPropagation();
                select.classList.toggle('open');
            };

            options.forEach(opt => {
                opt.onclick = () => {
                    const val = opt.getAttribute('data-value');
                    trigger.setAttribute('data-value', val);
                    trigger.innerHTML = `${opt.innerHTML} <i class="fas fa-chevron-down"></i>`;
                    options.forEach(o => o.classList.remove('active'));
                    opt.classList.add('active');
                    select.classList.remove('open');
                };
            });

            // Close when clicking outside
            window.addEventListener('click', () => select.classList.remove('open'));
        }
        
        document.getElementById('groom-fullname').value = config.couple?.groom?.fullname || '';
        document.getElementById('groom-name').value = config.couple?.groom?.name || '';
        document.getElementById('groom-father').value = config.couple?.groom?.sonOf?.split('&')[0]?.replace('Putra dari Bpk. ', '')?.trim() || '';
        document.getElementById('groom-mother').value = config.couple?.groom?.sonOf?.split('&')[1]?.replace('Ibu ', '')?.trim() || '';
        document.getElementById('groom-social').value = config.couple?.groom?.instagram?.replace('@', '') || '';
        const groomIcon = config.couple?.groom?.socialIcon || 'fab fa-instagram';
        const groomVal = groomIcon.includes('tiktok') ? 'tiktok' : (groomIcon.includes('whatsapp') ? 'whatsapp' : 'instagram');
        const groomTrigger = document.querySelector('#groom-social-select .custom-select-trigger');
        if (groomTrigger) {
            groomTrigger.setAttribute('data-value', groomVal);
            groomTrigger.innerHTML = `<span><i class="${groomIcon}"></i> ${groomVal.charAt(0).toUpperCase() + groomVal.slice(1)}</span><i class="fas fa-chevron-down"></i>`;
        }
        
        document.getElementById('bride-fullname').value = config.couple?.bride?.fullname || '';
        document.getElementById('bride-name').value = config.couple?.bride?.name || '';
        document.getElementById('bride-father').value = config.couple?.bride?.daughterOf?.split('&')[0]?.replace('Putri dari Bpk. ', '')?.trim() || '';
        document.getElementById('bride-mother').value = config.couple?.bride?.daughterOf?.split('&')[1]?.replace('Ibu ', '')?.trim() || '';
        document.getElementById('bride-social').value = config.couple?.bride?.instagram?.replace('@', '') || '';
        const brideIcon = config.couple?.bride?.socialIcon || 'fab fa-instagram';
        const brideVal = brideIcon.includes('tiktok') ? 'tiktok' : (brideIcon.includes('whatsapp') ? 'whatsapp' : 'instagram');
        const brideTrigger = document.querySelector('#bride-social-select .custom-select-trigger');
        if (brideTrigger) {
            brideTrigger.setAttribute('data-value', brideVal);
            brideTrigger.innerHTML = `<span><i class="${brideIcon}"></i> ${brideVal.charAt(0).toUpperCase() + brideVal.slice(1)}</span><i class="fas fa-chevron-down"></i>`;
        }

        document.getElementById('wedding-quotes').value = config.quotes || '';
        document.getElementById('youtube-url').value = config.youtubeUrl || '';
        
        if (config.couple?.groom?.image) setPreview('groom-photo-preview', config.couple.groom.image);
        if (config.couple?.bride?.image) setPreview('bride-photo-preview', config.couple.bride.image);
        if (config.coverImage) setPreview('cover-photo-preview', config.coverImage);
        if (config.ogImage) setPreview('thumb-photo-preview', config.ogImage);

        const events = config.events && config.events.length > 0 ? config.events : [
            { title: 'Akad Nikah', date: '', time: '', location: '', address: '', mapsUrl: '' },
            { title: 'Resepsi', date: '', time: '', location: '', address: '', mapsUrl: '' }
        ];
        renderDynamicEvents(events);
        renderDynamicGallery(config.gallery || []);
        renderDynamicStories(config.stories || []);
        renderDynamicGifts(config.gifts || []);
    }

    function setPreview(id, url) {
        const box = document.getElementById(id);
        if(!box) return;
        const urlInputId = id.replace('-preview', '-url');
        const urlInput = document.getElementById(urlInputId);
        if (urlInput) urlInput.value = url;
        
        box.innerHTML = `<img src="${url}"><button type="button" class="remove-preview-btn" onclick="this.parentElement.style.display='none'; document.getElementById('${urlInputId}').value=''">×</button>`;
        box.style.display = 'block';
    }

    editorForm.onsubmit = async (e) => {
        e.preventDefault();
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';

        try {
            // Jika login sebagai admin, validasi akun di server terlebih dahulu
            if (loginRole === 'admin') {
                const { data: { user }, error: adminAuthError } = await window.supabaseClient.auth.getUser();
                if (!user || adminAuthError) {
                    showToast('Sesi admin Anda telah berakhir atau tidak lagi aktif. Mengalihkan Anda...', 'error', 'Sesi Berakhir');
                    clearSession();
                    if (window.supabaseClient) await window.supabaseClient.auth.signOut();
                    setTimeout(() => { window.location.href = '/login/'; }, 2000);
                    return;
                }
            }

            const groomFile = croppedBlobs['groom-photo-file'];
            const brideFile = croppedBlobs['bride-photo-file'];
            const coverFile = croppedBlobs['cover-photo-file'];
            const thumbFile = croppedBlobs['thumb-photo-file'];
            const musicFile = document.getElementById('music-file').files[0];
            const galleryFiles = document.getElementById('gallery-files').files;

            const groomUrlInput = document.getElementById('groom-photo-url').value;
            const brideUrlInput = document.getElementById('bride-photo-url').value;
            const coverUrlInput = document.getElementById('cover-photo-url').value;
            const thumbUrlInput = document.getElementById('thumb-photo-url').value;

            const resetBtn = () => {
                saveBtn.disabled = false;
                saveBtn.innerHTML = '<i class="fas fa-save"></i> SIMPAN & UPDATE UNDANGAN';
            };

            if (!groomFile && !groomUrlInput) { resetBtn(); return showToast('Foto profil mempelai pria harus diunggah.', 'error', 'Formulir Kurang Lengkap'); }
            if (!brideFile && !brideUrlInput) { resetBtn(); return showToast('Foto profil mempelai wanita harus diunggah.', 'error', 'Formulir Kurang Lengkap'); }
            if (!coverFile && !coverUrlInput) { resetBtn(); return showToast('Foto sampul depan undangan harus diunggah.', 'error', 'Formulir Kurang Lengkap'); }
            if (!thumbFile && !thumbUrlInput) { resetBtn(); return showToast('Foto thumbnail media sosial harus diunggah.', 'error', 'Formulir Kurang Lengkap'); }

            // Pastikan tidak pernah mengambil URL blob dari input jika terjadi kegagalan/kesalahan state
            let groomUrl = groomUrlInput.startsWith('blob:') ? (currentConfig.couple?.groom?.image || '') : groomUrlInput;
            let brideUrl = brideUrlInput.startsWith('blob:') ? (currentConfig.couple?.bride?.image || '') : brideUrlInput;
            let coverUrl = coverUrlInput.startsWith('blob:') ? (currentConfig.coverImage || '') : coverUrlInput;
            let thumbUrl = thumbUrlInput.startsWith('blob:') ? (currentConfig.ogImage || '') : thumbUrlInput;
            let musicUrl = currentConfig.music;
            let galleryUrls = [];
            document.querySelectorAll('#gallery-preview .existing-img').forEach(img => {
                galleryUrls.push(img.src);
            });

            const compressImage = async (file) => {
                const MAX_SIZE = 1 * 1024 * 1024; // 1MB
                if (file.size <= MAX_SIZE) return file;

                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onload = (e) => {
                        const img = new Image();
                        img.src = e.target.result;
                        img.onload = () => {
                            const canvas = document.createElement('canvas');
                            let width = img.width;
                            let height = img.height;

                            // Resize jika dimensi terlalu besar (Max 1600px)
                            const MAX_DIM = 1600;
                            if (width > height) {
                                if (width > MAX_DIM) {
                                    height *= MAX_DIM / width;
                                    width = MAX_DIM;
                                }
                            } else {
                                if (height > MAX_DIM) {
                                    width *= MAX_DIM / height;
                                    height = MAX_DIM;
                                }
                            }

                            canvas.width = width;
                            canvas.height = height;
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(img, 0, 0, width, height);

                            // Kompres dengan kualitas 0.7 (biasanya cukup untuk < 1MB)
                            canvas.toBlob((blob) => {
                                const finalName = file.name || 'image.jpg';
                                resolve(new File([blob], finalName, { type: 'image/jpeg' }));
                            }, 'image/jpeg', 0.7);
                        };
                    };
                });
            };

            const uploadToSupabase = async (file, folder) => {
                if (!file) return null;
                console.log(`Menyiapkan unggah file ke folder: ${folder}...`);
                let fileToUpload = file;
                if (folder !== 'music') {
                    console.log("Mengompres gambar...");
                    fileToUpload = await compressImage(file);
                }
                const nameSource = fileToUpload.name || file.name || 'image.jpg';
                const cleanName = String(nameSource).replace(/[^a-zA-Z0-9.]/g, '_');
                const fileName = `${Date.now()}_${cleanName}`;
                const filePath = `${folder}/${fileName}`;
                
                console.log(`Mengunggah ke Supabase: ${filePath}`);
                const { data, error } = await window.supabaseClient.storage.from('invitation-images').upload(filePath, fileToUpload);
                
                if (error) {
                    console.error("Gagal unggah ke Storage:", error);
                    throw new Error(`Gagal Unggah Foto (${folder}): ${error.message}`);
                }
                
                const publicUrl = window.supabaseClient.storage.from('invitation-images').getPublicUrl(filePath).data.publicUrl;
                console.log(`Unggah Berhasil! URL: ${publicUrl}`);
                return publicUrl;
            };

            if (groomFile) groomUrl = await uploadToSupabase(groomFile, 'couples');
            if (brideFile) brideUrl = await uploadToSupabase(brideFile, 'couples');
            if (coverFile) coverUrl = await uploadToSupabase(coverFile, 'covers');
            if (thumbFile) thumbUrl = await uploadToSupabase(thumbFile, 'thumbnails');
            if (musicFile) musicUrl = await uploadToSupabase(musicFile, 'music');
            
            if (selectedGalleryFiles.length > 0) {
                // Check gallery limit (Max 8 total)
                if (galleryUrls.length + selectedGalleryFiles.length > 8) {
                    showToast('Batas maksimal galeri foto adalah 8 gambar.', 'error', 'Batas Maksimal');
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = '<i class="fas fa-save"></i> SIMPAN & UPDATE UNDANGAN';
                    return;
                }
                for (let fileObj of selectedGalleryFiles) {
                    const url = await uploadToSupabase(fileObj.file, 'gallery');
                    galleryUrls.push(url);
                }
            }

            const events = [];
            document.querySelectorAll('.event-item').forEach(item => {
                events.push({
                    title: item.querySelector('.event-title').value,
                    date: item.querySelector('.event-date').value,
                    startTime: item.querySelector('.event-start').value,
                    endTime: item.querySelector('.event-end').value,
                    location: item.querySelector('.event-location').value,
                    address: item.querySelector('.event-address').value,
                    mapsUrl: item.querySelector('.event-maps').value,
                    entertainment: item.querySelector('.event-ent').value
                });
            });

            const stories = [];
            const storyItems = document.querySelectorAll('.story-item');
            if (storyItems.length > 6) {
                showToast('Batas maksimal cerita cinta adalah 6 cerita.', 'error', 'Batas Maksimal');
                saveBtn.disabled = false;
                saveBtn.innerHTML = '<i class="fas fa-save"></i> SIMPAN & UPDATE UNDANGAN';
                return;
            }
            for (const item of storyItems) {
                let storyUrl = item.querySelector('.story-image-url').value;
                if (item._croppedBlob) {
                    storyUrl = await uploadToSupabase(item._croppedBlob, 'stories');
                }
                stories.push({
                    title: item.querySelector('.story-title').value,
                    date: item.querySelector('.story-date').value,
                    description: item.querySelector('.story-desc').value,
                    image: storyUrl
                });
            }

            const gifts = [];
            document.querySelectorAll('.gift-item').forEach(item => {
                const bankSelectTrigger = item.querySelector('.custom-select-trigger');
                let bankName = bankSelectTrigger ? bankSelectTrigger.getAttribute('data-value') : '';
                let logoUrl = bankLogos[bankName] || '';

                if (bankName === 'Lainnya') {
                    bankName = item.querySelector('.gift-bank-custom').value;
                    logoUrl = item.querySelector('.gift-logo-custom').value;
                }

                gifts.push({
                    bank: bankName,
                    logo: logoUrl,
                    accountNumber: item.querySelector('.gift-acc-num').value,
                    accountName: item.querySelector('.gift-acc-name').value
                });
            });

            const updatedConfig = {
                ...currentConfig,
                theme: document.querySelector('#theme-select-editor .custom-select-trigger')?.getAttribute('data-value') || 'royal-gold',
                couple: {
                    groom: {
                        name: document.getElementById('groom-name').value,
                        fullname: document.getElementById('groom-fullname').value,
                        sonOf: `Putra dari Bpk. ${document.getElementById('groom-father').value} & Ibu ${document.getElementById('groom-mother').value}`,
                        instagram: '@' + document.getElementById('groom-social').value.replace('@', ''),
                        socialIcon: document.querySelector('#groom-social-select .custom-select-trigger')?.getAttribute('data-value') === 'tiktok' ? 'fab fa-tiktok' : (document.querySelector('#groom-social-select .custom-select-trigger')?.getAttribute('data-value') === 'whatsapp' ? 'fab fa-whatsapp' : 'fab fa-instagram'),
                        image: groomUrl
                    },
                    bride: {
                        name: document.getElementById('bride-name').value,
                        fullname: document.getElementById('bride-fullname').value,
                        daughterOf: `Putri dari Bpk. ${document.getElementById('bride-father').value} & Ibu ${document.getElementById('bride-mother').value}`,
                        instagram: '@' + document.getElementById('bride-social').value.replace('@', ''),
                        socialIcon: document.querySelector('#bride-social-select .custom-select-trigger')?.getAttribute('data-value') === 'tiktok' ? 'fab fa-tiktok' : (document.querySelector('#bride-social-select .custom-select-trigger')?.getAttribute('data-value') === 'whatsapp' ? 'fab fa-whatsapp' : 'fab fa-instagram'),
                        image: brideUrl
                    }
                },
                events: events,
                stories: stories,
                gifts: gifts,
                gallery: galleryUrls.slice(0, 20),
                quotes: document.getElementById('wedding-quotes').value,
                youtubeUrl: document.getElementById('youtube-url').value,
                coverImage: coverUrl,
                ogImage: thumbUrl,
                music: musicUrl
            };

            console.log("Mengirim Update ke Database Invitations...", updatedConfig);
            const { data, error } = await window.supabaseClient
                .from('invitations')
                .update({ config: updatedConfig })
                .eq('id', invitationId)
                .select('id');
            
            if (error) {
                console.error("Gagal Update Database:", error);
                throw error;
            }

            if (!data || data.length === 0) {
                throw new Error('RECORD_DELETED');
            }
            
            console.log("Database Berhasil Diperbarui!");
            showToast('Semua perubahan data undangan telah berhasil disimpan ke database.', 'success', 'Penyimpanan Berhasil');
            currentConfig = updatedConfig;
            localStorage.removeItem(`draft_${currentSlug}`); // Clear draft on success
            
            // --- CLEAR UPLOAD STATE ---
            // Mengosongkan data file/blob agar tidak diunggah ulang jika tombol simpan diklik lagi
            croppedBlobs = {};
            selectedGalleryFiles = [];
            // Hilangkan label "BARU" dari galeri
            document.querySelectorAll('#gallery-preview .new-img-preview').forEach(div => {
                div.classList.remove('new-img-preview');
                const badge = div.querySelector('div'); // Menghapus badge hijau "BARU"
                if (badge) badge.remove();
                
                // Ganti img.src object URL yang sementara dengan URL asli dari Supabase
                const img = div.querySelector('img');
                const fileId = div.dataset.fileId;
                // Kita harus merender ulang galeri supaya URL-nya clean menggunakan config
                // Karena kita tidak memetakan satu persatu URL yang baru kembali ke preview box-nya,
                // Lebih aman panggil fungsi render ulang galeri dari awal.
            });
            renderDynamicGallery(updatedConfig.gallery || []);
            renderDynamicStories(updatedConfig.stories || []);
            
            // Perbarui URL form input dengan URL asli dari Supabase agar tidak menyimpan blob URL jika disimpan ulang
            document.getElementById('groom-photo-url').value = groomUrl || '';
            document.getElementById('bride-photo-url').value = brideUrl || '';
            document.getElementById('cover-photo-url').value = coverUrl || '';
            document.getElementById('thumb-photo-url').value = thumbUrl || '';
            
            if (groomUrl && document.querySelector('#groom-photo-preview img')) document.querySelector('#groom-photo-preview img').src = groomUrl;
            if (brideUrl && document.querySelector('#bride-photo-preview img')) document.querySelector('#bride-photo-preview img').src = brideUrl;
            if (coverUrl && document.querySelector('#cover-photo-preview img')) document.querySelector('#cover-photo-preview img').src = coverUrl;
            if (thumbUrl && document.querySelector('#thumb-photo-preview img')) document.querySelector('#thumb-photo-preview img').src = thumbUrl;
            
        } catch (err) {
            if (err.message === 'RECORD_DELETED') {
                showToast('Undangan ini telah dihapus dari database. Sesi Anda dihentikan.', 'error', 'Sesi Berakhir');
                clearSession();
                setTimeout(() => {
                    window.location.href = '/login/';
                }, 2000);
            } else {
                showToast(err.message, 'error', 'Gagal Menyimpan');
            }
        } finally {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="fas fa-save"></i> SIMPAN & UPDATE UNDANGAN';
        }
    };

    // --- DYNAMIC RENDERING HELPERS ---
    function renderDynamicEvents(items) {
        const container = document.getElementById('events-container');
        container.innerHTML = '';
        items.forEach(item => addEventRow(item));
    }
    document.getElementById('add-event').onclick = () => addEventRow();
    function addEventRow(data = {}) {
        const isCoreEvent = data.title === 'Akad Nikah' || data.title === 'Resepsi';
        const div = document.createElement('div');
        div.className = 'dynamic-item event-item';
        div.innerHTML = `
            ${isCoreEvent ? '' : '<button type="button" class="remove-btn" onclick="this.parentElement.remove()">×</button>'}
            <div class="grid-2">
                <div class="input-group"><label>Judul Acara <span class="required">*</span></label><input type="text" class="event-title" value="${data.title || ''}" ${isCoreEvent ? 'readonly style="background: rgba(255,255,255,0.05); color: #aaa;"' : ''} required></div>
                <div class="input-group"><label>Tanggal Acara <span class="required">*</span></label><input type="date" class="event-date" value="${data.date || ''}" required></div>
            </div>
            <div class="grid-2">
                <div class="input-group"><label>Waktu Mulai <span class="required">*</span></label><input type="time" class="event-start" value="${data.startTime || ''}" required></div>
                <div class="input-group"><label>Waktu Selesai <span class="required">*</span></label><input type="text" class="event-end" value="${data.endTime || ''}" placeholder="contoh: 13:00 atau Selesai" required></div>
            </div>
            <div class="input-group">
                <label>Tempat / Lokasi Acara <span class="required">*</span></label>
                <input type="text" class="event-location" value="${data.location || ''}" required placeholder="misal: Gedung Serbaguna">
            </div>
            <div class="input-group">
                <label>Alamat Lengkap <span class="required">*</span></label>
                <textarea class="event-address" rows="2" placeholder="Alamat lengkap lokasi..." required>${data.address || ''}</textarea>
            </div>
            <div class="grid-2">
                <div class="input-group"><label class="no-star">Hiburan (Opsional)</label><input type="text" class="event-ent" value="${data.entertainment || ''}" placeholder="misal: Solo Organ"></div>
                <div class="input-group"><label class="no-star">Link Google Maps (Opsional)</label><input type="url" class="event-maps" value="${data.mapsUrl || ''}"></div>
            </div>`;
        document.getElementById('events-container').appendChild(div);
    }

    function renderDynamicGallery(items) {
        const container = document.getElementById('gallery-preview');
        if(!container) return;
        container.innerHTML = '';
        items.forEach(url => {
            const div = document.createElement('div');
            div.className = 'image-preview-box';
            div.style.display = 'block';
            div.innerHTML = `
                <img src="${url}" class="existing-img">
                <button type="button" class="remove-preview-btn" onclick="this.parentElement.remove()">×</button>
            `;
            container.appendChild(div);
        });
    }

    // --- NEW GALLERY PREVIEW LOGIC ---
    const galleryInput = document.getElementById('gallery-files');
    const galleryPreviewContainer = document.getElementById('gallery-preview');

    if (galleryInput) {
        galleryInput.onchange = (e) => {
            const files = Array.from(e.target.files);
            const currentTotal = document.querySelectorAll('#gallery-preview .image-preview-box').length;
            
            if (currentTotal + files.length > 8) {
                showToast('Batas maksimal galeri foto adalah 8 gambar.', 'error', 'Batas Maksimal');
                galleryInput.value = '';
                return;
            }
            
            files.forEach(file => {
                // Add to our managed list
                const fileId = 'new-img-' + Date.now() + Math.random();
                selectedGalleryFiles.push({ id: fileId, file: file });

                const reader = new FileReader();
                reader.onload = (event) => {
                    const div = document.createElement('div');
                    div.className = 'image-preview-box new-img-preview';
                    div.dataset.fileId = fileId;
                    div.style.display = 'block';
                    div.innerHTML = `
                        <img src="${event.target.result}">
                        <button type="button" class="remove-preview-btn" onclick="removeNewGalleryImg('${fileId}', this)">×</button>
                        <div style="position:absolute; bottom:0; width:100%; background:rgba(46, 204, 113, 0.8); color:white; font-size:10px; text-align:center; padding:2px; pointer-events:none;">BARU</div>
                    `;
                    galleryPreviewContainer.appendChild(div);
                };
                reader.readAsDataURL(file);
            });

            // CLEAR THE INPUT immediately so no filename is stuck
            galleryInput.value = '';
        };
    }

    window.removeNewGalleryImg = (id, btn) => {
        // Remove from the array
        selectedGalleryFiles = selectedGalleryFiles.filter(item => item.id !== id);
        // Remove the preview element
        btn.parentElement.remove();
    };

    function renderDynamicStories(items) {
        const container = document.getElementById('stories-container');
        if(container) container.innerHTML = '';
        items.forEach(item => addStoryRow(item));
    }
    const addStoryBtn = document.getElementById('add-story');
    if(addStoryBtn) {
        addStoryBtn.onclick = () => {
            const count = document.querySelectorAll('.story-item').length;
            if (count >= 6) return showToast('Batas cerita cinta yang diperbolehkan adalah 6 cerita.', 'error', 'Batas Maksimal');
            addStoryRow();
        };
    }
    function addStoryRow(data = {}) {
        const container = document.getElementById('stories-container');
        if(!container) return;
        const div = document.createElement('div');
        const rowId = 'story-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9); // Unique ID for each row
        div.className = 'dynamic-item story-item';
        div.id = rowId;
        div.innerHTML = `
            <button type="button" class="remove-btn" onclick="this.parentElement.remove()">×</button>
            <div class="grid-2">
                <div class="input-group"><label>Judul Cerita <span class="no-star">(Opsional)</span></label><input type="text" class="story-title" value="${data.title || ''}" placeholder="Contoh: Pertama Kali Bertemu"></div>
                <div class="input-group"><label>Tanggal Kejadian <span class="no-star">(Opsional)</span></label><input type="text" class="story-date" value="${data.date || ''}" placeholder="Contoh: Januari 2020"></div>
            </div>
            <div class="input-group">
                <label>Deskripsi Cerita <span class="no-star">(Opsional)</span></label>
                <textarea class="story-desc" rows="3" placeholder="Ceritakan momen indah Anda...">${data.description || ''}</textarea>
            </div>
            <div class="input-group">
                <label>Foto Cerita <span class="no-star">(Opsional)</span></label>
                <input type="file" class="story-image-file" accept="image/*" onchange="handleStoryImageChange(this, '${rowId}')">
                <input type="hidden" class="story-image-url" value="${data.image || ''}">
                <div class="image-preview-box wide story-preview">
                    ${data.image ? `<img src="${data.image}"><button type="button" class="remove-preview-btn" onclick="removeStoryPhoto(this)">×</button>` : ''}
                </div>
            </div>`;
        if(data.image) div.querySelector('.story-preview').style.display = 'block';
        container.appendChild(div);
    }

    function renderDynamicGifts(items) {
        const container = document.getElementById('gifts-container');
        if(container) container.innerHTML = '';
        items.forEach(item => addGiftRow(item));
    }
    const addGiftBtn = document.getElementById('add-gift');
    if(addGiftBtn) {
        addGiftBtn.onclick = () => {
            const count = document.querySelectorAll('.gift-item').length;
             if (count >= 5) return showToast('Batas rekening kado/hadiah yang diperbolehkan adalah 5 rekening.', 'error', 'Batas Maksimal');
            addGiftRow();
        };
    }
    function addGiftRow(data = {}) {
        const container = document.getElementById('gifts-container');
        if(!container) return;
        const div = document.createElement('div');
        div.className = 'dynamic-item gift-item';
        
        const isCustomBank = data.bank && !bankLogos[data.bank];
        const selectedBank = isCustomBank ? 'Lainnya' : (data.bank || '');
        const currentLogo = isCustomBank ? (data.logo || '') : (bankLogos[selectedBank] || '');
        
        const optionsHtml = Object.keys(bankLogos).map(b => `<div class="custom-option" data-value="${b}">${b}</div>`).join('');
        
        div.innerHTML = `
            <button type="button" class="remove-btn" onclick="this.parentElement.remove()">×</button>
            <div class="grid-3">
                <div class="input-group">
                    <label>Pilih Bank/E-Wallet</label>
                    <div class="custom-select gift-bank-select">
                        <div class="custom-select-trigger" data-value="${selectedBank}">
                            <span>${selectedBank || '-- Pilih --'}</span>
                            <i class="fas fa-chevron-down"></i>
                        </div>
                        <div class="custom-options">
                            ${optionsHtml}
                            <div class="custom-option" data-value="Lainnya">Lainnya (Manual)</div>
                        </div>
                    </div>
                </div>
                <div class="input-group"><label>No. Rekening</label><input type="text" class="gift-acc-num" value="${data.accountNumber || ''}" placeholder="Nomor Rekening / HP"></div>
                <div class="input-group"><label>Nama Pemilik</label><input type="text" class="gift-acc-name" value="${data.accountName || ''}" placeholder="Nama Pemilik Akun"></div>
            </div>
            <div class="custom-bank-group" style="display: ${selectedBank === 'Lainnya' ? 'grid' : 'none'};">
                <div class="input-group"><label>Nama Bank Kustom</label><input type="text" class="gift-bank-custom" value="${isCustomBank ? data.bank : ''}" placeholder="Contoh: Bank Jatim / Seabank"></div>
                <div class="input-group"><label>URL Logo Kustom <span class="no-star">(Opsional)</span></label><input type="url" class="gift-logo-custom" value="${isCustomBank ? (data.logo || '') : ''}" placeholder="https://link-logo.png"></div>
            </div>`;
        container.appendChild(div);

        // Initialize custom select for this row
        const select = div.querySelector('.custom-select');
        const trigger = select.querySelector('.custom-select-trigger');
        const options = select.querySelectorAll('.custom-option');
        const customGroup = div.querySelector('.custom-bank-group');

        trigger.onclick = () => {
            // Close other open selects
            document.querySelectorAll('.custom-select.open').forEach(s => {
                if(s !== select) s.classList.remove('open');
            });
            select.classList.toggle('open');
        };

        options.forEach(opt => {
            opt.onclick = () => {
                const val = opt.getAttribute('data-value');
                trigger.setAttribute('data-value', val);
                trigger.querySelector('span').innerText = val;
                select.classList.remove('open');
                
                if (val === 'Lainnya') {
                    customGroup.style.display = 'grid';
                } else {
                    customGroup.style.display = 'none';
                }
            };
        });
    }

    // Close selects when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.custom-select')) {
            document.querySelectorAll('.custom-select.open').forEach(s => s.classList.remove('open'));
        }
    });

    initSocialDropdowns();

    // --- CROPPER LOGIC ---
    const cropModal = document.getElementById('crop-modal');
    const cropImgEl = document.getElementById('crop-image-element');
    const btnCancelCrop = document.getElementById('btn-cancel-crop');
    const btnApplyCrop = document.getElementById('btn-apply-crop');

    const setupCropper = (inputId, aspectRatio, title) => {
        const input = document.getElementById(inputId);
        if(!input) return;

        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            currentCropTarget = inputId;
            const reader = new FileReader();
            reader.onload = (event) => {
                document.getElementById('crop-modal-title').innerText = title;
                cropImgEl.src = event.target.result;
                cropModal.style.display = 'flex';
                
                if (cropper) cropper.destroy();
                cropper = new Cropper(cropImgEl, {
                    aspectRatio: aspectRatio,
                    viewMode: 1,
                    background: false
                });
            };
            reader.readAsDataURL(file);
        };
    };

    // Initialize Croppers for all photo fields
    setupCropper('groom-photo-file', 1 / 1, 'Potong Foto Mempelai Pria');
    setupCropper('bride-photo-file', 1 / 1, 'Potong Foto Mempelai Wanita');
    setupCropper('cover-photo-file', 1 / 1, 'Potong Foto Cover Depan');
    setupCropper('thumb-photo-file', 1.91 / 1, 'Potong Foto Thumbnail Sosmed');

    btnCancelCrop.onclick = () => {
        cropModal.style.display = 'none';
        if (currentCropTarget) {
            const el = document.getElementById(currentCropTarget);
            if (el) {
                if (el.tagName === 'INPUT') {
                    el.value = '';
                } else {
                    // Target adalah baris dinamis (seperti Cerita Cinta)
                    const fileInput = el.querySelector('input[type="file"]');
                    if (fileInput) fileInput.value = '';
                }
            }
        }
    };

    btnApplyCrop.onclick = () => {
        const isThumb = currentCropTarget === 'thumb-photo-file';
        const canvas = cropper.getCroppedCanvas({
            width: isThumb ? 1200 : 800,
            height: isThumb ? 630 : 800
        });

        canvas.toBlob((blob) => {
            croppedBlobs[currentCropTarget] = blob;
            const url = URL.createObjectURL(blob);
            const previewId = currentCropTarget.replace('-file', '-preview');
            setPreview(previewId, url);
            cropModal.style.display = 'none';
        }, 'image/jpeg', 0.8);
    };

    // --- DYNAMIC STORY PHOTO CROP ---
    window.handleStoryImageChange = (input, rowId) => {
        const file = input.files[0];
        if (!file) return;

        currentCropTarget = rowId; // Use rowId to identify the target
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('crop-modal-title').innerText = 'Potong Foto Cerita Cinta';
            cropImgEl.src = e.target.result;
            cropModal.style.display = 'flex';
            if (cropper) cropper.destroy();
            cropper = new Cropper(cropImgEl, {
                aspectRatio: 16 / 9, // Cinematic Landscape for stories
                viewMode: 1,
                background: false
            });
        };
        reader.readAsDataURL(file);
    };

    // Modify btnApplyCrop to handle dynamic rows as well
    const originalApplyCrop = btnApplyCrop.onclick;
    btnApplyCrop.onclick = () => {
        if (currentCropTarget.startsWith('story-')) {
            const canvas = cropper.getCroppedCanvas({ width: 1280, height: 720 });
            canvas.toBlob((blob) => {
                const row = document.getElementById(currentCropTarget);
                if (row) {
                    const preview = row.querySelector('.story-preview');
                    const urlInput = row.querySelector('.story-image-url');
                    const url = URL.createObjectURL(blob);
                    
                    // Store the blob in the row element for saving later
                    row.dataset.croppedBlob = 'true';
                    row._croppedBlob = blob;

                    preview.innerHTML = `
                        <img src="${url}">
                        <button type="button" class="remove-preview-btn" onclick="removeStoryPhoto(this)">×</button>
                    `;
                    preview.style.display = 'block';
                }
                cropModal.style.display = 'none';
            }, 'image/jpeg', 0.8);
        } else {
            originalApplyCrop();
        }
    };

    window.removeStoryPhoto = (btn) => {
        const preview = btn.parentElement;
        const row = preview.closest('.story-item');
        if (!row) return;

        // Hide preview
        preview.style.display = 'none';
        preview.innerHTML = '';

        // Clear file input
        const fileInput = row.querySelector('.story-image-file');
        if (fileInput) fileInput.value = '';

        // Clear hidden URL input
        const urlInput = row.querySelector('.story-image-url');
        if (urlInput) urlInput.value = '';

        // Delete cropped blob state
        delete row._croppedBlob;
    };

    // BRANDING LOGIC
    async function fetchBrandName() {
        try {
            const cachedBrand = localStorage.getItem('bizBrandName');
            if (cachedBrand) {
                document.querySelectorAll('.brand-info span').forEach(el => el.innerText = cachedBrand);
                document.title = "Editor Undangan | " + cachedBrand;
            }

            const { data, error } = await window.supabaseClient
                .from('admin_settings')
                .select('value')
                .eq('key', 'business_name')
                .maybeSingle();

            if (data && data.value) {
                const name = data.value.toUpperCase();
                localStorage.setItem('bizBrandName', name);
                document.querySelectorAll('.brand-info span').forEach(el => el.innerText = name);
                document.title = "Editor Undangan | " + data.value;
            }
        } catch (err) {
            console.error('Error fetching brand:', err);
        }
    }
    fetchBrandName();
    checkSession();
});

function initSocialDropdowns() {
    const socialOptions = [
        { name: 'Instagram', icon: 'fab fa-instagram', val: 'instagram' },
        { name: 'TikTok', icon: 'fab fa-tiktok', val: 'tiktok' },
        { name: 'WhatsApp', icon: 'fab fa-whatsapp', val: 'whatsapp' }
    ];

    ['groom', 'bride'].forEach(role => {
        const container = document.getElementById(`${role}-social-select-wrapper`);
        if (!container) return;
        container.innerHTML = `<div class="custom-select" id="${role}-social-select"><div class="custom-select-trigger" data-value="instagram"><span><i class="fab fa-instagram"></i> Instagram</span><i class="fas fa-chevron-down"></i></div><div class="custom-options">${socialOptions.map(opt => `<div class="custom-option" data-value="${opt.val}"><i class="${opt.icon}"></i> ${opt.name}</div>`).join('')}</div></div>`;
        const select = container.querySelector('.custom-select');
        const trigger = select.querySelector('.custom-select-trigger');
        const options = select.querySelectorAll('.custom-option');
        if(trigger){
            trigger.onclick = () => select.classList.toggle('open');
            options.forEach(opt => {
                opt.onclick = () => {
                    trigger.setAttribute('data-value', opt.getAttribute('data-value'));
                    trigger.innerHTML = `${opt.innerHTML} <i class="fas fa-chevron-down"></i>`;
                    select.classList.remove('open');
                };
            });
        }
    });
}
