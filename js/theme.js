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

function highlightHashTarget(attempt = 0) {
  const currentHash = window.location.hash.substring(1);
  document.querySelectorAll('.highlighted').forEach(el => el.classList.remove('highlighted'));
  if (!currentHash) return;
  let target = document.getElementById(currentHash);
  if (!target && attempt < 6) {
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
  document.addEventListener('click', (event) => {
    const anchor = event.target.closest('a[href]');
    if (!anchor) return;
    const href = anchor.getAttribute('href') || '';
    if (!href.includes('#')) return;
    const targetUrl = new URL(href, window.location.href);
    if (targetUrl.origin !== window.location.origin) return;
    if (targetUrl.pathname === window.location.pathname) {
      window.setTimeout(() => highlightHashTarget(), 80);
    }
  });
  window.addEventListener('hashchange', () => highlightHashTarget());
  window.addEventListener('load', () => highlightHashTarget());
  highlightHashTarget();
});
