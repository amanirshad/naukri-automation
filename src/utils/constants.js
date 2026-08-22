export const loginUrl =
  'https://www.naukri.com/central-login-services/v1/login';

export const resumeUploadUrl = 'https://filevalidation.naukri.com/file';

export const resumeUpdateUrl = (profileId) =>
  `https://www.naukri.com/cloudgateway-mynaukri/resman-aggregator-services/v0/users/self/profiles/${profileId}/advResume`;

export const profileCompleteUrl =
  'https://www.naukri.com/cloudgateway-ncjobseeker/fn-jobseeker-profile-services/v0/users/self/profile-complete?flowId=mobile-mnj';

export const profileFetchUrl = profileCompleteUrl;

export const resumeHeadlineUrl =
  'https://www.naukri.com/cloudgateway-mynaukri/resman-aggregator-services/v1/users/self/fullprofiles';
