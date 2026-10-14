// Auto-generated Supabase Configuration & Fallback Mock Client
console.log('🚀 ENV Configuration loading...');
var SUPABASE_URL = "https://vdlrpkjzeopxfdyluers.supabase.co";
var SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkbHJwa2p6ZW9weGZkeWx1ZXJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzNDY3NjgsImV4cCI6MjEwNDkyMjc2OH0.qvZ4sCCHxVD9SGROz3VDnf8VZn5UFyw7gF8caH0WeOA";
var EDITOR_PASSWORD = "*NjiYui2021*";

function createMockSupabaseClient() {
    console.info('ℹ️ Using in-memory / localStorage Supabase Client for local preview.');

    const STORAGE_PREFIX = 'mock_supabase_';
    const getTable = (name) => {
        try {
            const raw = localStorage.getItem(STORAGE_PREFIX + name);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    };
    const setTable = (name, data) => {
        try {
            localStorage.setItem(STORAGE_PREFIX + name, JSON.stringify(data));
        } catch (e) {
            console.error('Failed to write mock table', name, e);
        }
    };

    // Seed initial tables if not present
    if (localStorage.getItem(STORAGE_PREFIX + 'seeded') !== 'v3') {
        const defaultWeddingConfig = {
            couple: {
                groom: {
                    name: "Ozy",
                    fullname: "Ozy Zulkarnain",
                    sonOf: "Putra dari Bpk. Hendra Wibowo & Ibu Wirda Wahyuni",
                    instagram: "@ozyzulkarnaincontoh",
                    socialIcon: "fab fa-tiktok",
                    image: "https://i.ibb.co.com/p66QX9Dt/cowo.jpg"
                },
                bride: {
                    name: "Zelda",
                    fullname: "Zelda Wulandari",
                    daughterOf: "Putri dari Bpk. Daniswara Permadi & Ibu Yuliana Lestari",
                    instagram: "@zeldawulandaricontoh",
                    socialIcon: "fab fa-tiktok",
                    image: "https://i.ibb.co.com/Q418tDs/cewe.jpg"
                }
            },
            events: [
                {
                    title: "Akad Nikah",
                    date: "Kamis, 13 Desember 2029",
                    time: "08:00 - Selesai WIB",
                    location: "KUA Bunga Wangi",
                    address: "Jl. Bunga Wangi No.88, Kec. Harum, Kab. Indah",
                    mapsUrl: "https://maps.google.com/example",
                    entertainment: ""
                },
                {
                    title: "Resepsi",
                    date: "Jumat, 14 Desember 2029",
                    time: "08:00 - Selesai WIB",
                    location: "Rumah Zelda Wulandari",
                    address: "Jl. Sangat Harum No.666, Kec. Segar, Kab. Sangat Segar",
                    mapsUrl: "https://maps.google.com/example",
                    entertainment: "Wayang Kulit Satu Malam Suntuk \"Ki Dalang Kardi Suryono\""
                },
                {
                    title: "Ngunduh Mantu",
                    date: "Minggu, 16 Desember 2029",
                    time: "09:00 - Selesai WIB",
                    location: "Gedung Serbaguna Hendra Wibowo",
                    address: "Jl. Kemenangan No.1, Kec. Sukses, Kab. Jaya",
                    mapsUrl: "https://maps.google.com/example",
                    entertainment: "Live Music Accoustic & Orkes Melayu"
                }
            ],
            stories: [
                {
                    title: "Pertemuan Pertama",
                    date: "Rabu, 12 Februari 2025",
                    description: "Takdir mempertemukan kami untuk pertama kalinya. Dari sebuah pertemuan sederhana, tumbuh rasa nyaman yang tak terduga.",
                    image: "https://i.ibb.co.com/SwxWP5sw/story1.jpg"
                },
                {
                    title: "Menjalin Hubungan",
                    date: "Selasa, 25 Maret 2025",
                    description: "Hari demi hari kami lewati bersama. Tawa, doa, dan dukungan menjadi bagian dari perjalanan kami.",
                    image: "https://i.ibb.co.com/Nd23Wvv3/story3.jpg"
                },
                {
                    title: "Menguatkan Cinta",
                    date: "Selasa, 10 Juni 2025",
                    description: "Berbagai tantangan kami hadapi bersama. Cinta kami semakin kuat dan penuh makna.",
                    image: "https://i.ibb.co.com/BK6vpvkT/story2.jpg"
                },
                {
                    title: "Lamaran 💍",
                    date: "Sabtu, 20 September 2025",
                    description: "Dengan penuh keyakinan dan cinta, kami melangkah ke tahap yang lebih serius.",
                    image: "https://i.ibb.co.com/qMTjgNxM/story4.jpg"
                }
            ],
            gallery: [
                "https://i.ibb.co.com/20XNYHKm/gallery1.jpg",
                "https://i.ibb.co.com/DHc2VzZz/gallery2.jpg",
                "https://i.ibb.co.com/9k4gQZv5/gallery3.jpg",
                "https://i.ibb.co.com/xvWDx1k/gallery4.jpg",
                "https://i.ibb.co.com/qZ0p5Vb/gallery5.jpg",
                "https://i.ibb.co.com/nNqKXLJj/gallery6.jpg"
            ],
            music: "",
            weddingDate: "Jumat, 14 Desember 2029",
            countdownDate: "2029-12-14 08:00:00",
            gifts: [
                {
                    bankName: "BCA",
                    accountNumber: "123456",
                    accountHolder: "Ozy Zulkarnain",
                    logo: "https://upload.wikimedia.org/wikipedia/commons/5/5c/Bank_Central_Asia.svg"
                },
                {
                    bankName: "Mandiri",
                    accountNumber: "567890",
                    accountHolder: "Zelda Wulandari",
                    logo: "https://upload.wikimedia.org/wikipedia/commons/a/ad/Bank_Mandiri_logo_2016.svg"
                }
            ],
            whatsappNumber: "628123456789",
            youtubeUrl: "https://youtu.be/Contoh",
            coverImage: "https://i.ibb.co.com/DHc2VzZz/gallery2.jpg",
            quotes: "“Dan di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang.” (QS. Ar-Rum: 21)",
            theme: "royal-gold"
        };

        setTable('admin_settings', [
            { key: 'business_name', value: 'SEJOLI' },
            { key: 'owner_whatsapp', value: '6285716467666' },
            { key: 'primary_domain', value: '' },
            { key: 'theme_pricing_json', value: JSON.stringify({
                global: { '1': '99000', '2': '149000', '3': '199000', orig: '250000' },
                'royal-gold': { '1': '99000', '2': '149000', '3': '199000', orig: '250000' },
                'floral-light': { '1': '99000', '2': '149000', '3': '199000', orig: '250000' },
                'midnight-dark': { '1': '99000', '2': '149000', '3': '199000', orig: '250000' },
                'heritage-series': { '1': '99000', '2': '149000', '3': '199000', orig: '250000' },
                'modern-botanical': { '1': '99000', '2': '149000', '3': '199000', orig: '250000' }
            })}
        ]);

        setTable('invitations', [
            {
                id: 'inv-client-1',
                slug: 'ozy-zelda',
                password: '123456',
                expiry_days: 90,
                created_at: new Date().toISOString(),
                config: defaultWeddingConfig
            },
            {
                id: 'inv-client-demo',
                slug: 'demo',
                password: 'demo',
                expiry_days: 365,
                created_at: new Date().toISOString(),
                config: { ...defaultWeddingConfig, theme: 'royal-gold' }
            },
            {
                id: 'inv-client-demo2',
                slug: 'demo2',
                password: 'demo',
                expiry_days: 365,
                created_at: new Date().toISOString(),
                config: { ...defaultWeddingConfig, theme: 'floral-light' }
            },
            {
                id: 'inv-client-demo3',
                slug: 'demo3',
                password: 'demo',
                expiry_days: 365,
                created_at: new Date().toISOString(),
                config: { ...defaultWeddingConfig, theme: 'midnight-dark' }
            },
            {
                id: 'inv-client-demo4',
                slug: 'demo4',
                password: 'demo',
                expiry_days: 365,
                created_at: new Date().toISOString(),
                config: { ...defaultWeddingConfig, theme: 'heritage-series' }
            },
            {
                id: 'inv-client-demo5',
                slug: 'demo5',
                password: 'demo',
                expiry_days: 365,
                created_at: new Date().toISOString(),
                config: { ...defaultWeddingConfig, theme: 'modern-botanical' }
            }
        ]);

        setTable('wishes', [
            {
                id: 'wish-1',
                slug: 'ozy-zelda',
                name: 'Bpk. Hendra & Keluarga',
                attendance: 'Hadir',
                message: 'Selamat menempuh hidup baru untuk Ozy & Zelda! Semoga sakinah mawaddah warahmah.',
                created_at: new Date(Date.now() - 3600000 * 24).toISOString()
            },
            {
                id: 'wish-2',
                slug: 'ozy-zelda',
                name: 'Dian & Sahabat',
                attendance: 'Hadir',
                message: 'Barakallahu lakum wa baraka alaikum! Bahagia selalu sampai kakek nenek yaaa ✨',
                created_at: new Date(Date.now() - 3600000 * 5).toISOString()
            }
        ]);

        localStorage.setItem(STORAGE_PREFIX + 'seeded', 'v3');
    }

    class MockQueryBuilder {
        constructor(tableName) {
            this.tableName = tableName;
            this.filters = [];
            this.orders = [];
            this.isSingle = false;
            this.operation = 'select';
            this.payload = null;
            this.selectCols = '*';
        }

        select(cols = '*') {
            this.selectCols = cols;
            return this;
        }

        eq(column, value) {
            this.filters.push(item => item[column] === value);
            return this;
        }

        ilike(column, value) {
            const v = String(value).toLowerCase();
            this.filters.push(item => String(item[column] || '').toLowerCase() === v);
            return this;
        }

        in(column, values) {
            const set = new Set(values);
            this.filters.push(item => set.has(item[column]));
            return this;
        }

        order(column, { ascending = true } = {}) {
            this.orders.push({ column, ascending });
            return this;
        }

        maybeSingle() {
            this.isSingle = true;
            return this;
        }

        insert(rows) {
            this.operation = 'insert';
            this.payload = Array.isArray(rows) ? rows : [rows];
            return this;
        }

        update(fields) {
            this.operation = 'update';
            this.payload = fields;
            return this;
        }

        upsert(rows) {
            this.operation = 'upsert';
            this.payload = Array.isArray(rows) ? rows : [rows];
            return this;
        }

        delete() {
            this.operation = 'delete';
            return this;
        }

        async execute() {
            let table = getTable(this.tableName);

            if (this.operation === 'insert') {
                const inserted = this.payload.map(p => ({
                    id: p.id || 'id_' + Math.random().toString(36).substr(2, 9),
                    created_at: p.created_at || new Date().toISOString(),
                    ...p
                }));
                table.push(...inserted);
                setTable(this.tableName, table);
                return { data: inserted, error: null };
            }

            if (this.operation === 'upsert') {
                for (const row of this.payload) {
                    const matchKey = this.tableName === 'admin_settings' ? 'key' : 'id';
                    const idx = table.findIndex(item => item[matchKey] === row[matchKey]);
                    if (idx >= 0) {
                        table[idx] = { ...table[idx], ...row };
                    } else {
                        table.push({
                            id: row.id || 'id_' + Math.random().toString(36).substr(2, 9),
                            created_at: row.created_at || new Date().toISOString(),
                            ...row
                        });
                    }
                }
                setTable(this.tableName, table);
                return { data: this.payload, error: null };
            }

            if (this.operation === 'update') {
                const updated = [];
                table = table.map(item => {
                    const matches = this.filters.every(f => f(item));
                    if (matches) {
                        const updatedItem = { ...item, ...this.payload };
                        updated.push(updatedItem);
                        return updatedItem;
                    }
                    return item;
                });
                setTable(this.tableName, table);
                return { data: updated, error: null };
            }

            if (this.operation === 'delete') {
                table = table.filter(item => !this.filters.every(f => f(item)));
                setTable(this.tableName, table);
                return { data: null, error: null };
            }

            // Standard SELECT
            let results = table.filter(item => this.filters.every(f => f(item)));

            for (const ord of this.orders) {
                results.sort((a, b) => {
                    const valA = a[ord.column];
                    const valB = b[ord.column];
                    if (valA < valB) return ord.ascending ? -1 : 1;
                    if (valA > valB) return ord.ascending ? 1 : -1;
                    return 0;
                });
            }

            if (this.selectCols && this.selectCols !== '*') {
                const fields = this.selectCols.split(',').map(s => s.trim());
                results = results.map(row => {
                    const projected = {};
                    fields.forEach(f => {
                        if (row[f] !== undefined) projected[f] = row[f];
                    });
                    return projected;
                });
            }

            if (this.isSingle) {
                return { data: results[0] || null, error: null };
            }

            return { data: results, error: null };
        }

        then(resolve, reject) {
            return this.execute().then(resolve, reject);
        }
    }

    const mockStorage = {
        from: (bucket) => ({
            upload: async (filePath, file) => {
                const url = file instanceof Blob ? URL.createObjectURL(file) : (typeof file === 'string' ? file : '');
                try {
                    localStorage.setItem('mock_storage_' + filePath, url);
                } catch (e) {}
                return { data: { path: filePath }, error: null };
            },
            getPublicUrl: (filePath) => {
                const saved = localStorage.getItem('mock_storage_' + filePath);
                return { data: { publicUrl: saved || filePath } };
            }
        })
    };

    const mockAuth = {
        signInWithPassword: async ({ email, password }) => {
            if (!email || !password) {
                return { data: { user: null, session: null }, error: { message: 'Email and password required' } };
            }
            const user = { id: 'admin-preview-user', email, role: 'authenticated' };
            const session = { access_token: 'mock-session-token', user };
            localStorage.setItem(STORAGE_PREFIX + 'auth_session', JSON.stringify(session));
            return { data: { user, session }, error: null };
        },
        getSession: async () => {
            const raw = localStorage.getItem(STORAGE_PREFIX + 'auth_session');
            return { data: { session: raw ? JSON.parse(raw) : null }, error: null };
        },
        getUser: async () => {
            const raw = localStorage.getItem(STORAGE_PREFIX + 'auth_session');
            const session = raw ? JSON.parse(raw) : null;
            return { data: { user: session ? session.user : null }, error: session ? null : { message: 'No active session' } };
        },
        signOut: async () => {
            localStorage.removeItem(STORAGE_PREFIX + 'auth_session');
            return { error: null };
        }
    };

    return {
        from: (tableName) => new MockQueryBuilder(tableName),
        auth: mockAuth,
        storage: mockStorage
    };
}

if (typeof supabase !== 'undefined' && SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
        window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Supabase Client initialized! URL:', SUPABASE_URL.substring(0, 10) + '...');
    } catch (err) {
        console.warn('⚠️ Failed to initialize official Supabase client, falling back to mock:', err);
        window.supabaseClient = createMockSupabaseClient();
    }
} else {
    window.supabaseClient = createMockSupabaseClient();
}

window.EDITOR_PASSWORD = EDITOR_PASSWORD;
