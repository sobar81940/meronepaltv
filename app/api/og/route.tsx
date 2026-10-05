import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);

        // Get dynamic params
        const title = searchParams.get('title') || 'News Portal';
        const author = searchParams.get('author') || 'News Team';
        const date = searchParams.get('date'); // Optional date string
        const category = searchParams.get('category') || 'News';

        // Font (optional: load custom font if needed, otherwise use default system fonts)
        // For simplicity, we'll use system fonts/tailwind classes.
        // Note: next/og supports a subset of CSS and Flexbox.

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
                        backgroundImage: 'linear-gradient(to bottom right, #1a202c, #2d3748)',
                        color: 'white',
                        padding: '60px',
                        fontFamily: 'sans-serif',
                    }}
                >
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
                            textShadow: '0 2px 10px rgba(0,0,0,0.2)',
                            // Max lines clamp simulation logic would be complex here, 
                            // so we rely on flex layout to handle overflow gracefully or truncate via CSS if supported.
                            display: '-webkit-box',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }}
                    >
                        {title}
                    </div>

                    {/* Footer: Author & Brand */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'flex-end', borderTop: '2px solid rgba(255,255,255,0.1)', paddingTop: '30px' }}>
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
                                RANGAMANCH
                            </div>
                        </div>
                    </div>
                </div>
            ),
            {
                width: 1200,
                height: 630,
            },
        );
    } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : 'Unknown error';
        console.error(errorMessage);
        return new Response(`Failed to generate the image`, {
            status: 500,
        });
    }
}
