Deploy this project to Vercel and return the deployment URL.

Steps:
1. Check if `vercel` CLI is installed by running `vercel --version`. If not installed, run `npm install -g vercel` first.
2. Run `npm run build` to make sure the project builds successfully.
3. Run `vercel --prod --yes` to deploy to production. If this is the first deployment, Vercel will ask setup questions — answer them: use current directory, detect framework automatically, keep default build/output settings.
4. Parse the output to find the production URL (the line starting with `Production:` or the final URL shown).
5. Report the deployment URL to the user.

If the user is not logged in to Vercel, run `vercel login` and wait for them to complete authentication in the browser before proceeding.
