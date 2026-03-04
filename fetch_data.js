import fs from 'fs';

async function main() {
  // npm search
  const npmRes = await fetch('https://registry.npmjs.org/-/v1/search?text=google+indexing+api+OR+indexing+api&size=10');
  const npmData = await npmRes.json();
  const npmPackages = npmData.objects.map(obj => ({
    name: obj.package.name,
    date: obj.package.date,
    links: obj.package.links.npm,
    description: obj.package.description,
  }));

  // For each npm package, get downloads
  for (const pkg of npmPackages) {
    const dlRes = await fetch(`https://api.npmjs.org/downloads/point/last-week/${pkg.name}`);
    const dlData = await dlRes.json();
    pkg.downloads = dlData.downloads || 0;
  }

  // Github search
  const ghRes = await fetch('https://api.github.com/search/repositories?q="google indexing api" OR "indexing api"&sort=stars&order=desc&per_page=10', {
    headers: { 'User-Agent': 'Node.js' }
  });
  const ghData = await ghRes.json();
  const ghRepos = (ghData.items || []).map(repo => ({
    name: repo.full_name,
    stars: repo.stargazers_count,
    url: repo.html_url,
    language: repo.language,
    description: repo.description,
    pushed_at: repo.pushed_at
  }));

  // Google Docs
  const docs1 = await fetch('https://developers.google.com/search/apis/indexing-api/v3/quickstart').then(r => r.text());
  const docs2 = await fetch('https://developers.google.com/search/apis/indexing-api/v3/using-api').then(r => r.text());
  const docs3 = await fetch('https://developers.google.com/search/apis/indexing-api/v3/reference').then(r => r.text());

  fs.writeFileSync('data_output.json', JSON.stringify({
    npm: npmPackages,
    github: ghRepos,
    doc_using: docs2.substring(0, 10000), // Get enough text to find exact quotes
    doc_reference: docs3.substring(0, 10000)
  }, null, 2));
}

main().catch(console.error);
