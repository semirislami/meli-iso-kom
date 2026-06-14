# Deploy guide (browser-only — nothing runs on your PC)

Your machine blocks Node from the internet, so we let the cloud build it.
Everything below happens in your web browser. No terminal, no npm.

## Phase A — Put the code on GitHub (free)

1. Go to **https://github.com** and sign up / log in.
2. Click the **+** (top-right) → **New repository**.
3. Repository name: `measurement-calculator` → keep it **Public** (or Private,
   both work) → click **Create repository**.
4. On the new page, click the link **"uploading an existing file"**
   (or go to `Add file ▸ Upload files`).
5. Open the folder `C:\Users\Semir\Claude\meli-iso-kom` in File Explorer.
6. Select **all the items inside it** (Ctrl + A) — make sure `package.json`,
   `index.html`, the `src` folder and the `public` folder are included.
   **Do NOT** include a `node_modules` folder (there isn't one — good).
7. **Drag them into the GitHub upload box.** Wait for the file list to fill in.
8. Scroll down → click **Commit changes**.

## Phase B — Deploy with Vercel (free)

1. Go to **https://vercel.com** → **Sign Up** → choose **Continue with GitHub**.
2. Click **Add New… ▸ Project**.
3. Find `measurement-calculator` in the list → click **Import**.
4. Vercel auto-detects **Vite**. Leave every setting as-is.
5. Click **Deploy**. Wait ~1–2 minutes (it installs + builds in the cloud).
6. You'll get a live link like `https://measurement-calculator-xxxx.vercel.app`.

## Phase C — Use it on your phone

1. Open that link on your phone (any browser).
2. Browser menu → **Add to Home Screen** / **Install app**.
3. Open it from your home screen — full screen, works offline.

## Making changes later

Edit a file on GitHub (pencil icon) or re-upload → Vercel rebuilds and
re-deploys automatically. The link stays the same.
