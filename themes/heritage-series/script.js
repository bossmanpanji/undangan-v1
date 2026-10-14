// Heritage Series Dynamic Wedding Script
document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const pathname = window.location.pathname;
    const hostname = window.location.hostname;
    
    const reserved = ['admin', 'editor', 'login', 'assets', 'api', 'index.html', '/login/', 'app'];
    
    // 1. Slug Detection (Query Param, Subdomain, or window.FORCE_SLUG)
    let slug = window.FORCE_SLUG || urlParams.get('u');
    const isAppSubdomain = hostname.startsWith('app.');
    const isWwwSubdomain = hostname.startsWith('www.');

    if (!slug) {
        const parts = hostname.split('.');
        const isHostingPlatform = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('run.app') || hostname.includes('webcontainer') || hostname.includes('aistudio') || hostname.includes('google') || hostname.includes('vercel.app') || hostname.includes('pages.dev') || hostname.includes('netlify.app');
        
        if (parts.length > 2 && !isAppSubdomain && !isWwwSubdomain && !isHostingPlatform) {
            slug = parts[0];
        } else {
            const pathSlug = pathname.split('/')[1];
            if (pathSlug && !reserved.includes(pathSlug)) {
                slug = pathSlug;
            }
        }
    }

    // Default to demo if accessed directly without slug in demo mode
    if (!slug && (pathname.includes('/heritage') || urlParams.has('demo'))) {
        slug = 'demo';
    }

    // Dynamic Guest Name from '?to='
    const guestParam = urlParams.get('to');
    const guestEl = document.getElementById('guest-name');
    const rsvpNameInput = document.getElementById('rsvp-name');
    if (guestParam) {
        const cleanGuest = decodeURIComponent(guestParam.replace(/\+/g, ' '));
        if (guestEl) guestEl.innerText = cleanGuest;
        if (rsvpNameInput) {
            rsvpNameInput.value = cleanGuest;
            rsvpNameInput.readOnly = true;
            rsvpNameInput.classList.add('bg-white/30');
        }
    }

    // Initialize App
    if (slug) {
        initHeritageApp(slug);
    } else {
        // Fallback demo
        initHeritageApp('demo');
    }

    // Setup intersection observer for smooth animation
    setupScrollAnimations();
});

let currentInvitationSlug = 'demo';
let isMusicPlaying = false;
let audioInstance = null;

async function initHeritageApp(slug) {
    currentInvitationSlug = slug;
    console.log("🌸 Memuat Tema Heritage Series untuk slug:", slug);

    try {
        let configData = null;
        let createdAt = new Date().toISOString();
        let expiryLimit = 90;

        // 1. DEMO MODE
        if (slug === 'demo' || slug === 'demo2' || slug === 'demo3' || slug === 'demo-heritage') {
            const c = window.config || {};
            configData = {
                ...c,
                theme: 'heritage-series',
                couple: {
                    groom: {
                        name: "Rama",
                        fullname: "Rama Wijaya, S.T.",
                        sonOf: "Putra dari Bpk. Prabu Dasarata & Ibu Kosalya",
                        instagram: "@ramawijaya",
                        socialIcon: "fab fa-instagram",
                        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80"
                    },
                    bride: {
                        name: "Shinta",
                        fullname: "Shinta Dewi, S.E.",
                        daughterOf: "Putri dari Bpk. Prabu Janaka & Ibu Sunayana",
                        instagram: "@shintadewi",
                        socialIcon: "fab fa-instagram",
                        image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80"
                    }
                },
                coverImage: "https://images.unsplash.com/photo-1519741497674-611481863552?w=1080&auto=format&fit=crop&q=80",
                weddingDate: "Minggu, 15 Agustus 2027",
                countdownDate: "2027-08-15 08:00:00",
                quotes: "“Dan di antara tanda-tanda kebesaran-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang.”",
                events: [
                    {
                        title: "Akad Nikah",
                        date: "Minggu, 15 Agustus 2027",
                        startTime: "08:00",
                        endTime: "10:00 WIB",
                        location: "Pendopo Ageng Kraton",
                        address: "Jl. Kenangan Indah No. 123, Yogyakarta",
                        mapsUrl: "https://maps.google.com/?q=Yogyakarta"
                    },
                    {
                        title: "Resepsi Pernikahan",
                        date: "Minggu, 15 Agustus 2027",
                        startTime: "11:00",
                        endTime: "14:00 WIB",
                        entertainment: "Gamelan Jawa & Musik Karawitan",
                        location: "Pendopo Ageng Kraton",
                        address: "Jl. Kenangan Indah No. 123, Yogyakarta",
                        mapsUrl: "https://maps.google.com/?q=Yogyakarta"
                    }
                ],
                gifts: [
                    {
                        bankName: "BCA",
                        accountNumber: "1234567890",
                        accountHolder: "Rama Wijaya",
                        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Bank_Central_Asia.svg/960px-Bank_Central_Asia.svg.png"
                    },
                    {
                        bankName: "Mandiri",
                        accountNumber: "9876543210",
                        accountHolder: "Shinta Dewi",
                        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Bank_Mandiri_logo_2016.svg/250px-Bank_Mandiri_logo_2016.svg.png"
                    }
                ],
                gallery: [
                    "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&auto=format&fit=crop&q=80"
                ]
            };
        } else {
            // 2. SUPABASE FETCH
            if (!window.supabaseClient) {
                console.error("Supabase client not found");
                showErrorOverlay("Koneksi Gagal", "Gagal menghubungkan ke database. Silakan muat ulang halaman.");
                return;
            }

            const { data, error } = await window.supabaseClient
                .from('invitations')
                .select('config, created_at, expiry_days')
                .ilike('slug', slug)
                .maybeSingle();

            if (error || !data) {
                showErrorOverlay("404 - Tidak Ditemukan", `Undangan dengan nama <b>"${slug}"</b> tidak ditemukan di sistem kami.`);
                return;
            }

            configData = data.config;
            createdAt = data.created_at;
            expiryLimit = data.expiry_days || 90;
        }

        // Check expiration
        const createdDate = new Date(createdAt);
        const diffDays = Math.ceil(Math.abs(new Date() - createdDate) / (1000 * 60 * 60 * 24));
        if (slug !== 'demo' && diffDays > expiryLimit) {
            showErrorOverlay("Masa Aktif Berakhir", "Masa aktif undangan digital ini telah berakhir. Silakan hubungi calon pengantin atau admin.");
            return;
        }

        // Apply Data Binding
        applyThemeData(configData);

        // Fetch Guest Wishes from Supabase
        fetchWishes(slug);

        // Fetch brand name for footer
        fetchBrandName();

    } catch (err) {
        console.error("Initialization error:", err);
        showErrorOverlay("Terjadi Kendala", "Gagal memuat data undangan. Silakan coba kembali nanti.");
    }
}

function applyThemeData(config) {
    if (!config) return;

    const groom = config.couple?.groom || {};
    const bride = config.couple?.bride || {};
    const groomName = groom.name || 'Pria';
    const brideName = bride.name || 'Wanita';
    const coupleText = `${groomName} & ${brideName}`;

    // Update Titles and Meta
    document.title = `The Wedding of ${coupleText} - Heritage Series`;
    const pageTitle = document.getElementById('page-title');
    if (pageTitle) pageTitle.innerText = `The Wedding of ${coupleText}`;

    // Cover Screen
    const coverCoupleName = document.getElementById('cover-couple-name');
    if (coverCoupleName) coverCoupleName.innerText = coupleText;

    const coverQuote = document.getElementById('cover-quote');
    if (coverQuote) coverQuote.innerText = config.quotes || '"Sebuah ikatan suci yang terjalin dalam doa dan restu."';

    const coverImg = config.coverImage || groom.image || bride.image;
    const coverScreen = document.getElementById('cover-screen');
    if (coverScreen && coverImg) {
        coverScreen.style.backgroundImage = `linear-gradient(rgba(44, 42, 41, 0.85), rgba(44, 42, 41, 0.85)), url('${coverImg}')`;
    }

    // Hero Section
    const heroCoupleNames = document.getElementById('hero-couple-names');
    if (heroCoupleNames) heroCoupleNames.innerText = coupleText;

    const heroImage = document.getElementById('hero-couple-image');
    if (heroImage && coverImg) heroImage.src = coverImg;

    const firstEvent = config.events?.[0];
    const heroDate = document.getElementById('hero-date');
    if (heroDate) {
        heroDate.innerText = firstEvent?.date || config.weddingDate || "15 . 08 . 2027";
    }

    // Countdown Timer
    setupCountdown(firstEvent, config.countdownDate);

    // Quote Section
    const quoteBody = document.getElementById('quote-body');
    if (quoteBody && config.quotes) {
        quoteBody.innerText = config.quotes;
    }

    // Couple (Mempelai)
    const groomFullName = document.getElementById('groom-fullname');
    if (groomFullName) groomFullName.innerText = groom.fullname || groom.name || 'Rama Wijaya';

    const groomParents = document.getElementById('groom-parents');
    if (groomParents) groomParents.innerText = groom.sonOf || 'Putra dari Bpk. Orang Tua & Ibu Orang Tua';

    const groomImage = document.getElementById('groom-image');
    if (groomImage && groom.image) groomImage.src = groom.image;

    setupSocial('groom', groom.instagram, groom.socialIcon);

    const brideFullName = document.getElementById('bride-fullname');
    if (brideFullName) brideFullName.innerText = bride.fullname || bride.name || 'Shinta Dewi';

    const brideParents = document.getElementById('bride-parents');
    if (brideParents) brideParents.innerText = bride.daughterOf || 'Putri dari Bpk. Orang Tua & Ibu Orang Tua';

    const brideImage = document.getElementById('bride-image');
    if (brideImage && bride.image) brideImage.src = bride.image;

    setupSocial('bride', bride.instagram, bride.socialIcon);

    // Detail Acara (Events)
    renderEvents(config.events || []);

    // Love Story
    if (config.stories && config.stories.length > 0) {
        renderStories(config.stories);
    }

    // Gallery
    if (config.gallery && config.gallery.length > 0) {
        renderGallery(config.gallery);
    }

    // Video Section
    if (config.youtubeUrl) {
        renderVideo(config.youtubeUrl);
    }

    // Digital Gifts / Rekening
    if (config.gifts && config.gifts.length > 0) {
        renderGifts(config.gifts);
    }

    // Footer
    const footerCoupleName = document.getElementById('footer-couple-name');
    if (footerCoupleName) footerCoupleName.innerText = coupleText;

    // Background Audio
    setupAudio(config.music);
}

function setupSocial(target, handle, customIcon) {
    const linkEl = document.getElementById(`${target}-social-link`);
    const textEl = document.getElementById(`${target}-social-text`);
    const iconEl = document.getElementById(`${target}-social-icon`);
    const container = document.getElementById(`${target}-social-container`);

    if (!handle || handle.trim() === '' || handle === '@' || handle === '-') {
        if (container) container.style.display = 'none';
        return;
    }

    const cleanHandle = handle.trim().replace(/^@/, '');
    if (textEl) textEl.innerText = `@${cleanHandle}`;

    let iconClass = customIcon || 'fab fa-instagram';
    let href = `https://instagram.com/${cleanHandle}`;

    if (iconClass.includes('tiktok')) {
        href = `https://tiktok.com/@${cleanHandle}`;
    } else if (iconClass.includes('whatsapp')) {
        let phone = cleanHandle.replace(/[^0-9]/g, '');
        if (phone.startsWith('0')) phone = '62' + phone.substring(1);
        href = `https://wa.me/${phone}`;
    }

    if (linkEl) linkEl.href = href;
    if (iconEl) iconEl.className = iconClass;
}

function setupAudio(musicUrl) {
    const audio = document.getElementById('bg-music');
    const source = document.getElementById('bg-music-source');
    audioInstance = audio;

    const defaultMusic = "https://assets.mixkit.co/music/preview/mixkit-romantic-piano-110.mp3";
    const finalUrl = musicUrl && musicUrl.trim() !== '' ? musicUrl : defaultMusic;

    if (source) source.src = finalUrl;
    if (audio) {
        audio.load();
    }
}

// Global functions attached to window for HTML event handlers
window.openInvitation = function() {
    const cover = document.getElementById('cover-screen');
    const mainContent = document.getElementById('main-content');
    const audioBtn = document.getElementById('audio-btn');

    if (cover) {
        cover.style.transform = 'translateY(-100vh)';
        setTimeout(() => {
            cover.style.display = 'none';
        }, 1000);
    }

    if (mainContent) {
        mainContent.classList.remove('hidden');
    }

    if (audioBtn) {
        audioBtn.classList.remove('hidden');
    }

    // Play Audio
    if (audioInstance) {
        audioInstance.play().then(() => {
            isMusicPlaying = true;
            updateAudioIcon();
        }).catch(err => {
            console.log("Audio autoplay prevented by browser policies:", err);
            isMusicPlaying = false;
            updateAudioIcon();
        });
    }

    // Refresh scroll animations
    setupScrollAnimations();
};

window.togglePlay = function() {
    if (!audioInstance) return;
    if (isMusicPlaying) {
        audioInstance.pause();
    } else {
        audioInstance.play().catch(e => console.warn(e));
    }
    isMusicPlaying = !isMusicPlaying;
    updateAudioIcon();
};

function updateAudioIcon() {
    const audioBtn = document.getElementById('audio-btn');
    if (!audioBtn) return;
    const icon = audioBtn.querySelector('i');
    if (!icon) return;

    if (isMusicPlaying) {
        icon.className = 'fas fa-music';
        audioBtn.classList.add('animate-pulse');
    } else {
        icon.className = 'fas fa-volume-mute';
        audioBtn.classList.remove('animate-pulse');
    }
}

function renderEvents(events) {
    const container = document.getElementById('events-container');
    if (!container) return;

    if (!events || events.length === 0) {
        container.innerHTML = '<p class="text-center text-sm text-gray-500 italic">Jadwal acara akan segera diperbarui.</p>';
        return;
    }

    container.innerHTML = events.map((ev, index) => {
        const isAkad = (ev.title || '').toLowerCase().includes('akad') || index === 0;
        const icon = isAkad ? 'fa-ring' : 'fa-glass-cheers';
        const eventTime = ev.time || `${ev.startTime || '08:00'} - ${ev.endTime || 'Selesai'}`;

        const mapsBtn = ev.mapsUrl ? `
            <a href="${ev.mapsUrl}" target="_blank" class="inline-flex items-center gap-1.5 border border-heritage-gold text-heritage-gold hover:bg-heritage-gold hover:text-white px-5 py-2 rounded-full font-sans text-xs font-semibold transition uppercase tracking-wider">
                <i class="fas fa-map-marked-alt"></i> Petunjuk Lokasi
            </a>
        ` : '';

        // Google Calendar Link
        const calendarUrl = generateGoogleCalendarUrl(ev);
        const calendarBtn = calendarUrl ? `
            <a href="${calendarUrl}" target="_blank" class="inline-flex items-center gap-1.5 bg-heritage-gold/15 text-heritage-brown hover:bg-heritage-gold hover:text-white px-4 py-2 rounded-full font-sans text-xs font-semibold transition border border-heritage-gold/30">
                <i class="far fa-calendar-plus"></i> Simpan Kalender
            </a>
        ` : '';

        // Hiburan (hanya ditampilkan jika diisi user)
        const entertainmentVal = (ev.entertainment || ev.hiburan || '').trim();
        const entertainmentBlock = entertainmentVal ? `
            <div class="flex items-center justify-center gap-2 mb-4 text-heritage-brown bg-heritage-cream/70 py-1.5 px-3 rounded-lg border border-heritage-gold/20 max-w-xs mx-auto text-xs font-sans">
                <i class="fas fa-music text-heritage-gold"></i>
                <span>Hiburan: <strong class="font-semibold">${escapeHtml(entertainmentVal)}</strong></span>
            </div>
        ` : '';

        return `
            <div class="bg-white p-7 shadow-lg relative fade-in border-t-4 border-heritage-gold rounded-b-xl text-center">
                <div class="absolute -top-5 left-1/2 transform -translate-x-1/2 bg-heritage-cream px-3.5 py-1 text-heritage-gold text-xl rounded-full border border-heritage-gold/30 shadow-sm">
                    <i class="fas ${icon}"></i>
                </div>
                
                <h3 class="font-serif text-2xl text-heritage-brown mb-5 mt-3 font-semibold">${ev.title || 'Acara Bahagia'}</h3>
                
                <div class="flex items-center justify-center gap-3 mb-3 text-heritage-dark">
                    <i class="far fa-calendar-alt text-heritage-gold"></i>
                    <p class="font-semibold font-sans text-sm">${ev.date || '-'}</p>
                </div>
                
                <div class="flex items-center justify-center gap-3 mb-5 text-heritage-dark">
                    <i class="far fa-clock text-heritage-gold"></i>
                    <p class="font-semibold font-sans text-sm">${eventTime}</p>
                </div>

                ${entertainmentBlock}

                <div class="border-t border-gray-100 pt-5 mt-2">
                    <p class="font-serif font-bold text-sm text-heritage-dark mb-1">${ev.location || 'Lokasi Acara'}</p>
                    <p class="font-sans text-xs text-gray-500 mb-5 max-w-xs mx-auto leading-relaxed">${ev.address || ''}</p>
                    <div class="flex flex-wrap justify-center gap-2.5">
                        ${mapsBtn}
                        ${calendarBtn}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function generateGoogleCalendarUrl(event) {
    if (!event || !event.date) return null;
    try {
        const title = encodeURIComponent(event.title || 'Pernikahan');
        const details = encodeURIComponent(`Menghadiri ${event.title} di ${event.location || ''} - ${event.address || ''}`);
        const location = encodeURIComponent(`${event.location || ''} ${event.address || ''}`.trim());
        
        // Simple Google Calendar add link
        return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}`;
    } catch (e) {
        return null;
    }
}

function setupCountdown(firstEvent, explicitCountdownDate) {
    const daysEl = document.getElementById('days');
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');
    const countdownContainer = document.getElementById('countdown');

    if (!daysEl) return;

    let targetTime = null;

    if (explicitCountdownDate) {
        targetTime = new Date(explicitCountdownDate.replace(' ', 'T')).getTime();
    } else if (firstEvent?.date) {
        // Parse date string like "Minggu, 15 Agustus 2027" or "2027-08-15"
        const d = new Date(firstEvent.date);
        if (!isNaN(d.getTime())) {
            targetTime = d.getTime();
        }
    }

    // Default fallback to future date if unparseable
    if (!targetTime || isNaN(targetTime)) {
        targetTime = new Date(2027, 7, 15, 8, 0, 0).getTime();
    }

    const timer = setInterval(() => {
        const now = new Date().getTime();
        const distance = targetTime - now;

        if (distance < 0) {
            clearInterval(timer);
            if (countdownContainer) {
                countdownContainer.innerHTML = '<span class="font-serif text-sm text-heritage-gold font-bold uppercase tracking-wider py-2">Acara Sedang Berlangsung / Selesai</span>';
            }
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        daysEl.innerText = String(days).padStart(2, '0');
        hoursEl.innerText = String(hours).padStart(2, '0');
        minutesEl.innerText = String(minutes).padStart(2, '0');
        secondsEl.innerText = String(seconds).padStart(2, '0');
    }, 1000);
}

function renderStories(stories) {
    const section = document.getElementById('story-section');
    const container = document.getElementById('story-timeline');
    if (!section || !container) return;

    section.style.display = 'block';
    container.innerHTML = stories.map((s) => `
        <div class="bg-white p-5 rounded-xl border-l-4 border-heritage-gold shadow-md">
            <span class="text-[11px] font-mono text-heritage-gold font-bold block mb-1 uppercase tracking-wider">${s.date || ''}</span>
            <h4 class="font-serif font-bold text-base text-heritage-brown mb-2">${s.title || ''}</h4>
            <p class="font-sans text-xs text-gray-600 leading-relaxed">${s.description || ''}</p>
            ${s.image ? `<img src="${s.image}" alt="Story" class="mt-3.5 rounded-lg w-full h-44 object-cover border border-heritage-gold/20">` : ''}
        </div>
    `).join('');
}

function renderGallery(gallery) {
    const section = document.getElementById('gallery-section');
    const grid = document.getElementById('gallery-grid');
    if (!section || !grid) return;

    section.style.display = 'block';
    grid.innerHTML = gallery.map((img, i) => {
        const isWide = (i % 3 === 0);
        return `
            <div class="${isWide ? 'col-span-2 h-56' : 'h-40'} overflow-hidden rounded-lg shadow-sm border border-heritage-gold/20 cursor-pointer group" onclick="openLightbox('${img}')">
                <img src="${img}" alt="Gallery ${i + 1}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500">
            </div>
        `;
    }).join('');
}

window.openLightbox = function(url) {
    const lb = document.getElementById('lightbox');
    const lbImg = document.getElementById('lightbox-img');
    if (lb && lbImg) {
        lbImg.src = url;
        lb.style.display = 'flex';
    }
};

window.closeLightbox = function() {
    const lb = document.getElementById('lightbox');
    if (lb) lb.style.display = 'none';
};

function renderVideo(youtubeUrl) {
    const section = document.getElementById('video-section');
    const iframe = document.getElementById('youtube-iframe');
    if (!section || !iframe) return;

    let videoId = '';
    if (youtubeUrl.includes('youtu.be/')) {
        videoId = youtubeUrl.split('youtu.be/')[1]?.split('?')[0];
    } else if (youtubeUrl.includes('watch?v=')) {
        videoId = youtubeUrl.split('watch?v=')[1]?.split('&')[0];
    } else if (youtubeUrl.includes('embed/')) {
        videoId = youtubeUrl.split('embed/')[1]?.split('?')[0];
    }

    if (videoId) {
        iframe.src = `https://www.youtube.com/embed/${videoId}`;
        section.style.display = 'block';
    }
}

function renderGifts(gifts) {
    const section = document.getElementById('gifts-section');
    const container = document.getElementById('gifts-container');
    if (!section || !container) return;

    section.style.display = 'block';

    const getBankLogo = (bank) => {
        const b = (bank || '').toLowerCase();
        if (b.includes('bca')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Bank_Central_Asia.svg/960px-Bank_Central_Asia.svg.png';
        if (b.includes('mandiri')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Bank_Mandiri_logo_2016.svg/250px-Bank_Mandiri_logo_2016.svg.png';
        if (b.includes('bni')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Bank_Negara_Indonesia_logo_%282004%29.svg/250px-Bank_Negara_Indonesia_logo_%282004%29.svg.png';
        if (b.includes('bri')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/BRI_2025.svg/960px-BRI_2025.svg.png';
        if (b.includes('bsi')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Bank_Syariah_Indonesia.svg/960px-Bank_Syariah_Indonesia.svg.png';
        if (b.includes('dana')) return 'https://upload.wikimedia.org/wikipedia/commons/7/72/Logo_dana_blue.svg';
        if (b.includes('gopay')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Logo_Gopay.svg/960px-Logo_Gopay.svg.png';
        if (b.includes('ovo')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Logo_ovo_purple.svg/960px-Logo_ovo_purple.svg.png';
        return null;
    };

    container.innerHTML = gifts.map((g, i) => {
        const logo = g.logo || getBankLogo(g.bankName || g.bank);
        const bankName = g.bankName || g.bank || 'Bank';
        const accNumber = g.accountNumber || g.account_number || '';
        const accHolder = g.accountHolder || g.accountName || g.account_holder || '';
        const idElem = `norek-${i}`;

        return `
            <div class="bg-white p-5 rounded-xl border border-heritage-gold/30 shadow-md text-left">
                <div class="flex justify-between items-center mb-3">
                    <span class="font-serif font-bold text-sm text-heritage-dark">${bankName}</span>
                    ${logo ? `<img src="${logo}" alt="${bankName}" class="h-5 max-w-[80px] object-contain">` : ''}
                </div>
                <div class="flex justify-between items-center bg-[#FDFBF7] px-3.5 py-2.5 rounded-lg border border-gray-200 mb-2">
                    <p id="${idElem}" class="font-mono text-base font-bold tracking-wider text-heritage-brown">${accNumber}</p>
                    <button onclick="copyAccount('${idElem}')" class="text-heritage-gold hover:text-heritage-brown text-xs border border-heritage-gold px-3 py-1 rounded-full font-semibold transition flex items-center gap-1.5 bg-white">
                        <i class="far fa-copy"></i> Salin
                    </button>
                </div>
                <p class="text-xs font-sans text-gray-500">a.n ${accHolder}</p>
            </div>
        `;
    }).join('');
}

window.copyAccount = function(elemId) {
    const el = document.getElementById(elemId);
    if (!el) return;
    const text = el.innerText.trim();

    navigator.clipboard.writeText(text).then(() => {
        showCopyToast();
    }).catch(() => {
        // Fallback
        const temp = document.createElement('input');
        temp.value = text;
        document.body.appendChild(temp);
        temp.select();
        document.execCommand('copy');
        document.body.removeChild(temp);
        showCopyToast();
    });
};

function showCopyToast() {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.classList.remove('opacity-0');
    setTimeout(() => {
        toast.classList.add('opacity-0');
    }, 2200);
}

// ----------------- REALTIME WISHES / RSVP -----------------
async function fetchWishes(slug) {
    const list = document.getElementById('wishes-list');
    const countEl = document.getElementById('wishes-count');
    if (!list) return;

    if (!window.supabaseClient) {
        list.innerHTML = '<p class="text-center text-xs text-gray-400 py-3 italic">Buku tamu offline.</p>';
        return;
    }

    try {
        const { data, error } = await window.supabaseClient
            .from('wishes')
            .select('*')
            .ilike('slug', slug)
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (countEl) countEl.innerText = data?.length || 0;

        if (!data || data.length === 0) {
            list.innerHTML = '<p class="text-center text-xs text-gray-300 py-4 italic">Jadilah yang pertama memberikan doa restu.</p>';
            return;
        }

        list.innerHTML = data.map(w => {
            const isHadir = (w.attendance || 'Hadir').toLowerCase() === 'hadir';
            const badgeColor = isHadir ? 'bg-heritage-gold/30 text-heritage-gold border-heritage-gold/40' : 'bg-gray-500/20 text-gray-300 border-gray-500/30';
            const timeAgo = formatTimeAgo(w.created_at);

            return `
                <div class="bg-white/5 p-3.5 rounded-lg border border-white/10 text-left">
                    <div class="flex items-center justify-between mb-1">
                        <span class="font-bold text-heritage-gold font-sans text-xs">${escapeHtml(w.name)}</span>
                        <span class="text-[10px] font-sans px-2 py-0.5 rounded-full border ${badgeColor}">${escapeHtml(w.attendance || 'Hadir')}</span>
                    </div>
                    <p class="text-xs font-sans italic text-gray-200 leading-relaxed mb-1.5">"${escapeHtml(w.message)}"</p>
                    <span class="text-[10px] text-gray-400 font-mono block text-right">${timeAgo}</span>
                </div>
            `;
        }).join('');

    } catch (err) {
        console.warn("Gagal mengambil ucapan:", err);
        list.innerHTML = '<p class="text-center text-xs text-gray-400 py-2">Belum ada ucapan terbaru.</p>';
    }
}

window.submitRSVP = async function(event) {
    event.preventDefault();

    const nameInput = document.getElementById('rsvp-name');
    const attendanceSelect = document.getElementById('rsvp-attendance');
    const messageInput = document.getElementById('rsvp-message');
    const submitBtn = document.getElementById('btn-submit-rsvp');

    const name = nameInput?.value.trim();
    const attendance = attendanceSelect?.value || 'Hadir';
    const message = messageInput?.value.trim();

    if (!name || !message) {
        alert("Silakan lengkapi nama dan ucapan doa Anda.");
        return;
    }

    if (currentInvitationSlug === 'demo') {
        alert("Terima kasih! Fitur buku tamu berjalan lancar (Mode Demo).");
        nameInput.value = '';
        messageInput.value = '';
        return;
    }

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengirim...';
    }

    try {
        const { error } = await window.supabaseClient.from('wishes').insert([{
            slug: currentInvitationSlug,
            name: name,
            attendance: attendance,
            message: message
        }]);

        if (error) throw error;

        // Success dialog
        showSuccessModal(name);

        // Reset form
        if (!nameInput.readOnly) nameInput.value = '';
        if (messageInput) messageInput.value = '';

        // Re-fetch wishes
        fetchWishes(currentInvitationSlug);

    } catch (err) {
        console.error("Gagal mengirim doa:", err);
        alert("Maaf, terjadi kesalahan saat mengirim doa: " + (err.message || "Koneksi bermasalah"));
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Kirim Ucapan';
        }
    }
};

function showSuccessModal(guestName) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/80 flex items-center justify-center p-6 z-[200000]';
    modal.innerHTML = `
        <div class="bg-heritage-brown text-heritage-cream p-7 rounded-2xl max-w-sm w-full text-center border border-heritage-gold shadow-2xl animate-fade-in">
            <i class="fas fa-check-circle text-4xl text-heritage-gold mb-3 block"></i>
            <h3 class="font-serif text-xl text-heritage-gold mb-2 font-bold">Terima Kasih, ${escapeHtml(guestName)}!</h3>
            <p class="font-sans text-xs text-gray-300 leading-relaxed mb-6">Doa dan konfirmasi kehadiran Anda telah tersimpan dengan aman di buku tamu kami.</p>
            <button onclick="this.closest('.fixed').remove()" class="bg-heritage-gold hover:bg-yellow-700 text-white font-serif px-6 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition">Tutup</button>
        </div>
    `;
    document.body.appendChild(modal);
}

async function fetchBrandName() {
    // Brand name removed from footer
}

function showErrorOverlay(title, desc) {
    const overlay = document.getElementById('error-overlay');
    const titleEl = document.getElementById('error-title');
    const descEl = document.getElementById('error-desc');
    if (overlay) {
        if (titleEl) titleEl.innerText = title;
        if (descEl) descEl.innerHTML = desc;
        overlay.style.display = 'flex';
    }
}

function setupScrollAnimations() {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                obs.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.fade-in').forEach(el => {
        observer.observe(el);
    });
}

function formatTimeAgo(dateString) {
    if (!dateString) return '';
    try {
        const d = new Date(dateString);
        return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) {
        return '';
    }
}

function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
