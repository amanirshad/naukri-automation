import axios from 'axios';
import { uploadFileHeader } from '../utils/headers.js';
import { resumeHeadlineUrl } from '../utils/constants.js';

export const updateResumeHeadline = async (
  cookieHeader,
  profileId,
  headline
) => {
  try {
    const headers = {
      ...uploadFileHeader(cookieHeader),
      'content-type': 'application/json',
      'x-http-method-override': 'PUT',
      'x-requested-with': 'XMLHttpRequest',
      appid: '105',
      systemid: 'Naukri',
      clientid: 'd3skt0p',
      authorization: `Bearer ${cookieHeader.nauk_at}`
    };

    const data = {
      profile: {
        resumeHeadline: headline
      },
      profileId
    };

    console.log('Updating resume headline...');

    const resp = await axios.post(resumeHeadlineUrl, data, { headers });

    if (resp.status !== 200) {
      console.error('Headline update failed:', resp.status, resp.data);
      return false;
    }

    console.log('Resume headline updated successfully!');
    return true;
  } catch (error) {
    if (error.response) {
      console.error(
        'Error in updateResumeHeadline:',
        error.response.status,
        error.response.data
      );
    } else {
      console.error('Error in updateResumeHeadline:', error.message);
    }
    return false;
  }
};
