/**
 * Minimal, read-only MySQL dump parser for the posts migration.
 *
 * It extracts rows from `INSERT INTO \`table\` (...) VALUES (...),(...);`
 * statements for a specific set of tables, WITHOUT importing the dump into a
 * MySQL server and WITHOUT modifying the dump file.
 *
 * The parser is intentionally small and tolerant:
 *   - handles single-quoted strings with backslash escapes (\\', \\\\, \\n ...)
 *   - handles NULL, integers, decimals
 *   - handles multiple value-tuples per INSERT and multiple INSERTs per table
 *   - handles multi-line string values (e.g. HTML content with newlines)
 *
 * It is NOT a general SQL engine; it only understands the shapes mysqldump
 * produces, which is exactly what backup/mero_meronepaltv.sql contains.
 */

import { readFileSync } from "node:fs";

export type SqlValue = string | number | null;
export type SqlRow = Record<string, SqlValue>;

/** Parse the column list from `INSERT INTO \`t\` (\`a\`, \`b\`) VALUES` */
function parseColumnList(segment: string): string[] {
    const open = segment.indexOf("(");
    const close = segment.indexOf(")");
    if (open === -1 || close === -1) return [];
    return segment
        .slice(open + 1, close)
        .split(",")
        .map((c) => c.trim().replace(/^`|`$/g, ""));
}

/**
 * Tokenize the VALUES portion starting at `startIdx` (index of the first "(").
 * Returns an array of tuples (each an array of SqlValue) and the index just
 * past the terminating semicolon.
 */
function parseValues(sql: string, startIdx: number): { tuples: SqlValue[][]; endIdx: number } {
    const tuples: SqlValue[][] = [];
    let i = startIdx;
    const n = sql.length;

    while (i < n) {
        // Skip whitespace and commas between tuples.
        while (i < n && (sql[i] === " " || sql[i] === "\n" || sql[i] === "\r" || sql[i] === "\t" || sql[i] === ",")) {
            i++;
        }
        if (i >= n) break;
        if (sql[i] === ";") {
            i++;
            break;
        }
        if (sql[i] !== "(") {
            // Unexpected; stop to avoid runaway parsing.
            break;
        }

        // Parse one tuple.
        i++; // consume "("
        const row: SqlValue[] = [];
        while (i < n) {
            // Skip leading whitespace before a field.
            while (i < n && (sql[i] === " " || sql[i] === "\n" || sql[i] === "\r" || sql[i] === "\t")) i++;

            if (sql[i] === "'") {
                // Quoted string with backslash escapes.
                i++;
                let str = "";
                while (i < n) {
                    const ch = sql[i];
                    if (ch === "\\") {
                        const next = sql[i + 1];
                        switch (next) {
                            case "n": str += "\n"; break;
                            case "r": str += "\r"; break;
                            case "t": str += "\t"; break;
                            case "0": str += "\0"; break;
                            case "'": str += "'"; break;
                            case '"': str += '"'; break;
                            case "\\": str += "\\"; break;
                            default: str += next ?? ""; break;
                        }
                        i += 2;
                        continue;
                    }
                    if (ch === "'") {
                        // Handle MySQL doubled-quote escaping ('' -> ').
                        if (sql[i + 1] === "'") {
                            str += "'";
                            i += 2;
                            continue;
                        }
                        i++; // consume closing quote
                        break;
                    }
                    str += ch;
                    i++;
                }
                row.push(str);
            } else {
                // Unquoted token: NULL / number (until , or )).
                let token = "";
                while (i < n && sql[i] !== "," && sql[i] !== ")") {
                    token += sql[i];
                    i++;
                }
                const trimmed = token.trim();
                if (trimmed.toUpperCase() === "NULL" || trimmed === "") {
                    row.push(null);
                } else if (/^-?\d+$/.test(trimmed)) {
                    row.push(parseInt(trimmed, 10));
                } else if (/^-?\d*\.\d+$/.test(trimmed)) {
                    row.push(parseFloat(trimmed));
                } else {
                    row.push(trimmed);
                }
            }

            // After a field: skip whitespace, then expect , or )
            while (i < n && (sql[i] === " " || sql[i] === "\n" || sql[i] === "\r" || sql[i] === "\t")) i++;
            if (sql[i] === ",") {
                i++;
                continue;
            }
            if (sql[i] === ")") {
                i++; // consume ")"
                break;
            }
        }
        tuples.push(row);
    }

    return { tuples, endIdx: i };
}

/**
 * Parse all rows for a given table from the dump text.
 * Returns objects keyed by the table's declared column names.
 */
export function parseTableRows(sqlText: string, tableName: string): SqlRow[] {
    const rows: SqlRow[] = [];
    const insertMarker = `INSERT INTO \`${tableName}\``;
    let searchFrom = 0;

    while (true) {
        const insertIdx = sqlText.indexOf(insertMarker, searchFrom);
        if (insertIdx === -1) break;

        // Find "VALUES" after the marker; the column list sits between.
        const valuesIdx = sqlText.indexOf("VALUES", insertIdx);
        if (valuesIdx === -1) break;

        const header = sqlText.slice(insertIdx, valuesIdx);
        const columns = parseColumnList(header);

        // First "(" after VALUES begins the tuples.
        const firstParen = sqlText.indexOf("(", valuesIdx);
        if (firstParen === -1) break;

        const { tuples, endIdx } = parseValues(sqlText, firstParen);
        for (const tuple of tuples) {
            const row: SqlRow = {};
            for (let c = 0; c < columns.length; c++) {
                row[columns[c]] = tuple[c] ?? null;
            }
            rows.push(row);
        }
        searchFrom = endIdx;
    }

    return rows;
}

/** Read the dump file once (read-only). */
export function readDump(dumpPath: string): string {
    return readFileSync(dumpPath, "utf-8");
}

// ---- Typed row shapes for the tables we touch ----

export interface NewsRow {
    id: number;
    language: string | null;
    category_id: number | null;
    auther_id: number | null;
    image: string | null;
    video: string | null;
    video_url: string | null;
    title: string | null;
    slug: string | null;
    content: string | null;
    meta_title: string | null;
    meta_description: string | null;
    is_breaking_news: number | null;
    show_at_slider: number | null;
    show_at_popular: number | null;
    status: number | null;
    is_approved: number | null;
    views: number | null;
    created_at: string | null;
    updated_at: string | null;
}

export interface CategoryRow {
    id: number;
    name: string | null;
    slug: string | null;
}

export interface AdminRow {
    id: number;
    name: string | null;
}

export interface TagRow {
    id: number;
    name: string | null;
}

export interface NewsTagRow {
    news_id: number;
    tag_id: number;
}

export interface ParsedDump {
    news: NewsRow[];
    categoriesById: Map<number, CategoryRow>;
    adminsById: Map<number, AdminRow>;
    tagsById: Map<number, TagRow>;
    tagsByNewsId: Map<number, number[]>; // news_id -> [tag_id,...]
}

/** Parse everything the posts migration needs in one pass over the dump. */
export function parseDump(dumpPath: string): ParsedDump {
    const text = readDump(dumpPath);

    const news = parseTableRows(text, "news") as unknown as NewsRow[];

    const categoriesById = new Map<number, CategoryRow>();
    for (const r of parseTableRows(text, "categories") as unknown as CategoryRow[]) {
        categoriesById.set(r.id, r);
    }

    const adminsById = new Map<number, AdminRow>();
    for (const r of parseTableRows(text, "admins") as unknown as AdminRow[]) {
        adminsById.set(r.id, r);
    }

    const tagsById = new Map<number, TagRow>();
    for (const r of parseTableRows(text, "tags") as unknown as TagRow[]) {
        tagsById.set(r.id, r);
    }

    const tagsByNewsId = new Map<number, number[]>();
    for (const r of parseTableRows(text, "news_tags") as unknown as NewsTagRow[]) {
        if (r.news_id == null || r.tag_id == null) continue;
        const list = tagsByNewsId.get(r.news_id) ?? [];
        list.push(r.tag_id);
        tagsByNewsId.set(r.news_id, list);
    }

    return { news, categoriesById, adminsById, tagsById, tagsByNewsId };
}
