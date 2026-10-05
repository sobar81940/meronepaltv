import { NextRequest, NextResponse } from "next/server";
import NepaliDate from "nepali-date-converter";

interface RashifalData {
    rashi: string;
    rashiEnglish: string;
    icon: string;
    dateRange: string;
    prediction: string;
    lucky: {
        number: string;
        color: string;
        day: string;
    };
    compatibility: string;
    mood: string;
    health: string;
    career: string;
    love: string;
}

// Rashi data with icons and date ranges
const rashiInfo: Record<string, { icon: string; dateRange: string; rashiEnglish: string; letters: string }> = {
    "मेष": { icon: "♈", dateRange: "मार्च २१ - अप्रिल १९", rashiEnglish: "Aries", letters: "चु, चे, चो, ला, लि, लु, ले, लो, अ" },
    "वृष": { icon: "♉", dateRange: "अप्रिल २० - मे २०", rashiEnglish: "Taurus", letters: "इ, उ, ए, ओ, वा, वि, वु, वे, वो" },
    "मिथुन": { icon: "♊", dateRange: "मे २१ - जुन २०", rashiEnglish: "Gemini", letters: "का, कि, कु, घ, ङ, छ, के, को, हा" },
    "कर्कट": { icon: "♋", dateRange: "जुन २१ - जुलाई २२", rashiEnglish: "Cancer", letters: "हि, हु, हे, हो, डा, डि, डु, डे, डो" },
    "सिंह": { icon: "♌", dateRange: "जुलाई २३ - अगस्ट २२", rashiEnglish: "Leo", letters: "मा, मि, मु, मे, मो, टा, टि, टु, टे" },
    "कन्या": { icon: "♍", dateRange: "अगस्ट २३ - सेप्टेम्बर २२", rashiEnglish: "Virgo", letters: "टो, पा, पि, पु, ष, ण, ठ, पे, पो" },
    "तुला": { icon: "♎", dateRange: "सेप्टेम्बर २३ - अक्टोबर २२", rashiEnglish: "Libra", letters: "रा, रि, रु, रे, रो, ता, ति, तु, ते" },
    "वृश्चिक": { icon: "♏", dateRange: "अक्टोबर २३ - नोभेम्बर २१", rashiEnglish: "Scorpio", letters: "तो, ना, नि, नु, ने, नो, या, यि, यु" },
    "धनु": { icon: "♐", dateRange: "नोभेम्बर २२ - डिसेम्बर २१", rashiEnglish: "Sagittarius", letters: "ये, यो, भा, भि, भु, धा, फा, ढा, भे" },
    "मकर": { icon: "♑", dateRange: "डिसेम्बर २२ - जनवरी १९", rashiEnglish: "Capricorn", letters: "भो, जा, जि, जु, जे, जो, ख, खि, खु, खे, खो, गा, गि" },
    "कुम्भ": { icon: "♒", dateRange: "जनवरी २० - फेब्रुअरी १८", rashiEnglish: "Aquarius", letters: "गु, गे, गो, सा, सि, सु, से, सो, दा" },
    "मीन": { icon: "♓", dateRange: "फेब्रुअरी १९ - मार्च २०", rashiEnglish: "Pisces", letters: "दि, दु, थ, झ, ञ, दे, दो, चा, चि" },
};

// Daily predictions rotated by date to provide varied content
const predictionSets = [
    {
        predictions: {
            "मेष": { prediction: "आज तपाईंको दिन शुभ रहनेछ। कार्यक्षेत्रमा सफलता मिल्नेछ।", mood: "उत्साही", health: "राम्रो", career: "सकारात्मक", love: "मधुर", lucky: { number: "९", color: "रातो", day: "मंगलबार" }, compatibility: "सिंह" },
            "वृष": { prediction: "आर्थिक मामिलामा सावधान रहनुहोस्। परिवारसँग समय बिताउनुहोस्।", mood: "शान्त", health: "मध्यम", career: "स्थिर", love: "सामान्य", lucky: { number: "६", color: "हरियो", day: "शुक्रबार" }, compatibility: "मकर" },
            "मिथुन": { prediction: "नयाँ अवसरहरू आउनेछन्। सञ्चारमा राम्रो दिन।", mood: "चञ्चल", health: "राम्रो", career: "उत्कृष्ट", love: "रोमाञ्चक", lucky: { number: "५", color: "पहेंलो", day: "बुधबार" }, compatibility: "तुला" },
            "कर्कट": { prediction: "भावनात्मक रूपमा सशक्त महसुस हुनेछ। घरायसी कार्यमा व्यस्त।", mood: "भावुक", health: "सावधान", career: "मध्यम", love: "गहन", lucky: { number: "२", color: "सेतो", day: "सोमबार" }, compatibility: "वृश्चिक" },
            "सिंह": { prediction: "नेतृत्वका अवसरहरू प्राप्त हुनेछन्। आत्मविश्वास बढ्नेछ।", mood: "आत्मविश्वासी", health: "उत्तम", career: "शानदार", love: "आकर्षक", lucky: { number: "१", color: "सुनौलो", day: "आइतबार" }, compatibility: "मेष" },
            "कन्या": { prediction: "विस्तारमा ध्यान दिनुहोस्। स्वास्थ्यमा सुधार हुनेछ।", mood: "विश्लेषणात्मक", health: "सुधारोन्मुख", career: "व्यवस्थित", love: "विचारशील", lucky: { number: "५", color: "खैरो", day: "बुधबार" }, compatibility: "कुम्भ" },
            "तुला": { prediction: "सामाजिक सम्बन्ध मजबुत हुनेछन्। संतुलन कायम राख्नुहोस्।", mood: "सौहार्दपूर्ण", health: "सामान्य", career: "सहयोगी", love: "मिलनसार", lucky: { number: "६", color: "गुलाबी", day: "शुक्रबार" }, compatibility: "मिथुन" },
            "वृश्चिक": { prediction: "गहन अनुसन्धानका लागि राम्रो दिन। रहस्य खुल्नेछन्।", mood: "तीव्र", health: "मध्यम", career: "गहन", love: "समर्पित", lucky: { number: "८", color: "कालो", day: "मंगलबार" }, compatibility: "कर्कट" },
            "धनु": { prediction: "यात्रा र नयाँ अनुभवका लागि शुभ दिन।", mood: "साहसिक", health: "सक्रिय", career: "विस्तारित", love: "स्वतन्त्र", lucky: { number: "३", color: "बैजनी", day: "बिहीबार" }, compatibility: "मेष" },
            "मकर": { prediction: "कडा परिश्रमको फल मिल्नेछ। धैर्य राख्नुहोस्।", mood: "दृढ", health: "स्थिर", career: "उन्नति", love: "विश्वसनीय", lucky: { number: "८", color: "खैरो गाढा", day: "शनिबार" }, compatibility: "वृष" },
            "कुम्भ": { prediction: "नवीन विचारहरू आउनेछन्। सामाजिक सेवामा रुचि बढ्नेछ।", mood: "नवीन", health: "राम्रो", career: "सिर्जनात्मक", love: "अनौठो", lucky: { number: "४", color: "नीलो", day: "शनिबार" }, compatibility: "मिथुन" },
            "मीन": { prediction: "आध्यात्मिक चिन्तनका लागि उत्तम दिन। कल्पनाशक्ति बलियो।", mood: "सपनीला", health: "सावधान", career: "कलात्मक", love: "रोमान्टिक", lucky: { number: "७", color: "समुद्री हरियो", day: "बिहीबार" }, compatibility: "कर्कट" },
        }
    },
    {
        predictions: {
            "मेष": { prediction: "नयाँ परियोजनाहरू सुरु गर्न उत्तम समय। साहस देखाउनुहोस्।", mood: "जोशिला", health: "ऊर्जावान", career: "नेतृत्व", love: "उत्साहित", lucky: { number: "१", color: "रातो", day: "मंगलबार" }, compatibility: "धनु" },
            "वृष": { prediction: "वित्तीय स्थिरता आउनेछ। धैर्यको फल मिल्नेछ।", mood: "सन्तुष्ट", health: "स्थिर", career: "प्रगतिशील", love: "विश्वसनीय", lucky: { number: "२", color: "हरियो", day: "शुक्रबार" }, compatibility: "कन्या" },
            "मिथुन": { prediction: "नयाँ मानिसहरूसँग भेट हुनेछ। सञ्चार कौशल उपयोगी हुनेछ।", mood: "मिलनसार", health: "सक्रिय", career: "नेटवर्किङ", love: "चञ्चल", lucky: { number: "३", color: "पहेंलो", day: "बुधबार" }, compatibility: "कुम्भ" },
            "कर्कट": { prediction: "परिवारसँग आनन्दको समय। भावनात्मक सुरक्षा महसुस हुनेछ।", mood: "स्नेही", health: "राम्रो", career: "स्थिर", love: "गहरो", lucky: { number: "४", color: "चाँदी", day: "सोमबार" }, compatibility: "मीन" },
            "सिंह": { prediction: "सबैको ध्यान तपाईंमा केन्द्रित हुनेछ।", mood: "गौरवशाली", health: "शक्तिशाली", career: "चमकदार", love: "रोमाञ्चक", lucky: { number: "५", color: "सुनौलो", day: "आइतबार" }, compatibility: "धनु" },
            "कन्या": { prediction: "विवरणमा ध्यान दिनुहोस्। समस्या समाधान हुनेछन्।", mood: "केन्द्रित", health: "सुधारिँदै", career: "सटीक", love: "व्यावहारिक", lucky: { number: "६", color: "नीलो हल्का", day: "बुधबार" }, compatibility: "वृष" },
            "तुला": { prediction: "कला र सौन्दर्यमा रुचि बढ्नेछ। सम्बन्धमा सौहार्द।", mood: "सुन्दर", health: "सन्तुलित", career: "कूटनीतिक", love: "सुमधुर", lucky: { number: "७", color: "गुलाबी हल्का", day: "शुक्रबार" }, compatibility: "कुम्भ" },
            "वृश्चिक": { prediction: "परिवर्तनको समय। पुरानो छोड्नुहोस्, नयाँ अपनाउनुहोस्।", mood: "रहस्यमय", health: "पुनर्जन्म", career: "गहन शोध", love: "तीव्र", lucky: { number: "८", color: "गाढा रातो", day: "मंगलबार" }, compatibility: "मीन" },
            "धनु": { prediction: "शिक्षा र दर्शनमा रुचि। विदेशी सम्पर्क लाभदायक।", mood: "दार्शनिक", health: "साहसिक", career: "विस्तार", love: "स्वतन्त्र", lucky: { number: "९", color: "बैजनी", day: "बिहीबार" }, compatibility: "सिंह" },
            "मकर": { prediction: "व्यावसायिक सफलता निकट। लक्ष्यमा केन्द्रित रहनुहोस्।", mood: "महत्त्वाकांक्षी", health: "मजबुत", career: "सफलता", love: "प्रतिबद्ध", lucky: { number: "१०", color: "कालो", day: "शनिबार" }, compatibility: "कन्या" },
            "कुम्भ": { prediction: "मानवतावादी कार्यमा संलग्न हुने इच्छा। मित्रता बढ्नेछ।", mood: "प्रगतिशील", health: "असामान्य", career: "नवाचारी", love: "मैत्रीपूर्ण", lucky: { number: "११", color: "आकाशे नीलो", day: "शनिबार" }, compatibility: "तुला" },
            "मीन": { prediction: "सपनाहरू साकार हुने संकेत। अन्तर्ज्ञान बलियो।", mood: "अन्तर्मुखी", health: "संवेदनशील", career: "कलात्मक", love: "आदर्शवादी", lucky: { number: "१२", color: "समुद्री", day: "बिहीबार" }, compatibility: "वृश्चिक" },
        }
    }
];

// Get prediction set based on day of year for variety
function getPredictionSet(): typeof predictionSets[0] {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    return predictionSets[dayOfYear % predictionSets.length];
}

export async function GET(request: NextRequest) {
    try {
        const today = new Date();
        const npDate = new NepaliDate();
        const nepaliDate = npDate.format('ddd, DD MMMM YYYY', 'np');

        const predictionSet = getPredictionSet();

        const rashifalData: RashifalData[] = Object.entries(rashiInfo).map(([rashi, info]) => {
            const pred = predictionSet.predictions[rashi as keyof typeof predictionSet.predictions];
            return {
                rashi,
                rashiEnglish: info.rashiEnglish,
                icon: info.icon,
                dateRange: info.dateRange,
                letters: info.letters,
                prediction: pred.prediction,
                lucky: pred.lucky,
                compatibility: pred.compatibility,
                mood: pred.mood,
                health: pred.health,
                career: pred.career,
                love: pred.love,
            };
        });

        return NextResponse.json({
            success: true,
            data: rashifalData,
            date: today.toISOString(),
            nepaliDate,
        });
    } catch (error) {
        console.error("Rashifal API error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch rashifal data" },
            { status: 500 }
        );
    }
}
