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
   Triggered only by "Uđite u kuću" button.
   Zooms the hero visual slightly, then runs the iris wipe transition.
   ================================================================ */
let doorOpened = false;

function triggerDoorAnimation() {
  if (doorOpened) return;
  doorOpened = true;
  triggerZoomTransition();
}

/* ================================================================
   ZOOM TRANSITION — iris wipe reveals the About section
   ================================================================ */
function triggerZoomTransition() {
  var heroHouse   = document.getElementById('heroHouse');
  var heroContent = document.getElementById('heroContent');

  /* Gently zoom the photo */
  if (heroHouse) {
    heroHouse.style.transition      = 'transform 1.2s cubic-bezier(0.76, 0, 0.24, 1)';
    heroHouse.style.transformOrigin = '50% 50%';
    heroHouse.style.transform       = 'scale(1.08)';
  }

  /* Fade out hero text */
  if (heroContent) {
    heroContent.style.transition = 'opacity 0.6s ease';
    heroContent.style.opacity    = '0';
  }

  /* Iris wipe overlay expands */
  setTimeout(function() {
    var overlay = document.getElementById('zoom-overlay');
    if (overlay) overlay.classList.add('active');

    /* Scroll to About section */
    setTimeout(function() {
      var about = document.getElementById('about');
      if (about) about.scrollIntoView({ behavior: 'auto' });

      /* Retract overlay and reset hero */
      setTimeout(function() {
        if (overlay) {
          overlay.style.transition = 'clip-path 0.7s ease';
          overlay.style.clipPath   = 'circle(0% at 50% 50%)';
        }
        if (heroHouse)   heroHouse.style.transform   = '';
        if (heroContent) heroContent.style.opacity   = '1';

        setTimeout(function() {
          if (overlay) {
            overlay.classList.remove('active');
            overlay.style.transition = '';
            overlay.style.clipPath   = '';
          }
          doorOpened = false;
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

