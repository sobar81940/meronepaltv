import clientPromise from "@/lib/mongodb";

export async function GET() {
    try {
        const client = await clientPromise;

        // Ping the database to check connection
        await client.db().command({ ping: 1 });

        return Response.json({
            success: true,
            message: "Successfully connected to MongoDB!",
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("MongoDB connection error:", error);
        return Response.json(
            {
                success: false,
                message: "Failed to connect to MongoDB",
                error: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
