let politici = [];
let dichiarazioni = [];
let partitoAffiliazioni = {};
let partitoCoalizioni = {};
let partyMetaByName = {};
const url = "https://raw.githubusercontent.com/ItaliaConsapevole/html/main/data/";
const defaultPersonPhoto = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="140" height="140"%3E%3Crect width="140" height="140" fill="%23f8f9ff"/%3E%3Ccircle cx="70" cy="45" r="32" fill="%23cbd2e6"/%3E%3Crect x="30" y="86" width="80" height="32" rx="16" fill="%23cbd2e6"/%3E%3C/svg%3E';

function loadRemoteJSON(filename) {
    return fetch(url + filename)
        .then(response => response.ok ? response.json() : Promise.reject())
        .catch(() => fetch(`data/${filename}`)
            .then(response => response.ok ? response.json() : Promise.reject())
            .catch(() => ({}))
        );
}

function normalizeString(value) {
    return value.toString().toLowerCase().trim().replace(/\s+/g, ' ');
}

function getPartyMeta(name) {
    const normalized = normalizeString(name);
    if (!normalized) return {};
    if (partyMetaByName[normalized]) return partyMetaByName[normalized];
    const match = Object.keys(partyMetaByName).find(key => normalized.includes(key) || key.includes(normalized));
    return match ? partyMetaByName[match] : {};
}

function readableTextColor(hex) {
    if (!hex) return '#000';
    const c = hex.replace('#','');
    const r = parseInt(c.substr(0,2),16);
    const g = parseInt(c.substr(2,2),16);
    const b = parseInt(c.substr(4,2),16);
    // relative luminance
    const luminance = (0.299*r + 0.587*g + 0.114*b)/255;
    return luminance > 0.6 ? '#000' : '#fff';
}

function getAffiliationForParty(name) {
    const normalized = normalizeString(name);
    if (partitoAffiliazioni[normalized]) return partitoAffiliazioni[normalized];
    const match = Object.keys(partitoAffiliazioni).find(key => normalized.includes(key) || key.includes(normalized));
    return match ? partitoAffiliazioni[match] : '';
}

function getCoalitionForParty(name) {
    const normalized = normalizeString(name);
    if (partitoCoalizioni[normalized]) return partitoCoalizioni[normalized];
    const match = Object.keys(partitoCoalizioni).find(key => normalized.includes(key) || key.includes(normalized));
    return match ? partitoCoalizioni[match] : 'Indipendente';
}

Promise.all([
    loadRemoteJSON("politici.json"),
    loadRemoteJSON("index.json"),
    loadRemoteJSON("partiti.json")
])
    .then(([politiciData, dichiarazioniData, partitiData]) => {
        politici = politiciData;
        dichiarazioni = dichiarazioniData;
        const partitiEntries = Array.isArray(partitiData) ? partitiData.slice(1) : [];
        partitoAffiliazioni = {};
        partitoCoalizioni = {};
        partyMetaByName = {};
        partitiEntries.forEach(item => {
            const normalized = normalizeString(item.partito || '');
            partitoAffiliazioni[normalized] = item.affiliazione || '';
            partitoCoalizioni[normalized] = item.coalizione || 'Indipendente';
            if (normalized) {
                partyMetaByName[normalized] = {
                    logo: item.logo || '',
                    color: item.color || ''
                };
            }
        });

        renderPolitici();
        const filterInput = document.getElementById('politici-filter');
        if (filterInput) {
            filterInput.addEventListener('input', () => renderPolitici(filterInput.value));
        }
    })
    .catch(err => console.error("Errore:", err));

function slug(value) {
    return value.toString().toLowerCase().trim()
        .replace(/[àáâãäå]/g, 'a')
        .replace(/[èéêë]/g, 'e')
        .replace(/[ìíîï]/g, 'i')
        .replace(/[òóôõö]/g, 'o')
        .replace(/[ùúûü]/g, 'u')
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

function updatePoliticiSummary(count, parties, declarations) {
    const summary = document.getElementById('politici-summary');
    if (!summary) return;
    summary.innerHTML = `
        <span>${count} politici</span>
        <span>${parties} partiti</span>
        <span>${declarations} dichiarazioni</span>
    `;
}

function renderPolitici(filterValue = '') {
    if (!Array.isArray(politici) || politici.length <= 1) {
        document.getElementById('content').innerHTML = '';
        updatePoliticiSummary(0, 0, 0);
        return;
    }

    const entries = politici.slice(1);
    const declarations = Array.isArray(dichiarazioni) ? dichiarazioni.slice(1) : [];
    const declarationsByPolitician = declarations.reduce((acc, item) => {
        const name = item.nome || '';
        if (!acc[name]) acc[name] = [];
        acc[name].push(item);
        return acc;
    }, {});

    const normalizedFilter = normalizeString(filterValue || '');
    const filteredEntries = entries.filter(politico => {
        if (!normalizedFilter) return true;
        const partito = politico.partito || '';
        const affiliation = getAffiliationForParty(partito);
        const coalition = getCoalitionForParty(partito);
        const searchText = normalizeString(`${politico.nome} ${partito} ${politico.ruolo} ${politico.funzione} ${affiliation} ${coalition}`);
        return searchText.includes(normalizedFilter);
    });

    const totalDeclarations = filteredEntries.reduce((sum, politico) => sum + ((declarationsByPolitician[politico.nome] || []).length), 0);
    const uniqueParties = new Set(filteredEntries.map(politico => politico.partito || 'Partito sconosciuto')).size;
    updatePoliticiSummary(filteredEntries.length, uniqueParties, totalDeclarations);

    if (filteredEntries.length === 0) {
        document.getElementById('content').innerHTML = '<article class="source-card"><p class="empty-state">Nessun politico trovato per la ricerca.</p></article>';
        return;
    }

    const grouped = filteredEntries.reduce((acc, politico) => {
        const partito = politico.partito || 'Partito sconosciuto';
        if (!acc[partito]) acc[partito] = [];
        acc[partito].push(politico);
        return acc;
    }, {});

    const sortedPartiti = Object.keys(grouped).sort((a, b) => a.localeCompare(b));
    let HTML = '';

    sortedPartiti.forEach(partito => {
        const members = grouped[partito].sort((a, b) => a.nome.localeCompare(b.nome));
        HTML += `<section class="party-group"><details class="party-box" open>
                    <summary class="party-summary"><a class="party-link" href="partiti.html#${slug(partito)}">${partito}</a></summary>
                    <div class="party-members">`;

        members.forEach(politico => {
            const declarationsForPolitico = declarationsByPolitician[politico.nome] || [];
            const declarationItems = declarationsForPolitico.length
                ? declarationsForPolitico.map(entry => `<li><strong>${entry.data}</strong>: <em>${politico.ruolo} e ${politico.funzione} di ${politico.partito}</em><br>${entry.messaggio}</li>`).join('')
                : '<li>Nessuna dichiarazione disponibile.</li>';
            const affiliation = getAffiliationForParty(politico.partito || '');
            const coalition = getCoalitionForParty(politico.partito || '');
                const partyMeta = getPartyMeta(politico.partito || '');
                const photoSrc = politico.photo || partyMeta.logo || defaultPersonPhoto;
                const partyColor = partyMeta.color || '';
                const badgeTextColor = partyColor ? readableTextColor(partyColor) : '';
                const photoStyle = partyColor ? `style="border:2px solid ${partyColor};"` : '';
                const badgeStyle = partyColor ? `style="background:${partyColor}; color:${badgeTextColor};"` : '';

                HTML += `
                    <article class="source-card" id="${slug(politico.nome)}">
                        <div class="person-row">
                            <img class="politician-photo" src="${photoSrc}" alt="${politico.nome}" ${photoStyle}>
                            <div>
                                <span class="nome">${politico.nome}</span>
                                <div class="metadata">
                                    <span class="badge badge-function" ${badgeStyle}>${politico.funzione}</span>
                                </div>
                            </div>
                        </div>
                        <div class="role-function">${politico.ruolo}</div>
                        <details class="politico-details">
                            <summary>Dichiarazioni</summary>
                            <ul>${declarationItems}</ul>
                        </details>
                    </article>`;
        });

        HTML += `
                    </div>
                 </details></section>`;
    });

    document.getElementById('content').innerHTML = HTML;
    if (typeof window.highlightHashTarget === 'function') {
        window.highlightHashTarget();
    }
}