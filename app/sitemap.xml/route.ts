import { NextResponse } from 'next/server'
import PostModel from '@/models/Post'
import CategoryModel from '@/models/Category'
import SettingsModel from '@/models/Settings'
import CelebrityModel from '@/models/Celebrity'
import WebStoryModel from '@/models/WebStory'
import EventModel from '@/models/Event'

export const dynamic = 'force-dynamic'
export const revalidate = 3600 // Revalidate every hour

// Only posts published within the last 2 days get Google News markup
const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000

export async function GET() {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rangamanch.com'
        const settings = await SettingsModel.get()
        const siteName = settings.siteName || 'Rangamanch'
        const now = new Date().toISOString()

        // Build XML manually for better control
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n'
        xml += '        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"\n'
        xml += '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n'

        // Static pages
        const staticPages = [
            { path: '', priority: '1.0', changefreq: 'always' },
            { path: '/about', priority: '0.8', changefreq: 'monthly' },
            { path: '/contact', priority: '0.8', changefreq: 'monthly' },
            { path: '/privacy-policy', priority: '0.5', changefreq: 'yearly' },
            { path: '/terms-of-service', priority: '0.5', changefreq: 'yearly' },
            { path: '/advertise', priority: '0.7', changefreq: 'monthly' },
            { path: '/careers', priority: '0.6', changefreq: 'monthly' },
            { path: '/rashifal', priority: '0.8', changefreq: 'daily' },
            { path: '/forex', priority: '0.8', changefreq: 'daily' },
            { path: '/web-stories', priority: '0.7', changefreq: 'daily' },
            { path: '/gallery', priority: '0.6', changefreq: 'weekly' },
            { path: '/event', priority: '0.7', changefreq: 'weekly' },
            { path: '/patro', priority: '0.6', changefreq: 'monthly' },
            { path: '/share-market', priority: '0.7', changefreq: 'daily' },
            { path: '/pradesh', priority: '0.7', changefreq: 'daily' },
            { path: '/wiki', priority: '0.6', changefreq: 'weekly' },
            { path: '/shorts', priority: '0.7', changefreq: 'daily' },
        ]

        for (const page of staticPages) {
            xml += '  <url>\n'
                xml += `    <loc>${escapeXml(baseUrl + page.path)}</loc>\n`
            xml += `    <lastmod>${now}</lastmod>\n`
            xml += `    <changefreq>${page.changefreq}</changefreq>\n`
            xml += `    <priority>${page.priority}</priority>\n`
            xml += '  </url>\n'
        }

        // Categories
        try {
            const categories = await CategoryModel.findAll()
            for (const cat of categories) {
                const lastmod = new Date(cat.updatedAt).toISOString()
                xml += '  <url>\n'
                xml += `    <loc>${escapeXml(`${baseUrl}/category/${cat.slug}`)}</loc>\n`
                xml += `    <lastmod>${lastmod}</lastmod>\n`
                xml += `    <changefreq>daily</changefreq>\n`
                xml += `    <priority>0.8</priority>\n`
                xml += '  </url>\n'
            }
        } catch (error) {
            console.error('Failed to fetch categories for sitemap:', error)
        }

        // Celebrities / Wiki pages
        try {
            const celebrities = await CelebrityModel.findPublished(500)
            for (const celeb of celebrities) {
                const lastmod = celeb.updatedAt ? new Date(celeb.updatedAt).toISOString() : now
                xml += '  <url>\n'
                xml += `    <loc>${escapeXml(`${baseUrl}/wiki/${celeb.slug}`)}</loc>\n`
                xml += `    <lastmod>${lastmod}</lastmod>\n`
                xml += `    <changefreq>weekly</changefreq>\n`
                xml += `    <priority>0.6</priority>\n`
                if (celeb.imageUrl) {
                    xml += `    <image:image>\n`
                    xml += `      <image:loc>${escapeXml(celeb.imageUrl)}</image:loc>\n`
                    xml += `      <image:title>${escapeXml(celeb.name)}</image:title>\n`
                    xml += `    </image:image>\n`
                }
                xml += '  </url>\n'
            }
        } catch (error) {
            console.error('Failed to fetch celebrities for sitemap:', error)
        }

        // Web stories
        try {
            const stories = await WebStoryModel.findPublished(500)
            for (const story of stories) {
                const lastmod = story.updatedAt ? new Date(story.updatedAt).toISOString() : now
                xml += '  <url>\n'
                xml += `    <loc>${escapeXml(`${baseUrl}/web-stories/${story.slug}`)}</loc>\n`
                xml += `    <lastmod>${lastmod}</lastmod>\n`
                xml += `    <changefreq>daily</changefreq>\n`
                xml += `    <priority>0.7</priority>\n`
                if (story.coverImage) {
                    xml += `    <image:image>\n`
                    xml += `      <image:loc>${escapeXml(story.coverImage)}</image:loc>\n`
                    xml += `      <image:title>${escapeXml(story.title)}</image:title>\n`
                    xml += `    </image:image>\n`
                }
                xml += '  </url>\n'
            }
        } catch (error) {
            console.error('Failed to fetch web stories for sitemap:', error)
        }

        // Events
        try {
            const events = await EventModel.findAll({ published: true, limit: 500 })
            for (const event of events) {
                const lastmod = event.updatedAt ? new Date(event.updatedAt).toISOString() : now
                xml += '  <url>\n'
                xml += `    <loc>${escapeXml(`${baseUrl}/event/${event.slug}`)}</loc>\n`
                xml += `    <lastmod>${lastmod}</lastmod>\n`
                xml += `    <changefreq>weekly</changefreq>\n`
                xml += `    <priority>0.6</priority>\n`
                xml += '  </url>\n'
            }
        } catch (error) {
            console.error('Failed to fetch events for sitemap:', error)
        }

        // Posts with Google News markup (only for recent posts ≤ 2 days old)
        try {
            const posts = await PostModel.findPublished().then((res) => res.slice(0, 1000))
            const cutoff = Date.now() - TWO_DAYS_MS

            for (const post of posts) {
                const lastmod = new Date(post.updatedAt || post.createdAt).toISOString()
                const title = post.title || 'Untitled'
                const pubDate = new Date(post.createdAt).getTime()
                const isRecent = pubDate >= cutoff

                xml += '  <url>\n'
                xml += `    <loc>${escapeXml(`${baseUrl}/post/${post.slug}`)}</loc>\n`
                xml += `    <lastmod>${lastmod}</lastmod>\n`
                xml += `    <changefreq>weekly</changefreq>\n`
                xml += `    <priority>${isRecent ? '0.9' : '0.7'}</priority>\n`

                // Google News sitemap markup — only valid for articles published within the last 2 days
                if (isRecent) {
                    xml += `    <news:news>\n`
                    xml += `      <news:publication>\n`
                    xml += `        <news:name>${escapeXml(siteName)}</news:name>\n`
                    xml += `        <news:language>ne</news:language>\n`
                    xml += `      </news:publication>\n`
                    xml += `      <news:publication_date>${new Date(post.createdAt).toISOString()}</news:publication_date>\n`
                    xml += `      <news:title>${escapeXml(title)}</news:title>\n`
                    if (post.tags && post.tags.length > 0) {
                        xml += `      <news:keywords>${escapeXml(post.tags.slice(0, 10).join(', '))}</news:keywords>\n`
                    }
                    xml += `    </news:news>\n`
                }

                // Image sitemap markup
                if (post.imageUrl) {
                    const imageUrl = post.imageUrl.startsWith('http') ? post.imageUrl : `${baseUrl}${post.imageUrl}`
                    xml += `    <image:image>\n`
                    xml += `      <image:loc>${escapeXml(imageUrl)}</image:loc>\n`
                    xml += `      <image:title>${escapeXml(title)}</image:title>\n`
                    xml += `    </image:image>\n`
                }

                xml += '  </url>\n'
            }
        } catch (error) {
            console.error('Failed to fetch posts for sitemap:', error)
        }

        xml += '</urlset>'

        return new NextResponse(xml, {
            status: 200,
            headers: {
                'Content-Type': 'application/xml; charset=utf-8',
                'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
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
