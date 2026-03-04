import fs from 'fs';

async function main() {
  const npmQueries = ['google-indexing-api', 'google-indexing', 'seo-indexer', 'googleapis'];
  const npmResults = [];
  for (const q of npmQueries) {
    const res = await fetch(`https://registry.npmjs.org/-/v1/search?text=${q}&size=10`);
    const data = await res.json();
    for (const obj of data.objects) {
      if (!npmResults.find(r => r.name === obj.package.name) && 
         (obj.package.name.includes('index') || obj.package.description.toLowerCase().includes('index'))) {
        
        const dlRes = await fetch(`https://api.npmjs.org/downloads/point/last-week/${obj.package.name}`);
        const dlData = await dlRes.json();
        
        npmResults.push({
          name: obj.package.name,
          date: obj.package.date,
          links: obj.package.links.npm,
          description: obj.package.description,
          downloads: dlData.downloads || 0
        });
      }
    }
  }

  const ghRes = await fetch('https://api.github.com/search/repositories?q="google indexing api" in:name,description,readme&sort=stars&order=desc&per_page=15', {
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

  fs.writeFileSync('better_search.json', JSON.stringify({ npm: npmResults, github: ghRepos }, null, 2));
}

main().catch(console.error);
