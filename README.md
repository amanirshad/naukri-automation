# Naukri Profile Automation

Automatically keep your [Naukri.com](https://www.naukri.com) profile active by uploading resumes and refreshing your profile summary — based on [Prateek-Wayne/naukri-resume-action](https://github.com/Prateek-Wayne/naukri-resume-action).

## What it does

- Uploads a resume (rotates if you have multiple)
- Updates your profile summary (adds a timestamp to keep it "fresh")
- Updates your resume headline
- Can run locally on your Mac or via GitHub Actions

## Quick start (local — recommended)

Since you're in India, running locally on your Mac is the simplest option. No self-hosted runner needed.

### 1. Install dependencies

```bash
cd naukri-automation
npm install
```

### 2. Configure credentials

```bash
cp .env.example .env
```

Edit `.env` with your Naukri credentials:

| Variable | Description |
|----------|-------------|
| `NAUKRI_USERNAME` | Your Naukri login email |
| `NAUKRI_PASSWORD` | Your Naukri password |
| `NAUKRI_PROFILE_ID` | Your Naukri profile ID (see below) |

### 3. Find your Profile ID

1. Log in to [naukri.com](https://www.naukri.com)
2. Go to **My Profile** → **View & Edit Profile**
3. Open browser DevTools (F12) → **Network** tab
4. Refresh the page and look for API calls containing your `profileId`

Video guide in the [original repo README](https://github.com/Prateek-Wayne/naukri-resume-action#finding-your-profile-id-).

### 4. Add your resume

Place one or more resume files in `resumes/`:

```bash
cp ~/Downloads/MyResume.pdf resumes/
```

Supported formats: PDF, DOC, DOCX

### 5. Customize profile text

Edit `config/profile.json`:

```json
{
  "profile_summary": "Your summary (minimum 50 characters)...",
  "resume_headline": "Software Engineer | Full Stack Developer"
}
```

### 6. Run

```bash
# Dry run (no API calls)
npm run update:dry-run

# Actually update your profile
npm run update
```

## Schedule daily updates (macOS)

To run automatically every day at 9 AM:

1. Copy and edit the launchd plist:

```bash
cp launchd/com.naukri.profile-update.plist.example ~/Library/LaunchAgents/com.naukri.profile-update.plist
```

2. Update `WorkingDirectory` in the plist to match your project path
3. Load the job:

```bash
launchctl load ~/Library/LaunchAgents/com.naukri.profile-update.plist
```

Logs are written to `/tmp/naukri-update.log`.

## GitHub Actions (optional)

GitHub-hosted runners in US/EU **cannot** reach Naukri APIs. You need a **self-hosted runner** in India (e.g. AWS EC2 Mumbai, or your own machine).

### Setup

1. Push this repo to GitHub
2. Add secrets under **Settings → Secrets and variables → Actions**:
   - `NAUKRI_USERNAME`
   - `NAUKRI_PASSWORD`
   - `NAUKRI_PROFILE_ID`
3. Add repository variables (optional):
   - `NAUKRI_PROFILE_SUMMARY`
   - `NAUKRI_RESUME_HEADLINE`
4. [Register a self-hosted runner](https://docs.github.com/en/actions/hosting-your-own-runners/managing-self-hosted-runners/adding-self-hosted-runners) on a machine in India
5. The workflow runs daily at 9 AM IST, or trigger manually from the Actions tab

## Project structure

```
naukri-automation/
├── config/profile.json       # Profile summary & headline
├── resumes/                  # Your resume file(s)
├── scripts/update-profile.js # Local runner
├── src/api/                  # Naukri API client
├── .github/workflows/        # GitHub Actions workflow
└── .env                      # Credentials (not committed)
```

## Security

- Never commit `.env` or credentials
- Use GitHub Secrets for Actions
- Consider using a dedicated Naukri password or app-specific credentials

## Credits

Built on [Prateek-Wayne/naukri-resume-action](https://github.com/Prateek-Wayne/naukri-resume-action).
