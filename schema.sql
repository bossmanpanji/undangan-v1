-- ==========================================
-- 💍 SQL SCHEMA FOR WEDDING INVITATION V4.0 (SUPABASE AUTH EDITION)
-- Target: Jalankan ini sekali saja di Supabase SQL Editor
-- ==========================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLES
-- Table: invitations (Data Undangan Klien)
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL, 
  password TEXT,             -- Password khusus klien (non-auth)
  config JSONB NOT NULL,     -- Seluruh konfigurasi undangan
  expiry_days INTEGER DEFAULT 90, -- Masa aktif dalam hari
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Table: wishes (Buku Tamu / Ucapan)
CREATE TABLE IF NOT EXISTS wishes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL, 
  name TEXT NOT NULL,
  message TEXT NOT NULL,
  attendance TEXT DEFAULT 'Hadir',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Table: admin_settings (Pengaturan Brand & Fitur)
CREATE TABLE IF NOT EXISTS admin_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- 3. INDEXING
CREATE INDEX IF NOT EXISTS idx_invitations_slug ON invitations(slug);
CREATE INDEX IF NOT EXISTS idx_wishes_slug ON wishes(slug);

-- 4. INITIAL DATA
INSERT INTO admin_settings (key, value) 
VALUES 
  ('business_name', 'SEJOLI'), 
  ('owner_whatsapp', '6285716467666'),
  ('primary_domain', '')
ON CONFLICT (key) DO NOTHING;

-- 5. ROW LEVEL SECURITY (RLS)
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- POLICIES: invitations
-- Admin (Authenticated): Full Access
CREATE POLICY "Admin Full Access Invitations" ON invitations
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Public (Anon): Read Only (untuk menampilkan undangan)
CREATE POLICY "Public Read Invitations" ON invitations
FOR SELECT TO anon USING (true);

-- Public (Anon): Update (untuk klien menyimpan perubahan via Editor)
CREATE POLICY "Public Update Invitations" ON invitations
FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- POLICIES: wishes
-- Admin (Authenticated): Full Access
CREATE POLICY "Admin Full Access Wishes" ON wishes
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Public (Anon): Read, Insert, Delete (untuk tamu mengisi dan klien menghapus ucapan)
CREATE POLICY "Public Read Wishes" ON wishes FOR SELECT TO anon USING (true);
CREATE POLICY "Public Insert Wishes" ON wishes FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Public Delete Wishes" ON wishes FOR DELETE TO anon USING (true);

-- POLICIES: admin_settings
-- Admin (Authenticated): Full Access
CREATE POLICY "Admin Full Access Settings" ON admin_settings
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Public (Anon): Read Only (untuk branding di landing page)
CREATE POLICY "Public Read Settings" ON admin_settings
FOR SELECT TO anon USING (true);

-- ==========================================
-- 6. STORAGE BUCKET & POLICIES (AUTOMATIC SETUP)
-- ==========================================

-- Buat bucket 'invitation-images' dan set ke PUBLIC
INSERT INTO storage.buckets (id, name, public) 
VALUES ('invitation-images', 'invitation-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Hapus policy lama jika ada (untuk menghindari error duplikat)
DROP POLICY IF EXISTS "Public View Images" ON storage.objects;
DROP POLICY IF EXISTS "Allow Public Uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow Public Updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow Public Deletes" ON storage.objects;

-- Buat policy baru untuk bucket 'invitation-images'
-- 1. Mengizinkan siapa saja melihat gambar (SELECT)
CREATE POLICY "Public View Images" ON storage.objects 
FOR SELECT TO public USING (bucket_id = 'invitation-images');

-- 2. Mengizinkan siapa saja mengunggah gambar baru (INSERT)
CREATE POLICY "Allow Public Uploads" ON storage.objects 
FOR INSERT TO public WITH CHECK (bucket_id = 'invitation-images');

-- 3. Mengizinkan siapa saja mengupdate gambar (UPDATE)
CREATE POLICY "Allow Public Updates" ON storage.objects 
FOR UPDATE TO public USING (bucket_id = 'invitation-images');

-- 4. Mengizinkan siapa saja menghapus gambar (DELETE)
CREATE POLICY "Allow Public Deletes" ON storage.objects 
FOR DELETE TO public USING (bucket_id = 'invitation-images');

-- ==========================================
-- SELESAI!
-- Setelah menjalankan script ini, silakan:
-- 1. Buat User baru di menu Authentication > Users untuk akun Admin Anda.
-- (Bucket Storage 'invitation-images' sudah terbuat otomatis lewat script ini!)
-- ==========================================
