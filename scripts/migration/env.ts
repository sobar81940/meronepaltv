/**
 * Environment loader for the standalone posts migration.
 *
 * Loads `.env.local` the same way Next.js does (via `@next/env`) so the
 * migration sees exactly the same variables the application does. Falls back
 * to a tiny manual parser if `@next/env` is unavailable.
 *
 * SECURITY: never prints secret values. Only reports which keys are present.
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export interface MigrationEnv {
    MONGODB_URI: string;
    MONGO_DB_NAME: string;
    R2_ACCOUNT_ID: string;
    R2_BUCKET_NAME: string;
    R2_ENDPOINT: string;
    R2_ACCESS_KEY_ID: string;
    R2_SECRET_ACCESS_KEY: string;
    R2_PUBLIC_URL: string;
}

// Fixed target per migration spec (Option A). The app models also hardcode this.
const TARGET_DB_NAME = "meronepaltv";

let loaded = false;

function loadWithNextEnv(projectDir: string): boolean {
    try {
        // Lazy require so the script still runs if @next/env is missing.
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { loadEnvConfig } = require("@next/env") as {
            loadEnvConfig: (dir: string, dev?: boolean) => unknown;
        };
        loadEnvConfig(projectDir, true);
        return true;
    } catch {
        return false;
    }
}

function loadManually(projectDir: string): void {
    const envPath = join(projectDir, ".env.local");
    const content = readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const idx = trimmed.indexOf("=");
        if (idx === -1) continue;
        const key = trimmed.slice(0, idx).trim();
        if (process.env[key] !== undefined) continue; // don't clobber real env
        process.env[key] = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
    }
}

/**
 * Absolute path to the project root.
 *
 * The npm scripts run from the project root, so process.cwd() is the project
 * root. We still walk upward defensively to locate the folder that contains
 * both `backup/` and `package.json`, so the scripts also work if invoked from
 * a subdirectory.
 */
export function projectRoot(): string {
    let dir = process.cwd();
    for (let i = 0; i < 6; i++) {
        if (existsSync(join(dir, "package.json")) && existsSync(join(dir, "backup"))) {
            return dir;
        }
        const parent = join(dir, "..");
        if (parent === dir) break;
        dir = parent;
    }
    return process.cwd();
}

function requireVar(name: keyof MigrationEnv): string {
    const value = process.env[name]?.trim();
    if (!value) {
        throw new Error(`Missing required environment variable: ${name} (set it in .env.local)`);
    }
    return value;
}

/**
 * Load and return the validated migration environment.
 * Idempotent: safe to call multiple times.
 */
export function loadMigrationEnv(): MigrationEnv {
    const root = projectRoot();
    if (!loaded) {
        if (!loadWithNextEnv(root)) {
            loadManually(root);
        }
        loaded = true;
    }

    const r2AccountId = process.env.R2_ACCOUNT_ID?.trim() || "";
    const r2Endpoint =
        process.env.R2_ENDPOINT?.trim() ||
        (r2AccountId ? `https://${r2AccountId}.r2.cloudflarestorage.com` : "");

    const env: MigrationEnv = {
        MONGODB_URI: requireVar("MONGODB_URI"),
        MONGO_DB_NAME: TARGET_DB_NAME,
        R2_ACCOUNT_ID: r2AccountId,
        R2_BUCKET_NAME: requireVar("R2_BUCKET_NAME"),
        R2_ENDPOINT: r2Endpoint,
        R2_ACCESS_KEY_ID: requireVar("R2_ACCESS_KEY_ID"),
        R2_SECRET_ACCESS_KEY: requireVar("R2_SECRET_ACCESS_KEY"),
        R2_PUBLIC_URL: requireVar("R2_PUBLIC_URL").replace(/\/+$/, ""),
    };

    if (!env.R2_ENDPOINT) {
        throw new Error("Missing R2 endpoint: set R2_ENDPOINT or R2_ACCOUNT_ID in .env.local");
    }

    return env;
}

/** Redact a MongoDB URI's credentials for safe logging. */
export function redactMongoUri(uri: string): string {
    return uri.replace(/\/\/([^:/@]+):([^@]+)@/, "//$1:****@");
}

/** Print a non-secret summary of which required vars are present. */
export function printEnvSummary(env: MigrationEnv): void {
    console.log("Environment loaded:");
    console.log(`   MONGODB_URI:        ${redactMongoUri(env.MONGODB_URI)}`);
    console.log(`   target database:    ${env.MONGO_DB_NAME}`);
    console.log(`   R2_BUCKET_NAME:     ${env.R2_BUCKET_NAME}`);
    console.log(`   R2_ENDPOINT:        ${env.R2_ENDPOINT}`);
    console.log(`   R2_PUBLIC_URL:      ${env.R2_PUBLIC_URL}`);
    console.log(`   R2_ACCESS_KEY_ID:   ${env.R2_ACCESS_KEY_ID ? "present" : "MISSING"}`);
    console.log(`   R2_SECRET_ACCESS_KEY: ${env.R2_SECRET_ACCESS_KEY ? "present" : "MISSING"}`);
}
