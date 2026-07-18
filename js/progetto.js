const PROJECT_JSON_URL = 'https://raw.githubusercontent.com/ItaliaConsapevole/html/main/data/project.json';
loadProjectTexts()
  .then(data => {
    const texts = (data && data.pages && data.pages.progetto) ? data.pages.progetto : {};
    document.getElementById('project-description').textContent = data.description || texts.pageDescription || '';
    const linksContainer = document.getElementById('project-links');
    linksContainer.innerHTML = '';
    if (data.github) {
      const githubLink = document.createElement('a');
      githubLink.href = data.github;
      githubLink.textContent = texts.githubLabel || 'GitHub';
      githubLink.target = '_blank';
      linksContainer.appendChild(githubLink);
    }
    if (data.wikipedia) {
      linksContainer.appendChild(document.createTextNode(' | '));
      const wikipediaLink = document.createElement('a');
      wikipediaLink.href = data.wikipedia;
      wikipediaLink.textContent = texts.wikipediaLabel || 'Wikipedia';
      wikipediaLink.target = '_blank';
      linksContainer.appendChild(wikipediaLink);
    }
  })