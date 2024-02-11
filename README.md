<h1 align='center'>Request Indexing</h1>

<p align="center">
Get your pages indexed on Google within 48 hours. (on average)
</p>

<p align="center">
<table>
<tbody>
<td align="center">
<img width="800" height="0" /><br>
<i>Status:</i> <a href="https://requestindexing.com/">requestindexing.com Released 🥳/a></b> <br>
<sup> Please report any issues 🐛</sup><br>
<sub>Made possible by my <a href="https://github.com/sponsors/harlan-zw">Sponsor Program 💖</a><br> Follow me <a href="https://twitter.com/harlan_zw">@harlan_zw</a> 🐦 • Join <a href="https://discord.gg/275MBUBvgP">Discord</a> for help</sub><br>
<img width="800" height="0" />
</td>
</tbody>
</table>
</p>

## Features

- ⚡ Request indexing on new sites and pages, have them appear on Google in 48 hours.
- 📊 Dashboard to see the search performance of all your Google Search Console sites.
- 🌲 Keep your site data. Google Search Console data deletes site data longer than 16 months, start keeping it.

## Run Locally

1. Git clone the project:

```bash
git clone git
```

2. Install deps and run the project:

```bash
pnpm i
```

3. Configure your Google OAuth Keys

You will need to create a Google OAuth Client ID and Secret. You can do this by visiting the [Google Developer Console](https://console.developers.google.com/).

The following scopes are required:
- userinfo.email
- webmasters.readonly
- indexing

You will need to add the redirect URL to your OAuth client. This will be `http://localhost:3000/auth/google` and `http://localhost:3000/auth/google-indexing`.

```bash
NUXT_OAUTH_GOOGLE_CLIENT_ID=<clientId>
NUXT_OAUTH_GOOGLE_CLIENT_SECRET=<clientSecret>
```

You should also set a unique 32 character string for the security keys:

```bash
NUXT_KEY=<mustbe32chars>
NUXT_SESSION_PASSWORD=<secret>
```

That's it!

## Sponsors

<p align="center">
  <a href="https://raw.githubusercontent.com/harlan-zw/static/main/sponsors.svg">
    <img src='https://raw.githubusercontent.com/harlan-zw/static/main/sponsors.svg'/>
  </a>
</p>

## License

MIT License © 2022-PRESENT [Harlan Wilton](https://github.com/harlan-zw)
