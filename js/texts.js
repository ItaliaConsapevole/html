const PROJECT_TEXTS_URL = 'https://raw.githubusercontent.com/ItaliaConsapevole/html/main/data/project.json';

function loadProjectTexts() {
  return fetch(PROJECT_TEXTS_URL)
    .then(response => response.ok ? response.json() : Promise.reject())
    .catch(() => fetch('data/project.json')
      .then(response => response.ok ? response.json() : Promise.reject())
      .catch(() => ({}))
    );
}

function getCurrentPageKey() {
  const pathname = window.location.pathname.split('/').pop() || 'index.html';
  const map = {
    'index.html': 'home',
    'partiti.html': 'partiti',
    'partiti-europei.html': 'partitiEuropei',
    'politici.html': 'politici',
    'il-progetto.html': 'progetto',
    'html/partiti.html': 'partiti',
    'html/partiti-europei.html': 'partitiEuropei',
    'html/politici.html': 'politici',
    'html/il-progetto.html': 'progetto'
  };
  return map[pathname] || 'home';
}

function getPageTexts(pageKey) {
  return window.__PROJECT_TEXTS__ && window.__PROJECT_TEXTS__.pages ? window.__PROJECT_TEXTS__.pages[pageKey] || {} : {};
}

function resolveText(template, values) {
  if (!template) return '';
  return template.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? '');
}

function applyPageTexts(pageKey = getCurrentPageKey()) {
  const data = window.__PROJECT_TEXTS__ || {};
  const pageTexts = data.pages && data.pages[pageKey] ? data.pages[pageKey] : {};
  const navTexts = data.nav || {};

  if (pageTexts.title) {
    document.title = pageTexts.title;
  }

  const pageTitle = document.querySelector('h1.page-title');
  if (pageTitle && pageTexts.pageTitle) {
    pageTitle.textContent = pageTexts.pageTitle;
  }

  const pageDescription = document.querySelector('p.page-description');
  if (pageDescription && pageTexts.pageDescription) {
    pageDescription.textContent = pageTexts.pageDescription;
  }

  document.querySelectorAll('nav a[href]').forEach(link => {
    const href = link.getAttribute('href') || '';
    if (href.endsWith('index.html') || href.endsWith('/index.html')) {
      link.textContent = navTexts.home || 'Home';
    } else if (href.endsWith('partiti.html') || href.includes('/partiti.html')) {
      link.textContent = navTexts.partiti || 'Partiti';
    } else if (href.endsWith('partiti-europei.html') || href.includes('/partiti-europei.html')) {
      link.textContent = navTexts.partitiEuropei || 'Partiti europei';
    } else if (href.endsWith('politici.html') || href.includes('/politici.html')) {
      link.textContent = navTexts.politici || 'Politici';
    } else if (href.endsWith('il-progetto.html') || href.includes('/il-progetto.html')) {
      link.textContent = navTexts.progetto || 'Il progetto';
    }
  });

  const themeSwitcher = document.querySelector('.theme-switcher');
  if (themeSwitcher && navTexts.theme) {
    themeSwitcher.setAttribute('title', navTexts.theme);
  }

  if (pageKey === 'progetto') {
    const descriptionHeading = document.querySelector('.project-card.project-description h2');
    if (descriptionHeading && pageTexts.sectionDescriptionTitle) {
      descriptionHeading.textContent = pageTexts.sectionDescriptionTitle;
    }
    const linksHeading = document.querySelector('.project-card.project-links h2');
    if (linksHeading && pageTexts.sectionLinksTitle) {
      linksHeading.textContent = pageTexts.sectionLinksTitle;
    }
  }
}

window.__PROJECT_TEXTS__ = {};
window.__PROJECT_TEXTS_PROMISE__ = loadProjectTexts().then(data => {
  window.__PROJECT_TEXTS__ = data || {};
  applyPageTexts(getCurrentPageKey());
  return data;
});

window.addEventListener('DOMContentLoaded', () => {
  applyPageTexts(getCurrentPageKey());
});
