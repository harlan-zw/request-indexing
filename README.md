<h1 align='center'>Request Indexing</h1>

<p align="center">
Get your pages indexed on Google within 48 hours. (on average)
</p>

<p align="center">
<table>
<tbody>
<td align="center">
<img width="800" height="0" /><br>
<i>Status:</i> <a href="https://github.com/harlan-zw/nuxt-seo/releases/tag/v2.0.0">Just Released 🥳/a></b> <br>
<sup> Please report any issues 🐛</sup><br>
<sub>Made possible by my <a href="https://github.com/sponsors/harlan-zw">Sponsor Program 💖</a><br> Follow me <a href="https://twitter.com/harlan_zw">@harlan_zw</a> 🐦 • Join <a href="https://discord.gg/275MBUBvgP">Discord</a> for help</sub><br>
<img width="800" height="0" />
</td>
</tbody>
</table>
</p>

## Features

- ✨ Create an `og:image` using the built-in templates or make your own with Vue components
- 🎨 Design and test your `og:image` in the Nuxt DevTools OG Image Playground with full HMR
- ▲ Render using [Satori](https://github.com/vercel/satori): Tailwind / UnoCSS with your theme, Google fonts, 6 emoji families supported and more!
- 🤖 Or prerender using the Browser: Supporting painless, complex templates
- 📸 Feeling lazy? Just generate screenshots for every page: hide elements, wait for animations, and more
- ⚙️ Works on the edge: Vercel Edge, Netlify Edge and Cloudflare Workers

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

You will need to add the redirect URL to your OAuth client. This will be `http://localhost:3000/auth/callback/google`.

```bash
NUXT_OAUTH_GOOGLE_CLIENT_ID=<clientId>
NUXT_OAUTH_GOOGLE_CLIENT_SECRET=<clientSecret>
```

That's it!

All features are enabled by default. Learn more by exploring the [documentation](https://nuxtseo.com)

## Sponsors

<p align="center">
  <a href="https://raw.githubusercontent.com/harlan-zw/static/main/sponsors.svg">
    <img src='https://raw.githubusercontent.com/harlan-zw/static/main/sponsors.svg'/>
  </a>
</p>

## License

MIT License © 2022-PRESENT [Harlan Wilton](https://github.com/harlan-zw)
