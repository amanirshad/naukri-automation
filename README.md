# Naukri Automation

Serverless Naukri.com profile refresher for India.

**EventBridge Scheduler** fires the Lambda every day at **9:00 AM IST**. **AWS Lambda (Mumbai)** logs in, updates your summary/headline, and re-uploads your resume — so recruiters see a recently updated profile without you doing it by hand.

GitHub Actions is optional and **manual-only** (GitHub’s cron is often delayed or skipped).

## Why this setup

| Piece | Role |
|-------|------|
| EventBridge Scheduler | Reliable daily run at 9:00 AM `Asia/Kolkata` |
| Lambda `ap-south-1` | All Naukri API calls from India |
| GitHub Actions | Optional on-demand invoke (no schedule) |

```
EventBridge Scheduler (cron 9:00 AM Asia/Kolkata)
              │
              ▼
     Lambda · Mumbai (ap-south-1)
              │
              ├── login
              ├── update profile summary
              ├── update resume headline
              └── upload resume PDF
              ▼
         Naukri.com APIs

Optional: GitHub Actions (manual) → aws lambda invoke → same Lambda
```

## Features

- Daily profile freshness at a fixed IST wall-clock time
- Resume upload with date-based rotation if you add multiple PDFs
- Configurable summary (≥ 50 chars) and headline (≤ 250 chars)
- Credentials stored as Lambda env vars; GitHub only holds AWS invoke keys (manual runs)
- Optional local CLI for debugging on your Mac

## Prerequisites

- AWS account, [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html), [SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)
- Node.js 20+
- Naukri email, password, and profile ID
- At least one resume under `resumes/` (PDF / DOC / DOCX)

### Find your Naukri profile ID

1. Log in to [naukri.com](https://www.naukri.com) → open your profile
2. DevTools → **Network**
3. Reload and inspect XHR/fetch calls to Naukri profile APIs
4. Copy the `profileId` value from the request URL or JSON body

## Configure profile text

Edit `config/profile.json`:

```json
{
  "profile_summary": "Your summary (minimum 50 characters)...",
  "resume_headline": "Your headline (maximum 250 characters)"
}
```

Redeploy Lambda after changing this file or the resume.

## Deploy (Mumbai)

```bash
npm install
# Place resume(s) in resumes/
sam build
sam deploy --guided --region ap-south-1
```

| Prompt | Value |
|--------|--------|
| Stack name | `naukri-profile-updater` |
| Region | **`ap-south-1`** |
| NaukriUsername / Password / ProfileId | your Naukri credentials |
| ScheduleEnabled | `ENABLED` (default) |
| Create IAM roles | Yes |

This deploy creates the Lambda **and** the EventBridge Scheduler rule `naukri-profile-updater-daily-9am-ist` (`cron(0 9 * * ? *)` in `Asia/Kolkata`, flexible window off).

```bash
# Smoke test
aws lambda invoke \
  --function-name naukri-profile-updater \
  --region ap-south-1 \
  --cli-binary-format raw-in-base64-out \
  --payload '{"dryRun":false}' \
  /tmp/out.json && cat /tmp/out.json
```

### Confirm the schedule

```bash
aws scheduler get-schedule \
  --name naukri-profile-updater-daily-9am-ist \
  --region ap-south-1
```

Pause without redeploying:

```bash
sam deploy --parameter-overrides ScheduleEnabled=DISABLED --region ap-south-1
```

## Optional: manual GitHub Actions

### IAM user (invoke only)

1. IAM → Users → create `github-naukri-invoker`
2. Inline policy from `docs/github-actions-iam-policy.json` (replace `ACCOUNT_ID`)
3. Create access keys

### Repo secrets

**Settings → Secrets and variables → Actions**

| Secret | Value |
|--------|--------|
| `AWS_ACCESS_KEY_ID` | IAM access key |
| `AWS_SECRET_ACCESS_KEY` | IAM secret |

### Run on demand

Actions → **Invoke Naukri Lambda** → Run workflow

## Local CLI (optional)

```bash
cp .env.example .env   # NAUKRI_USERNAME, NAUKRI_PASSWORD, NAUKRI_PROFILE_ID
npm install
npm run update:dry-run
npm run update
```

macOS launchd example: `launchd/com.naukri.profile-update.plist.example`

## Layout

```
naukri-automation/
├── lambda/handler.js           # AWS Lambda entry
├── src/runUpdate.js            # Shared update orchestration
├── src/api/                    # Naukri HTTP client
├── config/profile.json         # Summary + headline
├── resumes/                    # Packaged into the Lambda zip
├── template.yaml               # SAM · EventBridge Scheduler · ap-south-1 · arm64
├── docs/github-actions-iam-policy.json
└── .github/workflows/          # Manual invoke only
```

## Cost & security

- Typical daily use fits in the Lambda free tier; one EventBridge schedule/day is effectively free
- Never commit `.env` or a `samconfig.toml` with real passwords
- GitHub IAM principal: `lambda:InvokeFunction` only (manual runs)
- Naukri secrets live on the Lambda, set at deploy time

## License

Private / personal use unless you add a license of your own.
