import https from 'https';

function fetchSearch(query) {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const options = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  };

  https.get(url, options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      const regex = /href="([^"]+)"/g;
      let match;
      const links = [];
      while ((match = regex.exec(data)) !== null) {
        if (match[1].startsWith('http') && !match[1].includes('duckduckgo.com')) {
          try {
            const urlObj = new URL(match[1]);
            const actualUrl = new URLSearchParams(urlObj.search).get('uddg');
            if (actualUrl) links.push(decodeURIComponent(actualUrl));
          } catch(e) {}
        }
      }
      console.log(links.slice(0, 5).join('\n'));
    });
  }).on('error', err => console.error(err));
}

fetchSearch(process.argv[2]);
