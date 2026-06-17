# 🎟️ HobbyCon Website

This repository contains the official website for **HobbyCon**, a curated, community-driven convention designed to help people discover, explore, and deepen their engagement with niche hobbies.

The site is built with **HTML, Tailwind CSS, and JavaScript**.

The website code is stored in GitHub and deployed through **GoDaddy cPanel Git Version Control**.

---

## 🌐 Live Site

Live website:

```text
https://hobbycon.com
```

GitHub repository:

```text
https://github.com/kparrish33/hobby-con
```

---

## 🧱 Project Structure

The website files may include:

```text
index.html
events.html
vendors.html
community.html
contact.html
tickets.html
/images
/assets
/js
└── main.js
/styles
/pdfs
/flyers
```

The exact page and folder structure may evolve as HobbyCon expands.

Important:
The full website folder should be kept together. The image folders, asset folders, flyers, PDFs, and logo files are required for the website to display correctly.

---

## ⚙️ Built With

- HTML
- Tailwind CSS CDN
- Feather Icons
- Vanilla JavaScript
- Visual Studio Code
- GitHub
- GoDaddy cPanel
- cPanel Git Version Control
- Formspree
- Stripe Payment Links
- Google Analytics 4

Recommended VS Code extensions:

- Live Server
- Prettier
- Auto Rename Tag
- Image Preview

---

## 🧠 Key Features

- Fully responsive layout
- Shared navigation across pages
- Active page highlighting in the nav
- Mobile-friendly menu toggle
- Dynamic footer year update
- Modular JavaScript in `main.js`
- Static-site friendly structure
- Formspree-powered forms
- Stripe ticket/payment links

---

## 💻 How to Edit This Site

### 1. Open the local project folder

The main working copy is saved locally on the website manager’s laptop.

Open the local HobbyCon website folder in Visual Studio Code.

Do not edit the only backup copy. Before making major changes, duplicate the folder first.

---

### 2. Preview changes locally

In VS Code:

1. Open the project folder.
2. Right-click `index.html`.
3. Select **Open with Live Server**.
4. Test changes in the browser.

Make sure to test:

- homepage
- navigation
- mobile menu
- images
- forms
- buttons
- links
- ticket links

---

### 3. Publish updates to GitHub

In GitHub Desktop:

1. Review the changed files.
2. Write a clear commit message.
3. Click **Commit to main**.
4. Click **Push origin**.

This updates the GitHub repository.

---

### 4. Deploy updates through cPanel

The website is deployed through GoDaddy cPanel using **Git Version Control**.

After pushing changes to GitHub:

1. Log into GoDaddy / cPanel.
2. Open **Git Version Control**.
3. Find the HobbyCon website repository.
4. Click **Update from Remote**.
5. Visit `https://hobbycon.com` and confirm the website updated correctly.

The live website files are located in:

```text
public_html
```

---

## 🧾 Forms, Tickets & Integrations

The website uses outside services that are not fully stored inside the website code.

### Formspree

HobbyCon forms are connected to **Formspree**.

Formspree account information is stored in the internal HobbyCon Drive where all passwords live.

The README may include Formspree endpoint IDs if needed, but passwords should not be stored directly in this file.

Formspree may be used for:

- contact forms
- vendor forms
- signup forms
- email collection forms
- retreat or event forms

When updating forms, check that the form action URL still points to the correct Formspree endpoint.

---

### Stripe

Ticketing and/or payments use **Stripe Payment Links**.

Stripe account information and payment link details should be stored in the internal HobbyCon Drive where passwords and account access information live.

When updating ticket buttons or payment links, confirm that the links go to the correct Stripe Payment Link.

---

### Google Analytics

Google Analytics 4 may be used for website analytics.

Analytics access information should be stored with the rest of the HobbyCon account access information.

---

## 🔐 Important Access Checklist

The team should know where to find access information for all of the following:

- GitHub repository
- GoDaddy hosting / cPanel
- Domain settings / DNS
- Website email account
- Formspree forms
- Stripe or ticket links
- Canva, Adobe, logo files, or brand assets
- Google Drive folders with images, flyers, PDFs, or source files

Do not store passwords directly in this README.

Passwords and account login details should be stored securely in the internal HobbyCon Drive where all passwords live, or in an approved password manager.

---

## 📦 Backup & Portability

The website should have multiple backups.

The most important backup is the full local website folder because it contains the complete website files, including images and assets.

---

## Important Note About the Local Website Folder

The local HobbyCon website folder is very important because it contains the full website files, including:

- HTML pages
- CSS files
- JavaScript files
- images
- logos
- flyers
- PDFs
- icons
- other website assets

The images and asset files are needed for the website to display correctly.

If the team only has some of the code but does not have the image folders or asset folders, the website may load with broken images or missing design elements.

Because of this, the full local website folder should be backed up and shared with the team.

Do not only copy individual HTML files. Copy the entire website folder exactly as-is.

---

## Backup Priority

The team should keep backups in this order:

### 1. Best backup: full local website folder

A full copy of the local HobbyCon website folder from the website manager’s laptop.

This should include:

- HTML files
- CSS files
- JavaScript files
- images
- logos
- flyers
- PDFs
- icons
- assets
- all other website folders

This is the most complete version if all images and assets are stored locally.

---

### 2. Second backup: GitHub repository

GitHub repository:

```text
https://github.com/kparrish33/hobby-con
```

GitHub stores the version-controlled copy of the website and the change history.

Team members who need access should be added to the repository.

Recommended access levels:

- **Read access:** for team members who only need to download or back up the website.
- **Write access:** for team members who may need to edit the website.
- **Admin access:** only for trusted people who may need to manage settings, deployment, or collaborators.

Important:
If images or large assets are stored locally but were not pushed to GitHub, the GitHub version may not contain the complete website. In that case, use the full local website folder backup.

---

### 3. Third backup: cPanel live website files

The live site files are stored in cPanel, usually in:

```text
public_html
```

A ZIP backup of `public_html` can be downloaded from cPanel File Manager as an emergency backup.

---

## Recommended Shared Backup Folder

The team should maintain a shared HobbyCon backup folder.

Suggested structure:

```text
HobbyCon Website Backup
├── Latest Full Website Folder Backup
├── GitHub Repository Link
├── cPanel / Hosting Notes
├── Domain / DNS Notes
├── Website Email Notes
├── Formspree Notes
├── Stripe / Ticket Link Notes
├── Brand Files
├── Canva / Adobe Source Files
├── Website Images
├── PDFs and Flyers
└── Emergency Restore Instructions
```

The most important folder is:

```text
Latest Full Website Folder Backup
```

That folder should contain the full website exactly as it exists locally.

---

## How to Create a Backup

Before making major changes:

1. Find the current local HobbyCon website folder.
2. Duplicate the entire folder.
3. Make sure the copy includes all image and asset folders.
4. Rename the backup with the date.

Example:

```text
hobbycon-website-backup-2026-06-17
```

5. Compress the folder into a `.zip`.
6. Upload the ZIP to the shared HobbyCon backup folder.
7. Confirm the ZIP can be opened and contains the full website structure.

Do not rename internal folders such as `images`, `assets`, `js`, `pdfs`, or `flyers` unless the website code is also updated.

---

## How to Check That the Backup Is Complete

A complete website backup should include:

- homepage file, usually `index.html`
- all other page files
- CSS files
- JavaScript files
- image folders
- logo files
- flyer files
- PDF files
- any other folders used by the website

Common folders to check for:

```text
images/
assets/
img/
media/
flyers/
pdfs/
downloads/
js/
styles/
```

If the site opens but images are missing, the image paths or image folders may be missing.

---

# 🚨 Emergency Restore Instructions

Use these instructions if the website needs to be restored or if the main website manager is unavailable.

---

## Emergency Option 1: Use the Local Website Folder Backup

Use this option if the team has access to the latest full local website folder backup.

### Steps

1. Find the latest full HobbyCon website folder backup.
2. Download the entire folder.
3. Make a duplicate copy before editing anything.
4. Open the folder and check that it contains:
   - `index.html`
   - page files
   - image folders
   - asset folders
   - JavaScript files
   - PDFs or flyers, if used

5. Open `index.html` in a browser to preview the site locally.
6. If the website looks correct, use this folder to restore or update the site.

Important:
Do not edit the only backup copy. Always duplicate the folder first.

---

## Emergency Option 2: Download the Website from GitHub

Use this option if the team has GitHub access.

### Steps

1. Go to:

```text
https://github.com/kparrish33/hobby-con
```

2. Click the green **Code** button.
3. Choose **Download ZIP**.
4. Save the ZIP file to your computer.
5. Unzip the folder.
6. Open `index.html` to view the site locally.
7. Confirm that the image and asset folders are included.

Important:
After downloading from GitHub, confirm that the image and asset folders are included. If they are missing, use the local website folder backup instead.

---

## Emergency Option 3: Restore Through cPanel Git Version Control

Use this option if GitHub is available and the cPanel Git connection is still working.

### Steps

1. Log into GoDaddy / cPanel.
2. Open **Git Version Control**.
3. Find the HobbyCon website repository.
4. Click **Update from Remote**.
5. Confirm the live site updates correctly.
6. Visit:

```text
https://hobbycon.com
```

7. Test the website.

---

## Emergency Option 4: Restore by Uploading the Backup Folder to cPanel

Use this option if GitHub is unavailable, the cPanel Git connection is broken, or the team needs to manually restore the site.

### Steps

1. Find the latest full HobbyCon website backup folder.
2. Compress the full website folder into a `.zip` file.
3. Log into GoDaddy / cPanel.
4. Open **File Manager**.
5. Go to:

```text
public_html
```

6. Upload the website backup ZIP.
7. Extract the ZIP inside `public_html`.
8. Make sure `index.html` is directly inside `public_html`.

Correct structure:

```text
public_html/index.html
public_html/images/
public_html/assets/
public_html/js/
```

Incorrect structure:

```text
public_html/hobbycon-website-backup/index.html
public_html/hobbycon-website-backup/images/
public_html/hobbycon-website-backup/assets/
```

If the files are inside an extra folder, move them up into `public_html`.

The homepage file must be here:

```text
public_html/index.html
```

not here:

```text
public_html/some-folder/index.html
```

---

## What to Test After Restoring the Website

After restoring or updating the website, test:

- homepage
- all navigation links
- images and logos
- flyers and PDFs
- contact forms
- vendor forms
- signup forms
- ticket buttons
- Stripe payment links
- mobile layout
- desktop layout
- footer links
- social media links

If images are missing, check that the image folders were uploaded and that the folder names were not changed.

If forms are not working, check the Formspree endpoint URLs and confirm the Formspree account is active.

If ticket buttons are not working, check the Stripe Payment Links.

---

## Simple Emergency Instructions

If the website needs to be restored quickly:

1. Find the latest full local HobbyCon website folder backup.
2. Confirm that it includes the image and asset folders.
3. Log into GoDaddy / cPanel.
4. Open **File Manager**.
5. Go to `public_html`.
6. Upload the website files or ZIP backup.
7. Extract the ZIP if needed.
8. Make sure `index.html` is directly inside `public_html`.
9. Visit `https://hobbycon.com`.
10. Test pages, images, forms, and buttons.

The most important thing is to keep the full website folder together. The image folders and asset folders are required for the website to display correctly.

---

## Current Workflow Summary

The website is edited locally, saved in GitHub, and deployed through cPanel.

The normal workflow is:

```text
Local HobbyCon Website Folder
→ GitHub Repository
→ cPanel public_html
→ hobbycon.com
```

If something happens, the team should use either:

1. the latest full local website folder backup, or
2. the GitHub repository, or
3. the live cPanel files in `public_html`

to recover the site.

---

## 🧑‍💻 Contributors

Primary Maintainer: HobbyCon website manager

Organization: HobbyCon

---

## 🛡 License

© HobbyCon. All rights reserved.
