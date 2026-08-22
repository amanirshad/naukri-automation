import axios from 'axios';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import { uploadFileHeader } from '../utils/headers.js';
import { resumeUpdateUrl, resumeUploadUrl } from '../utils/constants.js';

export const uploadResume = async (cookieHeader, resumePath, profileId) => {
  try {
    const formKey = 'F51f8e7e54e205';
    const fileKey = 'UyFNbCXtBHdkXQ';
    const uploadCallback = 'true';
    const fileName = path.basename(resumePath);

    const formData = new FormData();
    formData.append('formKey', formKey);
    formData.append('fileName', fileName);
    formData.append('uploadCallback', uploadCallback);
    formData.append('fileKey', fileKey);

    const fileBuffer = fs.readFileSync(resumePath);
    formData.append('file', fileBuffer, {
      filename: fileName,
      contentType: 'application/pdf'
    });

    const uploadHeaders = uploadFileHeader(cookieHeader);

    console.log('Uploading file...');

    const uploadResponse = await axios.post(resumeUploadUrl, formData, {
      headers: uploadHeaders
    });

    if (uploadResponse.status !== 200) {
      console.error(
        'File upload failed:',
        uploadResponse.status,
        uploadResponse.data
      );
      return false;
    }

    console.log('File uploaded successfully!');

    const updateResumeUrl = resumeUpdateUrl(profileId);

    const updateHeaders = {
      ...uploadFileHeader(cookieHeader),
      'content-type': 'application/json',
      'x-http-method-override': 'PUT',
      'x-requested-with': 'XMLHttpRequest',
      appid: '105',
      systemid: '105',
      authorization: `Bearer ${cookieHeader.nauk_at}`
    };

    const updateData = {
      textCV: {
        formKey,
        fileKey,
        textCvContent: ''
      }
    };

    console.log('Updating resume on profile...');

    const updateResponse = await axios.post(updateResumeUrl, updateData, {
      headers: updateHeaders
    });

    if (updateResponse.status !== 200) {
      console.error(
        'Resume update failed:',
        updateResponse.status,
        updateResponse.data
      );
      return false;
    }

    console.log('Resume updated successfully!');
    return true;
  } catch (error) {
    console.error('Error in uploadResume:', error.message);
    return false;
  }
};
