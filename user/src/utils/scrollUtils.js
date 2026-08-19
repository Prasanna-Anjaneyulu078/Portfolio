// Cached navbar height — invalidated on resize
let _cachedNavbarHeight = null;

const _invalidateNavbarCache = () => { _cachedNavbarHeight = null; };
if (typeof window !== 'undefined') {
  window.addEventListener('resize', _invalidateNavbarCache, { passive: true });
}

export const getNavbarHeight = () => {
  if (_cachedNavbarHeight !== null) return _cachedNavbarHeight;
  const headerEl = document.querySelector('.header') || document.querySelector('header');
  _cachedNavbarHeight = headerEl ? headerEl.getBoundingClientRect().height : 72;
  return _cachedNavbarHeight;
};

export const scrollToSection = (sectionId) => {
  if (!sectionId) return;
  const cleanId = sectionId.replace('#', '');
  const element = document.getElementById(cleanId);
  if (!element) return;

  // Batch: read layout FIRST, then write — deferred to next frame to avoid forced reflow
  requestAnimationFrame(() => {
    const navbarHeight = getNavbarHeight();
    const elementPosition = element.getBoundingClientRect().top + window.scrollY;
    const offsetPosition = elementPosition - navbarHeight;

    window.scrollTo({
      top: Math.max(0, offsetPosition),
      behavior: 'smooth',
    });
  });
};

export const scrollToProjects = () => {
  scrollToSection('projects');
};
