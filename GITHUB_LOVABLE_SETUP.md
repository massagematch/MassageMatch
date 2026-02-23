# Push to GitHub so Lovable can sync

Lovable syncs from your GitHub repo’s **default branch** (usually `main`). This project is on `main` and ready to push.

## 1. Create a GitHub repo (if you don’t have one)

1. Go to [github.com](https://github.com) → **Repositories** → **New**.
2. Name it (e.g. `thai-massage-connect`).
3. **Do not** add a README, .gitignore, or license (this project already has code).
4. Click **Create repository**.

## 2. Push this project to GitHub

In a terminal, from the project folder:

```powershell
cd C:\massagematch\thai-massage-connect

# Add your repo (replace YOUR_USER and YOUR_REPO with your GitHub username and repo name)
git remote add origin https://github.com/YOUR_USER/YOUR_REPO.git

# Push (branch is already named main)
git push -u origin main
```

If you use SSH:

```powershell
git remote add origin git@github.com:YOUR_USER/YOUR_REPO.git
git push -u origin main
```

## 3. Let Lovable use this repo

- **If the repo is already connected to Lovable:**  
  Lovable syncs from the default branch. After you `git push origin main`, Lovable will pull the latest code (location, unlock, PWA, etc.) from GitHub.

- **If you’re connecting for the first time:**  
  In Lovable: **Settings → Connectors → GitHub** → connect your account and install the Lovable app, then **Connect project** and choose this repository. Lovable will use the code on `main` as the source of truth.

## Notes

- Don’t rename or delete the repo after connecting; that breaks sync.
- Lovable only syncs the default branch (we use `main`).
- To deploy the site, use Lovable’s deploy 