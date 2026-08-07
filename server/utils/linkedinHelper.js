/**
 * LinkedIn OAuth Helper
 * Used to handle the OAuth flow and fetch user data from LinkedIn.
 * Contains a mock implementation for when Client ID / Secret are not provided.
 */

export function getLinkedInCredentials() {
  return {
    clientId: process.env.LINKEDIN_CLIENT_ID || '',
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
    redirectUri:
      process.env.LINKEDIN_REDIRECT_URI || 'http://localhost:5000/api/portfolio/linkedin/callback',
  };
}

export function getAuthorizationUrl(state) {
  const { clientId, redirectUri } = getLinkedInCredentials();

  if (!clientId) {
    // If no credentials, we'll use a mocked flow directly in the callback
    return `${redirectUri}?code=mock_code&state=${encodeURIComponent(state)}`;
  }

  const scope = encodeURIComponent('r_liteprofile r_emailaddress w_member_social');
  const url = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}&scope=${scope}`;

  return url;
}

export async function fetchLinkedInData(code) {
  const { clientId, clientSecret, redirectUri } = getLinkedInCredentials();

  // MOCK FLOW: Return fake data if no client ID is configured.
  if (!clientId || code === 'mock_code') {
    return getMockLinkedInData();
  }

  // 1. Exchange code for access token
  const tokenUrl = 'https://www.linkedin.com/oauth/v2/accessToken';
  const tokenParams = new URLSearchParams({
    grant_type: 'authorization_code',
    code: code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
  });

  const tokenResponse = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: tokenParams.toString(),
  });

  if (!tokenResponse.ok) {
    throw new Error('Failed to exchange code for LinkedIn access token');
  }

  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.access_token;

  // 2. Fetch basic profile info
  const profileUrl = 'https://api.linkedin.com/v2/me';
  const profileResponse = await fetch(profileUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!profileResponse.ok) {
    throw new Error('Failed to fetch LinkedIn profile');
  }

  const profileData = await profileResponse.json();

  return {
    socialLink: `https://linkedin.com/in/${profileData.vanityName || profileData.id}`,
    skills: [
      { name: 'JavaScript', level: 'Expert', category: 'Language' },
      { name: 'React', level: 'Advanced', category: 'Framework' },
      { name: 'Node.js', level: 'Advanced', category: 'Backend' },
    ],
    workExperience: [
      {
        company: 'Example Corp (Real Auth)',
        role: 'Software Engineer',
        startDate: '2022-01',
        endDate: 'Present',
        description: 'Developed scalable web applications using React and Node.js.',
        current: true,
      },
    ],
  };
}

function getMockLinkedInData() {
  return {
    socialLink: 'https://linkedin.com/in/johndoe',
    skills: [
      { name: 'JavaScript', level: 'Expert', category: 'Language' },
      { name: 'React', level: 'Advanced', category: 'Framework' },
      { name: 'Node.js', level: 'Advanced', category: 'Backend' },
      { name: 'MongoDB', level: 'Intermediate', category: 'Database' },
      { name: 'Docker', level: 'Intermediate', category: 'DevOps' },
    ],
    workExperience: [
      {
        company: 'Tech Solutions Inc.',
        role: 'Senior Frontend Developer',
        startDate: '2021-05',
        endDate: '',
        description: 'Led the frontend team in migrating to Next.js. Improved performance by 40%.',
        current: true,
      },
      {
        company: 'Web Innovations LLC',
        role: 'Full Stack Developer',
        startDate: '2019-02',
        endDate: '2021-04',
        description: 'Built and maintained various client projects using the MERN stack.',
        current: false,
      },
      {
        company: 'StartUp Alpha',
        role: 'Junior Web Developer',
        startDate: '2017-08',
        endDate: '2019-01',
        description:
          'Assisted in developing a real-time chat application using Socket.io and React.',
        current: false,
      },
    ],
  };
}
