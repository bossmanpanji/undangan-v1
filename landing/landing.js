document.addEventListener('DOMContentLoaded', async () => {
    // --- FORCE APP SUBDOMAIN CHECK & REDIRECT ---
    const hostname = window.location.hostname;
    if (hostname.startsWith('app.')) {
        await checkAppSessionAndRedirect();
        return;
    }

    if (window.AOS) AOS.init({ duration: 1000, once: true, offset: 50 });
    document.getElementById('current-year').innerText = new Date().getFullYear();
    
    // Smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
            const target = document.querySelector(link.getAttribute('href'));
            if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
        });
    });

    // Navbar scroll
    const navbar = document.getElementById('lp-navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            navbar.classList.toggle('scrolled', window.scrollY > 50);
        });
    }

    setupOrderModal();
    await fetchBrandAndSettings();
    setupParticles();
});

// Global state
let ownerWA = '6285716467666';
let themePricing = {
    'global': { '1': '99000', '2': '149000', '3': '199000', 'orig': '250000' },
    'royal-gold': { '1': '99000', '2': '149000', '3': '199000', 'orig': '250000' },
    'floral-light': { '1': '99000', '2': '149000', '3': '199000', 'orig': '250000' },
    'midnight-dark': { '1': '99000', '2': '149000', '3': '199000', 'orig': '250000' },
    'heritage-series': { '1': '99000', '2': '149000', '3': '199000', 'orig': '250000' },
    'velvet-champagne': { '1': '99000', '2': '149000', '3': '199000', 'orig': '250000' }
};
let bizName = 'SEJOLI';

async function fetchBrandAndSettings() {
    try {
        if (window.supabaseClient) {
            const { data } = await window.supabaseClient
                .from('admin_settings')
                .select('key, value')
                .in('key', ['business_name', 'owner_whatsapp', 'theme_pricing_json']);

            if (data && data.length > 0) {
                const s = {};
                data.forEach(item => s[item.key] = item.value);
                if (s.business_name) bizName = s.business_name;
                if (s.owner_whatsapp) ownerWA = s.owner_whatsapp;

                if (s.theme_pricing_json) {
                    try {
                        themePricing = JSON.parse(s.theme_pricing_json);
                    } catch(e) {}
                }
            }
        }
    } catch (err) {
        console.error('Error fetching settings:', err);
    }

    displayPricing();
    if (window.updateOrderPrice) window.updateOrderPrice();

    const elements = {
        title: document.getElementById('landing-brand-title'),
        navbar: document.getElementById('navbar-brand'),
        footer: document.getElementById('brand-footer')
    };
    if (elements.title) elements.title.innerText = bizName;
    if (elements.navbar) elements.navbar.innerText = bizName;
    if (elements.footer) elements.footer.innerText = bizName.toUpperCase();
    document.title = `${bizName} - Undangan Digital`;
}

function displayPricing() {
    const formatRp = (val) => {
        const num = parseInt(val);
        if (!num || isNaN(num)) return null;
        return 'Rp' + num.toLocaleString('id-ID');
    };

    document.querySelectorAll('.theme-price-wrapper').forEach(wrapper => {
        const themeId = wrapper.getAttribute('data-theme-id');
        let p1 = themePricing[themeId]?.['1'] || themePricing['global']?.['1'];
        let pOrig = themePricing[themeId]?.['orig'] || themePricing['global']?.['orig'];

        const f1 = formatRp(p1);
        const fOrig = formatRp(pOrig);

        if (f1) {
            let html = `<span style="font-size: 0.8rem; opacity: 0.7; font-weight: 400; color: #fff;">Mulai </span>`;
            if (fOrig && fOrig !== f1) {
                html += `<span style="text-decoration: line-through; opacity: 0.5; font-size: 0.85rem; margin-right: 8px; color: #fff;">${fOrig}</span>`;
            }
            html += `<span style="color: var(--primary); font-weight: 800; font-size: 1.2rem;">${f1}</span>`;
            wrapper.innerHTML = html;
            wrapper.style.display = 'flex';
        } else {
            wrapper.style.display = 'none';
        }
    });
}

function setupOrderModal() {
    const modal = document.getElementById('order-modal');
    const closeBtn = document.getElementById('order-modal-close');
    const form = document.getElementById('order-form');
    if (!modal) return;

    const btnSubmit = document.getElementById('btn-order-submit');
    const themeSelect = document.getElementById('order-theme-select');
    
    // Custom select elements
    const customSelect = document.getElementById('order-theme-custom-select');
    const customTrigger = customSelect?.querySelector('.custom-select-trigger');
    
    const syncCustomSelect = () => {
        if (!themeSelect || !customSelect || !customTrigger) return;
        const val = themeSelect.value;
        const selectedOption = themeSelect.options[themeSelect.selectedIndex];
        const text = selectedOption ? selectedOption.text : '';
        
        customTrigger.setAttribute('data-value', val);
        customTrigger.querySelector('span').innerText = text;
        
        customSelect.querySelectorAll('.custom-option').forEach(opt => {
            if (opt.getAttribute('data-value') === val) {
                opt.classList.add('active');
            } else {
                opt.classList.remove('active');
            }
        });
    };

    window.updateOrderPrice = () => {
        const themeId = themeSelect.value;
        const dur = form.querySelector('input[name="order-dur"]:checked')?.value || '3';
        const price = themePricing[themeId]?.[dur] || themePricing['global']?.[dur];
        
        if (price) {
            const formatted = 'Rp' + parseInt(price).toLocaleString('id-ID');
            btnSubmit.innerHTML = `<i class="fab fa-whatsapp"></i> PESAN SEKARANG — ${formatted}`;
        } else {
            btnSubmit.innerHTML = `<i class="fab fa-whatsapp"></i> PESAN SEKARANG`;
        }
    };

    window.openOrderModal = (themeId, isLocked = false) => {
        if (themeId) themeSelect.value = themeId;
        themeSelect.disabled = isLocked;
        
        if (customSelect) {
            if (isLocked) {
                customSelect.style.pointerEvents = 'none';
                customSelect.style.opacity = '0.6';
            } else {
                customSelect.style.pointerEvents = 'auto';
                customSelect.style.opacity = '1';
            }
        }
        
        syncCustomSelect();
        modal.style.display = 'flex';
        window.updateOrderPrice();
    };

    if (closeBtn) closeBtn.onclick = () => modal.style.display = 'none';
    window.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };

    // Toggle custom select open/close
    if (customTrigger) {
        customTrigger.onclick = (e) => {
            e.stopPropagation();
            customSelect.classList.toggle('open');
        };
    }

    if (customSelect) {
        customSelect.querySelectorAll('.custom-option').forEach(opt => {
            opt.onclick = (e) => {
                e.stopPropagation();
                const val = opt.getAttribute('data-value');
                themeSelect.value = val;
                
                // Dispatch change event to trigger updateOrderPrice and other logic
                themeSelect.dispatchEvent(new Event('change'));
                
                syncCustomSelect();
                customSelect.classList.remove('open');
            };
        });
    }

    // Close select on click outside
    window.addEventListener('click', () => {
        if (customSelect) customSelect.classList.remove('open');
    });

    themeSelect.addEventListener('change', window.updateOrderPrice);
    form.querySelectorAll('input[name="order-dur"]').forEach(radio => {
        radio.addEventListener('change', window.updateOrderPrice);
    });

    document.querySelectorAll('.btn-open-order').forEach(btn => {
        btn.onclick = () => {
            const themeId = btn.closest('.theme-card')?.querySelector('.theme-price-wrapper')?.getAttribute('data-theme-id');
            window.openOrderModal(themeId || 'royal-gold', !!themeId);
        };
    });

    if (form) {
        form.onsubmit = (e) => {
            e.preventDefault();
            const clientName = document.getElementById('order-name').value.trim();
            const themeId = themeSelect.value;
            const themeName = themeSelect.options[themeSelect.selectedIndex].text;
            const durasi = form.querySelector('input[name="order-dur"]:checked').value;
            const price = themePricing[themeId]?.[durasi] || themePricing['global']?.[durasi];
            const formattedPrice = price ? 'Rp' + parseInt(price).toLocaleString('id-ID') : '';

            const bizNameUpper = bizName.toUpperCase();
            const msg = `*PEMESANAN UNDANGAN DIGITAL ${bizNameUpper}*%0A%0A` +
                        `Halo Admin, saya tertarik untuk memesan undangan digital dengan detail sebagai berikut:%0A%0A` +
                        `- *Nama/Slug:* ${clientName}%0A` +
                        `- *Pilihan Tema:* ${themeName}%0A` +
                        `- *Masa Aktif:* ${durasi} bulan%0A` +
                        (formattedPrice ? `- *Estimasi Harga:* ${formattedPrice}%0A%0A` : `%0A`) +
                        `Mohon untuk dibantu memproses pesanan ini. Terima kasih!`;
            
            window.open(`https://wa.me/${ownerWA}?text=${msg}`, '_blank');
            modal.style.display = 'none';
        };
    }
}

function setupParticles() {
    if (!window.particlesJS || !document.getElementById('particles-js')) return;
    particlesJS('particles-js', {
        "particles": {
            "number": { "value": 15, "density": { "enable": true, "value_area": 1000 } },
            "color": { "value": "#b8860b" },
            "shape": { "type": "circle" },
            "opacity": { "value": 0.2, "random": true },
            "size": { "value": 2, "random": true },
            "move": { "enable": true, "speed": 0.5, "direction": "top", "random": true, "straight": false, "out_mode": "out" }
        },
        "interactivity": { "events": { "onhover": { "enable": false }, "onclick": { "enable": false } } },
        "retina_detect": false
    });
}

async function checkAppSessionAndRedirect() {
    // Tunggu sampai window.supabaseClient terinisialisasi
    let retries = 0;
    while (!window.supabaseClient && retries < 15) {
        await new Promise(resolve => setTimeout(resolve, 100));
        retries++;
    }

    if (!window.supabaseClient) {
        window.location.href = '/login/';
        return;
    }

    try {
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (session) {
            // Verifikasi ke server jika akun admin masih ada
            const { data: { user }, error } = await window.supabaseClient.auth.getUser();
            if (user && !error) {
                window.location.href = '/admin/';
            } else {
                console.warn("Sesi admin ditemukan di landing page tapi pengguna tidak valid (dihapus/tidak aktif):", error);
                await window.supabaseClient.auth.signOut();
                checkClientSession();
            }
        } else {
            checkClientSession();
        }
    } catch (e) {
        console.error('Session check failed:', e);
        window.location.href = '/login/';
    }
}

function checkClientSession() {
    const clientSlug = localStorage.getItem('editorSlug');
    const clientPass = localStorage.getItem('editorPassword');
    if (clientSlug && clientPass) {
        window.location.href = '/editor/';
    } else {
        window.location.href = '/login/';
    }
}
