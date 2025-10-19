Release notes for v5.0.0
-----------------------

What I changed:

- Bumped project version to `5.0.0` in `package.json` and top-level `package-lock.json`.
- Updated visible version strings and cache-busting tokens to `v5.0.0` in `index.html`, `src/main.jsx`, `vite.config.js`, `src/screens/AboutScreenModern.jsx`, and `src/screens/DriverInitScreen.jsx`.
- Created/updated `public/manifest.json` with `version: 5.0.0` and updated PWA manifest fields.

How to build & deploy (local):

1. Install dependencies: `npm ci` (recommended) or `npm install`.
2. Build: `npm run build`.
3. Preview locally: `npm run preview`.
4. Deploy to GitHub Pages (existing setup): `npm run deploy`.

Notes:
- I updated the top-level `package-lock.json` version string to match `package.json`. To fully regenerate the lockfile with consistent dependency versions, run `npm ci` (this will replace the lockfile contents). I intentionally avoided changing dependency versions.
- I updated human-visible strings only; I did not change package dependency versions.

If you want, I can regenerate `package-lock.json` by running `npm install`/`npm ci` here and commit the updated lockfile.

Done by automated script.
