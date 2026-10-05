import PostModel from "@/models/Post";

// GET - Fetch seed status
export async function GET() {
    const count = await PostModel.count();
    return Response.json({
        success: true,
        message: `Database has ${count} posts`,
        count,
    });
}

// POST - Insert demo data
export async function POST() {
    try {
        const demoData = [
            {
                title: "Breaking: Major Tech Breakthrough in AI Development",
                content: `Scientists have announced a significant breakthrough in artificial intelligence research that could revolutionize how we interact with technology. The new development promises to make AI systems more efficient and accessible to everyday users.

The research team, led by experts from multiple universities, has developed a new algorithm that reduces the computational requirements for AI training by 70%. This could lead to more sustainable AI development and democratize access to advanced AI capabilities.

Industry experts are calling this a watershed moment for the technology sector, with potential applications spanning healthcare, education, and environmental monitoring.`,
                category: "Technology",
                tags: ["AI", "Innovation", "Research"],
                author: "Sarah Johnson",
                published: true,
            },
            {
                title: "Global Climate Summit Reaches Historic Agreement",
                content: `World leaders have reached a landmark agreement at the Global Climate Summit, committing to net-zero emissions by 2050. The agreement includes unprecedented financial commitments from developed nations to support climate adaptation in vulnerable countries.

The deal was reached after two weeks of intense negotiations, with 195 countries signing the final document. Key provisions include a global carbon pricing mechanism and a $100 billion annual fund for green technology transfer.

Environmental groups have cautiously welcomed the agreement while calling for stronger enforcement mechanisms to ensure countries meet their commitments.`,
                category: "Politics",
                tags: ["Climate", "Environment", "Global"],
                author: "Michael Chen",
                published: true,
            },
            {
                title: "Local Community Garden Transforms Urban Neighborhood",
                content: `A once-abandoned lot in downtown has been transformed into a thriving community garden, bringing together neighbors and providing fresh produce to local families. The project, initiated by residents two years ago, now serves over 200 families.

The garden features organic vegetables, fruit trees, and a dedicated section for educational programs. Local schools regularly visit for hands-on learning about sustainable agriculture and nutrition.

The initiative has inspired similar projects in neighboring communities and has been recognized by the city council as a model for urban renewal.`,
                category: "Local",
                tags: ["Community", "Urban", "Sustainability"],
                author: "Emma Rodriguez",
                published: true,
            },
            {
                title: "Sports: National Team Qualifies for World Championship",
                content: `In a thrilling final match, the national team secured their spot in next year's World Championship with a dramatic 3-2 victory. The team's captain scored the winning goal in the 89th minute, sending fans into celebration.

This marks the team's first qualification in over a decade, following years of rebuilding under new management. The coaching staff praised the players' dedication and the support from fans throughout the qualifying campaign.

Preparations for the championship will begin immediately, with training camps scheduled across the country in the coming months.`,
                category: "Sports",
                tags: ["Championship", "Football", "National Team"],
                author: "David Park",
                published: true,
            },
            {
                title: "New Study Reveals Benefits of Mediterranean Diet",
                content: `A comprehensive study involving 50,000 participants over 10 years has confirmed significant health benefits of the Mediterranean diet. Researchers found a 25% reduction in cardiovascular disease risk among adherents.

The study, published in a leading medical journal, also found improvements in cognitive function and reduced rates of certain cancers. Experts recommend incorporating olive oil, fish, whole grains, and fresh vegetables into daily meals.

Nutritionists are now calling for updated dietary guidelines to reflect these findings and promote healthier eating habits nationwide.`,
                category: "Health",
                tags: ["Nutrition", "Research", "Wellness"],
                author: "Dr. Lisa Thompson",
                published: true,
            },
            {
                title: "Stock Market Reaches Record High Amid Economic Recovery",
                content: `The stock market closed at an all-time high today, reflecting growing investor confidence in the economic recovery. Major indices gained over 2%, led by technology and healthcare sectors.

Analysts attribute the surge to positive employment data and strong corporate earnings reports. Consumer spending has also shown robust growth, indicating sustained economic momentum.

However, some economists caution about potential inflation concerns and recommend investors maintain diversified portfolios to manage risk.`,
                category: "Business",
                tags: ["Economy", "Markets", "Finance"],
                author: "Robert Williams",
                published: true,
            },
            {
                title: "Award-Winning Film Director Announces New Project",
                content: `Acclaimed director announces their most ambitious project yet - an epic historical drama spanning three centuries. The production, with a budget of $200 million, will feature an ensemble cast of international stars.

Filming is set to begin next spring across multiple locations in Europe and Asia. The director described the project as a labor of love that has been in development for over five years.

Industry insiders are already speculating about potential award recognition, given the director's track record of critical and commercial success.`,
                category: "Entertainment",
                tags: ["Film", "Movies", "Cinema"],
                author: "Jennifer Adams",
                published: true,
            },
            {
                title: "Revolutionary Electric Vehicle Battery Doubles Range",
                content: `A startup has unveiled a new battery technology that promises to double the range of electric vehicles while reducing charging time by half. The solid-state battery represents a major leap forward in EV technology.

Major automakers have already expressed interest in licensing the technology, with production partnerships expected to be announced within months. The innovation could accelerate the transition to electric transportation globally.

Environmental advocates are hailing this as a crucial development in reducing transportation emissions, which account for a significant portion of global carbon output.`,
                category: "Technology",
                tags: ["EV", "Battery", "Green Tech"],
                author: "Alex Turner",
                published: true,
            },
            {
                title: "Historic Building Restoration Project Completed",
                content: `After five years of careful restoration work, the historic city hall building has reopened to the public. The project preserved the 19th-century architecture while incorporating modern accessibility features and sustainable technologies.

The $50 million restoration included the discovery of original murals that had been covered for decades. Art historians have painstakingly restored these works, providing a glimpse into the city's rich cultural heritage.

The building will now serve as both a functioning government facility and a museum celebrating local history and architecture.`,
                category: "Local",
                tags: ["Architecture", "Heritage", "Restoration"],
                author: "Maria Santos",
                published: true,
            },
            {
                title: "Draft Preview: Top Prospects Set to Transform League",
                content: `This year's draft class is being hailed as one of the most talented in recent memory. Scouts and analysts have identified several players expected to make immediate impacts at the professional level.

The top prospect, a dynamic playmaker from the college ranks, is projected to go first overall. Teams in the lottery positions are reportedly considering trades to move up in the draft order.

The draft ceremony will be held downtown next month, with thousands of fans expected to attend the event and welcome the new generation of players.`,
                category: "Sports",
                tags: ["Draft", "Prospects", "Sports"],
                author: "Chris Martinez",
                published: false,
            },
        ];

        const insertedPosts = [];
        for (const post of demoData) {
            const created = await PostModel.create(post);
            insertedPosts.push(created);
        }

        return Response.json({
            success: true,
            message: `Successfully inserted ${insertedPosts.length} demo posts`,
            count: insertedPosts.length,
            categories: [...new Set(demoData.map((p) => p.category))],
        });
    } catch (error) {
        console.error("Error seeding data:", error);
        return Response.json(
            { success: false, error: "Failed to seed demo data" },
            { status: 500 }
        );
    }
}
