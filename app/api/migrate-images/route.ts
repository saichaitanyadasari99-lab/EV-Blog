import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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

async function downloadImage(url: string): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

async function uploadToUploadThing(arrayBuffer: ArrayBuffer, fileName: string): Promise<string | null> {
  try {
    // Use UploadThing's prepared upload API via multipart form
    const formData = new FormData();
    const blob = new Blob([arrayBuffer], { type: "image/jpeg" });
    formData.append("file", blob, fileName);
    
    // Get token from env - works because it's set in Vercel
    const token = process.env.UPLOADTHING_TOKEN;
    if (!token) {
      console.error("No UPLOADTHING_TOKEN in env");
      return null;
    }
    
    const response = await fetch("https://api.uploadthing.com/v6/uploadFiles", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "x-uploadthing-version": "6.12.0",
      },
      body: formData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("UploadThing error:", response.status, errorText);
      return null;
    }
    
    const data = await response.json();
    return data[0]?.url || null;
  } catch (error) {
    console.error("Upload error:", error);
    return null;
  }
}

export async function POST() {
  const supabase = await getSupabase();
  const results = { migrated: 0, failed: 0, errors: [] as string[] };
  
  try {
    const { data: posts, error } = await supabase
      .from("posts")
      .select("id, title, slug, cover_url")
      .not("cover_url", "is", null);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    const toMigrate = posts?.filter(p => p.cover_url && isSupabaseUrl(p.cover_url)) || [];
    
    console.log(`Found ${toMigrate.length} images to migrate`);
    
    for (const post of toMigrate) {
      console.log(`Migrating: ${post.title}`);
      
      const arrayBuffer = await downloadImage(post.cover_url!);
      if (!arrayBuffer) {
        results.failed++;
        results.errors.push(`Download failed: ${post.title}`);
        continue;
      }
      
      const fileName = `${post.slug}-${Date.now()}.jpg`;
      const newUrl = await uploadToUploadThing(arrayBuffer, fileName);
      
      if (!newUrl) {
        results.failed++;
        results.errors.push(`Upload failed: ${post.title}`);
        continue;
      }
      
      const { error: updateError } = await supabase
        .from("posts")
        .update({ cover_url: newUrl })
        .eq("id", post.id);
      
      if (updateError) {
        results.failed++;
        results.errors.push(`DB update failed: ${post.title}`);
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
    message: "POST to migrate-images to run migration",
    info: "Migrates Supabase Storage images to UploadThing",
  });
}