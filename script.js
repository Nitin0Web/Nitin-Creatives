// ===== 3D TUBES INTERACTIVE BACKGROUND =====
(async function initTubesBackground() {
    const canvas = document.getElementById('heroTubesCanvas');
    if (!canvas) return;

    try {
        const module = await import('https://cdn.jsdelivr.net/npm/threejs-components@0.0.19/build/cursors/tubes1.min.js');
        const TubesCursor = module.default;

        const app = TubesCursor(canvas, {
            tubes: {
                // Colors matched to portfolio palette (purples + cyans)
                colors: ['#7c3aed', '#a855f7', '#06b6d4'],
                lights: {
                    intensity: 180,
                    colors: ['#a855f7', '#7c3aed', '#06b6d4', '#22d3ee']
                }
            }
        });

        // Random color generation helper
        const randomHex = () => '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
        const randomColors = (n) => Array.from({ length: n }, randomHex);

        // Click anywhere on the hero to randomize colors
        const hero = document.getElementById('hero');
        hero.addEventListener('click', (e) => {
            // Don't randomize if clicking a button or link
            if (e.target.closest('a, button')) return;
            if (!app?.tubes) return;

            app.tubes.setColors(randomColors(3));
            app.tubes.setLightsColors(randomColors(4));
        });

    } catch (err) {
        console.warn('Tubes background failed to load, using fallback:', err);
        // Graceful fallback: add back subtle glow effects
        const hero = document.getElementById('hero');
        if (hero) {
            const glow1 = document.createElement('div');
            glow1.style.cssText = 'position:absolute;width:500px;height:500px;background:#7c3aed;border-radius:50%;filter:blur(120px);opacity:0.35;top:-100px;right:-100px;pointer-events:none;';
            const glow2 = document.createElement('div');
            glow2.style.cssText = 'position:absolute;width:400px;height:400px;background:#06b6d4;border-radius:50%;filter:blur(120px);opacity:0.3;bottom:-50px;left:-100px;pointer-events:none;';
            hero.prepend(glow2);
            hero.prepend(glow1);
        }
    }
})();

// ===== NAVBAR SCROLL =====
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
});

// ===== MOBILE NAV TOGGLE =====
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    navToggle.classList.toggle('active');
});
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        navToggle.classList.remove('active');
    });
});

// ===== STAT COUNTER ANIMATION =====
function animateCounters() {
    document.querySelectorAll('.stat-number').forEach(el => {
        const target = +el.dataset.target;
        const duration = 2000;
        const start = performance.now();
        function update(now) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.round(target * ease);
            if (progress < 1) requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
    });
}

const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { animateCounters(); statsObserver.disconnect(); } });
}, { threshold: 0.5 });
const statsEl = document.querySelector('.hero-stats');
if (statsEl) statsObserver.observe(statsEl);

// ===== REVEAL ON SCROLL =====
const revealEls = document.querySelectorAll(
    '.service-card, .process-step, .testimonial-card, .about-wrapper, .contact-wrapper'
);
revealEls.forEach(el => el.classList.add('reveal'));

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((e, i) => {
        if (e.isIntersecting) {
            setTimeout(() => e.target.classList.add('visible'), i * 100);
            revealObserver.unobserve(e.target);
        }
    });
}, { threshold: 0.15 });
revealEls.forEach(el => revealObserver.observe(el));

// ===== STACKING CARDS — PREMIUM DECK EFFECT =====
const stackCards = document.querySelectorAll('.stack-card');
const stackContainer = document.querySelector('.stack-cards-container');
const STACK_OFFSET = window.innerWidth <= 768 ? 20 : 30;
const STACK_TOP = window.innerWidth <= 768 ? 70 : 90;

let ticking = false;

function updateStackCards() {
    const totalCards = stackCards.length;

    stackCards.forEach((card, i) => {
        const inner = card.querySelector('.stack-card-inner');
        const rect = card.getBoundingClientRect();
        const stickyTop = STACK_TOP + i * STACK_OFFSET;

        // Check if this card is currently stuck (at its sticky position)
        const isStuck = rect.top <= stickyTop + 1;

        if (isStuck && i < totalCards - 1) {
            // Calculate how much the NEXT card has overlapped this one
            const nextCard = stackCards[i + 1];
            const nextRect = nextCard.getBoundingClientRect();
            const nextStickyTop = STACK_TOP + (i + 1) * STACK_OFFSET;

            // How far the next card's top is from this card's top
            const distanceBetween = nextRect.top - stickyTop;
            const cardHeight = rect.height;

            // Progress: 0 = next card hasn't reached us yet, 1 = fully covering
            const overlap = Math.max(0, cardHeight - distanceBetween);
            const progress = Math.min(overlap / cardHeight, 1);

            // Eased progress for smoother visual
            const easedProgress = progress * progress;

            // Scale: shrinks from 1.0 → 0.94 as it gets buried
            const scale = 1 - easedProgress * 0.06;

            // Brightness: dims from 1.0 → 0.5 to create depth
            const brightness = 1 - easedProgress * 0.5;

            // Slight upward push to create "going into the table" feel
            const translateY = easedProgress * -8;

            // Apply transforms
            inner.style.transform = `scale(${scale}) translateY(${translateY}px)`;
            inner.style.filter = `brightness(${brightness})`;

            // Dynamic shadow — deeper cards get more diffuse, dimmer shadow
            const shadowSpread = 15 + easedProgress * 25;
            const shadowOpacity = 0.25 - easedProgress * 0.1;
            inner.style.boxShadow = `
                0 4px 15px rgba(0,0,0,0.3),
                0 ${shadowSpread}px ${shadowSpread * 2}px rgba(0,0,0,${shadowOpacity}),
                0 0 0 1px rgba(255,255,255,${0.04 - easedProgress * 0.03})
            `;
        } else {
            // Reset — card is either not stuck or is the last card
            inner.style.transform = '';
            inner.style.filter = '';
            inner.style.boxShadow = '';
        }
    });

    ticking = false;
}

function onStackScroll() {
    if (!ticking) {
        requestAnimationFrame(updateStackCards);
        ticking = true;
    }
}

window.addEventListener('scroll', onStackScroll, { passive: true });
// Recalculate on resize for responsive values
window.addEventListener('resize', () => {
    const newOffset = window.innerWidth <= 768 ? 20 : 30;
    const newTop = window.innerWidth <= 768 ? 70 : 90;
    // Update the CSS custom properties
    if (stackContainer) {
        stackContainer.style.setProperty('--stack-offset', newOffset + 'px');
        stackContainer.style.setProperty('--stack-top', newTop + 'px');
    }
}, { passive: true });

// ===== CONTACT FORM (WhatsApp redirect) =====
document.getElementById('contactForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const service = document.getElementById('service').value;
    const budget = document.getElementById('budget').value;
    const message = document.getElementById('message').value;

    const text = `Hi! I'm *${name}*%0A📧 ${email}%0A📋 Service: ${service}%0A💰 Budget: ${budget}%0A%0A${message}`;
    window.open(`https://wa.me/917324919140?text=${text}`, '_blank');

    const btn = document.getElementById('submitBtn');
    btn.innerHTML = '<span>Message Sent! ✓</span>';
    btn.style.background = 'linear-gradient(135deg, #22c55e, #10b981)';
    setTimeout(() => {
        btn.innerHTML = '<span>Send Message</span><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>';
        btn.style.background = '';
        this.reset();
    }, 3000);
});

// ===== SMOOTH SCROLL FOR ANCHOR LINKS =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});

// ===== TILT EFFECT ON SERVICE CARDS =====
document.querySelectorAll('[data-tilt]').forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(800px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave', () => {
        card.style.transform = '';
    });
});
