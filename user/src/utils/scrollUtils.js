export const getNavbarHeight = () => {
  const headerEl = document.querySelector('.header') || document.querySelector('header');
  return headerEl ? headerEl.getBoundingClientRect().height : 72;
};

export const scrollToSection = (sectionId) => {
  if (!sectionId) return;
  const cleanId = sectionId.replace('#', '');
  const element = document.getElementById(cleanId);
  if (!element) return;

  const navbarHeight = getNavbarHeight();
  const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
  const offsetPosition = elementPosition - navbarHeight;

  window.scrollTo({
    top: Math.max(0, offsetPosition),
    behavior: 'smooth',
  });
};

export const scrollToProjects = () => {
  scrollToSection('projects');
};
