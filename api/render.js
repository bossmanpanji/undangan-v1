const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  let slug = req.query.u;
  
  if (!slug) {
    return res.status(400).send("Slug is required");
  }

  // Bersihkan slug dari garis miring di akhir jika ada
  slug = slug.replace(/\/$/, '');

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  try {
    // 1. Ambil data dari Supabase via REST API (Case-Insensitive)
    const fetchUrl = `${supabaseUrl}/rest/v1/invitations?slug=ilike.${slug}&select=config`;
    const response = await fetch(fetchUrl, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Range': '0-0'
      }
    });

    if (!response.ok) throw new Error(`Supabase Error: ${response.statusText}`);

    const data = await response.json();
    const invitation = data && data.length > 0 ? data[0] : null;

    // 2. Buat HTML minimal khusus untuk Meta Tags (Social Media Scrapers)
    const config = invitation?.config || {};
    const title = config.couple ? `The Wedding of ${config.couple.groom?.name || 'Pria'} & ${config.couple.bride?.name || 'Wanita'}` : "Undangan Pernikahan Digital";
    const description = config.quotes || "Tanpa mengurangi rasa hormat, kami bermaksud mengundang Anda untuk hadir di hari bahagia kami.";
    let image = config.ogImage || config.coverImage || "https://i.ibb.co.com/gZpZ6Q7/default-thumbnail.jpg";
    
    // Pastikan URL gambar adalah URL lengkap (Absolute)
    if (image && !image.startsWith('http')) {
      image = `${supabaseUrl}/storage/v1/object/public/invitation-images/${image}`;
    }
    
    // Ambil parameter tambahan (seperti 'to') untuk diteruskan saat redirect
    const queryParams = new URLSearchParams(req.query);
    queryParams.delete('u'); 
    const additionalParams = queryParams.toString();
    const redirectUrl = `/themes/v1/index.html?u=${slug}${additionalParams ? '&' + additionalParams : ''}`;

    const bridgeHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${description}">
    <meta property="og:type" content="website">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${image}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${image}">
    <script>
        window.location.href = "${redirectUrl}";
    </script>
</head>
<body style="background: #1a120b; color: #fff; display: flex; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif; margin: 0;">
    <div style="text-align: center; border: 1px solid #b8860b; padding: 40px; border-radius: 20px;">
        <h2 style="color: #b8860b;">Memuat Undangan...</h2>
        <p style="opacity: 0.7;">Sedang menyiapkan pengalaman terbaik untuk Anda.</p>
    </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(bridgeHtml);

  } catch (error) {
    console.error("Render Error:", error);
    // Jika gagal total, arahkan ke index standar dengan mempertahankan parameter
    const queryParams = new URLSearchParams(req.query);
    queryParams.delete('u');
    const additionalParams = queryParams.toString();
    const fallbackUrl = `/themes/v1/index.html?u=${slug}${additionalParams ? '&' + additionalParams : ''}`;
    
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(`<html><head><script>window.location.href="${fallbackUrl}";</script></head><body>Redirecting...</body></html>`);
  }
}
