import Header from "@/components/Header";
import FooterWrapper from "@/components/FooterWrapper";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { CalendarDays, ChevronLeft, ChevronRight, Eye, Mail, Megaphone } from "lucide-react";
import PostModel from "@/models/Post";
import CategoryModel from "@/models/Category";
import { stripHtmlTags } from "@/lib/utils";
import NewsletterForm from "@/components/NewsletterForm";

export const revalidate = 60;

interface CategoryPageProps {
    params: Promise<{ slug: string }>;
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

function firstParam(value: string | string[] | undefined) {
    return Array.isArray(value) ? value[0] : value;
}

function formatDate(date: Date | string) {
    return new Date(date).toLocaleDateString("ne-NP", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

function postUrl(post: { slug: string }) {
    return `/post/${post.slug}`;
}

function PageImage({ src, alt, sizes }: { src?: string; alt: string; sizes: string }) {
    return src ? (
        <Image src={src} alt={alt} fill sizes={sizes} className="object-cover transition duration-500 group-hover:scale-105" />
    ) : (
        <div className="flex h-full w-full items-center justify-center bg-slate-100 text-4xl text-slate-300">📰</div>
    );
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
    const { slug } = await params;
    const category = await CategoryModel.findBySlug(slug);
    if (!category) return { title: "Category Not Found" };
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://MeroNepalTv.com";
    const description = category.description && category.description !== category.name
        ? stripHtmlTags(category.description)
        : `${category.name} - ताजा समाचार, अपडेट र जानकारी`;
    return {
        title: category.name,
        description,
        alternates: { canonical: `${siteUrl}/category/${slug}` },
        openGraph: { title: category.name, description, url: `${siteUrl}/category/${slug}`, siteName: "MeroNepalTv", type: "website", locale: "ne_NP" },
    };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
    const { slug } = await params;
    const query = searchParams ? await searchParams : {};
    const pageValue = Number.parseInt(firstParam(query.page) || "1", 10);
    const currentPage = Number.isFinite(pageValue) && pageValue > 0 ? pageValue : 1;
    const category = await CategoryModel.findBySlug(slug);
    if (!category) notFound();

    const subcategories = await CategoryModel.findByParentId(category._id.toString());
    const selectedSlug = firstParam(query.category);
    const selectedCategory = selectedSlug
        ? subcategories.find((subcat) => subcat.slug === selectedSlug)
        : undefined;
    const categoryNames = selectedCategory
        ? [selectedCategory.name]
        : [category.name, ...subcategories.map((subcat) => subcat.name)];
    const [paginatedData, popularPosts] = await Promise.all([
        PostModel.paginateByCategoryNames(categoryNames, currentPage, 20),
        PostModel.popularByCategoryNames(category.name === "समाचार" ? [category.name, ...subcategories.map((subcat) => subcat.name)] : categoryNames),
    ]);
    const posts = paginatedData.posts;
    const totalCount = paginatedData.total;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://MeroNepalTv.com";
    const filterHref = (filter?: string, page?: number) => {
        const params = new URLSearchParams();
        if (filter) params.set("category", filter);
        if (page && page > 1) params.set("page", String(page));
        const suffix = params.toString();
        return `/category/${slug}${suffix ? `?${suffix}` : ""}`;
    };

    return (
        <div className="min-h-screen bg-[#f7f9fc]">
            <Header />
            <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "BreadcrumbList",
                    itemListElement: [
                        { "@type": "ListItem", position: 1, name: "गृहपृष्ठ", item: siteUrl },
                        { "@type": "ListItem", position: 2, name: category.name, item: `${siteUrl}/category/${slug}` },
                    ],
                }) }} />

                <nav className="mb-6 flex items-center gap-2 text-xs text-slate-500" aria-label="Breadcrumb">
                    <Link href="/" className="font-medium hover:text-red-600">गृहपृष्ठ</Link>
                    <span>›</span>
                    <span className="font-semibold text-slate-800">{category.name}</span>
                </nav>

                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-[#12233f] sm:text-4xl">{category.name}</h1>
                        <p className="mt-1 text-sm text-slate-500">{category.description || "देश तथा विदेशका ताजा समाचार, घटनाक्रम र महत्वपूर्ण अपडेटहरू"}</p>
                    </div>
                    <span className="text-xs font-medium text-slate-400">{totalCount.toLocaleString("ne-NP")} समाचार</span>
                </div>

                <div className="mb-7 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none]">
                    <Link href={filterHref()} className={`shrink-0 rounded-lg px-4 py-2 text-xs font-semibold transition ${!selectedCategory ? "bg-red-600 text-white shadow-md shadow-red-200" : "border border-slate-200 bg-white text-slate-600 hover:border-red-200 hover:text-red-600"}`}>सबै</Link>
                    {subcategories.map((subcat) => (
                        <Link key={subcat._id.toString()} href={filterHref(subcat.slug)} className={`shrink-0 rounded-lg px-4 py-2 text-xs font-semibold transition ${selectedCategory?._id.toString() === subcat._id.toString() ? "bg-red-600 text-white shadow-md shadow-red-200" : "border border-slate-200 bg-white text-slate-600 hover:border-red-200 hover:text-red-600"}`}>{subcat.name}</Link>
                    ))}
                </div>

                <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_310px]">
                    <section>
                        {posts.length === 0 ? (
                            <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center text-slate-500">कुनै प्रकाशित समाचार उपलब्ध छैन।</div>
                        ) : (
                            <>
                                <div className="mb-8 grid gap-4 md:grid-cols-[1.35fr_1fr]">
                                    <FeaturedCard post={posts[0]} categoryName={posts[0].category || category.name} />
                                    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-1">
                                        {posts.slice(1, 3).map((post) => <SmallFeaturedCard key={post._id.toString()} post={post} categoryName={post.category || category.name} />)}
                                    </div>
                                </div>
                                <div className="mb-4 flex items-center justify-between">
                                    <h2 className="flex items-center gap-2 text-xl font-bold text-[#12233f]"><span className="h-6 w-1 rounded-full bg-red-600" />सबै समाचार</h2>
                                </div>
                                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                                    {posts.slice(3).map((post) => <NewsCard key={post._id.toString()} post={post} categoryName={post.category || category.name} />)}
                                </div>
                                <Pagination currentPage={currentPage} totalPages={paginatedData.pages} filter={selectedSlug} href={filterHref} />
                            </>
                        )}
                    </section>

                    <aside className="space-y-5">
                        <PopularNews posts={popularPosts} />
                        <SubcategoryPanel categories={subcategories} />
                        <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#063d83] via-[#1768bb] to-[#e51f35] p-5 text-white shadow-lg">
                            <Megaphone className="mb-3 h-7 w-7" />
                            <h3 className="text-xl font-bold">ताजा समाचार तपाईको हातमा</h3>
                            <p className="mt-1 text-sm text-blue-100">जहाँ भए पनि, जतिबेला पनि</p>
                            <Link href="/contact" className="mt-5 inline-flex rounded-lg bg-red-600 px-4 py-2 text-xs font-bold hover:bg-red-500">थप पढ्नुहोस् →</Link>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <Mail className="mb-2 h-6 w-6 text-red-600" />
                            <h3 className="font-bold text-[#12233f]">न्युजलेटर</h3>
                            <p className="mt-1 text-xs text-slate-500">ताजा समाचार सिधै इनबक्समा पाउनुहोस्।</p>
                            <div className="mt-4 -mx-2">
                                <NewsletterForm
                                    title=""
                                    description=""
                                    accentColor="#e61e2b"
                                    textColor="#475569"
                                    source="category"
                                />
                            </div>
                        </div>
                    </aside>
                </div>
            </main>
            <FooterWrapper />
        </div>
    );
}

type PostCardPost = {
    _id: { toString(): string };
    title: string;
    slug: string;
    imageUrl?: string;
    excerpt?: string;
    category?: string;
    createdAt: Date;
    viewCount?: number;
};

function FeaturedCard({ post, categoryName }: { post: PostCardPost; categoryName: string }) {
    return <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-xl">
        <Link href={postUrl(post)} className="block">
            <div className="relative aspect-[16/9] overflow-hidden bg-slate-100"><PageImage src={post.imageUrl} alt={post.title} sizes="(max-width: 768px) 100vw, 60vw" /><span className="absolute left-3 top-3 rounded bg-red-600 px-2.5 py-1 text-[10px] font-bold text-white">{categoryName}</span></div>
            <div className="p-5"><h2 className="line-clamp-2 text-xl font-bold leading-snug text-[#12233f] group-hover:text-red-600">{post.title}</h2>{post.excerpt && <p className="mt-2 line-clamp-2 text-sm text-slate-500">{stripHtmlTags(post.excerpt)}</p>}<PostMeta post={post} /></div>
        </Link>
    </article>;
}

function SmallFeaturedCard({ post, categoryName }: { post: PostCardPost; categoryName: string }) {
    return <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-lg">
        <Link href={postUrl(post)} className="flex h-full gap-3 p-3 sm:block">
            <div className="relative aspect-[16/10] w-36 shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:w-auto"><PageImage src={post.imageUrl} alt={post.title} sizes="(max-width: 768px) 140px, 30vw" /><span className="absolute left-2 top-2 rounded bg-red-600 px-2 py-1 text-[9px] font-bold text-white">{categoryName}</span></div>
            <div className="p-1 sm:p-3 sm:pt-2"><h3 className="line-clamp-3 text-sm font-bold leading-snug text-[#12233f] group-hover:text-red-600">{post.title}</h3><PostMeta post={post} compact /></div>
        </Link>
    </article>;
}

function NewsCard({ post, categoryName }: { post: PostCardPost; categoryName: string }) {
    return <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
        <Link href={postUrl(post)}>
            <div className="relative aspect-[16/10] overflow-hidden bg-slate-100"><PageImage src={post.imageUrl} alt={post.title} sizes="(max-width: 640px) 100vw, (max-width: 1280px) 33vw, 280px" /><span className="absolute left-3 top-3 rounded bg-red-600 px-2 py-1 text-[9px] font-bold text-white">{categoryName}</span></div>
            <div className="p-4"><h3 className="line-clamp-2 text-base font-bold leading-snug text-[#12233f] group-hover:text-red-600">{post.title}</h3><PostMeta post={post} compact /></div>
        </Link>
    </article>;
}

function PostMeta({ post, compact = false }: { post: PostCardPost; compact?: boolean }) {
    return <div className={`mt-3 flex items-center gap-3 text-[10px] text-slate-400 ${compact ? "mt-2" : ""}`}><span className="flex items-center gap-1"><CalendarDays size={11} />{formatDate(post.createdAt)}</span>{typeof post.viewCount === "number" && <span className="flex items-center gap-1"><Eye size={11} />{post.viewCount.toLocaleString("ne-NP")}</span>}</div>;
}

function PopularNews({ posts }: { posts: PostCardPost[] }) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><h2 className="mb-3 border-b border-slate-100 pb-3 text-lg font-bold text-[#12233f]">लोकप्रिय समाचार</h2><div className="space-y-3">{posts.map((post, index) => <Link key={post._id.toString()} href={postUrl(post)} className="group flex gap-2.5 border-b border-slate-100 pb-3 last:border-0 last:pb-0"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">{index + 1}</span><div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100"><PageImage src={post.imageUrl} alt={post.title} sizes="80px" /></div><div className="min-w-0"><h3 className="line-clamp-2 text-xs font-semibold leading-snug text-slate-700 group-hover:text-red-600">{post.title}</h3><p className="mt-1 text-[10px] text-slate-400">{formatDate(post.createdAt)}</p></div></Link>)}</div></div>;
}

function SubcategoryPanel({ categories }: { categories: { _id: { toString(): string }; name: string; slug: string }[] }) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><h2 className="mb-3 border-b border-slate-100 pb-3 text-lg font-bold text-[#12233f]">सम्बन्धित उपश्रेणी</h2><div className="space-y-2">{categories.map((category) => <Link key={category._id.toString()} href={`/category/${category.slug}`} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-xs text-slate-600 transition hover:border-red-200 hover:text-red-600"><span>{category.name}</span><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px]">→</span></Link>)}</div></div>;
}

function Pagination({ currentPage, totalPages, filter, href }: { currentPage: number; totalPages: number; filter?: string; href: (filter?: string, page?: number) => string }) {
    if (totalPages <= 1) return null;
    const pages = Array.from({ length: Math.min(totalPages, 5) }, (_, index) => index + 1);
    return <nav className="mt-8 flex items-center justify-center gap-1.5" aria-label="Pagination"><Link href={href(filter, Math.max(1, currentPage - 1))} className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:text-red-600"><ChevronLeft size={16} /></Link>{pages.map((page) => <Link key={page} href={href(filter, page)} className={`rounded-lg px-3 py-2 text-xs font-semibold ${currentPage === page ? "bg-blue-600 text-white" : "border border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-600"}`}>{page}</Link>)}{totalPages > 5 && <span className="px-1 text-slate-400">...</span>}{totalPages > 5 && <Link href={href(filter, totalPages)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:text-blue-600">{totalPages}</Link>}<Link href={href(filter, Math.min(totalPages, currentPage + 1))} className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:text-red-600"><ChevronRight size={16} /></Link></nav>;
}
