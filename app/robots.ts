import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://meronepaltv.com').replace(/\/$/, '')
    return {
        rules: [
            {
                userAgent: '*',
                allow: ['/', '/api/sitemap-news'],
                disallow: [
                    '/admin/',
                    '/api/',
                    '/login/',
                ],
            },
            {
                // Block bad bots known for scraping
                userAgent: ['AhrefsBot', 'SemrushBot', 'DotBot', 'MJ12bot'],
                disallow: '/',
            },
        ],
        sitemap: [
            `${baseUrl}/sitemap.xml`,
            `${baseUrl}/api/sitemap-news`,
        ],
    }
}
