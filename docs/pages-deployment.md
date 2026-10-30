# GitHub Pages deployment

Status: live at the URL below. GitHub reports the branch source as gh-pages /, the build as successful, and HTTPS enforced. Source and README remain on dev; main is unchanged.

Public editor: https://kmg200164.github.io/ALO4OBS/

Source and README updates belong to `dev`. GitHub Pages publishes the root of the separate `gh-pages` branch. The branch contains only the verified output of `python build_site.py`, with `.nojekyll`. This is GitHub's official branch publishing flow; it does not merge or modify `main`.

The repository is already public. Before the initial publication, the Pages API reported no existing site, deployments or custom domain. Publication therefore does not replace an existing website. The generated site keeps the current `settings.html` interface.

## Prepare an update

1. Check out the intended committed `dev` revision and run `python build_site.py`.
2. Run `python -m unittest discover -s tests -p test_site_build.py` and the web workflow checks.
3. Check that `dist/site/config.js` exactly matches the neutral `template/config.public.js`, that no personal `obs-settings.json`, environment/key files or installation payloads appear, and that every file matches `site-manifest.json`.
4. Copy only that generated inventory into an isolated checkout of `gh-pages`. Preserve any unrelated checkout and do not copy the source tree, local settings, tests or browser data. Commit and push normally. Never force-push to update the site.
5. Confirm the Pages build succeeds and the public `site-manifest.json` matches the local output. Then verify Lua download/import and reopening on the actual HTTPS origin.

For a repository without an enabled site, setup uses `POST /repos/kmg200164/ALO4OBS/pages` with `build_type: legacy` and source `gh-pages` / `/`. The first gh-pages push in this repository automatically enabled Pages; a create request returned already enabled, and the GET API confirmed the exact intended branch source. Subsequent pushes to that branch trigger GitHub's Pages build and deployment. Repository Website points to the editor. The default source branch remains `main`; the updated README is available at `https://github.com/kmg200164/ALO4OBS/tree/dev` until a separately authorized main update.

The public build contains neutral defaults, application code, rendering resources and licenses. Uploads and user settings stay in browser storage. Lua downloads can contain the user's widget URLs, but they are generated locally and never committed to the publishing branch.

The build command itself never publishes. The page is not an offline editor, and changing the HTTPS origin would isolate existing browser storage. Keep the published origin stable.

Official references: [Configure a Pages publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site), [Pages REST API](https://docs.github.com/en/rest/pages/pages#create-a-github-pages-site).
