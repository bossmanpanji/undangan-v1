document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const pathname = window.location.pathname;
    const hostname = window.location.hostname;
    
    const reserved = ['admin', 'editor', 'login', 'assets', 'api', 'index.html', '/login/', 'app'];
    
    // 1. HYBRID SLUG DETECTION
    let slug = window.FORCE_SLUG || urlParams.get('u');
    const isAppSubdomain = hostname.startsWith('app.');
    const isWwwSubdomain = hostname.startsWith('www.');

    // Jika belum ada slug (bukan via worker/query), deteksi dari subdomain atau path
    if (!slug) {
        const parts = hostname.split('.');
        const isHostingPlatform = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('run.app') || hostname.includes('webcontainer') || hostname.includes('aistudio') || hostname.includes('google') || hostname.includes('vercel.app') || hostname.includes('pages.dev') || hostname.includes('netlify.app');
        
        // Cek jika ini subdomain kustom (misal: budi.domain.com), BUKAN link bawaan Vercel/Pages
        if (parts.length > 2 && !isAppSubdomain && !isWwwSubdomain && !isHostingPlatform) {
            slug = parts[0];
        } else {
            // Cek jika ini path (misal: domain.com/budi)
            const pathSlug = pathname.split('/')[1];
            if (pathSlug && !reserved.includes(pathSlug)) {
                slug = pathSlug;
            }
        }
    }

    // Jika di subdomain sistem, pastikan slug kosong agar tidak render undangan
    if (isAppSubdomain || isWwwSubdomain) {
        slug = null;
    }

    if (window.AOS) AOS.init({ duration: 1000, once: true, offset: 0 });

    const guest = urlParams.get('to');
    if (guest) {
        const guestEl = document.getElementById('guest-name');
        if (guestEl) guestEl.innerText = guest;

        const wishNameInput = document.getElementById('wish-name');
        if (wishNameInput) {
            wishNameInput.value = guest;
            wishNameInput.readOnly = true;
            wishNameInput.style.background = 'rgba(184, 134, 11, 0.1)';
        }
    }

    if (slug) {
        initApp(slug);
    } else {
        const currentFile = pathname.split('/').pop();
        
        // JIKA DI APP SUBDOMAIN DAN AKSES ROOT (/), PAKSA KE LOGIN
        if (hostname.startsWith('app.') && (pathname === '/' || pathname === '')) {
            window.location.href = '/login/';
            return;
        }

        if (!['/login/', '/editor/', '/admin/'].includes(currentFile)) {
            window.location.href = '/';
        }
    }
});

// --- FAVICON HELPER ---
const setFavicon = (type) => {
    // Platform: Crown (Gold), Wedding: Heart (Pink)
    const iconUrl = (type === 'wedding') 
        ? "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Cpath fill='%23e91e63' d='M462.3 62.6C407.5 15.9 326 24.3 275.7 76.2L256 96.5l-19.7-20.3C186.1 24.3 104.5 15.9 49.7 62.6c-62.8 53.6-66.1 149.8-9.9 207.9l193.5 199.8c12.5 12.9 32.8 12.9 45.3 0l193.5-199.8c56.3-58.1 53-154.3-9.8-207.9z'/%3E%3C/svg%3E"
        : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Cpath fill='%23b8860b' d='M512 128l-81 126L311 96l-55 80-55-80L80 254l-80-126v256h512V128z'/%3E%3C/svg%3E";

    // Bersihkan favicon lama agar tidak tumpang tindih
    const existingIcons = document.querySelectorAll("link[rel~='icon']");
    existingIcons.forEach(icon => icon.parentNode.removeChild(icon));

    // Pasang favicon baru
    const link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/svg+xml';
    link.href = iconUrl;
    document.getElementsByTagName('head')[0].appendChild(link);
    console.log(`Favicon set to: ${type}`);
};

async function initApp(slug) {
    await fetchBrandName();
    console.log("Memuat Undangan untuk Slug:", slug);
    setFavicon('wedding'); // Set to Heart for Invitations
    try {
        let configData;
        let createdAt;
        let expiryLimit = 90;

        if (slug === 'demo4' || slug === 'demo-heritage') {
            window.location.href = `/themes/heritage/index.html${window.location.search}`;
            return;
        }

        if (slug === 'demo5' || slug === 'demo-botanical') {
            window.location.href = `/themes/botanical/index.html${window.location.search}`;
            return;
        }

        if (slug === 'demo' || slug === 'demo2' || slug === 'demo3') {
            if (!window.config) throw new Error("Data demo tidak tersedia");
            const c = window.config;
            let theme = 'royal-gold';
            if (slug === 'demo2') theme = 'floral-light';
            if (slug === 'demo3') theme = 'midnight-dark';
            
            configData = {
                ...c,
                theme: theme,
                overlayImage: c.coverImage,
                couple: {
                    groom: { ...c.couple.groom, father: "Hendra Wibowo", mother: "Wirda Wahyuni" },
                    bride: { ...c.couple.bride, father: "Daniswara Permadi", mother: "Yuliana Lestari" }
                },
                stories: c.stories.map(s => ({ title: s.title, date: s.date, description: s.description, image: s.image })),
                gifts: c.gifts.map(g => ({ bank: g.bankName, accountNumber: g.accountNumber, accountName: g.accountHolder, logo: g.logo })),
                events: c.events.map((ev, idx) => ({
                    title: ev.title,
                    date: idx === 0 ? '2029-12-13' : (idx === 1 ? '2029-12-14' : '2029-12-16'),
                    startTime: ev.startTime || (ev.time ? ev.time.split(' - ')[0] : '08:00'),
                    endTime: ev.endTime || (ev.time && ev.time.includes(' - ') ? ev.time.split(' - ')[1].split(' ')[0] : 'Selesai'),
                    location: ev.location,
                    address: ev.address,
                    mapsUrl: ev.mapsUrl,
                    entertainment: ev.entertainment
                }))
            };
            createdAt = new Date().toISOString();
        } else {
            const { data, error } = await window.supabaseClient.from('invitations').select('config, created_at, expiry_days').ilike('slug', slug).maybeSingle();
            
            if (error) throw error;
            if (!data) {
                const baseDomain = window.BASE_DOMAIN;
                
                // Jika base domain diketahui dan ini adalah subdomain yang salah, arahkan ke base domain
                if (baseDomain && hostname !== baseDomain && !hostname.startsWith('www.') && !hostname.startsWith('app.')) {
                    window.location.href = `https://${baseDomain}`;
                    return;
                }

                // FALLBACK CERDAS: Jika akses dilakukan di root (/) dan data tidak ditemukan,
                // kemungkinan besar ini adalah domain utama (misal: domain.my.id salah dianggap slug "domain").
                // Atau, pengunjung mengakses subdomain yang memang tidak ada.
                // Solusi terbaik: Tampilkan Landing Page (Katalog) alih-alih pesan error 404.
                if (pathname === '/' || pathname === '') {
                    console.log("Slug tidak ditemukan, redirect ke Landing Page...");
                    window.location.href = '/';
                    return;
                }

                showPremiumError("404 - Halaman Tidak Ditemukan", `Maaf, link dengan nama <b>"${slug}"</b> tidak terdaftar di sistem kami. Silakan periksa kembali URL atau hubungi pengundang.`);
                return;
            }

            configData = data.config;
            createdAt = data.created_at;
            expiryLimit = data.expiry_days || 90;
        }
        
        // --- 1. CEK MASA AKTIF (EXPIRATION CHECK) ---
        const createdDate = new Date(createdAt);
        const diffDays = Math.ceil(Math.abs(new Date() - createdDate) / (1000 * 60 * 60 * 24));
        if (slug !== 'demo' && diffDays > expiryLimit) {
            showPremiumError("Masa Aktif Berakhir", "Mohon maaf, masa aktif undangan digital ini telah berakhir. Silakan hubungi admin untuk perpanjangan layanan.");
            return;
        }

        // --- 2. CEK JIKA DATA MASIH KOSONG (BARU DIBUAT ADMIN) ---
        const c = configData || {};
        if (!c.couple?.groom?.fullname && !c.couple?.bride?.fullname) {
            showPremiumError("Sedang Dipersiapkan", "Kabar bahagia segera datang! Halaman undangan ini sedang dalam tahap persiapan data oleh calon mempelai. Silakan berkunjung kembali nanti.");
            return;
        }

        const config = configData;
        
        if (config.theme === 'heritage-series') {
            window.location.href = `/themes/heritage/index.html${window.location.search}`;
            return;
        }
        if (config.theme === 'modern-botanical') {
            window.location.href = `/themes/botanical/index.html${window.location.search}`;
            return;
        }

        // --- APPLY THEME ---
        document.body.className = config.theme || 'royal-gold';
        
        const groom = config.couple?.groom || {};
        const bride = config.couple?.bride || {};
        
        // --- UPDATE DYNAMIC TITLE ---
        document.title = `The Wedding of ${groom.name || 'Pria'} & ${bride.name || 'Wanita'}`;
        
        // --- UPDATE META TAGS ---
        const mTitle = `The Wedding of ${groom.name || 'Pria'} & ${bride.name || 'Wanita'}`;
        const mDesc = `Tanpa mengurangi rasa hormat, kami bermaksud mengundang Anda untuk hadir di hari bahagia kami.`;
        const mThumb = config.ogImage || config.coverImage || 'https://i.ibb.co.com/mF5cNnTr/thumbnail.jpg';
        updateMetaTags(mTitle, mDesc, mThumb);
        
        // --- ISI DATA ---
        document.querySelectorAll('#groom-name, .groom-name, #groom-name-mini, #groom-name-footer').forEach(el => el.innerText = groom.name || 'Pria');
        document.querySelectorAll('#bride-name, .bride-name, #bride-name-mini, #bride-name-footer').forEach(el => el.innerText = bride.name || 'Wanita');
        document.querySelectorAll('#groom-fullname, .groom-fullname').forEach(el => el.innerText = groom.fullname || 'Nama Lengkap Pria');
        document.querySelectorAll('#bride-fullname, .bride-fullname').forEach(el => el.innerText = bride.fullname || 'Nama Lengkap Wanita');
        
        if (document.getElementById('groom-parents')) document.getElementById('groom-parents').innerText = groom.sonOf || `Putra dari Bapak ${groom.father || '...'} & Ibu ${groom.mother || '...'}`;
        if (document.getElementById('bride-parents')) document.getElementById('bride-parents').innerText = bride.daughterOf || `Putri dari Bapak ${bride.father || '...'} & Ibu ${bride.mother || '...'}`;
        
        if (document.getElementById('groom-image')) document.getElementById('groom-image').src = groom.image || '';
        if (document.getElementById('bride-image')) document.getElementById('bride-image').src = bride.image || '';
        if (document.getElementById('overlay-couple-image')) document.getElementById('overlay-couple-image').src = config.coverImage || groom.image || '';

        setupSocialLink('groom-ig', groom.instagram, groom.socialIcon);
        setupSocialLink('bride-ig', bride.instagram, bride.socialIcon);

        const defaultQuotes = "“Dan di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang.” (QS. Ar-Rum: 21)";
        if (document.getElementById('quote-text')) document.getElementById('quote-text').innerText = (config.quotes && config.quotes.trim() !== '') ? config.quotes : defaultQuotes;

        renderInvitationEvents(config.events);
        toggleSection('story', config.stories, renderInvitationStories);
        toggleSection('gallery', config.gallery, renderInvitationGallery);
        toggleSection('gifts', config.gifts, renderInvitationGifts);
        toggleSection('video', config.youtubeUrl, setupVideo);
        
        const audio = document.getElementById('background-music');
        if (audio) {
            // Gunakan link musik instrumen yang lebih stabil sebagai cadangan
            const defaultMusic = "https://www.dropbox.com/scl/fi/pbtl6lwtv07kxgmdd0gnu/music.mp3?rlkey=u1xr764r3lumkbdl5ds2zt2ex&st=8f6aeui9&raw=1";
            const musicUrl = config.music || config.backgroundMusic;
            audio.src = (musicUrl && musicUrl.trim() !== '') ? musicUrl : defaultMusic;
            audio.volume = 1.0;
            audio.load();
            console.log("Music Source Loaded:", audio.src);
        }

        // Auto-detect countdown from "Resepsi" event
        const resepsiEvent = (config.events || []).find(ev => ev.title.toLowerCase().includes('resepsi'));
        if (resepsiEvent && resepsiEvent.date && resepsiEvent.startTime) {
            setupCountdown(`${resepsiEvent.date}T${resepsiEvent.startTime}`);
        } else if (config.countdownDate) {
            setupCountdown(config.countdownDate);
        }
        
        let heroDate = "";
        if (resepsiEvent && resepsiEvent.date) {
            heroDate = resepsiEvent.date;
            const d = new Date(resepsiEvent.date);
            if (!isNaN(d)) {
                heroDate = d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
            }
        } else if (config.weddingDate) {
            heroDate = config.weddingDate;
            const d = new Date(config.weddingDate);
            if (!isNaN(d)) {
                heroDate = d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
            }
        }
        if (heroDate) {
            const heroDateEl = document.getElementById('wedding-date-hero');
            if (heroDateEl) heroDateEl.innerText = heroDate.toUpperCase();
        }

        loadWishes(slug);

        // --- ORDER MODAL FOR DEMO ---
        if (['demo', 'demo2', 'demo3'].includes(slug)) {
            const themeName = slug === 'demo' ? 'Royal Gold' : (slug === 'demo2' ? 'Floral Light' : 'Midnight Dark');
            
            // 1. Inject Modal HTML
            const modalHTML = `
                <div id="demo-order-modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); z-index:100000; justify-content:center; align-items:center; backdrop-filter:blur(10px); font-family:'Inter', sans-serif;">
                    <div style="background:#1a120b; width:90%; max-width:450px; padding:35px; border-radius:24px; border:1px solid rgba(184,134,11,0.3); position:relative; box-shadow:0 25px 50px rgba(0,0,0,0.5);">
                        <button id="demo-modal-close" style="position:absolute; top:20px; right:20px; background:none; border:none; color:#fff; font-size:24px; cursor:pointer; opacity:0.6;">&times;</button>
                        <h3 style="color:#b8860b; margin-top:0; font-family:'Cinzel Decorative', cursive; font-size:1.4rem;">Form Pemesanan</h3>
                        <p style="color:#aaa; font-size:0.9rem; margin-bottom:25px;">Lengkapi data di bawah untuk memesan tema ini.</p>
                        
                        <form id="demo-order-form">
                            <div style="margin-bottom:20px;">
                                <label style="display:block; color:#fff; font-size:0.85rem; margin-bottom:8px; font-weight:600; text-transform:uppercase; letter-spacing:1px;">Nama Anda (Pria-Wanita) <span style="color:#e74c3c;">*</span></label>
                                <input type="text" id="demo-order-nama" placeholder="Contoh: ozy-zelda" required pattern="^[a-zA-Z]+-[a-zA-Z]+$" style="width:100%; padding:14px; background:rgba(255,255,255,0.05); border:1px solid rgba(184,134,11,0.2); border-radius:12px; color:#fff; box-sizing:border-box;">
                            </div>
                            <div style="margin-bottom:20px;">
                                <label style="display:block; color:#fff; font-size:0.85rem; margin-bottom:8px; font-weight:600; text-transform:uppercase; letter-spacing:1px;">Tema Undangan</label>
                                <select id="demo-order-tema" disabled style="width:100%; padding:14px; background:rgba(255,255,255,0.05); border:1px solid rgba(184,134,11,0.2); border-radius:12px; color:#fff; opacity:0.7; appearance:none;">
                                    <option value="${themeName}">${themeName}</option>
                                </select>
                            </div>
                            <div style="margin-bottom:25px;">
                                <label style="display:block; color:#fff; font-size:0.85rem; margin-bottom:8px; font-weight:600; text-transform:uppercase; letter-spacing:1px;">Durasi Aktif <span style="color:#e74c3c;">*</span></label>
                                <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:10px;">
                                    <label style="background:rgba(255,255,255,0.05); border:1px solid rgba(184,134,11,0.2); padding:10px; border-radius:10px; text-align:center; color:#fff; cursor:pointer; font-size:0.8rem; transition:0.3s;">
                                        <input type="radio" name="demo-durasi" value="1" style="display:none;"> 1 Bln
                                    </label>
                                    <label style="background:rgba(255,255,255,0.05); border:1px solid rgba(184,134,11,0.2); padding:10px; border-radius:10px; text-align:center; color:#fff; cursor:pointer; font-size:0.8rem; transition:0.3s;">
                                        <input type="radio" name="demo-durasi" value="2" style="display:none;"> 2 Bln
                                    </label>
                                    <label style="background:rgba(255,255,255,0.05); border:1px solid rgba(184,134,11,0.2); padding:10px; border-radius:10px; text-align:center; color:#fff; cursor:pointer; font-size:0.8rem; transition:0.3s;">
                                        <input type="radio" name="demo-durasi" value="3" checked style="display:none;"> 3 Bln
                                    </label>
                                </div>
                            </div>
                            <button type="submit" style="width:100%; padding:16px; background:#b8860b; color:#1a120b; border:none; border-radius:14px; font-weight:bold; cursor:pointer; text-transform:uppercase; letter-spacing:1px; transition:0.3s; display:flex; align-items:center; justify-content:center; gap:10px;">
                                PESAN SEKARANG <i class="fab fa-whatsapp"></i>
                            </button>
                        </form>
                    </div>
                </div>
            `;
            const div = document.createElement('div');
            div.innerHTML = modalHTML;
            document.body.appendChild(div);

            // 2. Inject CSS for radio behavior
            if (!document.getElementById('demo-modal-css')) {
                const style = document.createElement('style');
                style.id = 'demo-modal-css';
                style.innerHTML = `
                    @keyframes pulse-green {
                        0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(37, 211, 102, 0.7); }
                        70% { transform: scale(1.05); box-shadow: 0 0 0 15px rgba(37, 211, 102, 0); }
                        100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(37, 211, 102, 0); }
                    }
                    #demo-order-form label:has(input:checked) {
                        background: rgba(184, 134, 11, 0.2) !important;
                        border: 1px solid #b8860b !important;
                    }
                    @media (max-width: 768px) {
                        #floating-order-btn { bottom: 150px !important; right: 15px !important; padding: 10px 20px !important; font-size: 0.8rem !important; }
                    }
                `;
                document.head.appendChild(style);
            }

            // 3. Floating Button Logic
            const floatingBtn = document.createElement('button');
            floatingBtn.id = "floating-order-btn";
            floatingBtn.innerHTML = `<i class="fab fa-whatsapp"></i> PESAN TEMA INI`;
            floatingBtn.style = `
                position: fixed; bottom: 85px; right: 20px; z-index: 9999;
                background: #25d366; color: #fff; padding: 12px 25px; border:none;
                border-radius: 50px; font-weight: bold; cursor:pointer;
                box-shadow: 0 5px 20px rgba(0,0,0,0.3); display: none; align-items: center; gap: 10px;
                font-family: 'Inter', sans-serif; font-size: 0.9rem; animation: pulse-green 2s infinite;
            `;
            document.body.appendChild(floatingBtn);

            const modal = document.getElementById('demo-order-modal');
            floatingBtn.onclick = () => { modal.style.display = 'flex'; };
            document.getElementById('demo-modal-close').onclick = () => { modal.style.display = 'none'; };
            modal.onclick = (e) => { if(e.target === modal) modal.style.display = 'none'; };

            // 4. Form Submit & Price Logic
            const form = document.getElementById('demo-order-form');
            const submitBtn = form.querySelector('button[type="submit"]');
            const themeId = slug === 'demo' ? 'royal-gold' : (slug === 'demo2' ? 'floral-light' : 'midnight-dark');

            const updateModalPrice = () => {
                const dur = form.querySelector('input[name="demo-durasi"]:checked').value;
                const pricing = window.appSettings?.theme_pricing || {};
                const price = pricing[themeId]?.[dur] || pricing['global']?.[dur];
                
                if (price) {
                    const formatted = 'Rp' + parseInt(price).toLocaleString('id-ID');
                    submitBtn.innerHTML = `PESAN SEKARANG — ${formatted} <i class="fab fa-whatsapp"></i>`;
                } else {
                    submitBtn.innerHTML = `PESAN SEKARANG <i class="fab fa-whatsapp"></i>`;
                }
            };

            // Listen for duration changes
            form.querySelectorAll('input[name="demo-durasi"]').forEach(radio => {
                radio.addEventListener('change', updateModalPrice);
            });

            form.onsubmit = (e) => {
                e.preventDefault();
                const nama = document.getElementById('demo-order-nama').value.trim();
                const durasi = form.querySelector('input[name="demo-durasi"]:checked').value;
                const ownerWA = window.appSettings?.owner_whatsapp || '';
                
                const pricing = window.appSettings?.theme_pricing || {};
                const price = pricing[themeId]?.[durasi] || pricing['global']?.[durasi];
                const formattedPrice = price ? 'Rp' + parseInt(price).toLocaleString('id-ID') : '';

                const bizName = window.appSettings?.business_name ? window.appSettings.business_name.toUpperCase() : 'PREMIUM';
                const msg = `*PEMESANAN UNDANGAN DIGITAL ${bizName}*%0A%0A` +
                    `Halo Admin, saya tertarik untuk memesan undangan digital dengan detail sebagai berikut:%0A%0A` +
                    `- *Nama/Slug:* ${nama}%0A` +
                    `- *Pilihan Tema:* ${themeName}%0A` +
                    `- *Masa Aktif:* ${durasi} bulan%0A` +
                    (formattedPrice ? `- *Estimasi Harga:* ${formattedPrice}%0A%0A` : `%0A`) +
                    `Mohon untuk dibantu memproses pesanan ini. Terima kasih!`;

                window.open(`https://wa.me/${ownerWA}?text=${msg}`, '_blank');
                modal.style.display = 'none';
            };

            // Initial price check
            updateModalPrice();

            // Disable Guestbook Form for Demo
            setTimeout(() => {
                const wishName = document.getElementById('wish-name');
                const wishMsg = document.getElementById('wish-message');
                const btnSend = document.getElementById('btn-send-wish');
                if (wishName) { wishName.disabled = true; wishName.placeholder = "Fitur dinonaktifkan untuk DEMO"; }
                if (wishMsg) { wishMsg.disabled = true; wishMsg.placeholder = "Ucapan tidak dapat dikirim di halaman DEMO"; }
                if (btnSend) {
                    btnSend.disabled = true;
                    btnSend.innerHTML = '<i class="fas fa-lock"></i> Fitur Terkunci (Demo)';
                    btnSend.style.opacity = '0.5';
                    btnSend.style.cursor = 'not-allowed';
                }
            }, 1000);
        }

        // --- TOMBOL BUKA UNDANGAN ---
        const btnOpen = document.getElementById('btn-open-invitation');
        if (btnOpen) {
            btnOpen.onclick = () => {
                const overlay = document.getElementById('overlay');
                const mainContent = document.getElementById('main-content');
                
                overlay.style.opacity = '0';
                overlay.style.transition = 'opacity 0.8s ease';
                
                setTimeout(() => {
                    overlay.style.display = 'none';
                    mainContent.style.display = 'block';
                    
                    // Memicu efek transisi CSS (opacity 1)
                    setTimeout(() => {
                        mainContent.classList.add('show');
                    }, 50);

                    document.getElementById('music-control').style.display = 'block';
                    document.getElementById('bottom-nav').style.display = 'flex';
                    document.getElementById('rsvp').style.display = 'block';
                    
                    const floatingOrder = document.getElementById('floating-order-btn');
                    if (floatingOrder) floatingOrder.style.display = 'flex';

                    // FORCE HERO VISIBILITY
                    const heroContainer = document.querySelector('.hero-container');
                    if (heroContainer) {
                        heroContainer.style.opacity = '1';
                        heroContainer.style.transform = 'none';
                        heroContainer.style.visibility = 'visible';
                    }

                    // PAKSA SEMUA ELEMEN LAIN MUNCUL
                    document.querySelectorAll('[data-aos]').forEach(el => {
                        el.classList.add('aos-animate');
                        el.style.opacity = '1';
                        el.style.transform = 'none';
                        el.style.visibility = 'visible';
                    });

                    // Start Music with fallback
                    if (audio) {
                        const playPromise = audio.play();
                        if (playPromise !== undefined) {
                            playPromise.then(() => {
                                console.log("Music started playing successfully");
                                if (btnMusic) btnMusic.classList.add('pulse');
                            }).catch(err => {
                                console.warn("Music play blocked by browser. User must click music button manually.", err);
                                isPlaying = false;
                                if (btnMusic) {
                                    btnMusic.innerHTML = '<i class="fas fa-play"></i>';
                                    btnMusic.classList.remove('pulse');
                                }
                            });
                        }
                    }
                    if (window.AOS) AOS.refresh();
                    if (window.particlesJS) setupParticles();
                }, 500);
            };
        }

        // --- RSVP BUTTON LISTENER ---
        const btnSendWish = document.getElementById('btn-send-wish');
        if (btnSendWish) {
            btnSendWish.onclick = () => sendWish(slug);
        }

        const btnMusic = document.getElementById('btn-music');
        let isPlaying = true;
        window.toggleMusic = () => {
            if (!audio) return;
            if (isPlaying) { audio.pause(); btnMusic.innerHTML = '<i class="fas fa-play"></i>'; btnMusic.classList.remove('pulse'); }
            else { audio.play(); btnMusic.innerHTML = '<i class="fas fa-pause"></i>'; btnMusic.classList.add('pulse'); }
            isPlaying = !isPlaying;
        };
        if (btnMusic) btnMusic.onclick = window.toggleMusic;
        
        fetchBrandName();

    } catch (err) { 
        console.error("Init Error:", err);
        // Jika tidak ketemu atau error, arahkan ke Landing Page
        window.location.href = '/';
    }
}

function setupSocialLink(id, username, iconClass) {
    const el = document.getElementById(id);
    if (!el) return;
    const cleanUsername = username ? username.trim() : '';
    if (cleanUsername !== '' && cleanUsername !== '@' && cleanUsername !== '-') {
        let url = cleanUsername;
        const icon = iconClass || 'fab fa-instagram';
        
        // UPDATE ICON CLASS
        const iconEl = el.querySelector('i');
        if (iconEl) iconEl.className = icon;

        if (!url.startsWith('http')) {
            if (icon.includes('instagram')) url = `https://instagram.com/${cleanUsername.replace('@', '')}`;
            else if (icon.includes('tiktok')) url = `https://tiktok.com/@${cleanUsername.replace('@', '')}`;
            else url = `https://google.com/search?q=${cleanUsername}`;
        }
        el.href = url; el.style.display = 'inline-flex';
        const span = el.querySelector('span'); if (span) span.innerText = cleanUsername;
    } else { 
        el.style.display = 'none'; 
    }
}

function toggleSection(id, data, renderFn) {
    const section = document.getElementById(id);
    if (!section) return;
    if (data && (Array.isArray(data) ? data.length > 0 : (data.trim && data.trim() !== ''))) {
        section.style.display = 'block';
        if (renderFn) renderFn(data);
    } else { section.style.display = 'none'; }
}

function renderInvitationEvents(events) {
    const container = document.getElementById('events-container');
    if (!container || !events) return;
    container.innerHTML = '<h2 class="section-title">Detail Acara</h2>';
    events.forEach(event => {
        const card = document.createElement('div');
        card.className = 'event-card';
        card.innerHTML = `
            <i class="fas fa-calendar-alt" style="font-size: 3rem; color: var(--primary-color); margin-bottom: 20px; display: block;"></i>
            <h3>${event.title}</h3>
            <div class="javanese-divider" style="margin: 15px auto;"></div>
            <div class="event-info">
                <p><strong>Hari/Tanggal:</strong><br>${event.date ? new Date(event.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '...'}</p>
                <p><strong>Waktu:</strong><br>${event.startTime || '...'} s/d ${event.endTime || 'Selesai'}</p>
                <p><strong>Tempat:</strong><br>${event.location || '...'}<br><small>${event.address || ''}</small></p>
                ${event.entertainment ? `<p><strong>Hiburan:</strong><br>${event.entertainment}</p>` : ''}
            </div>
            ${event.mapsUrl ? `<a href="${event.mapsUrl}" target="_blank" class="btn-premium btn-small">Lihat Google Maps</a>` : ''}
        `;
        container.appendChild(card);
    });
}

function renderInvitationStories(stories) {
    const container = document.getElementById('story-timeline');
    if (!container) return;
    container.innerHTML = '';
    stories.forEach((story, index) => {
        const item = document.createElement('div');
        item.className = `timeline-item ${index % 2 === 0 ? 'left' : 'right'}`;
        item.innerHTML = `
            <div class="timeline-dot"></div>
            <div class="timeline-content" data-aos="${index % 2 === 0 ? 'fade-right' : 'fade-left'}">
                ${story.image ? `<img src="${story.image}" alt="${story.title || 'Cerita'}" style="width: 100%; border-radius: 12px; margin-bottom: 15px; border: 1px solid var(--primary-color);">` : ''}
                <div class="story-details">
                    <div class="timeline-date">${story.date || ''}</div>
                    <h3 style="color: var(--primary-color); font-family: 'Cinzel Decorative', cursive; font-size: 1.2rem; margin-bottom: 10px;">${story.title || ''}</h3>
                    <p>${story.description || ''}</p>
                </div>
            </div>`;
        container.appendChild(item);
    });
}

function renderInvitationGallery(gallery) {
    const container = document.getElementById('gallery-grid');
    if (!container) return;
    container.innerHTML = '';
    gallery.forEach(imgUrl => {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        item.innerHTML = `<img src="${imgUrl}" alt="Gallery" onclick="openLightbox('${imgUrl}')">`;
        container.appendChild(item);
    });
}

function renderInvitationGifts(gifts) {
    const container = document.getElementById('gifts-grid');
    if (!container) return;
    container.innerHTML = '';
    
    // Fungsi cadangan jika di database link logonya belum terupdate
    const getFallbackLogo = (name) => {
        const n = name.toLowerCase();
        if (n.includes('bca')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Bank_Central_Asia.svg/960px-Bank_Central_Asia.svg.png';
        if (n.includes('mandiri')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Bank_Mandiri_logo_2016.svg/250px-Bank_Mandiri_logo_2016.svg.png';
        if (n.includes('bni')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Bank_Negara_Indonesia_logo_%282004%29.svg/250px-Bank_Negara_Indonesia_logo_%282004%29.svg.png';
        if (n.includes('bri')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/BRI_2025.svg/960px-BRI_2025.svg.png';
        if (n.includes('bsi')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Bank_Syariah_Indonesia.svg/960px-Bank_Syariah_Indonesia.svg.png';
        if (n.includes('dana')) return 'https://upload.wikimedia.org/wikipedia/commons/7/72/Logo_dana_blue.svg';
        if (n.includes('ovo')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Logo_ovo_purple.svg/960px-Logo_ovo_purple.svg.png';
        if (n.includes('gopay')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Logo_Gopay.svg/960px-Logo_Gopay.svg.png';
        return null;
    };

    gifts.forEach(gift => {
        const card = document.createElement('div');
        card.className = 'gift-card';
        // Ambil logo dari database, atau cari otomatis jika kosong
        const logoUrl = gift.logo || getFallbackLogo(gift.bank);
        const fallbackIcon = gift.icon || 'fas fa-university';
        
        console.log(`Bank: ${gift.bank}, Logo URL: ${logoUrl}`);
        card.innerHTML = `
            <div style="height: 60px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                ${logoUrl ? `<img src="${logoUrl}" 
                                  style="max-height: 100%; max-width: 150px; filter: drop-shadow(0 2px 5px rgba(0,0,0,0.1));" 
                                  alt="${gift.bank}"
                                  onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                             <i class="${fallbackIcon}" style="font-size: 2.5rem; color: var(--primary-color); display: none;"></i>` 
                          : `<i class="${fallbackIcon}" style="font-size: 2.5rem; color: var(--primary-color);"></i>`}
            </div>
            <h4 style="color: var(--primary-color); margin-bottom: 5px; font-size: 1.2rem;">${gift.bank}</h4>
            <div class="acc-number" style="font-size: 1.4rem; padding: 15px;">${gift.accountNumber}</div>
            <p style="color: #fff; opacity: 0.9; font-size: 1rem; margin-bottom: 20px; font-weight: 500;">A/N: ${gift.accountName}</p>
            <button class="btn-copy" onclick="copyText('${gift.accountNumber}')">
                <i class="fas fa-copy"></i> Salin Nomor Rekening
            </button>
        `;
        container.appendChild(card);
    });
}

function setupVideo(url) {
    const iframe = document.getElementById('youtube-video');
    if (!iframe) return;
    let videoId = '';
    if (url.includes('v=')) videoId = url.split('v=')[1].split('&')[0];
    else if (url.includes('be/')) videoId = url.split('be/')[1].split('?')[0];
    if (videoId) iframe.src = `https://www.youtube.com/embed/${videoId}`;
}

function setupCountdown(dateStr) {
    const target = new Date(dateStr.replace(' ', 'T')).getTime();
    if (isNaN(target)) return;
    const interval = setInterval(() => {
        const now = new Date().getTime(); const dist = target - now;
        if (dist < 0) { clearInterval(interval); return; }
        if (document.getElementById('days')) {
            document.getElementById('days').innerText = Math.floor(dist / (1000 * 60 * 60 * 24));
            document.getElementById('hours').innerText = Math.floor((dist % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            document.getElementById('minutes').innerText = Math.floor((dist % (1000 * 60 * 60)) / (1000 * 60));
            document.getElementById('seconds').innerText = Math.floor((dist % (1000 * 60)) / 1000);
        }
    }, 1000);
}

async function loadWishes(slug) {
    const wall = document.getElementById('wishes-wall');
    if (!wall) return;
    try {
        const { data, error } = await window.supabaseClient.from('wishes').select('*').ilike('slug', slug).order('created_at', { ascending: false });
        if (error) throw error;
        wall.innerHTML = data.map(wish => `<div class="wish-item"><div class="wish-header"><h4>${wish.name}</h4><span class="badge-attendance ${wish.attendance === 'Hadir' ? 'status-hadir' : 'status-tidak'}">${wish.attendance || 'Hadir'}</span></div><p>${wish.message}</p><small>${new Date(wish.created_at).toLocaleDateString('id-ID')}</small></div>`).join('') || '<p>Belum ada ucapan.</p>';
    } catch (err) { console.error(err); }
}

function copyText(text) { navigator.clipboard.writeText(text).then(() => showToast("Berhasil disalin!", "fas fa-check-circle")); }
function openLightbox(url) { const lb = document.getElementById('lightbox'); document.getElementById('lightbox-img').src = url; lb.style.display = 'flex'; }
document.querySelector('.lightbox-close')?.addEventListener('click', () => document.getElementById('lightbox').style.display = 'none');



function setupParticles() {
    if (!window.particlesJS) return;
    
    // Deteksi jika HP (Layar < 768px)
    const isMobile = window.innerWidth < 768;
    const particleCount = isMobile ? 20 : 40; // Dikurangi secara global agar super ringan

    particlesJS('particles-js', {
        "particles": {
            "number": { "value": particleCount, "density": { "enable": true, "value_area": 800 } },
            "color": { "value": "#b8860b" },
            "shape": { "type": "circle" },
            "opacity": { "value": 0.4, "random": true, "anim": { "enable": true, "speed": 1, "opacity_min": 0.1, "sync": false } },
            "size": { "value": 3, "random": true, "anim": { "enable": false, "speed": 2, "size_min": 0.1, "sync": false } },
            "line_linked": { "enable": false },
            "move": { "enable": true, "speed": 1, "direction": "top", "random": true, "straight": false, "out_mode": "out", "bounce": false }
        },
        "interactivity": { "events": { "onhover": { "enable": false } } },
        "retina_detect": false // Matikan retina detect agar HP tidak lag
    });
}

async function sendWish(slug) {
    const nameInput = document.getElementById('wish-name');
    const attendanceInput = document.getElementById('wish-attendance');
    const messageInput = document.getElementById('wish-message');
    const btn = document.getElementById('btn-send-wish');

    const urlParams = new URLSearchParams(window.location.search);
    const isGuest = urlParams.get('to');

    if (['demo', 'demo2', 'demo3'].includes(slug)) {
        showToast("Maaf, fitur kirim ucapan dinonaktifkan untuk halaman DEMO.", "fas fa-lock");
        return;
    }

    if (!isGuest) {
        showToast("Maaf, hanya tamu undangan resmi yang dapat mengirim ucapan.", "fas fa-user-slash");
        return;
    }

    if (!nameInput.value.trim() || !messageInput.value.trim()) {
        showToast("Silakan isi nama dan ucapan Anda.", "fas fa-exclamation-circle");
        return;
    }

    btn.disabled = true;
    btn.innerText = "Mengirim...";

    try {
        const { error } = await window.supabaseClient.from('wishes').insert([
            { 
                slug: slug.toLowerCase(), 
                name: nameInput.value.trim(), 
                message: messageInput.value.trim(), 
                attendance: attendanceInput.value 
            }
        ]);
        if (error) throw error;
        
        nameInput.value = '';
        messageInput.value = '';
        showToast("Terima kasih atas ucapannya!", "fas fa-heart");
        loadWishes(slug);
    } catch (err) {
        console.error(err);
        showToast("Gagal mengirim ucapan.", "fas fa-times-circle");
    } finally {
        btn.disabled = false;
        btn.innerText = "Kirim Ucapan & RSVP";
    }
}

function showToast(message, icon = "fas fa-info-circle") {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast-item';
    toast.innerHTML = `<i class="${icon}"></i><span>${message}</span>`;
    
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 500);
    }, 4000);
}

async function fetchBrandName() {
    try {
        const { data, error } = await window.supabaseClient
            .from('admin_settings')
            .select('key, value')
            .in('key', ['business_name', 'owner_whatsapp', 'theme_pricing_json']);

        if (data) {
            window.appSettings = {};
            data.forEach(item => {
                if (item.key === 'theme_pricing_json') {
                    try { window.appSettings.theme_pricing = JSON.parse(item.value); } catch(e) {}
                } else {
                    window.appSettings[item.key] = item.value;
                }
            });

            const bizName = window.appSettings?.business_name || '';
            
            // Update brand footer if exists
            const brandFooter = document.getElementById('brand-footer');
            if (brandFooter) brandFooter.innerText = bizName.toUpperCase();
            
            // Update landing page title if exists
            const landingTitle = document.getElementById('landing-brand-title');
            if (landingTitle) landingTitle.innerText = bizName;
        }
    } catch (err) {
        console.error('Error fetching brand:', err);
    }
}

function updateMetaTags(title, desc, image) {
    document.title = title;
    // Open Graph
    document.querySelector('meta[property="og:type"]')?.setAttribute('content', 'website');
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', title);
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', desc);
    document.querySelector('meta[property="og:image"]')?.setAttribute('content', image);
    // Twitter
    document.querySelector('meta[name="twitter:card"]')?.setAttribute('content', 'summary_large_image');
    document.querySelector('meta[property="twitter:title"]')?.setAttribute('content', title);
    document.querySelector('meta[property="twitter:description"]')?.setAttribute('content', desc);
    document.querySelector('meta[property="twitter:image"]')?.setAttribute('content', image);
    // Standard
    document.querySelector('meta[name="description"]')?.setAttribute('content', desc);
}
function showPremiumError(title, message) {
    document.body.innerHTML = `
        <style>
            .error-premium-container {
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                background: #1a120b; /* Dark background */
                padding: 20px;
                font-family: 'Inter', sans-serif;
            }
            .error-card-premium {
                background: rgba(45, 30, 18, 0.8);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(184, 134, 11, 0.3);
                padding: 40px;
                border-radius: 20px;
                text-align: center;
                max-width: 500px;
                box-shadow: 0 25px 50px rgba(0,0,0,0.5);
                color: #b8860b;
                animation: slideUp 0.8s ease-out;
            }
            .error-icon-crown {
                font-size: 3rem;
                margin-bottom: 20px;
                color: #b8860b;
            }
            .btn-premium {
                display: inline-block;
                padding: 12px 25px;
                background: #b8860b;
                color: #1a120b;
                text-decoration: none;
                font-weight: bold;
                border-radius: 50px;
                text-transform: uppercase;
                transition: all 0.3s ease;
                letter-spacing: 1px;
            }
            .btn-premium:hover {
                transform: translateY(-2px);
                box-shadow: 0 10px 20px rgba(184, 134, 11, 0.3);
            }
            @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        </style>
        <div class="error-premium-container">
            <div class="error-card-premium">
                <i class="fas fa-crown error-icon-crown"></i>
                <h1 style="letter-spacing: 2px; font-size: 1.8rem; margin-bottom: 20px; text-transform: uppercase;">${title}</h1>
                <p style="font-family: 'Inter', sans-serif; font-size: 1rem; color: #fff; line-height: 1.6; opacity: 0.9; margin-bottom: 35px;">
                    ${message}
                </p>
                <a href="${window.BASE_DOMAIN ? 'https://' + window.BASE_DOMAIN : '/'}" class="btn-premium">
                    KEMBALI KE BERANDA
                </a>
            </div>
        </div>
    `;
}

window.copyText = function(text) { navigator.clipboard.writeText(text).then(() => showToast("Berhasil disalin!", "fas fa-check-circle")); };
window.openLightbox = function(url) { const lb = document.getElementById('lightbox'); document.getElementById('lightbox-img').src = url; lb.style.display = 'flex'; };
document.querySelector('.lightbox-close')?.addEventListener('click', () => { document.getElementById('lightbox').style.display = 'none'; });
