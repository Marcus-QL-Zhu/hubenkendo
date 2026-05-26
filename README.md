# 女友Maker

女友Maker is a mobile-first prompt builder for assembling AI character image prompts from visual reference tiles.

The app is a static React/Vite site. It has no backend: all selections, prompt generation, and copy actions happen in the browser.

## Source Material

The current catalog is generated from the locally saved article:

- `C:\Users\wande\Downloads\text_to_pic.html`
- `C:\Users\wande\Downloads\text_to_pic_files`

The app credits Draco正在VibeCoding and links to the original article:

https://mp.weixin.qq.com/s/sf_epNebyrKJD-mmOu0mcA

## Local Development

Install dependencies:

```powershell
npm.cmd install
```

Regenerate the catalog and tiles:

```powershell
npm.cmd run build:catalog
```

Run tests:

```powershell
npm.cmd test -- --run
```

Start the dev server:

```powershell
npm.cmd run dev -- --host 127.0.0.1
```

Build the static site:

```powershell
npm.cmd run build
```

## GitHub Pages

This repo includes `.github/workflows/deploy.yml`. After pushing to a GitHub repository:

1. Rename the default branch to `main` if needed.
2. Open the repository settings.
3. Go to Pages.
4. Set the source to GitHub Actions.
5. Push to `main`.

The expected URL shape is:

```text
https://<github-username>.github.io/girlfriend-maker/
```

The Vite `base` path is already set to `/girlfriend-maker/`.
