import { ImageResponse } from 'next/og';
import PostModel from '@/models/Post';

export const runtime = 'nodejs';

// Image metadata
export const alt = 'News Portal Article';
export const size = {
    width: 1200,
    height: 630,
};

export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    // Fetch post directly from database (Node.js runtime)
    let post;
    try {
        post = await PostModel.findBySlug(slug);
    } catch (e) {
        console.error('Failed to fetch post for OG image:', e);
    }

    const title = post?.title || 'News Portal';
    const author = post?.author || 'News Team';
    const category = post?.category || 'News';
    const date = post?.createdAt ? new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
    const imageUrl = post?.imageUrl;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://MeroNepalTv.com';

    // Load fonts (optional, using system fonts for simplicity in this example)

    return new ImageResponse(
        (
            <div
                style={{
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    backgroundImage: imageUrl ? `url(${imageUrl.startsWith('http') ? imageUrl : siteUrl + imageUrl})` : 'linear-gradient(to bottom right, #1a202c, #2d3748)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    color: 'white',
                    padding: imageUrl ? '0px' : '60px',
                    fontFamily: 'sans-serif',
                }}
            >
                {!imageUrl && (
                    <div style={{ display: 'flex', flexDirection: 'column', zIndex: 1, width: '100%', height: '100%', justifyContent: 'space-between' }}>
                        {/* Top Bar: Category & Date */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                            <div
                                style={{
                                    backgroundColor: '#E53E3E', // Red-600
                                    color: 'white',
                                    padding: '8px 24px',
                                    borderRadius: '999px',
                                    fontSize: 24,
                                    fontWeight: 'bold',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                }}
                            >
                                {category}
                            </div>
                            {date && (
                                <div style={{ fontSize: 24, color: '#CBD5E0', fontWeight: 500 }}>
                                    {date}
                                </div>
                            )}
                        </div>

                        {/* Main Title */}
                        <div
                            style={{
                                fontSize: 64,
                                fontWeight: 900,
                                lineHeight: 1.2,
                                marginTop: '40px',
                                marginBottom: '40px',
                                background: 'linear-gradient(to right, #ffffff, #e2e8f0)',
                                backgroundClip: 'text',
                                color: 'transparent',
                                textShadow: '0 2px 10px rgba(0,0,0,0.5)',
                                display: '-webkit-box',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                            }}
                        >
                            {title}
                        </div>

                        {/* Footer: Author & Brand */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'flex-end', borderTop: '2px solid rgba(255,255,255,0.3)', paddingTop: '30px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <div style={{ fontSize: 20, color: '#A0AEC0', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                    Written By
                                </div>
                                <div style={{ fontSize: 32, fontWeight: 'bold', color: 'white' }}>
                                    {author}
                                </div>
                            </div>

                            {/* Logo / Brand Name */}
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <div
                                    style={{
                                        fontSize: 36,
                                        fontWeight: 900,
                                        color: 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                    }}
                                >
                                    <span style={{ color: '#E53E3E', marginRight: '8px', fontSize: 48 }}>R</span>
                                    MeroNepalTv
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        ),
        {
            ...size,
        }
    );
}
