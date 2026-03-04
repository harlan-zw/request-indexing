import * as cheerio from 'cheerio';
import fetch from 'node-fetch';

async function fetchGoogle(query) {
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&hl=en`;
    const res = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
    });
    const html = await res.text();
    const $ = cheerio.load(html);
    
    const results = [];
    $('div.g').each((i, el) => {
        const a = $(el).find('a').first();
        const title = $(el).find('h3').first().text();
        const href = a.attr('href');
        if (title && href && href.startsWith('http')) {
            results.push({ title, url: href });
        }
    });
    
    const paa = [];
    $('div[data-s="PAA"] div[role="button"]').each((i, el) => {
        const text = $(el).text();
        if (text) paa.push(text);
    });
    if (paa.length === 0) {
        // Alternative PAA selector
        $('.cbphWd').each((i, el) => paa.push($(el).text()));
    }

    const related = [];
    $('.s75CSd').each((i, el) => {
        related.push($(el).text());
    });
    
    return { results: results.slice(0, 10), paa, related };
}

async function main() {
    const queries = [
        "google indexing api",
        "google indexing api tutorial",
        "google indexing api node js",
        "google indexing api python",
        "google indexing api quota",
        "bulk url indexing",
        "bulk request indexing google"
    ];
    
    for (const q of queries) {
        const data = await fetchGoogle(q);
        console.log(`\n### "${q}"\n`);
        
        data.results.forEach((r, i) => {
            let type = 'guide/article';
            if (r.url.includes('developers.google.com') || r.url.includes('cloud.google.com')) type = 'docs';
            else if (r.url.includes('github.com')) type = 'tool/repo';
            else if (r.url.includes('youtube.com')) type = 'video';
            console.log(`${i + 1}. [${r.title}](${r.url}) — ${type}`);
        });

        console.log(`\n- **SERP Features Present:** ${data.paa.length ? 'PAA, ' : ''}Standard Organic Results`);
        console.log(`- **PAA Questions:**`);
        if (data.paa.length) {
            data.paa.forEach(p => console.log(`  - ${p}`));
        } else {
            console.log(`  - None displayed`);
        }
        
        console.log(`- **AI Overview Summary:** Not triggered / Not extracted in simple fetch.`);
        console.log(`- **Related Searches:**`);
        if (data.related.length) {
            data.related.forEach(p => console.log(`  - ${p}`));
        } else {
            console.log(`  - None displayed`);
        }
        console.log(`- **New long-tail keyword opportunities:** Exploring specific PAA questions like: "${data.paa[0] || 'How to use indexing api'}"`);
    }
}

main();