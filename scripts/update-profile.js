#!/usr/bin/env node

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { login } from '../src/api/login.js';
import { uploadResume } from '../src/api/uploadResume.js';
import { updateProfileSummary } from '../src/api/updateProfile.js';
import { updateResumeHeadline } from '../src/api/updateResumeHeadline.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

const dryRun = process.argv.includes('--dry-run');

function loadProfileConfig() {
  const configPath = path.join(rootDir, 'config', 'profile.json');
  if (!fs.existsSync(configPath)) {
    return { profile_summary: '', resume_headline: '' };
  }
  return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
}

function findResumeFiles() {
  const resumesDir = path.join(rootDir, 'resumes');
  if (!fs.existsSync(resumesDir)) {
    return [];
  }

  const extensions = ['.pdf', '.doc', '.docx'];
  return fs
    .readdirSync(resumesDir)
    .filter((file) => extensions.some((ext) => file.toLowerCase().endsWith(ext)))
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

async function main() {
  const username = process.env.NAUKRI_USERNAME;
  const password = process.env.NAUKRI_PASSWORD;
  const profileId = process.env.NAUKRI_PROFILE_ID;

  if (!username || !password || !profileId) {
    console.error(
      'Missing credentials. Copy .env.example to .env and set NAUKRI_USERNAME, NAUKRI_PASSWORD, and NAUKRI_PROFILE_ID.'
    );
    process.exit(1);
  }

  const resumePaths = findResumeFiles();
  if (resumePaths.length === 0) {
    console.error(
      'No resume files found. Add at least one PDF/DOC/DOCX to the resumes/ folder.'
    );
    process.exit(1);
  }

  const selectedResume = selectResumeByDate(resumePaths);
  const { profile_summary: profileSummary, resume_headline: resumeHeadline } =
    loadProfileConfig();

  console.log('Naukri Profile Updater');
  console.log('----------------------');
  console.log(`Selected resume: ${path.basename(selectedResume)}`);
  console.log(`Resume pool: ${resumePaths.length} file(s)`);

  if (dryRun) {
    console.log('\nDry run — no changes will be made.');
    console.log(`Would upload: ${selectedResume}`);
    if (profileSummary) console.log('Would update profile summary');
    if (resumeHeadline) console.log(`Would update headline: ${resumeHeadline}`);
    return;
  }

  console.log('\nLogging in to Naukri.com...');
  const cookies = await login(username, password);

  if (!cookies) {
    console.error('Login failed. Check your credentials.');
    process.exit(1);
  }

  console.log('Login successful.');

  if (profileSummary) {
    if (profileSummary.trim().length < 50) {
      console.warn(
        `Profile summary too short (${profileSummary.trim().length} chars, min 50). Skipping.`
      );
    } else {
      const summaryWithTimestamp = `${profileSummary} ${Date.now()}`;
      await updateProfileSummary(cookies, profileId, summaryWithTimestamp);
    }
  }

  if (resumeHeadline) {
    if (resumeHeadline.trim().length > 250) {
      console.warn(
        `Resume headline too long (${resumeHeadline.trim().length} chars, max 250). Skipping.`
      );
    } else {
      await updateResumeHeadline(cookies, profileId, resumeHeadline.trim());
    }
  }

  console.log('\nUploading resume...');
  const success = await uploadResume(cookies, selectedResume, profileId);

  if (success) {
    console.log('\nDone! Your Naukri profile has been updated.');
  } else {
    console.error('\nResume upload failed.');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
