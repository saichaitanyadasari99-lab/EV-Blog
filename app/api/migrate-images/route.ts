import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { UTApi, UTFile } from "uploadthing/server";
import { Buffer } from "buffer";

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() {},
      },
    },
  );
}

function isSupabaseUrl(url: string | null): boolean {
  return !!url && (url.includes("supabase.co/storage") || url.includes("storage/v1/object"));
}

async function downloadImage(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch {
    return null;
  }
}

async function uploadToUploadThing(buffer: Buffer, fileName: string): Promise<string | null> {
  try {
    const file = new UTFile([buffer], fileName);
    const utapi = new UTApi();
    
    const result = await utapi.uploadFiles(file);
    
    if (!result) return null;
    
    let url: string | null = null;
    if (Array.isArray(result) && result[0]?.url) {
      url = result[0].url;
    } else if (result && typeof result === 'object' && 'url' in result) {
      url = (result as Record<string, unknown>).url as string;
    }
    
    return url;
  } catch (error) {
    console.error("Upload error:", error);
    return null;
  }
}

export async function POST() {
  const supabase = await getSupabase();
  const results = { migrated: 0, failed: 0, errors: [] as string[] };
  
  try {
    // Fetch all posts with cover images
    const { data: posts, error } = await supabase
      .from("posts")
      .select("id, title, slug, cover_url")
      .not("cover_url", "is", null);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Filter to only Supabase URLs
    const toMigrate = posts?.filter(p => p.cover_url && isSupabaseUrl(p.cover_url)) || [];
    
    console.log(`Found ${toMigrate.length} images to migrate`);
    
    for (const post of toMigrate) {
      console.log(`Migrating: ${post.title}`);
      
      // Download from Supabase
      const buffer = await downloadImage(post.cover_url!);
      if (!buffer) {
        results.failed++;
        results.errors.push(`Failed to download: ${post.title}`);
        continue;
      }
      
      // Upload to UploadThing
      const fileName = `${post.slug}-${Date.now()}.jpg`;
      const newUrl = await uploadToUploadThing(buffer, fileName);
      
      if (!newUrl) {
        results.failed++;
        results.errors.push(`Failed to upload: ${post.title}`);
        continue;
      }
      
      // Update database with new URL
      const { error: updateError } = await supabase
        .from("posts")
        .update({ cover_url: newUrl })
        .eq("id", post.id);
      
      if (updateError) {
        results.failed++;
        results.errors.push(`Failed to update DB: ${post.title}`);
        continue;
      }
      
      console.log(`→ ${newUrl}`);
      results.migrated++;
    }
    
    return NextResponse.json({
      success: true,
      message: `Migrated ${results.migrated} images, ${results.failed} failed`,
      ...results,
    });
    
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: "POST to /api/migrate-images to run migration",
    info: "This will migrate Supabase Storage images to UploadThing",
  });
}