import https from 'https';

const urls = process.argv.slice(2);

urls.forEach(url => {
  https.get(url, (res) => {
    console.log(res.headers.location);
  }).on('error', (e) => console.error(e));
});