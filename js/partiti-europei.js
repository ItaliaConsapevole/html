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
  if (summary) {
    summary.textContent = `${count} partiti europei disponibili`;
  }
}

function renderPartitiEuropei(data) {
  const entries = Array.isArray(data) ? data.slice(1) : [];
  updateSummary(entries.length);

  if (!entries.length) {
    content.innerHTML = '<article class="source-card"><p class="empty-state">Nessun partito europeo disponibile.</p></article>';
    return;
  }

  const html = entries.map(item => {
    const color = item.color || '';
    const colorStyle = color ? `style="--party-color:${color};"` : '';
    const logoStyle = color ? `style="border:2px solid ${color};"` : '';
    const logoSrc = item.logo || '';
    const partitiNazionali = Array.isArray(item.partiti_nazionali) ? item.partiti_nazionali : [];
    const gruppiPerStato = partitiNazionali.reduce((acc, entry) => {
      const stato = entry.stato || 'Altro';
      if (!acc[stato]) acc[stato] = [];
      acc[stato].push(entry.partito);
      return acc;
    }, {});
    const partitiNazionaliMarkup = Object.entries(gruppiPerStato)
      .map(([stato, partiti]) => {
        const links = partiti.map(partito => `<a class="party-link" href="partiti.html#${slug(partito)}">${partito}</a>`).join(', ');
        return `<li><strong>${stato}:</strong> ${links}</li>`;
      })
      .join('');
    return `
      <article class="source-card party-card" id="${slug(item.partito)}" ${colorStyle}>
        <div class="card-header">
          <div>
            <h2 class="nome"><a class="party-link" href="partiti-europei.html#${slug(item.partito)}">${item.partito}</a></h2>
            <div class="party-label">${item.gruppo || 'Gruppo europeo'} · ${item.orientamento || 'Orientamento non specificato'}</div>
          </div>
          <div class="badges">
            <img class="party-logo" src="${logoSrc}" alt="Logo ${item.partito}" ${logoStyle}>
          </div>
        </div>
        <p class="descrizione">${item.descrizione || 'Nessuna descrizione disponibile.'}</p>
        <ul class="metadata">
          <li><strong>Partiti nazionali:</strong></li>
          ${partitiNazionaliMarkup || '<li>Nessun partito nazionale indicato</li>'}
        </ul>
      </article>`;
  }).join('');

  content.innerHTML = html;
}

function loadData() {
  fetch('https://raw.githubusercontent.com/ItaliaConsapevole/html/main/data/partiti-europei.json')
    .then(response => response.ok ? response.json() : Promise.reject(new Error('File non trovato')))
    .then(renderPartitiEuropei)
    .catch(() => {
      if (pageTitle) pageTitle.textContent = 'Partiti europei';
      if (pageDescription) pageDescription.textContent = 'Impossibile caricare il contenuto al momento.';
      if (content) {
        content.innerHTML = '<article class="source-card"><p class="empty-state">Impossibile caricare i dati dei partiti europei.</p></article>';
      }
      updateSummary(0);
    });
}

loadData();
