import crypto from 'crypto';
import { SiteSettings } from '@/models/Settings';

interface SocialMediaPost {
    title: string;
    url: string;
    imageUrl?: string;
    videoUrl?: string;
}

interface TwitterCredentials {
    apiKey: string;
    apiSecret: string;
    accessToken: string;
    accessTokenSecret: string;
}

// Helper to encode parameters for OAuth 1.0a signature
function percentEncode(str: string): string {
    return encodeURIComponent(str)
        .replace(/!/g, '%21')
        .replace(/'/g, '%27')
        .replace(/\(/g, '%28')
        .replace(/\)/g, '%29')
        .replace(/\*/g, '%2A');
}

// Generate OAuth 1.0a Header
function getTwitterAuthHeader(
    method: string,
    url: string,
    credentials: TwitterCredentials,
    params: Record<string, string> = {}
): string {
    const { apiKey, apiSecret, accessToken, accessTokenSecret } = credentials;

    const oauthParams: Record<string, string> = {
        oauth_consumer_key: apiKey,
        oauth_nonce: crypto.randomBytes(16).toString('hex'),
        oauth_signature_method: 'HMAC-SHA1',
        oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
        oauth_token: accessToken,
        oauth_version: '1.0',
        ...params
    };

    // Create Signature Base String
    const sortedKeys = Object.keys(oauthParams).sort();
    const paramString = sortedKeys
        .map(key => `${percentEncode(key)}=${percentEncode(oauthParams[key])}`)
        .join('&');

    const signatureBaseString = `${method.toUpperCase()}&${percentEncode(url)}&${percentEncode(paramString)}`;
    const signingKey = `${percentEncode(apiSecret)}&${percentEncode(accessTokenSecret)}`;

    const signature = crypto
        .createHmac('sha1', signingKey)
        .update(signatureBaseString)
        .digest('base64');

    oauthParams.oauth_signature = signature;

    // Construct Header
    const authHeader = 'OAuth ' + Object.keys(oauthParams)
        .sort()
        .map(key => `${percentEncode(key)}="${percentEncode(oauthParams[key])}"`)
        .join(', ');

    return authHeader;
}

export async function postToTwitter(post: SocialMediaPost, settings: SiteSettings['socialMedia']['twitter']) {
    if (!settings.enabled || !settings.apiKey) return;

    const endpoint = 'https://api.twitter.com/2/tweets';

    // We post just text with the link. Twitter will render the card.
    const tweetText = `${post.title}\n${post.url}`;
    const body = { text: tweetText };

    const authHeader = getTwitterAuthHeader('POST', endpoint, settings);

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('Twitter Post Error:', error);
            return { success: false, error };
        }

        return { success: true, data: await response.json() };
    } catch (error) {
        console.error('Twitter Post Exception:', error);
        return { success: false, error };
    }
}

export async function postToFacebook(post: SocialMediaPost, settings: SiteSettings['socialMedia']['facebook']) {
    if (!settings.enabled || !settings.pageAccessToken) return;

    // Post to Feed as a link
    const endpoint = `https://graph.facebook.com/v19.0/${settings.pageId}/feed`;

    const params = new URLSearchParams({
        message: post.title,
        link: post.url,
        access_token: settings.pageAccessToken
    });

    try {
        const response = await fetch(`${endpoint}?${params.toString()}`, {
            method: 'POST'
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('Facebook Post Error:', error);
            return { success: false, error };
        }

        return { success: true, data: await response.json() };
    } catch (error) {
        console.error('Facebook Post Exception:', error);
        return { success: false, error };
    }
}

export async function postToInstagram(post: SocialMediaPost, settings: SiteSettings['socialMedia']['instagram']) {
    if (!settings.enabled || !settings.accessToken || !post.imageUrl) return;

    // Instagram requires an image.
    // Step 1: Create Container
    const createEndpoint = `https://graph.facebook.com/v19.0/${settings.accountId}/media`;

    try {
        const createParams = new URLSearchParams({
            image_url: post.imageUrl,
            caption: `${post.title}\n${post.url}`,
            access_token: settings.accessToken
        });

        const createRes = await fetch(`${createEndpoint}?${createParams.toString()}`, { method: 'POST' });

        if (!createRes.ok) {
            const error = await createRes.text();
            console.error('Instagram Create Container Error:', error);
            return { success: false, error };
        }

        const createData = await createRes.json();
        const creationId = createData.id;

        // Step 2: Publish Container
        const publishEndpoint = `https://graph.facebook.com/v19.0/${settings.accountId}/media_publish`;
        const publishParams = new URLSearchParams({
            creation_id: creationId,
            access_token: settings.accessToken
        });

        const publishRes = await fetch(`${publishEndpoint}?${publishParams.toString()}`, { method: 'POST' });

        if (!publishRes.ok) {
            const error = await publishRes.text();
            console.error('Instagram Publish Error:', error);
            return { success: false, error };
        }

        return { success: true, data: await publishRes.json() };

    } catch (error) {
        console.error('Instagram Post Exception:', error);
        return { success: false, error };
    }
}

export async function postToFacebookReel(post: SocialMediaPost, settings: SiteSettings['socialMedia']['facebook']) {
    if (!settings.enabled || !settings.pageAccessToken || !post.videoUrl) return;

    const endpoint = `https://graph.facebook.com/v19.0/${settings.pageId}/video_reels`;

    const params = new URLSearchParams({
        video_url: post.videoUrl,
        description: `${post.title}\n${post.url}`,
        access_token: settings.pageAccessToken
    });

    try {
        const response = await fetch(`${endpoint}?${params.toString()}`, {
            method: 'POST'
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('Facebook Reel Post Error:', error);
            return { success: false, error };
        }

        return { success: true, data: await response.json() };
    } catch (error) {
        console.error('Facebook Reel Post Exception:', error);
        return { success: false, error };
    }
}

export async function postToYouTube(post: SocialMediaPost, settings: SiteSettings['socialMedia']['youtube']) {
    if (!settings.enabled || !settings.refreshToken || !post.videoUrl) return;

    try {
        // Step 1: Exchange refresh token for access token
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: settings.clientId,
                client_secret: settings.clientSecret,
                refresh_token: settings.refreshToken,
                grant_type: 'refresh_token'
            })
        });

        if (!tokenResponse.ok) {
            const error = await tokenResponse.text();
            console.error('YouTube Token Refresh Error:', error);
            return { success: false, error };
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        // Step 2: Download the video file
        const videoResponse = await fetch(post.videoUrl);
        if (!videoResponse.ok) {
            return { success: false, error: 'Failed to download video from URL' };
        }

        const videoBuffer = await videoResponse.arrayBuffer();
        const videoSize = videoBuffer.byteLength;

        // Step 3: Initiate resumable upload session
        const metadata = {
            snippet: {
                title: post.title,
                description: `${post.title}\n\n${post.url}\n\n#Shorts`,
                tags: ['Shorts', 'news']
            },
            status: {
                privacyStatus: 'public',
                selfDeclaredMadeForKids: false
            }
        };

        const initiateResponse = await fetch(
            'https://www.googleapis.com/upload/youtube/v3/videos?part=snippet,status&uploadType=resumable',
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'X-Upload-Content-Type': 'video/*',
                    'X-Upload-Content-Length': videoSize.toString()
                },
                body: JSON.stringify(metadata)
            }
        );

        if (!initiateResponse.ok) {
            const error = await initiateResponse.text();
            console.error('YouTube Upload Init Error:', error);
            return { success: false, error };
        }

        const uploadUrl = initiateResponse.headers.get('Location');
        if (!uploadUrl) {
            return { success: false, error: 'No upload URL returned' };
        }

        // Step 4: Upload the video binary
        const uploadResponse = await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': 'video/*',
                'Content-Length': videoSize.toString()
            },
            body: videoBuffer
        });

        if (!uploadResponse.ok) {
            const error = await uploadResponse.text();
            console.error('YouTube Upload Error:', error);
            return { success: false, error };
        }

        const uploadData = await uploadResponse.json();

        return { success: true, data: uploadData };
    } catch (error) {
        console.error('YouTube Post Exception:', error);
        return { success: false, error };
    }
}
