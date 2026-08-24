# Naukri Profile Automation

Keep your [Naukri.com](https://www.naukri.com) profile active from **India** via an **AWS Lambda in Mumbai**, scheduled by **GitHub Actions**.

Based on [Prateek-Wayne/naukri-resume-action](https://github.com/Prateek-Wayne/naukri-resume-action).

## Architecture

```
GitHub Actions (cron / manual)
        │  aws lambda invoke
        ▼
Lambda ap-south-1 (Mumbai)  ← Naukri login + resume upload
        ▼
     Naukri APIs
```

GitHub only triggers the job. All Naukri traffic comes from Mumbai.

## Prerequisites

1. AWS account + [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) + [SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)
2. Resume PDF in `resumes/`
3. Naukri credentials + [profile ID](https://github.com/Prateek-Wayne/naukri-resume-action#finding-your-profile-id-)
4. Edit `config/profile.json` (summary ≥ 50 chars, headline ≤ 250)

## 1. Deploy Lambda (Mumbai)

```bash
npm install
# Put your resume PDF in resumes/
sam build
sam deploy --guided --region ap-south-1
```

When prompted, set:

| Parameter | Value |
|-----------|--------|
| Stack name | `naukri-profile-updater` |
| Region | **`ap-south-1`** (required) |
| NaukriUsername / Password / ProfileId | your credentials |
| Confirm IAM role creation | Yes |

Optional: copy `samconfig.toml.example` → `samconfig.toml` after the first guided deploy.

### Test Lambda once

```bash
aws lambda invoke \
  --function-name naukri-profile-updater \
  --region ap-south-1 \
  --cli-binary-format raw-in-base64-out \
  --payload '{"dryRun":false}' \
  /tmp/out.json && cat /tmp/out.json
```

If login fails from Lambda, Naukri may be blocking AWS IPs — fall back to local `npm run update`.

## 2. GitHub Actions → invoke Lambda

### Create an IAM user for GitHub (least privilege)

1. IAM → Users → Create user (e.g. `github-naukri-invoker`)
2. Attach an inline policy from `docs/github-actions-iam-policy.json` (replace `ACCOUNT_ID`)
3. Create access keys

### Add repo secrets

**Settings → Secrets and variables → Actions:**

| Secret | Value |
|--------|--------|
| `AWS_ACCESS_KEY_ID` | from the IAM user |
| `AWS_SECRET_ACCESS_KEY` | from the IAM user |

### Run

- Automatic: daily **9:00 AM IST**
- Manual: Actions → **Invoke Naukri Lambda** → Run workflow (optional dry run)

## Local testing (optional)

```bash
cp .env.example .env   # fill credentials
npm install
npm run update:dry-run
npm run update
```

## Project layout

```
naukri-automation/
├── lambda/handler.js              # Lambda entrypoint
├── src/runUpdate.js               # Shared Naukri update logic
├── src/api/                       # Login, upload, profile APIs
├── config/profile.json
├── resumes/                       # Bundled into Lambda zip
├── template.yaml                  # SAM (ap-south-1)
└── .github/workflows/             # Invokes Lambda only
```

## Cost

Daily invoke ≈ free under AWS Lambda free tier. No EventBridge needed.

## Security

- Never commit `.env` or `samconfig.toml` with real passwords
- GitHub IAM user should only have `lambda:InvokeFunction`
- Naukri password lives in Lambda env (set at `sam deploy` time)
