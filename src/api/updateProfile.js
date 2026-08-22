import axios from 'axios';
import { uploadFileHeader } from '../utils/headers.js';
import { profileCompleteUrl, profileFetchUrl } from '../utils/constants.js';

export const updateProfileSummary = async (
  cookieHeader,
  profileId,
  summary,
  fullPayload
) => {
  try {
    let data = fullPayload;

    if (!fullPayload) {
      console.log('Fetching current profile data...');

      try {
        const getHeaders = {
          ...uploadFileHeader(cookieHeader),
          'content-type': 'application/json',
          'x-requested-with': 'XMLHttpRequest',
          appid: '801',
          systemid: '90',
          authorization: `Bearer ${cookieHeader.nauk_at}`
        };

        const profileResp = await axios.get(profileFetchUrl, {
          headers: getHeaders
        });

        if (profileResp.status === 200 && profileResp.data) {
          console.log('Profile data fetched successfully');

          const personalDetails =
            profileResp.data.jobseekerData?.resumeMakerPersonalDetails;

          if (personalDetails) {
            const { uploadPhoto: _uploadPhoto, ...cleanPersonalDetails } =
              personalDetails;

            data = {
              jobseekerData: {
                resumeMakerPersonalDetails: {
                  ...cleanPersonalDetails,
                  summary,
                  profileId
                }
              }
            };
          } else {
            data = {
              jobseekerData: {
                resumeMakerPersonalDetails: {
                  summary,
                  profileId
                }
              }
            };
          }
        } else {
          data = {
            jobseekerData: {
              resumeMakerPersonalDetails: {
                summary,
                profileId
              }
            }
          };
        }
      } catch (fetchErr) {
        console.warn('Profile fetch failed, using minimal payload:', fetchErr.message);
        data = {
          jobseekerData: {
            resumeMakerPersonalDetails: {
              summary,
              profileId
            }
          }
        };
      }
    }

    const updateHeaders = {
      ...uploadFileHeader(cookieHeader),
      'content-type': 'application/json',
      'x-http-method-override': 'PUT',
      'x-requested-with': 'XMLHttpRequest',
      appid: '801',
      systemid: '90',
      authorization: `Bearer ${cookieHeader.nauk_at}`
    };

    console.log('Updating profile summary...');

    const resp = await axios.post(profileCompleteUrl, data, {
      headers: updateHeaders
    });

    if (resp.status !== 200) {
      console.error('Profile update failed:', resp.status, resp.data);
      return false;
    }

    console.log('Profile summary updated successfully!');
    return true;
  } catch (error) {
    if (error.response) {
      console.error(
        'Error in updateProfileSummary:',
        error.response.status,
        error.response.data
      );
    } else {
      console.error('Error in updateProfileSummary:', error.message);
    }
    return false;
  }
};
