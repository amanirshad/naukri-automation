import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { login } from './api/login.js';
import { uploadResume } from './api/uploadResume.js';
import { updateProfileSummary } from './api/updateProfile.js';
import { updateResumeHeadline } from './api/updateResumeHeadline.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function resolveRootDir() {
  // Lambda packages the project root as LAMBDA_TASK_ROOT
  if (process.env.LAMBDA_TASK_ROOT) {
    return process.env.LAMBDA_TASK_ROOT;
  }
  return path.join(__dirname, '..');
}

function loadProfileConfig(rootDir) {
  const fromEnv = {
    profile_summary: process.env.NAUKRI_PROFILE_SUMMARY || '',
    resume_headline: process.env.NAUKRI_RESUME_HEADLINE || ''
  };

  const configPath = path.join(rootDir, 'config', 'profile.json');
  if (!fs.existsSync(configPath)) {
    return fromEnv;
  }

  const fileConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  return {
    profile_summary: fromEnv.profile_summary || fileConfig.profile_summary || '',
    resume_headline: fromEnv.resume_headline || fileConfig.resume_headline || ''
  };
}

function findResumeFiles(rootDir) {
  const resumesDir = path.join(rootDir, 'resumes');
  if (!fs.existsSync(resumesDir)) {
    return [];
  }

  const extensions = ['.pdf', '.doc', '.docx'];
  return fs
    .readdirSync(resumesDir)
    .filter((file) =>
      extensions.some((ext) => file.toLowerCase().endsWith(ext))
    )
    .map((file) => path.join(resumesDir, file));
}

function selectResumeByDate(resumePaths) {
  const today = new Date();
  const dayOfMonth = today.getDate();
  const dayOfWeek = today.getDay();
  const month = today.getMonth();
  const selectionFactor =
    (dayOfMonth + dayOfWeek * 5 + month * 31) % resumePaths.length;
  return resumePaths[selectionFactor];
}

/**
 * Core Naukri update flow — used by local CLI and Mumbai Lambda.
 * @param {{ dryRun?: boolean }} options
 */
export async function runUpdate(options = {}) {
  const { dryRun = false } = options;
  const rootDir = resolveRootDir();

  const username = process.env.NAUKRI_USERNAME;
  const password = process.env.NAUKRI_PASSWORD;
  const profileId = process.env.NAUKRI_PROFILE_ID;

  if (!username || !password || !profileId) {
    throw new Error(
      'Missing NAUKRI_USERNAME, NAUKRI_PASSWORD, or NAUKRI_PROFILE_ID'
    );
  }

  const resumePaths = findResumeFiles(rootDir);
  if (resumePaths.length === 0) {
    throw new Error(
      'No resume files found. Add at least one PDF/DOC/DOCX to resumes/ and redeploy.'
    );
  }

  const selectedResume = selectResumeByDate(resumePaths);
  const { profile_summary: profileSummary, resume_headline: resumeHeadline } =
    loadProfileConfig(rootDir);

  const result = {
    success: false,
    dryRun,
    selectedResume: path.basename(selectedResume),
    resumePoolSize: resumePaths.length,
    profileSummaryUpdated: false,
    resumeHeadlineUpdated: false,
    resumeUploaded: false,
    message: ''
  };

  console.log('Naukri Profile Updater');
  console.log('----------------------');
  console.log(`Selected resume: ${result.selectedResume}`);
  console.log(`Resume pool: ${result.resumePoolSize} file(s)`);

  if (dryRun) {
    result.success = true;
    result.message = 'Dry run — no changes made';
    console.log(result.message);
    return result;
  }

  console.log('Logging in to Naukri.com...');
  const cookies = await login(username, password);

  if (!cookies) {
    throw new Error('Login failed. Check credentials or Naukri IP restrictions.');
  }

  console.log('Login successful.');

  if (profileSummary) {
    if (profileSummary.trim().length < 50) {
      console.warn(
        `Profile summary too short (${profileSummary.trim().length} chars, min 50). Skipping.`
      );
    } else {
      const summaryWithTimestamp = `${profileSummary} ${Date.now()}`;
      result.profileSummaryUpdated = await updateProfileSummary(
        cookies,
        profileId,
        summaryWithTimestamp
      );
    }
  }

  if (resumeHeadline) {
    if (resumeHeadline.trim().length > 250) {
      console.warn(
        `Resume headline too long (${resumeHeadline.trim().length} chars, max 250). Skipping.`
      );
    } else {
      result.resumeHeadlineUpdated = await updateResumeHeadline(
        cookies,
        profileId,
        resumeHeadline.trim()
      );
    }
  }

  console.log('Uploading resume...');
  result.resumeUploaded = await uploadResume(
    cookies,
    selectedResume,
    profileId
  );

  if (!result.resumeUploaded) {
    throw new Error('Resume upload failed');
  }

  result.success = true;
  result.message = 'Naukri profile updated successfully';
  console.log(result.message);
  return result;
}
