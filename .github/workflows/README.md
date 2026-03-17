# 🚀 .github/workflows/

## deploy.yml

Automatic CI/CD pipeline — runs on every push to the `main` branch.

### What it does:
1. Checks out the code
2. Sets up Node.js 18
3. Runs `npm install`
4. Runs `npm run build` (Vite builds to `./dist/`)
5. Deploys `./dist/` to the `gh-pages` branch using `peaceiris/actions-gh-pages`
6. GitHub Pages serves the `gh-pages` branch at `https://Ayushh-Sharmaa.github.io/NexaSphere/`

### When to edit:
- Changing Node version (`node-version: 18`)
- Changing the deploy branch
- Adding build environment variables

### If a deploy fails:
Go to the **Actions** tab on GitHub — click the failed workflow — read the red step for the exact error.
Most common cause: syntax error in JSX or a missing import.
