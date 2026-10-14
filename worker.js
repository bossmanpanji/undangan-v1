/**
 * 💍 Cloudflare Worker: "The Concierge"
 * Tugas: Menangani Subdomain & Injeksi Meta Tags (SSR)
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const hostname = url.hostname;
    
    // 1. CACHING & ASSETS HANDLING
    if (url.pathname.match(/\.(css|js|png|jpg|jpeg|svg|webp|gif|ico|mp3|wav|ogg|woff|woff2|ttf|json)$/i) || url.pathname.includes('/storage/v1/object/public/')) {
      const cache = caches.default;
      let response = await cache.match(request);

      if (!response) {
        const originUrl = url.pathname.includes('/storage/v1/object/public/') 
                          ? `${env.SUPABASE_URL}${url.pathname}${url.search}`
                          : `https://${env.BASE_DOMAIN}${url.pathname}${url.search}`;
        
        response = await fetch(originUrl);
        response = new Response(response.body, response);
        response.headers.set("Cache-Control", "public, max-age=604800");
        
        if (response.status === 200) {
          ctx.waitUntil(cache.put(request, response.clone()));
        }
      }
      return response;
    }

    // --- 2. UNIVERSAL ROUTING ---
    let slug = "";
    const baseDomain = env.BASE_DOMAIN;
    const isRootDomain = hostname === baseDomain || hostname === `www.${baseDomain}`;
    const isAppSubdomain = hostname === `app.${baseDomain}`;

    if (isAppSubdomain || isRootDomain) {
        // Biarkan Vercel yang mengurus root dan app
        slug = ""; 
    } else if (hostname.endsWith(`.${baseDomain}`)) {
        // Ini adalah traffic undangan (budi.domain.my.id)
        slug = hostname.replace(`.${baseDomain}`, "").toLowerCase();
        if (['www', 'app', 'admin', 'login'].includes(slug)) slug = "";
    }


    // 3. SSR & META INJECTION
    if (slug && !['admin', 'editor', 'login', '/login/', 'app'].includes(slug.toLowerCase())) {
      try {
        const response = await fetch(
          `${env.SUPABASE_URL}/rest/v1/invitations?slug=ilike.${slug}&select=config`,
          {
            headers: {
              'apikey': env.SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${env.SUPABASE_ANON_KEY}`
            }
          }
        );
        
        const data = await response.json();
        const invitation = data && data.length > 0 ? data[0] : null;

        if (invitation) {
          const rawTheme = (invitation.config?.theme || 'v1').toLowerCase().trim();
          
          let vercelRes;
          // 1. Jika tema adalah salah satu sub-tema klasik V1, langsung ambil v1
          if (['royal-gold', 'floral-light', 'midnight-dark', 'v1'].includes(rawTheme)) {
            vercelRes = await fetch(`https://${env.BASE_DOMAIN}/themes/v1/index.html`);
          } else {
            // 2. Dinamis: Otomatis coba ambil folder tema sesuai nama tema (misal: heritage-series, atau tema baru apapun nanti)
            vercelRes = await fetch(`https://${env.BASE_DOMAIN}/themes/${rawTheme}/index.html`);
            
            // 3. Fallback: Jika folder tema khusus tersebut tidak ditemukan (404), fallback ke v1 agar tidak crash
            if (!vercelRes.ok || !vercelRes.headers.get("content-type")?.includes("text/html")) {
              vercelRes = await fetch(`https://${env.BASE_DOMAIN}/themes/v1/index.html`);
            }
          }

          let html = await vercelRes.text();

          const config = invitation.config;
          const groom = config.couple?.groom?.name || 'Pria';
          const bride = config.couple?.bride?.name || 'Wanita';
          const title = `💍 The Wedding of ${groom} & ${bride}`;
          
          const defaultDesc = `Tanpa mengurangi rasa hormat, kami mengundang Bapak/Ibu/Saudara/i untuk hadir dan memberikan doa restu pada acara pernikahan kami. Klik link untuk detail selengkapnya.`;
          const description = config.quotes || defaultDesc;
          let image = config.ogImage || config.coverImage || "https://i.ibb.co.com/gZpZ6Q7/default-thumbnail.jpg";

          const metaTags = `
            <title>${title}</title>
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
              window.FORCE_SLUG = "${slug}";
              window.BASE_DOMAIN = "${baseDomain}";
            </script>
          `;

          html = html.replace('</head>', `${metaTags}</head>`);

          return new Response(html, {
            headers: { 'Content-Type': 'text/html' }
          });
        } else {
          // Jika subdomain tidak terdaftar di Supabase, redirect ke domain utama
          return Response.redirect(`https://${env.BASE_DOMAIN}`, 302);
        }
      } catch (err) {
        console.error("Worker Error:", err);
        // Jika terjadi error saat fetch (misalnya database down), arahkan ke domain utama
        return Response.redirect(`https://${env.BASE_DOMAIN}`, 302);
      }
    }

    // 4. DEFAULT: TAMPILKAN DARI VERCEL
    const response = await fetch(`https://${env.BASE_DOMAIN}${url.pathname}${url.search}`);
    
    // Jika formatnya HTML, sisipkan BASE_DOMAIN agar script.js tahu domain utama kita
    if (response.headers.get("content-type")?.includes("text/html")) {
        let html = await response.text();
        html = html.replace('</head>', `<script>window.BASE_DOMAIN = "${env.BASE_DOMAIN}";</script></head>`);
        return new Response(html, response);
    }

    return response;
  }
};
