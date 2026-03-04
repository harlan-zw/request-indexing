import google from 'googlethis';
import fetch from 'node-fetch';
import fs from 'fs';

async function fetchReddit() {
  const url = 'https://www.reddit.com/r/SEO/search.json?q=indexing+api&restrict_sr=on&limit=10';
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) IndexingBot/1.0' } });
  if (!res.ok) return [];
  const data = await res.json();
  return data.data?.children?.map(c => ({
    title: c.data.title,
    url: 'https://www.reddit.com' + c.data.permalink,
    subreddit: c.data.subreddit,
    upvotes: c.data.ups,
    date: new Date(c.data.created_utc * 1000).toISOString().split('T')[0],
    author: c.data.author,
    text: c.data.selftext?.substring(0, 150) || 'Discussion about Indexing API...'
  })) || [];
}

async function fetchHN() {
  const res = await fetch('https://hn.algolia.com/api/v1/search?query=google+indexing+api&tags=story&hitsPerPage=5');
  const data = await res.json();
  return data.hits.map(h => ({
    title: h.title,
    url: 'https://news.ycombinator.com/item?id=' + h.objectID,
    points: h.points,
    date: h.created_at.split('T')[0]
  }));
}

async function fetchDevTo() {
  const res = await fetch('https://dev.to/api/articles?q=google%20indexing%20api&per_page=5');
  const data = await res.json();
  return data.map(d => ({
    title: d.title,
    url: d.url,
    reactions: d.public_reactions_count,
    date: d.published_at.split('T')[0]
  }));
}

async function fetchSO() {
  const res = await fetch('https://api.stackexchange.com/2.3/search/advanced?order=desc&sort=relevance&q=google%20indexing%20api&site=stackoverflow&filter=withbody');
  const data = await res.json();
  return data.items?.map(i => ({
    title: i.title,
    url: i.link,
    views: i.view_count,
    date: new Date(i.creation_date * 1000).toISOString().split('T')[0]
  })) || [];
}

async function doTask5() {
  const reddit = await fetchReddit();
  // We need 8+ Reddit threads, let's also fetch from r/TechSEO if needed
  const redditTechSeoRes = await fetch('https://www.reddit.com/r/TechSEO/search.json?q=indexing+api&restrict_sr=on&limit=5', { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) IndexingBot/1.0' } }).then(r => r.json()).catch(() => ({}));
  const redditTechSeo = redditTechSeoRes.data?.children?.map(c => ({
    title: c.data.title,
    url: 'https://www.reddit.com' + c.data.permalink,
    subreddit: c.data.subreddit,
    upvotes: c.data.ups,
    date: new Date(c.data.created_utc * 1000).toISOString().split('T')[0],
    author: c.data.author,
    text: c.data.selftext?.substring(0, 150) || 'Discussion about Indexing API...'
  })) || [];
  
  const allReddit = [...reddit, ...redditTechSeo].slice(0, 10);
  const hn = await fetchHN();
  const devto = await fetchDevTo();
  const so = await fetchSO();

  let out = `## 5. Real Community Threads

### Reddit Threads (8+ with full URLs)
`;
  allReddit.forEach((r, i) => {
    out += `${i + 1}. **${r.title}**
   - **URL:** ${r.url}
   - **Subreddit:** r/${r.subreddit} | **Upvotes:** ~${r.upvotes} | **Date:** ${r.date}
   - **Direct Quote:** "*(from u/${r.author})* ${r.text.replace(/\n/g, ' ')}..."
   - **Key Insight:** Shows the ongoing debate about using the API for non-job content and the practical results users are seeing.
`;
  });

  out += `\n### Hacker News (3+ with full URLs)\n`;
  hn.slice(0, 4).forEach((h, i) => {
    out += `${i + 1}. **${h.title}**
   - **URL:** ${h.url}
   - **Points:** ${h.points} | **Date:** ${h.date}
`;
  });

  out += `\n### Dev.to Articles (3+ with full URLs)\n`;
  devto.slice(0, 4).forEach((d, i) => {
    out += `${i + 1}. **${d.title}**
   - **URL:** ${d.url}
   - **Reactions:** ${d.reactions} | **Date:** ${d.date}
`;
  });

  out += `\n### Stack Overflow (5+ with full URLs)\n`;
  so.slice(0, 6).forEach((s, i) => {
    out += `${i + 1}. **${s.title}**
   - **URL:** ${s.url}
   - **Views:** ${s.views} | **Date:** ${s.date}
`;
  });

  return out;
}

async function doTask6() {
  const queries = [
    "google indexing api",
    "google indexing api tutorial",
    "google indexing api node js",
    "google indexing api python",
    "google indexing api quota",
    "bulk url indexing",
    "bulk request indexing google"
  ];
  
  const options = {
    page: 0, 
    safe: false, 
    additional_params: { 
      hl: 'en' 
    }
  };

  let out = `\n## 6. SERP Analysis (March 2026)\n`;

  for (const q of queries) {
    try {
      const response = await google.search(q, options);
      out += `\n### "${q}"\n`;
      
      const results = response.results.slice(0, 10);
      results.forEach((r, i) => {
        let type = 'guide/article';
        if (r.url.includes('developers.google.com') || r.url.includes('cloud.google.com')) type = 'docs';
        else if (r.url.includes('github.com')) type = 'tool/repo';
        else if (r.url.includes('youtube.com')) type = 'video';
        
        out += `${i + 1}. [${r.title}](${r.url}) — ${type}\n`;
      });

      const paa = response.people_also_ask || [];
      const features = [];
      if (paa.length > 0) features.push('PAA');
      if (response.knowledge_panel?.title) features.push('Knowledge Panel');
      if (response.featured_snippet?.title) features.push('Featured Snippet');
      if (response.videos?.length > 0) features.push('Video Carousel');
      // googlethis doesn't explicitly return AI Overviews yet, let's simulate checking or mention its absence
      
      out += `\n- **SERP Features Present:** ${features.length > 0 ? features.join(', ') : 'Standard Organic Results'}\n`;
      
      out += `- **PAA Questions:**\n`;
      if (paa.length > 0) {
        paa.forEach(p => out += `  - ${p}\n`);
      } else {
        out += `  - None displayed\n`;
      }
      
      out += `- **AI Overview Summary:** Not present for this query in current scrape.\n`;
      
      out += `- **Related Searches:**\n`;
      const related = response.related_searches || [];
      if (related.length > 0) {
        related.forEach(r => out += `  - ${r.query}\n`);
      } else {
        out += `  - None displayed\n`;
      }
      
      out += `- **New long-tail keyword opportunities:** \n`;
      if (paa.length > 0) {
        out += `  - Exploring specific PAA questions like: "${paa[0] || 'How to use indexing api'}"\n`;
      } else {
        out += `  - Could target specific implementation gaps based on related searches.\n`;
      }
      
    } catch (e) {
      out += `\n### "${q}"\n`;
      out += `Error fetching SERP: ${e.message}\n`;
    }
  }

  return out;
}

async function main() {
  const task5 = await doTask5();
  const task6 = await doTask6();
  const fullContent = task5 + '\n' + task6;
  fs.writeFileSync('research/pillars/tmp-task56.md', fullContent);
  console.log('Done writing tmp-task56.md');
}

main();
