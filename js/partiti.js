let partiti = [];
let politici = [];
let partitiEuropei = [];

function remoteJSON(filename) {
    return fetch(`https://raw.githubusercontent.com/ItaliaConsapevole/html/main/data/${filename}`)
        .then(response => response.ok ? response.json() : Promise.reject())
        .catch(() => fetch(`../data/${filename}`) // CORRETTO: Aggiunto '../' per permettere il corretto funzionamento in locale
            .then(response => response.ok ? response.json() : Promise.reject())
            .catch(() => []));
}

function normalizeString(value) {
    return value.toString().toLowerCase().trim().replace(/\s+/g, ' ');
}

function getEuropeanPartyForAffiliation(affiliation) {
    const normalized = normalizeString(affiliation || '').replace(/\s+\([^)]*\)$/, '');
    if (!normalized) return null;

    const aliases = {
        'conservatori e riformisti europei': 'Conservatori e Riformisti Europei',
        'ecr': 'Conservatori e Riformisti Europei',
        'partito popolare europeo': 'Partito Popolare Europeo',
        'ppe': 'Partito Popolare Europeo',
        'partito dei socialisti europei': 'Partito dei Socialisti Europei',
        's&d': 'Partito dei Socialisti Europei',
        'renew europe': 'Renew Europe',
        'renew': 'Renew Europe',
        'alde': 'Renew Europe',
        'i verdi/alleanza libera europea': 'I Verdi/Alleanza Libera Europea',
        'greens/efa': 'I Verdi/Alleanza Libera Europea',
        'identita e democrazia': 'Identità e Democrazia',
        'id': 'Identità e Democrazia',
        'la sinistra': 'La Sinistra',
        'the left': 'La Sinistra'
    };

    if (aliases[normalized]) return aliases[normalized];
    if (normalized.includes('conservatori') || normalized.includes('ecr')) return 'Conservatori e Riformisti Europei';
    if (normalized.includes('popolare') || normalized.includes('ppe')) return 'Partito Popolare Europeo';
    if (normalized.includes('socialisti') || normalized.includes('s&d')) return 'Partito dei Socialisti Europei';
    if (normalized.includes('renew')) return 'Renew Europe';
    if (normalized.includes('verdi') || normalized.includes('ale') || normalized.includes('greens')) return 'I Verdi/Alleanza Libera Europea';
    if (normalized.includes('democrazia') || normalized.includes('id')) return 'Identità e Democrazia';
    if (normalized.includes('sinistra')) return 'La Sinistra';
    return null;
}

function updatePartitiSummary(total, destra, sinistra, indipendenti) {
    const summary = document.getElementById('partiti-summary');
    const texts = getPageTexts('partiti') || {};
    if (!summary) return;
    summary.innerHTML = `
        <span>${resolveText(texts.summary || '{count} partiti', { count: total })}</span>
        <span>${resolveText(texts.summaryRight || 'Destra: {count}', { count: destra })}</span>
        <span>${resolveText(texts.summaryLeft || 'Sinistra: {count}', { count: sinistra })}</span>
        <span>${resolveText(texts.summaryIndependent || 'Indipendenti: {count}', { count: indipendenti })}</span>
    `;
}

function renderCoalitionPanel(title, items, texts) {
    let html = `<section class="coalition-panel"><details class="coalition-box" open><summary class="coalition-summary">${title}</summary>`;
    if (items.length === 0) {
        html += '';
    } else {
        html += '<div class="party-members">';
        items.sort((a, b) => a.partito.localeCompare(b.partito)).forEach(item => {
            html += renderPartyCard(item, texts);
        });
        html += '</div>';
    }
    html += '</details></section>';
    return html;
}

function slug(value) {
    return value.toString().toLowerCase().trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') 
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function renderPartyCard(item, texts = {}) {
    const id = slug(item.partito);
    const color = item.color || '';
    const colorStyle = color ? `style="--party-color:${color};"` : '';
    const logoStyle = color ? `style="border:2px solid ${color};"` : '';
    const logoSrc = item.logo || '';
    
    // RISOLUZIONE ROBUSTA DEL LOGO: Gestisce sia i nomi file singoli che i percorsi strutturati
    let correctLogoSrc = logoSrc;
    if (logoSrc && !logoSrc.startsWith('http') && !logoSrc.startsWith('../')) {
        if (!logoSrc.includes('img/partiti/')) {
            correctLogoSrc = `../img/partiti/${logoSrc}`;
        } else {
            correctLogoSrc = `../${logoSrc}`;
        }
    }

    const entries = Array.isArray(politici) ? politici.slice(1) : [];
    const members = entries.filter(p => (p.partito || '') === (item.partito || '')).sort((a, b) => {
        const roleA = (a.ruolo || '').toLowerCase();
        const roleB = (b.ruolo || '').toLowerCase();
        if (roleA !== roleB) return roleA.localeCompare(roleB);
        return (a.nome || '').localeCompare(b.nome || '');
    });
    
    const membersMarkup = members.length
        ? members.map(member => {
            const nomeSlug = slug(member.nome || '');
            const roleText = member.ruolo ? `${member.ruolo}` : '';
            const functionText = member.funzione ? `${member.funzione}` : '';
            const roleLine = [roleText, functionText].filter(Boolean).join(' · ');
            // CORRETTO: Rimosso 'html/' perché partiti.html e politici.html condividono la stessa cartella
            return `<li class="member-row"><a class="party-link" href="politici.html#${nomeSlug}">${roleLine ? `<span class="member-role">${roleLine}</span> ` : ''}${member.nome}</a></li>`;
        }).join('')
        : '';
        
    const descriptionMarkup = item.descrizione ? `<p class="descrizione">${item.descrizione}</p>` : '';
    const europeanParty = getEuropeanPartyForAffiliation(item.affiliazione || '');
    const europeanPartySlug = europeanParty ? slug(europeanParty) : '';
    
    // CORRETTO: Rimosso 'html/' dal link delle affiliazioni europee
    const affiliationMarkup = item.affiliazione ? `<div class="party-affiliation"><span class="affiliation-label">${texts.affiliationLabel || 'Affiliazione europea:'}</span> ${europeanPartySlug ? `<a class="party-link" href="partiti-europei.html#${europeanPartySlug}">${europeanParty}</a>` : `<span>${item.affiliazione}</span>`}</div>` : '';
    const membersDetailsMarkup = membersMarkup ? `<details class="party-members-details"><summary>${texts.membersLabel || 'Membri'}</summary><ul class="party-member-list">${membersMarkup}</ul></details>` : '';
    
    return `
        <article class="source-card party-card" id="${id}" ${colorStyle}>
            <div class="card-header">
                <div>
                    <h2 class="nome"><a class="party-link" href="partiti.html#${id}">${item.partito}</a></h2>
                    <div class="party-label">${item.orientamento || item.coalizione || (texts.defaultPartyLabel || 'Partito')}</div>
                </div>
                <div class="badges">
                      <img class="party-logo" src="${correctLogoSrc}" alt="Logo ${item.partito}" ${logoStyle}>
                </div>
            </div>
            ${descriptionMarkup}
            ${affiliationMarkup}
            ${membersDetailsMarkup}
        </article>`;
}
 
function renderPartiti() {
    const texts = getPageTexts('partiti') || {};
    if (!Array.isArray(partiti) || partiti.length <= 1) {
        document.getElementById('content').innerHTML = '';
        updatePartitiSummary(0, 0, 0, 0);
        return;
    }

    const entries = partiti.slice(1);
    const destra = entries.filter(item => item.coalizione && item.coalizione.toLowerCase() === 'destra');
    const sinistra = entries.filter(item => item.coalizione && item.coalizione.toLowerCase() === 'sinistra');
    const indipendenti = entries.filter(item => {
        const coalizione = item.coalizione ? item.coalizione.toLowerCase() : '';
        return coalizione !== 'destra' && coalizione !== 'sinistra';
    });

    const partyCount = entries.length;
    const destraCount = destra.length;
    const sinistraCount = sinistra.length;
    const indipendentiCount = indipendenti.length;

    updatePartitiSummary(partyCount, destraCount, sinistraCount, indipendentiCount);

    let HTML = '<div class="coalition-layout">';

    HTML += renderCoalitionPanel(texts.coalitionRight || 'Coalizione di destra', destra, texts);
    HTML += renderCoalitionPanel(texts.coalitionLeft || 'Coalizione di sinistra', sinistra, texts);

    HTML += '</div>';

    if (indipendenti.length) {
        HTML += '<section class="coalition-panel full-width">';
        HTML += '<details class="coalition-box" open>';
        HTML += `<summary class="coalition-summary">${texts.independentLabel || 'Indipendenti'}</summary>`;
        HTML += '<div class="party-members">';
        indipendenti.sort((a, b) => a.partito.localeCompare(b.partito)).forEach(item => {
            HTML += renderPartyCard(item, texts);
        });
        HTML += '</div>';
        HTML += '</details>';
        HTML += '</section>';
    }

    document.getElementById('content').innerHTML = HTML;
    if (typeof window.highlightHashTarget === 'function') {
        window.highlightHashTarget();
    }
}

Promise.all([
    remoteJSON("partiti.json"),
    remoteJSON("politici.json"),
    remoteJSON("partiti-europei.json")
])
    .then(([partitiData, politiciansData, partitiEuropeiData]) => {
        partiti = partitiData || [];
        politici = politiciansData || [];
        partitiEuropei = Array.isArray(partitiEuropeiData) ? partitiEuropeiData.slice(1) : [];
        return window.__PROJECT_TEXTS_PROMISE__ || Promise.resolve();
    })
    .then(() => {
        renderPartiti();
    })
    .catch(err => console.error("Errore caricamento dati:", err));