/* ---- PAGE LOADER ---- */
/* Robust loader removal:
   - Tries to hide after 'load' fires (normal path)
   - Hard fallback at 2000ms removes it no matter what
   - Guard flag ensures it only runs once                */
var loaderDone = false;

function hideLoader() {
  if (loaderDone) return;
  loaderDone = true;
  var loader = document.getElementById('page-loader');
  if (loader) loader.classList.add('hidden');
  setTimeout(function() {
    var hc = document.getElementById('heroContent');
    var hh = document.getElementById('heroHouse');
    if (hc) hc.classList.add('visible');
    if (hh) hh.classList.add('visible');
  }, 200);
}

/* Path 1 — window.load (all resources ready) */
window.addEventListener('load', function() {
  setTimeout(hideLoader, 600);
});

/* Path 2 — hard deadline: 2s maximum, works even if load never fires */
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
   DOOR ANIMATION — polygon foreshortening (no transforms/skew)
   
   The door panel is an SVG <polygon>. Each frame we recalculate
   its 4 corner points based on how far the door has rotated.
   
   Hinge is the LEFT edge (x = HX = 304, stays fixed every frame).
   As door rotates to angle A, the right edge foreshortens to:
     rightX = HX + fullWidth * cos(A)
   
   All Y values match the SVG markup exactly.
   Opening angle is 35° — visually reads as "gently ajar".
   ================================================================ */
let doorOpened = false;

function triggerDoorAnimation() {
  if (doorOpened) return;
  doorOpened = true;

  /* ---- geometry: must match SVG polygon points exactly ---- */
  const HX      = 304;   // hinge X — never changes
  const FULL_W  = 72;    // door width when closed (right edge = 376)
  const PNL_T   = 330;   // panel top Y
  const PNL_B   = 473;   // panel bottom Y
  // Inset rectangles — Y values taken directly from SVG markup
  const TOP_I_T = 338;   // top inset: top Y
  const TOP_I_B = 391;   // top inset: bottom Y
  const BOT_I_T = 399;   // bottom inset: top Y
  const BOT_I_B = 462;   // bottom inset: bottom Y
  const INS_X   = 7;     // horizontal inset margin from each edge

  const panel   = document.getElementById('dp-panel');
  const pTop    = document.getElementById('dp-top');
  const pBot    = document.getElementById('dp-bot');
  const handle  = document.getElementById('dp-handle');
  const intGlow = document.getElementById('door-interior-glow');
  const bloom   = document.getElementById('door-light-bloom');

  const DURATION   = 850;  // ms — snappy but not rushed
  const OPEN_DEG   = 35;   // degrees open — subtle, like a door gently ajar
  let   startTime  = null;

  // Ease-out cubic: fast start, soft settle — feels like real hinges
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  // Produce a polygon "points" string from 4 corners (top-left → clockwise)
  function pts(x1, y1, x2, y2, x3, y3, x4, y4) {
    return `${x1},${y1} ${x2},${y2} ${x3},${y3} ${x4},${y4}`;
  }

  function frame(ts) {
    if (!startTime) startTime = ts;
    const t    = easeOut(Math.min((ts - startTime) / DURATION, 1));
    const rad  = (t * OPEN_DEG) * Math.PI / 180;
    const visW = Math.max(FULL_W * Math.cos(rad), 1); // foreshortened width
    const RX   = HX + visW;                            // right edge, moves left

    // 1 — Door face narrows from its right edge; hinge side stays at HX
    if (panel) panel.setAttribute('points',
      pts(HX, PNL_T,  RX, PNL_T,  RX, PNL_B,  HX, PNL_B));

    // 2 — Insets scale with panel; hide when too narrow to matter
    const iL = HX + INS_X;
    const iR = RX - INS_X;
    if (iR > iL + 6) {
      if (pTop) {
        pTop.setAttribute('points', pts(iL, TOP_I_T, iR, TOP_I_T, iR, TOP_I_B, iL, TOP_I_B));
        pTop.style.display = '';
      }
      if (pBot) {
        pBot.setAttribute('points', pts(iL, BOT_I_T, iR, BOT_I_T, iR, BOT_I_B, iL, BOT_I_B));
        pBot.style.display = '';
      }
    } else {
      if (pTop) pTop.style.display = 'none';
      if (pBot) pBot.style.display = 'none';
    }

    // 3 — Handle slides toward hinge proportionally, fades as panel narrows
    if (handle) {
      // Original handle x-anchor was 358; move it to stay at ~76% of panel width
      const newHX = HX + visW * 0.76;
      handle.setAttribute('transform', `translate(${newHX - 358}, 0)`);
      handle.style.opacity = visW > 20 ? Math.min(visW / FULL_W * 1.4, 1) : 0;
    }

    // 4 — Interior warm glow fades in as panel moves away
    if (intGlow) intGlow.setAttribute('opacity', Math.min(t * 1.8, 1));

    // 5 — Light bloom: centered on door opening (fixed x), grows outward
    if (bloom) {
      bloom.setAttribute('cx', '340');  // center of door opening, stays fixed
      bloom.setAttribute('cy', '401');
      bloom.setAttribute('rx', 18 + t * 58);
      bloom.setAttribute('ry', 24 + t * 72);
      bloom.setAttribute('opacity', Math.min(t * 1.2, 0.78));
    }

    if (t < 1) {
      requestAnimationFrame(frame);
    } else {
      setTimeout(triggerZoomTransition, 300);
    }
  }

  requestAnimationFrame(frame);
}

/* ================================================================
   ZOOM TRANSITION
   Hero section zooms toward the door, then page-level iris wipe
   reveals the About section underneath.
   ================================================================ */
function triggerZoomTransition() {
  const heroHouse = document.getElementById('heroHouse');
  const heroContent = document.getElementById('heroContent');
  const hero = document.getElementById('hero');

  // 1. Zoom the house toward the door position
  // Door center is approx at 55% of the house SVG width
  heroHouse.style.transition = 'transform 1.3s cubic-bezier(0.76, 0, 0.24, 1), opacity 1.3s ease';
  heroHouse.style.transformOrigin = '55% 75%';
  heroHouse.style.transform = 'scale(2.6) translateY(4%)';

  // 2. Fade out hero text
  heroContent.style.transition = 'opacity 0.6s ease';
  heroContent.style.opacity = '0';

  // 3. Iris wipe overlay — expands from door position
  setTimeout(function() {
    const overlay = document.getElementById('zoom-overlay');
    overlay.classList.add('active');

    // 4. Scroll to #about, then retract overlay
    setTimeout(function() {
      document.getElementById('about').scrollIntoView({ behavior: 'auto' });

      // 5. Reset hero so back-navigation works
      setTimeout(function() {
        overlay.style.transition = 'clip-path 0.7s ease';
        overlay.style.clipPath = 'circle(0% at 50% 50%)';
        heroHouse.style.transform = '';
        heroContent.style.opacity = '1';

        setTimeout(function() {
          overlay.classList.remove('active');
          overlay.style.transition = '';
          overlay.style.clipPath = '';
          doorOpened = false; // allow re-triggering on back navigation
        }, 750);
      }, 400);
    }, 900);
  }, 500);
}

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

/* ---- PARALLAX ON HERO HOUSE ---- */
window.addEventListener('scroll', function() {
  const heroHouse = document.getElementById('heroHouse');
  if (!heroHouse || doorOpened) return;
  const scrollY = window.scrollY;
  if (scrollY < window.innerHeight) {
    heroHouse.style.transform = 'translateY(' + (scrollY * 0.15) + 'px)';
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

