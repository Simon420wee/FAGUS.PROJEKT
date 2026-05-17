/* ---- PAGE LOADER ---- */
/* hideLoader is called by window.load and by a 2s hard deadline.
   loaderDone flag ensures it only executes once.              */
var loaderDone = false;

function hideLoader() {
  if (loaderDone) return;
  loaderDone = true;
  /* Support both id names — preloader (current) and page-loader (legacy) */
  var loader = document.getElementById('preloader')
    || document.getElementById('page-loader');
  if (loader) loader.classList.add('hidden');
  document.body.classList.add('loaded');
  document.documentElement.classList.add('loaded');
  setTimeout(function() {
    var hc = document.getElementById('heroContent');
    var hh = document.getElementById('heroHouse');
    if (hc) hc.classList.add('visible');
    if (hh) hh.classList.add('visible');
  }, 200);
}

/* Path 1 — fires when all resources are ready */
window.addEventListener('load', function() {
  setTimeout(hideLoader, 600);
});

/* Path 2 — hard deadline: 2s max, runs regardless */
setTimeout(hideLoader, 2000);

/* ---- NAV SCROLL BEHAVIOR ---- */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', function() {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
});

/* ---- HAMBURGER MOBILE MENU ---- */
const hamburger = document.getElementById('hamburger');
const mobileNav = document.getElementById('mobileNav');
const navOverlay = document.getElementById('navOverlay');

function closeMobileNav() {
  hamburger.classList.remove('open');
  mobileNav.classList.remove('open');
  navOverlay.classList.remove('open');
  document.body.style.overflow = '';
}
hamburger.addEventListener('click', function() {
  const isOpen = mobileNav.classList.contains('open');
  if (isOpen) { closeMobileNav(); }
  else {
    hamburger.classList.add('open');
    mobileNav.classList.add('open');
    navOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
});
navOverlay.addEventListener('click', closeMobileNav);
document.querySelectorAll('.mobile-link').forEach(l => l.addEventListener('click', closeMobileNav));

/* ================================================================
   HERO ENTRANCE ANIMATION
   Triggered by "Uđite u kuću" button.

   1. Warm light flashes over the house image
   2. Image zooms in slightly (Ken Burns push)
   3. Then triggerZoomTransition() runs the iris wipe
   ================================================================ */
let doorOpened = false;

function triggerDoorAnimation() {
  if (doorOpened) return;
  doorOpened = true;

  const light   = document.getElementById('heroVisualLight');
  const img     = document.querySelector('.hero-visual-img');
  const scene   = document.getElementById('heroScene');

  /* Step 1 — warm light flash blooms over the image */
  if (light) {
    light.classList.add('flash');
  }

  /* Step 2 — image gently pushes forward (zoom-in Ken Burns) */
  if (img) {
    img.style.transition = 'transform 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    img.style.transform  = 'scale(1.10)';
  }

  /* Step 3 — disable tilt during transition */
  if (scene) scene.style.transition = 'transform 0.6s ease';

  /* Step 4 — iris wipe transition after the flash peaks */
  setTimeout(triggerZoomTransition, 750);
}

/* ================================================================
   ZOOM TRANSITION — unchanged, works with photo just as with SVG
   ================================================================ */
function triggerZoomTransition() {
  const heroHouse   = document.getElementById('heroHouse');
  const heroContent = document.getElementById('heroContent');

  /* Zoom the visual container */
  heroHouse.style.transition    = 'transform 1.3s cubic-bezier(0.76, 0, 0.24, 1), opacity 1.3s ease';
  heroHouse.style.transformOrigin = '55% 60%';
  heroHouse.style.transform     = 'scale(1.18)';

  /* Fade out hero text */
  heroContent.style.transition = 'opacity 0.6s ease';
  heroContent.style.opacity    = '0';

  /* Iris wipe overlay */
  setTimeout(function() {
    const overlay = document.getElementById('zoom-overlay');
    overlay.classList.add('active');

    setTimeout(function() {
      document.getElementById('about').scrollIntoView({ behavior: 'auto' });

      setTimeout(function() {
        overlay.style.transition = 'clip-path 0.7s ease';
        overlay.style.clipPath   = 'circle(0% at 50% 50%)';
        heroHouse.style.transform  = '';
        heroContent.style.opacity  = '1';

        /* Reset light and image */
        const light = document.getElementById('heroVisualLight');
        const img   = document.querySelector('.hero-visual-img');
        if (light) light.classList.remove('flash');
        if (img)   img.style.transform = '';

        setTimeout(function() {
          overlay.classList.remove('active');
          overlay.style.transition = '';
          overlay.style.clipPath   = '';
          doorOpened = false;
        }, 750);
      }, 400);
    }, 900);
  }, 500);
}

/* ================================================================
   MOUSE-TILT 3D EFFECT — desktop only
   Gentle perspective tilt follows cursor position.
   Max tilt: ±6° — subtle and premium.
   ================================================================ */
(function() {
  const scene = document.getElementById('heroScene');
  if (!scene || window.innerWidth < 768) return;

  const MAX_TILT  = 6;    // degrees
  const LERP      = 0.07; // smoothing (lower = smoother/slower)
  let   targetX   = 0, targetY = 0;
  let   currentX  = 0, currentY = 0;
  let   rafId     = null;
  let   isHeroVisible = true;

  function lerp(a, b, t) { return a + (b - a) * t; }

  function animateTilt() {
    if (!isHeroVisible || doorOpened) { rafId = null; return; }
    currentX = lerp(currentX, targetX, LERP);
    currentY = lerp(currentY, targetY, LERP);

    /* Only apply if we've moved meaningfully */
    if (Math.abs(currentX - targetX) > 0.001 || Math.abs(currentY - targetY) > 0.001 || rafId) {
      scene.style.transform = `perspective(900px) rotateX(${currentY}deg) rotateY(${currentX}deg)`;
    }
    rafId = requestAnimationFrame(animateTilt);
  }

  document.addEventListener('mousemove', function(e) {
    if (doorOpened) return;
    const hero = document.getElementById('hero');
    const rect = hero.getBoundingClientRect();
    /* Only tilt when cursor is over the hero section */
    if (e.clientY < rect.top || e.clientY > rect.bottom) {
      targetX = 0; targetY = 0; return;
    }
    /* Normalize cursor to -1 … +1 relative to hero center */
    const nx =  (e.clientX / window.innerWidth  - 0.5) * 2;
    const ny = -(e.clientY / window.innerHeight - 0.5) * 2;
    targetX = nx * MAX_TILT;
    targetY = ny * MAX_TILT * 0.6;
    if (!rafId) animateTilt();
  });

  /* Reset tilt when cursor leaves */
  document.addEventListener('mouseleave', function() {
    targetX = 0; targetY = 0;
  });

  /* Stop tilt if we scroll past hero */
  window.addEventListener('scroll', function() {
    const hero = document.getElementById('hero');
    if (!hero) return;
    isHeroVisible = window.scrollY < hero.offsetHeight;
    if (!isHeroVisible && scene) scene.style.transform = '';
  });
})();

/* ---- SCROLL REVEAL (IntersectionObserver) ---- */
const revealObserver = new IntersectionObserver(function(entries) {
  entries.forEach(function(entry) {
    if (entry.isIntersecting) {
      entry.target.classList.add('revealed');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });

document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => revealObserver.observe(el));

/* ---- ANIMATED COUNTERS ---- */
function animateCounter(el) {
  const target = parseInt(el.getAttribute('data-target'), 10);
  const suffix = target >= 100 ? '%' : '+';
  const duration = 1800;
  let current = 0;
  const step = Math.ceil(target / 60);
  const timer = setInterval(function() {
    current = Math.min(current + step, target);
    el.textContent = current + suffix;
    if (current >= target) clearInterval(timer);
  }, duration / 60);
}
const counterObserver = new IntersectionObserver(function(entries) {
  entries.forEach(function(entry) {
    if (entry.isIntersecting) { animateCounter(entry.target); counterObserver.unobserve(entry.target); }
  });
}, { threshold: 0.5 });
document.querySelectorAll('[data-target]').forEach(el => counterObserver.observe(el));

/* ---- SCROLL PARALLAX ON HERO IMAGE (mobile only — desktop uses mouse tilt) ---- */
window.addEventListener('scroll', function() {
  if (doorOpened || window.innerWidth >= 768) return;
  const img = document.querySelector('.hero-visual-img');
  if (!img) return;
  const scrollY = window.scrollY;
  if (scrollY < window.innerHeight) {
    img.style.transform = 'translateY(' + (scrollY * 0.12) + 'px)';
  }
});

/* ---- FORCE PAGE TO TOP ON REFRESH ---- */
if (history.scrollRestoration) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

/* ---- FORM SUBMIT HANDLER ---- */
function handleFormSubmit(btn) {
  const original = btn.textContent;
  btn.textContent = 'Slanje...';
  btn.style.opacity = '0.7';
  btn.disabled = true;
  setTimeout(function() {
    btn.textContent = '✓ Poruka poslata!';
    btn.style.background = 'var(--green-light)';
    btn.style.opacity = '1';
    setTimeout(function() {
      btn.textContent = original;
      btn.style.background = '';
      btn.disabled = false;
    }, 3000);
  }, 1400);
}

/* ---- SMOOTH ANCHOR SCROLL ---- */
document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
  anchor.addEventListener('click', function(e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
});

