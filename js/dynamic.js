document.addEventListener('DOMContentLoaded', async () => {
    try {
        const res = await fetch('data/content.json?t=' + new Date().getTime(), { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to load content.json');
        const data = await res.json();
        
        // --- HERO ---
        if (data.hero) {
            const h = document.querySelector('.hero');
            if (h) {
                const eye = h.querySelector('.eyebrow'); if (eye && data.hero.eyebrow) eye.innerHTML = data.hero.eyebrow;
                const ttl = h.querySelector('.hero__title'); if (ttl && data.hero.title) ttl.innerHTML = data.hero.title;
                const desc = h.querySelector('.hero__desc'); if (desc && data.hero.description) desc.innerHTML = data.hero.description;
                const badge = h.querySelector('.hero__badge span'); if (badge && data.hero.badge) badge.innerHTML = data.hero.badge;
                if (data.hero.heroImage) {
                    const img = h.querySelector('.hero__image-frame img');
                    if (img) img.src = data.hero.heroImage;
                }
                const stats = h.querySelectorAll('.hero__trust-item');
                data.hero.stats?.forEach((s, i) => {
                    if (stats[i]) {
                        stats[i].querySelector('strong').innerHTML = s.value;
                        stats[i].querySelector('span').innerHTML = s.label;
                    }
                });
            }
        }

        // --- ABOUT ---
        if (data.about) {
            const a = document.querySelector('.about');
            if (a) {
                const eye = a.querySelector('.eyebrow'); if (eye && data.about.eyebrow) eye.innerHTML = data.about.eyebrow;
                const ttl = a.querySelector('.section-title'); if (ttl && data.about.title) ttl.innerHTML = data.about.title;
                const ps = a.querySelectorAll('.about__content p');
                data.about.paragraphs?.forEach((p, i) => { if (ps[i]) ps[i].innerHTML = p; });
                
                if (data.about.imageMain) {
                    const img = a.querySelector('.about__image-main img');
                    if (img) img.src = data.about.imageMain;
                }
                if (data.about.imageAccent) {
                    const img = a.querySelector('.about__image-accent img');
                    if (img) img.src = data.about.imageAccent;
                }

                const statCards = a.querySelectorAll('.stat-card');
                data.about.counters?.forEach((c, i) => {
                    if (statCards[i]) {
                        statCards[i].querySelector('.stat-card__num').setAttribute('data-counter', c.value);
                        statCards[i].querySelector('.stat-card__num').textContent = '0';
                        statCards[i].querySelector('.stat-card__suffix').innerHTML = c.suffix;
                        statCards[i].querySelector('.stat-card__label').innerHTML = c.label;
                    }
                });
            }
        }

        // --- SERVICES ---
        if (data.services) {
            const s = document.querySelector('.services');
            if (s) {
                const eye = s.querySelector('.eyebrow'); if (eye && data.services.eyebrow) eye.innerHTML = data.services.eyebrow;
                const ttl = s.querySelector('.section-title'); if (ttl && data.services.title) ttl.innerHTML = data.services.title;
                const sub = s.querySelector('.section-sub'); if (sub && data.services.subtitle) sub.innerHTML = data.services.subtitle;
                
                const grid = s.querySelector('.services-grid');
                if (grid && data.services.items?.length > 0) {
                    grid.innerHTML = data.services.items.map(item => `
                        <article class="service-card" data-reveal>
                            <div class="service-card__img">
                                <img src="${item.image || 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22800%22 height=%22600%22><rect width=%22100%25%22 height=%22100%25%22 fill=%22%23EDE0D3%22/><text x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-family=%22sans-serif%22 font-size=%2224%22 fill=%22%23C59C8D%22>Image</text></svg>'}" alt="${item.name}">
                            </div>
                            <div class="service-card__body">
                                <svg class="service-card__icon" viewBox="0 0 64 40"><use href="#lash-fan"/></svg>
                                <h3>${item.name}</h3>
                                <p>${item.description}</p>
                                <a href="#promotions" class="service-card__link">View Pricing <i class="fa-solid fa-arrow-right"></i></a>
                            </div>
                        </article>
                    `).join('');
                }
            }
        }

        // --- PROMOTIONS ---
        if (data.promotions) {
            const p = document.querySelector('.promotions');
            if (p) {
                const eye = p.querySelector('.eyebrow'); if (eye && data.promotions.eyebrow) eye.innerHTML = data.promotions.eyebrow;
                const ttl = p.querySelector('.section-title'); if (ttl && data.promotions.title) ttl.innerHTML = data.promotions.title;
                const sub = p.querySelector('.section-sub'); if (sub && data.promotions.subtitle) sub.innerHTML = data.promotions.subtitle;
                
                const grid = p.querySelector('.pricing-grid');
                if (grid && data.promotions.items?.length > 0) {
                    grid.innerHTML = data.promotions.items.map(item => `
                        <article class="pricing-card ${item.featured ? 'pricing-card--featured' : ''}" data-reveal>
                            ${item.tag ? `<span class="pricing-card__tag">${item.tag}</span>` : ''}
                            <h3 class="pricing-card__name">${item.name}</h3>
                            <p class="pricing-card__desc">${item.description}</p>
                            <div class="pricing-card__price"><span>${item.currency}</span>${item.price}</div>
                            <ul class="pricing-card__features">
                                ${item.features.map(f => `<li><i class="fa-solid fa-check"></i> ${f}</li>`).join('')}
                            </ul>
                            <a href="#contact" class="btn ${item.featured ? 'btn--primary' : 'btn--outline'}">Book This Package</a>
                        </article>
                    `).join('');
                }
            }
        }

        // --- GALLERY ---
        if (data.gallery) {
            const g = document.querySelector('.gallery');
            if (g) {
                const grid = g.querySelector('.gallery-grid');
                if (grid && data.gallery.images?.length > 0) {
                    grid.innerHTML = data.gallery.images.map((img, i) => `
                        <div class="gallery-item ${i%4===1 || i%4===4 ? 'gallery-item--tall' : ''}" data-full="${img}">
                            <img src="${img}" alt="Gallery Image">
                            <span class="gallery-item__zoom"><i class="fa-solid fa-magnifying-glass-plus"></i></span>
                        </div>
                    `).join('');
                }
            }
        }

        // --- REVIEWS ---
        if (data.reviews) {
            const track = document.getElementById('reviewsTrack');
            if (track && data.reviews.items?.length > 0) {
                track.innerHTML = data.reviews.items.map((r, i) => `
                    <article class="review-card ${i===0?'active':''}">
                        <div class="review-card__stars">${'★'.repeat(r.stars)}</div>
                        <p class="review-card__text">${r.text}</p>
                        <div class="review-card__author"><strong>${r.author}</strong><span>${r.role}</span></div>
                    </article>
                `).join('');
                
                // Re-init dots
                const dotsContainer = document.getElementById('reviewsDots');
                if (dotsContainer) {
                    dotsContainer.innerHTML = data.reviews.items.map((_, i) => `<span class="${i===0?'active':''}"></span>`).join('');
                    const dots = dotsContainer.querySelectorAll('span');
                    const cards = track.querySelectorAll('.review-card');
                    dots.forEach((dot, i) => {
                        dot.addEventListener('click', () => {
                            cards.forEach(c => c.classList.remove('active'));
                            dots.forEach(d => d.classList.remove('active'));
                            cards[i].classList.add('active');
                            dots[i].classList.add('active');
                        });
                    });
                }
            }
        }

        // --- BANNER ---
        if (data.banner) {
            const b = document.querySelector('.banner');
            if (b) {
                const eye = b.querySelector('.eyebrow'); if (eye && data.banner.eyebrow) eye.innerHTML = data.banner.eyebrow;
                const ttl = b.querySelector('.banner__title'); if (ttl && data.banner.title) ttl.innerHTML = data.banner.title;
                const desc = b.querySelector('.banner__desc'); if (desc && data.banner.description) desc.innerHTML = data.banner.description;
            }
        }

        // --- CONTACT ---
        if (data.contact) {
            const c = document.querySelector('.contact');
            if (c) {
                const phone = c.querySelector('a[href^="tel:"] span'); if (phone) phone.innerHTML = data.contact.phone;
                const line = c.querySelector('a[href*="line.me"] span'); if (line) line.innerHTML = data.contact.line;
                const ig = c.querySelector('a[href*="instagram.com"] span'); if (ig) ig.innerHTML = data.contact.instagram;
                const map = c.querySelector('.contact-map iframe'); if (map && data.contact.mapUrl) map.src = data.contact.mapUrl;
                
                const hours = c.querySelector('.contact-hours');
                if (hours && data.contact.hours) {
                    hours.innerHTML = `<h4>Studio Hours</h4>` + data.contact.hours.map(h => `
                        <div class="contact-hours__row"><span>${h.days}</span><span>${h.time}</span></div>
                    `).join('');
                }
            }
            
            // Footer
            const fPhone = document.querySelector('.footer p i.fa-phone').parentNode; if (fPhone) fPhone.innerHTML = `<i class="fa-solid fa-phone"></i> ${data.contact.phone}`;
            const fLine = document.querySelector('.footer p i.fa-line').parentNode; if (fLine) fLine.innerHTML = `<i class="fa-brands fa-line"></i> ${data.contact.line}`;
            const fIg = document.querySelector('.footer p i.fa-instagram').parentNode; if (fIg) fIg.innerHTML = `<i class="fa-brands fa-instagram"></i> ${data.contact.instagram}`;
            const fLoc = document.querySelector('.footer p i.fa-location-dot').parentNode; if (fLoc) fLoc.innerHTML = `<i class="fa-solid fa-location-dot"></i> ${data.contact.location}`;
        }
        
        // Re-trigger reveal elements
        setTimeout(() => {
            document.querySelectorAll('[data-reveal]').forEach(el => {
                if (el.getBoundingClientRect().top < window.innerHeight) {
                    el.classList.add('is-visible');
                }
            });
        }, 100);

    } catch (e) {
        console.error('Content injection failed:', e);
    }
});
