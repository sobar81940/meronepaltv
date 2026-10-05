import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";

const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID?.trim() || "";
const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim() || "";
const r2BucketName = process.env.R2_BUCKET_NAME?.trim() || "";
const r2AccountId = process.env.R2_ACCOUNT_ID?.trim() || "";
const r2Endpoint = process.env.R2_ENDPOINT?.trim()
    || (r2AccountId ? `https://${r2AccountId}.r2.cloudflarestorage.com` : "");
const r2PublicUrl = process.env.R2_PUBLIC_URL?.trim() || "";
const useR2 = Boolean(
    r2AccessKeyId
    && r2SecretAccessKey
    && r2BucketName
    && r2Endpoint
    && r2PublicUrl
);

const spacesRegion = process.env.SPACES_REGION?.trim() || "sgp1";
const spacesBucketName = process.env.SPACES_BUCKET_NAME?.trim() || "dunz0";
const bucketName = useR2 ? r2BucketName : spacesBucketName;
const endpoint = useR2
    ? r2Endpoint
    : process.env.SPACES_ENDPOINT?.trim() || `https://${spacesRegion}.digitaloceanspaces.com`;
const publicUrl = (useR2
    ? r2PublicUrl
    : process.env.SPACES_CDN_ENDPOINT?.trim()
        || `https://${spacesBucketName}.${spacesRegion}.cdn.digitaloceanspaces.com`
).replace(/\/+$/, "");

const s3Client = new S3Client({
    endpoint,
    region: useR2 ? "auto" : spacesRegion,
    credentials: {
        accessKeyId: useR2 ? r2AccessKeyId : process.env.SPACES_KEY || "",
        secretAccessKey: useR2 ? r2SecretAccessKey : process.env.SPACES_SECRET || "",
    },
    forcePathStyle: false,
});

async function uploadOGImages() {
    console.log(`🚀 Starting OG image upload to ${useR2 ? "Cloudflare R2" : "DigitalOcean Spaces"}...\n`);

    // Define the images to upload
    const images = [
        {
            localPath: "/Users/aasish/.gemini/antigravity/brain/fd9dfb7d-9db2-424f-9c99-0a8dec3f2496/og_image_rangamanch_1771042557766.png",
            filename: "og-image-rangamanch.png",
            key: "news-portal/og-images/og-image-rangamanch.png",
            description: "Rangamanch News Portal OG Image",
        },
        {
            localPath: "/Users/aasish/.gemini/antigravity/brain/fd9dfb7d-9db2-424f-9c99-0a8dec3f2496/tech_og_image_1771042940488.png",
            filename: "og-image-tech.png",
            key: "news-portal/og-images/og-image-tech.png",
            description: "Modern Tech Website OG Image",
        },
    ];

    for (const image of images) {
        try {
            console.log(`📤 Uploading: ${image.description}`);
            console.log(`   Local: ${path.basename(image.localPath)}`);
            console.log(`   Target: ${image.filename}`);

            // Read the image file
            const fileBuffer = fs.readFileSync(image.localPath);

            // Do not send an object ACL; R2 does not support S3 ACLs and both
            // providers can expose objects through their bucket configuration.
            const command = new PutObjectCommand({
                Bucket: bucketName,
                Key: image.key,
                Body: fileBuffer,
                ContentType: "image/png",
                CacheControl: "max-age=31536000",
            });

            await s3Client.send(command);

            const url = `${publicUrl}/${image.key}`;

            console.log(`✅ Uploaded successfully!`);
            console.log(`   CDN URL: ${url}`);
            console.log(`   Key: ${image.key}\n`);
        } catch (error) {
            console.error(`❌ Failed to upload ${image.description}:`, error);
        }
    }

    console.log("✨ Upload process complete!");
}

// Run the upload
uploadOGImages().catch(console.error);
