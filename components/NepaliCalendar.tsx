"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Grid3X3, List } from "lucide-react";
import NepaliDate from "nepali-date-converter";

// Convert English numbers to Nepali numerals
function toNepaliNumerals(num: number | string): string {
    const nepaliDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
    return String(num).replace(/[0-9]/g, (digit) => nepaliDigits[parseInt(digit)]);
}

// Nepali month names
const NEPALI_MONTHS = [
    "बैशाख", "जेठ", "असार", "श्रावण", "भदौ", "आश्विन",
    "कार्तिक", "मंसिर", "पुष", "माघ", "फाल्गुन", "चैत्र"
];

// English month names
const ENGLISH_MONTHS = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

// Nepali weekday names
const NEPALI_WEEKDAYS = [
    { np: "आइतवार", en: "Sunday" },
    { np: "सोमवार", en: "Monday" },
    { np: "मंगलवार", en: "Tuesday" },
    { np: "बुधवार", en: "Wednesday" },
    { np: "बिहिवार", en: "Thursday" },
    { np: "शुक्रवार", en: "Friday" },
    { np: "शनिवार", en: "Saturday" }
];

// Days in each Nepali month for years 2080-2090
const NEPALI_MONTH_DAYS: Record<number, number[]> = {
    2080: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
    2081: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
    2082: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
    2083: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
    2084: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
    2085: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
    2086: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
    2087: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
    2088: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 29, 31],
    2089: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
    2090: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
};

// Tithi names
const TITHIS = [
    "प्रतिपदा", "द्वितीया", "तृतीया", "चतुर्थी", "पञ्चमी",
    "षष्ठी", "सप्तमी", "अष्टमी", "नवमी", "दशमी",
    "एकादशी", "द्वादशी", "त्रयोदशी", "चतुर्दशी", "पूर्णिमा", "औंसी"
];

// Important dates with events for specific year/month/day
interface EventInfo {
    name: string;
    type: 'festival' | 'holiday' | 'vrat' | 'event';
}

// Events for Pus 2082 (as shown in the reference)
const EVENTS_2082_PUS: Record<number, EventInfo[]> = {
    1: [{ name: "सफला एकादशी व्रत", type: "vrat" }, { name: "धनु संक्रान्ति", type: "festival" }],
    2: [{ name: "प्रदोष व्रत", type: "vrat" }],
    3: [{ name: "अन्तर्राष्ट्रिय आप्रवासी दिवस", type: "event" }],
    5: [{ name: "तोल ल्होसार", type: "festival" }],
    6: [{ name: "विश्व ध्यान दिवस", type: "event" }],
    10: [{ name: "क्रिसमस-डे", type: "holiday" }],
    14: [{ name: "--", type: "event" }],
    15: [{ name: "तामु ल्होसार/कवि शिरोमणि लेखनाथ जयन्ती/पुत्रदा एकादशी...", type: "festival" }],
    17: [{ name: "नयाँ वर्ष २०२६/राष्ट्रिय पोशाक दिवस/टोपी दिवस/प्रदोष व्रत", type: "holiday" }],
    19: [{ name: "श्री स्वस्थानी व्रत कथा प्रारम्भ/माघ स्नान/पूर्णिमा व्रत", type: "vrat" }],
    20: [{ name: "गुरु गोविन्द सिंह जयन्ती", type: "festival" }],
    23: [{ name: "अरनिको स्मृति दिवस", type: "event" }],
    24: [{ name: "नेपाल ज्योतिष परिषद स्थापना दिवस", type: "event" }],
    27: [{ name: "पृथ्वी जयन्ती/राष्ट्रिय एकता दिवस/गोरखकाली पूजा", type: "holiday" }],
    28: [{ name: "राष्ट्रिय भाक्का दिवस", type: "event" }],
    29: [{ name: "षट्तिला एकादशी", type: "vrat" }],
    // Magh month starts
};

// Get tithi for a day (simplified calculation)
const getTithi = (day: number): string => {
    // This is a simplified version - actual tithi calculation is complex
    const tithiIndex = (day - 1) % 15;
    const paksha = Math.floor((day - 1) / 15) % 2;
    if (tithiIndex === 14) {
        return paksha === 0 ? "पूर्णिमा" : "औंसी";
    }
    return TITHIS[tithiIndex];
};

// Get English date for a Nepali date
const getEnglishDate = (year: number, month: number, day: number): { day: number, month: string, year: number } | null => {
    try {
        const nepDate = new NepaliDate(year, month, day);
        const engDate = nepDate.toJsDate();
        return {
            day: engDate.getDate(),
            month: ENGLISH_MONTHS[engDate.getMonth()],
            year: engDate.getFullYear()
        };
    } catch {
        return null;
    }
};

export default function NepaliCalendar() {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Get current Nepali date (client-side only)
    const today = useMemo(() => typeof window !== 'undefined' ? new NepaliDate(new Date()) : null, []);
    
    const [selectedYear, setSelectedYear] = useState(() => {
        const now = typeof window !== 'undefined' ? new NepaliDate(new Date()) : null;
        return now ? now.getYear() : 2082;
    });
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = typeof window !== 'undefined' ? new NepaliDate(new Date()) : null;
        return now ? now.getMonth() : 8;
    });

    // Navigate months
    const getDaysInMonth = (year: number, month: number): number => {
        if (NEPALI_MONTH_DAYS[year]) {
            return NEPALI_MONTH_DAYS[year][month];
        }
        return [31, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30][month];
    };

    // Get the starting day of the month (0 = Sunday)
    const getStartingDay = (year: number, month: number): number => {
        try {
            const nepDate = new NepaliDate(year, month, 1);
            return nepDate.getDay();
        } catch {
            return 0;
        }
    };

    // Navigate months
    const goToPreviousMonth = () => {
        if (selectedMonth === 0) {
            setSelectedMonth(11);
            setSelectedYear(selectedYear - 1);
        } else {
            setSelectedMonth(selectedMonth - 1);
        }
    };

    const goToNextMonth = () => {
        if (selectedMonth === 11) {
            setSelectedMonth(0);
            setSelectedYear(selectedYear + 1);
        } else {
            setSelectedMonth(selectedMonth + 1);
        }
    };

    const goToToday = () => {
        if (today) {
            setSelectedYear(today.getYear());
            setSelectedMonth(today.getMonth());
        }
    };

    // Check if a date is today
    const isToday = (day: number): boolean => {
        if (!today) return false;
        return today.getYear() === selectedYear &&
            today.getMonth() === selectedMonth &&
            today.getDate() === day;
    };

    // Check if it's Saturday
    const isSaturday = (day: number): boolean => {
        try {
            const nepDate = new NepaliDate(selectedYear, selectedMonth, day);
            return nepDate.getDay() === 6;
        } catch {
            return false;
        }
    };

    // Get events for a day
    const getEvents = (day: number): EventInfo[] => {
        if (selectedYear === 2082 && selectedMonth === 8) {
            return EVENTS_2082_PUS[day] || [];
        }
        return [];
    };

    // Get English month range for header
    const getEnglishMonthRange = (): string => {
        const firstDay = getEnglishDate(selectedYear, selectedMonth, 1);
        const lastDay = getEnglishDate(selectedYear, selectedMonth, getDaysInMonth(selectedYear, selectedMonth));

        if (!firstDay || !lastDay) return "";

        if (firstDay.month === lastDay.month) {
            return `${firstDay.month} ${firstDay.year}`;
        }
        return `${firstDay.month}/${lastDay.month} ${firstDay.year}-${lastDay.year}`;
    };

    // Generate calendar grid
    const renderCalendarDays = () => {
        const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
        const startingDay = getStartingDay(selectedYear, selectedMonth);
        const days = [];

        // Empty cells for days before the start of the month
        for (let i = 0; i < startingDay; i++) {
            days.push(
                <div key={`empty-${i}`} className="min-h-[100px] md:min-h-[120px] border-b border-r border-gray-200" />
            );
        }

        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const englishDate = getEnglishDate(selectedYear, selectedMonth, day);
            const events = getEvents(day);
            const tithi = getTithi(day);
            const saturday = isSaturday(day);
            const todayClass = isToday(day);

            days.push(
                <div
                    key={day}
                    className={`
                        min-h-[100px] md:min-h-[120px] p-2 border-b border-r border-gray-200
                        relative flex flex-col
                        ${todayClass ? 'bg-green-500' : saturday ? 'bg-red-50' : 'bg-white'}
                        hover:bg-gray-50 transition-colors cursor-pointer
                    `}
                >
                    {/* Top row: Event name (left) and English date (right) */}
                    <div className="flex justify-between items-start text-[10px] md:text-xs mb-1">
                        <span className={`${todayClass ? 'text-white' : 'text-red-600'} truncate max-w-[70%] leading-tight`}>
                            {events.length > 0 ? events[0].name.slice(0, 20) + (events[0].name.length > 20 ? '...' : '') : '\u2013\u2013'}
                        </span>
                        <span className={`${todayClass ? 'text-white/80' : 'text-gray-400'}`}>
                            {englishDate?.day}
                        </span>
                    </div>

                    {/* Center: Large Nepali date */}
                    <div className="flex-1 flex items-center justify-center">
                        <span className={`
                            text-3xl md:text-4xl lg:text-5xl font-bold
                            ${todayClass ? 'text-white' : saturday ? 'text-red-600' : 'text-gray-800'}
                        `}>
                            {toNepaliNumerals(day)}
                        </span>
                    </div>

                    {/* Bottom row: Tithi (left) and English day number (right) */}
                    <div className="flex justify-between items-end text-[10px] md:text-xs">
                        <span className={`${todayClass ? 'text-white/90' : 'text-gray-600'}`}>
                            {tithi}
                        </span>
                        <span className={`${todayClass ? 'text-white/80' : saturday ? 'text-red-500' : 'text-gray-400'}`}>
                            {englishDate?.day}
                        </span>
                    </div>
                </div>
            );
        }

        return days;
    };

    // Generate year options (2080-2090)
    const yearOptions = Array.from({ length: 11 }, (_, i) => 2080 + i);

    return (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Header Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-gray-200 bg-gray-50">
                {/* Left side: Today button and view toggle */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={goToToday}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                        आज
                    </button>
                    <div className="flex border border-gray-300 rounded-md overflow-hidden">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 ${viewMode === 'grid' ? 'bg-gray-200' : 'bg-white hover:bg-gray-100'}`}
                            aria-label="Grid view"
                        >
                            <Grid3X3 className="w-5 h-5 text-gray-600" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 border-l border-gray-300 ${viewMode === 'list' ? 'bg-gray-200' : 'bg-white hover:bg-gray-100'}`}
                            aria-label="List view"
                        >
                            <List className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>
                </div>

                {/* Center: Navigation and dropdowns */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={goToPreviousMonth}
                        className="p-2 hover:bg-gray-200 rounded-md transition-colors"
                        aria-label="Previous"
                    >
                        <ChevronLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <button
                        onClick={goToPreviousMonth}
                        className="p-2 hover:bg-gray-200 rounded-md transition-colors"
                        aria-label="Previous month"
                    >
                        <ChevronLeft className="w-5 h-5 text-gray-600" />
                    </button>

                    {/* Year dropdown */}
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium bg-white"
                    >
                        {yearOptions.map(year => (
                            <option key={year} value={year}>{toNepaliNumerals(year)}</option>
                        ))}
                    </select>

                    {/* Month dropdown */}
                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(Number(e.target.value))}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium bg-white"
                    >
                        {NEPALI_MONTHS.map((month, idx) => (
                            <option key={idx} value={idx}>{month}</option>
                        ))}
                    </select>

                    <button
                        onClick={goToNextMonth}
                        className="p-2 hover:bg-gray-200 rounded-md transition-colors"
                        aria-label="Next month"
                    >
                        <ChevronRight className="w-5 h-5 text-gray-600" />
                    </button>
                    <button
                        onClick={goToNextMonth}
                        className="p-2 hover:bg-gray-200 rounded-md transition-colors"
                        aria-label="Next"
                    >
                        <ChevronRight className="w-5 h-5 text-gray-600" />
                    </button>
                </div>

                {/* Right side: English date range */}
                <div className="text-right">
                    <span className="text-lg font-bold text-red-600">
                        {toNepaliNumerals(selectedYear)} {NEPALI_MONTHS[selectedMonth]} | {getEnglishMonthRange()}
                    </span>
                </div>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 border-b border-gray-300 bg-gray-100">
                {NEPALI_WEEKDAYS.map((day, index) => (
                    <div
                        key={day.np}
                        className={`
                            py-3 text-center border-r border-gray-200 last:border-r-0
                            ${index === 6 ? 'text-red-600' : 'text-gray-700'}
                        `}
                    >
                        <div className="font-semibold text-sm">{day.np}</div>
                        <div className="text-xs text-gray-500">{day.en}</div>
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7">
                {renderCalendarDays()}
            </div>

            {/* Footer Legend */}
            <div className="flex flex-wrap items-center justify-center gap-6 py-4 px-4 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-500 rounded" />
                    <span className="text-sm text-gray-600">आज</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-red-50 border border-red-200 rounded" />
                    <span className="text-sm text-gray-600">शनिबार (बिदा)</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-red-600 text-sm font-medium">लाल अक्षर</span>
                    <span className="text-sm text-gray-600">= पर्व/चाड</span>
                </div>
            </div>
        </div>
    );
}
