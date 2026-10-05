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
const CACHE_DURATION = 60 * 60 * 1000;

// GET /api/mobile/forex
export async function GET() {
    try {
        const now = Date.now();

        if (cachedData && (now - cachedData.fetchedAt) < CACHE_DURATION) {
            return Response.json({
                success: true,
                data: cachedData.rates,
                date: cachedData.date,
                cached: true,
            });
        }

        const today = new Date().toISOString().split('T')[0];
        const response = await fetch(
            `https://www.nrb.org.np/api/forex/v1/rates?page=1&per_page=1&from=${today}&to=${today}`,
            {
                headers: { 'Accept': 'application/json' },
                next: { revalidate: 3600 },
            }
        );

        let payload: NRBForexResponse["data"]["payload"][0] | undefined;

        if (response.ok) {
            const data: NRBForexResponse = await response.json();
            payload = data.data?.payload?.[0];
        }

        if (!payload) {
            const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
            const retryResponse = await fetch(
                `https://www.nrb.org.np/api/forex/v1/rates?page=1&per_page=1&from=${yesterday}&to=${yesterday}`,
                { headers: { 'Accept': 'application/json' } }
            );

            if (!retryResponse.ok) {
                throw new Error(`NRB API error: ${retryResponse.status}`);
            }

            const retryData: NRBForexResponse = await retryResponse.json();
            payload = retryData.data?.payload?.[0];
        }

        if (payload) {
            cachedData = {
                rates: payload.rates,
                date: payload.date,
                fetchedAt: now,
            };
        }

        if (!cachedData) {
            return Response.json(
                { success: false, error: "No forex data available" },
                { status: 404 }
            );
        }

        return Response.json({
            success: true,
            data: cachedData.rates,
            date: cachedData.date,
            cached: false,
        });
    } catch (error) {
        console.error("Mobile forex API error:", error);

        if (cachedData) {
            return Response.json({
                success: true,
                data: cachedData.rates,
                date: cachedData.date,
                cached: true,
                stale: true,
            });
        }

        return Response.json(
            { success: false, error: "Failed to fetch forex rates" },
            { status: 500 }
        );
    }
}
