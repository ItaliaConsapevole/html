const THEME_STORAGE_KEY = 'italiaconsapevole-theme';
const themeToggle = document.getElementById('theme-toggle');
const themeMeta = document.querySelector('meta[name="theme-color"]');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

function updateMetaThemeColor() {
  if (!themeMeta) return;
  const surface = getComputedStyle(document.documentElement).getPropertyValue('--md-sys-color-surface').trim();
  if (surface) {
    themeMeta.setAttribute('content', surface);
  }
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  if (themeToggle) {
    themeToggle.checked = theme === 'dark';
  }
  updateMetaThemeColor();
}

function clearHighlight() {
  document.querySelectorAll('.highlighted').forEach(el => el.classList.remove('highlighted'));
}

function highlightHashTarget(attempt = 0) {
  const currentHash = window.location.hash.substring(1);
  clearHighlight();
  if (!currentHash) return;
  let target = document.getElementById(currentHash);
  if (!target && attempt < 8) {
    window.setTimeout(() => highlightHashTarget(attempt + 1), 120);
    return;
  }
  if (!target) return;
  const parentDetails = target.closest('details');
  if (parentDetails && !parentDetails.open) {
    parentDetails.open = true;
  }
  target.classList.add('highlighted');
  target.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function activateHashNavigation() {
  document.querySelectorAll('a[href]').forEach(link => {
    const href = link.getAttribute('href') || '';
    if (!href.includes('#')) return;
    const targetUrl = new URL(href, window.location.href);
    if (targetUrl.origin !== window.location.origin) return;
    link.addEventListener('click', (event) => {
      const targetHash = targetUrl.hash.substring(1);
      if (!targetHash) return;
      if (targetUrl.pathname === window.location.pathname) {
        window.location.hash = targetHash;
        event.preventDefault();
        window.setTimeout(() => highlightHashTarget(), 80);
        return;
      }
      window.location.href = `${targetUrl.pathname}${targetUrl.hash}`;
    });
  });
}

function loadTheme() {
  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  const theme = storedTheme || (prefersDark.matches ? 'dark' : 'light');
  applyTheme(theme);
}

function onToggleTheme(event) {
  const nextTheme = event.target.checked ? 'dark' : 'light';
  localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  applyTheme(nextTheme);
}

window.addEventListener('DOMContentLoaded', () => {
  loadTheme();
  if (themeToggle) {
    themeToggle.addEventListener('change', onToggleTheme);
  }
  window.highlightHashTarget = highlightHashTarget;
  prefersDark.addEventListener('change', (event) => {
    if (!localStorage.getItem(THEME_STORAGE_KEY)) {
      applyTheme(event.matches ? 'dark' : 'light');
    }
  });
  activateHashNavigation();
  window.addEventListener('hashchange', () => highlightHashTarget());
  window.addEventListener('load', () => highlightHashTarget());
  highlightHashTarget();
});
