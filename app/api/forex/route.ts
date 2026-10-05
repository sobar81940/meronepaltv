import { NextRequest, NextResponse } from "next/server";

interface ForexRate {
    currency: {
        iso3: string;
        name: string;
        unit: number;
    };
    buy: string;
    sell: string;
}

interface NRBForexResponse {
    status: {
        code: number;
    };
    data: {
        payload: Array<{
            date: string;
            published_on: string;
            rates: ForexRate[];
        }>;
    };
}

// Cache forex data for 1 hour
let cachedData: { rates: ForexRate[]; date: string; fetchedAt: number } | null = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

export async function GET(request: NextRequest) {
    try {
        const now = Date.now();

        // Return cached data if valid
        if (cachedData && (now - cachedData.fetchedAt) < CACHE_DURATION) {
            return NextResponse.json({
                success: true,
                data: cachedData.rates,
                date: cachedData.date,
                cached: true,
            });
        }

        // Fetch from Nepal Rastra Bank API
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
        const response = await fetch(
            `https://www.nrb.org.np/api/forex/v1/rates?page=1&per_page=1&from=${today}&to=${today}`,
            {
                headers: {
                    'Accept': 'application/json',
                },
                next: { revalidate: 3600 }, // Cache for 1 hour
            }
        );

        if (!response.ok) {
            // If today's data not available, try yesterday
            const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
            const retryResponse = await fetch(
                `https://www.nrb.org.np/api/forex/v1/rates?page=1&per_page=1&from=${yesterday}&to=${yesterday}`,
                {
                    headers: {
                        'Accept': 'application/json',
                    },
                }
            );

            if (!retryResponse.ok) {
                throw new Error(`NRB API error: ${retryResponse.status}`);
            }

            const retryData: NRBForexResponse = await retryResponse.json();
            const payload = retryData.data?.payload?.[0];

            if (payload) {
                cachedData = {
                    rates: payload.rates,
                    date: payload.date,
                    fetchedAt: now,
                };
            }
        } else {
            const data: NRBForexResponse = await response.json();
            const payload = data.data?.payload?.[0];

            if (payload) {
                cachedData = {
                    rates: payload.rates,
                    date: payload.date,
                    fetchedAt: now,
                };
            }
        }

        if (!cachedData) {
            return NextResponse.json(
                { success: false, error: "No forex data available" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: cachedData.rates,
            date: cachedData.date,
            cached: false,
        });
    } catch (error) {
        console.error("Forex API error:", error);

        // Return cached data even if stale
        if (cachedData) {
            return NextResponse.json({
                success: true,
                data: cachedData.rates,
                date: cachedData.date,
                cached: true,
                stale: true,
            });
        }

        return NextResponse.json(
            { success: false, error: "Failed to fetch forex rates" },
            { status: 500 }
        );
    }
}
