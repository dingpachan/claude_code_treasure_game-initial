Deploy this project to GitHub Pages and return the Pages URL. If no matching GitHub repository exists yet, create one; if it already exists, commit and push the update to it.

Steps:
1. Check if the `gh` CLI is installed by running `gh --version`. If not installed, run `brew install gh` (macOS). If Homebrew isn't available, ask the user to install `gh` manually before continuing.
2. Check auth with `gh auth status`. If not logged in, run `gh auth login` and wait for the user to complete authentication in the browser before proceeding.
3. Check if the project is already a git repo with `git rev-parse --is-inside-work-tree`. If not, run `git init` and `git branch -M main`.
4. Determine the repo name: reuse the existing `origin` remote if one is set; otherwise default to the project's directory name (lowercased, spaces/underscores replaced with hyphens), unless the user specifies a different name.
5. Determine the GitHub owner via `gh api user --jq .login`, then check whether `<owner>/<repo>` already exists with `gh repo view <owner>/<repo>`.
   - If it does **not** exist: stage and commit all changes (`git add -A && git commit -m "..."`, skipping the commit step if there's nothing to commit), then run `gh repo create <repo> --public --source=. --remote=origin --push` to create the repo, wire up the `origin` remote, and push `main` in one step.
   - If it **does** exist: make sure `origin` points to it (`git remote add origin <url>` or `git remote set-url origin <url>` as needed), stage and commit any changes (`git add -A && git commit -m "..."`, skipping if there's nothing to commit), then `git push -u origin main`.
6. GitHub Pages project sites are served from `https://<owner>.github.io/<repo>/`, so Vite's `base` must resolve to `/<repo>/` for asset URLs to work — but this project's Vercel deploy needs `base: '/'`. Check `vite.config.ts`'s `build`/root config: if it doesn't already set `base` conditionally, add `base: process.env.GH_PAGES ? '/<repo>/' : '/'` (substituting the actual repo name) so the Vercel build path is unaffected.
7. Build for GitHub Pages: `GH_PAGES=true npm run build` (outputs to `./build/` per this project's `vite.config.ts`).
8. Publish `./build/` to the `gh-pages` branch: `npx --yes gh-pages -d build -m "Deploy to GitHub Pages"` (this pushes only the build output to that branch, leaving `main` untouched).
9. Make sure Pages is enabled and serving from the `gh-pages` branch root. Check `gh api repos/<owner>/<repo>/pages`; if that 404s, enable it with `gh api repos/<owner>/<repo>/pages -X POST -f "source[branch]=gh-pages" -f "source[path]=/"`.
10. Get the live URL with `gh api repos/<owner>/<repo>/pages --jq .html_url` (fall back to `https://<owner>.github.io/<repo>/` if the API call fails due to propagation delay — first-time Pages enablement can take a minute or two).
11. Report the GitHub Pages URL to the user, noting that a first-time deploy may take a minute or two to go live.
