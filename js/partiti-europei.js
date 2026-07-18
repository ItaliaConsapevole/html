const pageTitle = document.querySelector('h1.page-title');
const pageDescription = document.querySelector('p.page-description');
const content = document.getElementById('content');
const summary = document.getElementById('partiti-europei-summary');

function slug(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function updateSummary(count) {
  const texts = getPageTexts('partitiEuropei') || {};
  if (summary) {
    summary.textContent = resolveText(texts.summary || '{count} partiti europei disponibili', { count });
  }
}

function renderPartitiEuropei(data) {
  const texts = getPageTexts('partitiEuropei') || {};
  const entries = Array.isArray(data) ? data.slice(1) : [];
  updateSummary(entries.length);

  if (!entries.length) {
    if (content) content.innerHTML = '';
    return;
  }

  const html = entries.map(item => {
    const color = item.color || '';
    const colorStyle = color ? `style="--party-color:${color};"` : '';
    const logoStyle = color ? `style="border:2px solid ${color};"` : '';
    const logoSrc = item.logo || '';
    
    // CORRETTO: Gestione del percorso del logo per uscire dalla cartella html/
    let correctLogoSrc = logoSrc;
    if (logoSrc && !logoSrc.startsWith('http') && !logoSrc.startsWith('../')) {
        if (!logoSrc.includes('img/partiti/')) {
            correctLogoSrc = `../img/partiti/${logoSrc}`;
        } else {
            correctLogoSrc = `../${logoSrc}`;
        }
    }

    const partitiNazionali = Array.isArray(item.partiti_nazionali) ? item.partiti_nazionali : [];
    const gruppiPerStato = partitiNazionali.reduce((acc, entry) => {
      const stato = entry.stato || texts.defaultState || 'Altro';
      if (!acc[stato]) acc[stato] = [];
      acc[stato].push(entry.partito);
      return acc;
    }, {});
    
    const partitiNazionaliMarkup = Object.entries(gruppiPerStato)
      .map(([stato, partiti]) => {
        // I link mantengono la rotta corretta poiché partiti.html condivide la stessa cartella
        const links = partiti.map(partito => `<a class="party-link" href="partiti.html#${slug(partito)}">${partito}</a>`).join(', ');
        return `<li><strong>${stato}:</strong> ${links}</li>`;
      })
      .join('');
      
    return `
      <article class="source-card party-card" id="${slug(item.partito)}" ${colorStyle}>
        <div class="card-header">
          <div>
            <h2 class="nome"><a class="party-link" href="partiti-europei.html#${slug(item.partito)}">${item.partito}</a></h2>
            <div class="party-label">${item.gruppo || texts.defaultGroup || 'Gruppo europeo'} · ${item.orientamento || texts.defaultOrientation || 'Orientamento non specificato'}</div>
          </div>
          <div class="badges">
            <img class="party-logo" src="${correctLogoSrc}" alt="Logo ${item.partito}" ${logoStyle}>
          </div>
        </div>
        ${item.descrizione || texts.descriptionFallback ? `<p class="descrizione">${item.descrizione || texts.descriptionFallback}</p>` : ''}
        ${partitiNazionaliMarkup ? `<details class="affiliation-details"><summary>${texts.sectionTitle || 'Partiti nazionali'}</summary><ul class="party-affiliation-list">${partitiNazionaliMarkup}</ul></details>` : ''}
      </article>`;
  }).join('');

  if (content) {
    content.innerHTML = html;
  }
  
  if (typeof window.highlightHashTarget === 'function') {
    window.highlightHashTarget();
  }
}

function loadData() {
  const texts = getPageTexts('partitiEuropei') || {};
  let jsonData = null;

  // Prima chiamata: tenta il recupero da GitHub
  fetch('https://raw.githubusercontent.com/ItaliaConsapevole/html/main/data/partiti-europei.json')
    .then(response => response.ok ? response.json() : Promise.reject())
    // Fallback: se GitHub fallisce, prova a caricare il file locale corretto
    .catch(() => fetch('../data/partiti-europei.json').then(response => response.ok ? response.json() : Promise.reject()))
    .then(data => {
      jsonData = data; // Salva i dati validi ottenuti ed evita il double-fetch
      return window.__PROJECT_TEXTS_PROMISE__ || Promise.resolve().then(() => window.__PROJECT_TEXTS__);
    })
    .then(() => {
      if (jsonData) {
        renderPartitiEuropei(jsonData);
      } else {
        throw new Error("Nessun dato disponibile");
      }
    })
    .catch((err) => {
      console.error("Errore nel flusso di caricamento:", err);
      if (pageTitle) pageTitle.textContent = texts.pageTitle || 'Partiti europei';
      if (pageDescription) pageDescription.textContent = texts.pageDescription || 'Panoramica dei principali partiti e gruppi politici europei.';
      if (content) {
        content.innerHTML = '';
      }
      updateSummary(0);
    });
}

loadData();