'use strict';
const toggle = document.querySelector('.menu-toggle');
const navigation = document.getElementById('navigation');
const compact = matchMedia('(max-width: 980px)');
function closeMenu(focus = false) {
  toggle.setAttribute('aria-expanded', 'false');
  toggle.innerHTML = 'Menu <span aria-hidden="true">☰</span>';
  navigation.classList.remove('open');
  if (focus) toggle.focus();
}
toggle.addEventListener('click', () => {
  const open = toggle.getAttribute('aria-expanded') !== 'true';
  toggle.setAttribute('aria-expanded', String(open));
  toggle.innerHTML = open ? 'Close <span aria-hidden="true">×</span>' : 'Menu <span aria-hidden="true">☰</span>';
  navigation.classList.toggle('open', open);
});
navigation.addEventListener('click', event => {
  const link = event.target.closest('a');
  if (!link || !compact.matches) return;
  closeMenu();
  const target = document.querySelector(link.hash);
  if (target) { target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true }); }
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') closeMenu(true);
});
compact.addEventListener('change', () => closeMenu());
document.documentElement.classList.add('js');
toggle.hidden = false;
document.getElementById('year').textContent = new Date().getFullYear();

// The cinematic hero is a real film: play it once, hold the final frame.
const root = document.documentElement;
const hero = document.querySelector('.hero');
const video = document.getElementById('hero-video');
const pauseButton = document.getElementById('hero-pause');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const precisePointer = matchMedia('(hover: hover) and (pointer: fine)');
const light = document.querySelector('.light-sections');

root.classList.toggle('motion-on', !reducedMotion.matches);
reducedMotion.addEventListener('change', () => {
  root.classList.toggle('motion-on', !reducedMotion.matches);
  if (reducedMotion.matches) holdStill(); else armFilm();
});

let finished = false;   // the camera move has reached its final composition
let onScreen = true;    // the hero is in the viewport
let wanted = true;      // the visitor has not paused it

function canPlay() {
  return video && !reducedMotion.matches && !finished && wanted && onScreen && !document.hidden;
}
function resume() {
  if (!canPlay()) return;
  const attempt = video.play();
  // Autoplay can still be refused; the poster frame stays on screen if so.
  if (attempt && attempt.catch) attempt.catch(() => { if (pauseButton) pauseButton.hidden = true; });
}
function holdStill() {
  if (!video) return;
  video.pause();
  video.preload = 'none';
  if (pauseButton) pauseButton.hidden = true;
}
function armFilm() {
  if (!video || reducedMotion.matches) return holdStill();
  // Only fetch the 10 MB asset for visitors who will actually see it move.
  if (video.preload !== 'auto') { video.preload = 'auto'; video.load(); }
  resume();
}

if (video) {
  video.addEventListener('playing', () => {
    video.classList.add('is-showing');
    if (pauseButton && !finished) pauseButton.hidden = false;
  });
  video.addEventListener('ended', () => {
    finished = true;
    video.classList.add('is-showing');
    hero.classList.add('film-settled');
    if (pauseButton) pauseButton.hidden = true;
  });
  video.addEventListener('error', () => {
    // The poster is the same opening composition, so the hero still reads.
    root.classList.add('no-video');
    if (pauseButton) pauseButton.hidden = true;
  });

  if (pauseButton) {
    pauseButton.addEventListener('click', () => {
      wanted = !wanted;
      pauseButton.innerHTML = wanted
        ? '<span aria-hidden="true">Ⅱ</span> Pause film'
        : '<span aria-hidden="true">▷</span> Play film';
      if (wanted) resume(); else video.pause();
    });
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) video.pause(); else resume();
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      // Scrolling away costs nothing; scrolling back continues where it stopped.
      if (onScreen) resume(); else video.pause();
    }, { threshold: 0.12 }).observe(hero);
  }

  armFilm();
}

// Hero darkness resolving into the ivory capabilities section.
if (light) {
  let queued = false;
  const heroDepth = () => hero.offsetHeight || 1;
  const trace = () => {
    queued = false;
    light.style.setProperty('--journey', Math.min(1, window.scrollY / heroDepth()).toFixed(3));
  };
  addEventListener('scroll', () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(trace);
  }, { passive: true });
  trace();
}

if ('IntersectionObserver' in window) {
  const story = document.querySelector('.connection-explorer');
  if (story) new IntersectionObserver(([entry]) => story.classList.toggle('story-visible', entry.isIntersecting)).observe(story);
}

// Equivalent visible selection for pointer, keyboard focus and touch activation.
const grid = document.querySelector('.capability-grid');
const cards = [...grid.querySelectorAll('.capability')];
function selectCard(card) {
  if (card) grid.dataset.active = String(cards.indexOf(card));
  else delete grid.dataset.active;
  cards.forEach(item => item.classList.toggle('is-selected', item === card));
}
function retainedCard() {
  return cards.find(card => card.contains(document.activeElement)) || cards.find(card => card.querySelector('details').open);
}
cards.forEach(card => {
  const details = card.querySelector('details');
  card.addEventListener('pointerenter', event => {
    if (precisePointer.matches && event.pointerType !== 'touch') selectCard(card);
  });
  card.addEventListener('focusin', () => selectCard(card));
  card.addEventListener('click', event => {
    if (event.target.closest('a, summary, button')) return;
    details.open = !details.open;
    selectCard(card);
  });
  details.addEventListener('toggle', () => {
    if (details.open) {
      cards.forEach(other => { if (other !== card) other.querySelector('details').open = false; });
      selectCard(card);
    } else selectCard(retainedCard());
  });
});
grid.addEventListener('pointerleave', () => selectCard(retainedCard()));
grid.addEventListener('focusout', () => queueMicrotask(() => selectCard(retainedCard())));
