document.addEventListener('DOMContentLoaded', () => {
    // ========== SET CURRENT YEAR IN FOOTER ==========
    const yearElement = document.getElementById('year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }

    // ========== NAVBAR SCROLL & ACTIVE LINK ==========
    const navbar = document.getElementById('navbar');
    const backToTop = document.getElementById('backToTop');
    const navLinks = document.querySelectorAll('[data-nav]');
    const sections = Array.from(navLinks).map(link => {
        const id = link.getAttribute('href').substring(1);
        return document.getElementById(id);
    }).filter(Boolean);

    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        
        // Navbar styling
        if (scrollY > 50) {
            navbar.classList.add('scrolled');
            if(backToTop) backToTop.classList.add('show');
        } else {
            navbar.classList.remove('scrolled');
            if(backToTop) backToTop.classList.remove('show');
        }

        // Active link highlighting
        let currentSectionId = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionHeight = section.offsetHeight;
            if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
                currentSectionId = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSectionId}`) {
                link.classList.add('active');
            }
        });
    });

    if (backToTop) {
        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // ========== MOBILE MENU ==========
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileLinks = mobileMenu?.querySelectorAll('a');

    if (hamburger && mobileMenu) {
        hamburger.addEventListener('click', () => {
            const isOpen = hamburger.classList.contains('open');
            hamburger.classList.toggle('open');
            mobileMenu.classList.toggle('open');
            hamburger.setAttribute('aria-expanded', !isOpen);
        });

        mobileLinks?.forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('open');
                mobileMenu.classList.remove('open');
                hamburger.setAttribute('aria-expanded', 'false');
            });
        });
    }

    // ========== SCROLL REVEAL ANIMATIONS ==========
    const revealElements = document.querySelectorAll('[data-reveal]');
    const revealOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const revealOnScroll = new IntersectionObserver(function(entries, observer) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, revealOptions);

    revealElements.forEach(el => revealOnScroll.observe(el));

    // ========== STATS COUNTER ANIMATION ==========
    const counterElements = document.querySelectorAll('[data-counter]');
    const counterObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = entry.target;
                const targetValue = parseInt(target.getAttribute('data-counter'), 10);
                let current = 0;
                const increment = Math.max(1, Math.ceil(targetValue / 40));
                
                const updateCounter = () => {
                    current += increment;
                    if (current < targetValue) {
                        target.textContent = current;
                        requestAnimationFrame(updateCounter);
                    } else {
                        target.textContent = targetValue;
                    }
                };
                
                updateCounter();
                observer.unobserve(target);
            }
        });
    }, { threshold: 0.5 });

    counterElements.forEach(el => counterObserver.observe(el));

    // ========== REVIEWS CAROUSEL ==========
    const reviewsTrack = document.getElementById('reviewsTrack');
    const reviewCards = document.querySelectorAll('.review-card');
    const prevBtn = document.getElementById('reviewPrev');
    const nextBtn = document.getElementById('reviewNext');
    const dotsContainer = document.getElementById('reviewsDots');
    let currentReview = 0;

    if (reviewsTrack && reviewCards.length > 0) {
        // Create dots
        reviewCards.forEach((_, index) => {
            const dot = document.createElement('span');
            if (index === 0) dot.classList.add('active');
            dot.addEventListener('click', () => goToReview(index));
            dotsContainer.appendChild(dot);
        });

        const dots = dotsContainer.querySelectorAll('span');

        const goToReview = (index) => {
            reviewCards[currentReview].classList.remove('active');
            dots[currentReview].classList.remove('active');
            
            currentReview = index;
            
            reviewCards[currentReview].classList.add('active');
            dots[currentReview].classList.add('active');
        };

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                let prevIndex = currentReview - 1;
                if (prevIndex < 0) prevIndex = reviewCards.length - 1;
                goToReview(prevIndex);
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                let nextIndex = currentReview + 1;
                if (nextIndex >= reviewCards.length) nextIndex = 0;
                goToReview(nextIndex);
            });
        }

        // Initialize first review
        reviewCards[0].classList.add('active');
    }

    // ========== GALLERY LIGHTBOX ==========
    const galleryItems = document.querySelectorAll('.gallery-item');
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxClose = document.getElementById('lightboxClose');

    if (lightbox && lightboxImg) {
        galleryItems.forEach(item => {
            item.addEventListener('click', () => {
                const fullImgSrc = item.getAttribute('data-full');
                if (fullImgSrc) {
                    lightboxImg.src = fullImgSrc;
                    lightbox.classList.add('open');
                    document.body.style.overflow = 'hidden'; // Prevent scrolling
                }
            });
        });

        const closeLightbox = () => {
            lightbox.classList.remove('open');
            setTimeout(() => { lightboxImg.src = ''; }, 400); // Clear image after transition
            document.body.style.overflow = ''; // Restore scrolling
        };

        lightboxClose?.addEventListener('click', closeLightbox);
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) closeLightbox();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && lightbox.classList.contains('open')) closeLightbox();
        });
    }

    // ========== BOOKING FORM MOCK SUBMIT ==========
    const bookingForm = document.getElementById('bookingForm');
    const formNote = document.getElementById('formNote');

    if (bookingForm) {
        bookingForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const submitBtn = bookingForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            
            submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Sending...';
            submitBtn.disabled = true;

            // Mock API call
            setTimeout(() => {
                formNote.textContent = 'Thank you! We will confirm your appointment shortly.';
                formNote.style.color = 'var(--rose-gold-dark)';
                bookingForm.reset();
                
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
                
                setTimeout(() => {
                    formNote.textContent = '';
                }, 5000);
            }, 1500);
        });
    }
});
