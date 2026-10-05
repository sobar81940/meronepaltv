import { NextResponse } from 'next/server'
import PostModel from '@/models/Post'
import SettingsModel from '@/models/Settings'

export const dynamic = 'force-dynamic'

// Google News sitemap: ONLY news articles published within the last 48 hours, max 1000 URLs
const NEWS_WINDOW_MS = 2 * 24 * 60 * 60 * 1000
const MAX_URLS = 1000

export async function GET() {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rangamanch.com'
        const settings = await SettingsModel.get()
        const siteName = settings.siteName || 'Rangamanch'
        const cutoff = Date.now() - NEWS_WINDOW_MS

        // Build XML manually for better control
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n'
        xml += '         xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n'

        // Only posts published within the last 48 hours get Google News markup
        try {
            const posts = await PostModel.findPublished().then((res) => res.slice(0, MAX_URLS))

            for (const post of posts) {
                const pubTime = new Date(post.createdAt).getTime()
                if (pubTime < cutoff) continue

                const title = post.title || 'Untitled'
                const excerpt = post.excerpt || post.content?.substring(0, 160) || ''

                xml += '  <url>\n'
                xml += `    <loc>${baseUrl}/post/${post.slug}</loc>\n`
                xml += `    <news:news>\n`
                xml += `      <news:publication>\n`
                xml += `        <news:name>${escapeXml(siteName)}</news:name>\n`
                xml += `        <news:language>ne</news:language>\n`
                xml += `      </news:publication>\n`
                xml += `      <news:publication_date>${new Date(post.createdAt).toISOString()}</news:publication_date>\n`
                xml += `      <news:title>${escapeXml(title)}</news:title>\n`
                if (post.tags && post.tags.length > 0) {
                    xml += `      <news:keywords>${escapeXml(post.tags.slice(0, 10).join(', '))}</news:keywords>\n`
                } else if (excerpt) {
                    xml += `      <news:keywords>${escapeXml(excerpt.substring(0, 200))}</news:keywords>\n`
                }
                xml += `    </news:news>\n`
                xml += '  </url>\n'
            }
        } catch (error) {
            console.error('Failed to fetch posts for news sitemap:', error)
        }

        xml += '</urlset>'

        return new NextResponse(xml, {
            status: 200,
            headers: {
                'Content-Type': 'application/xml; charset=utf-8',
                'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
            },
        })
    } catch (error) {
        console.error('Sitemap generation error:', error)
        return new NextResponse('Error generating sitemap', { status: 500 })
    }
}

function escapeXml(str: string): string {
    if (!str) return ''
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
}
