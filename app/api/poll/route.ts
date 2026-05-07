import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function getVoterHash(request: Request): Promise<string> {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0] || request.headers.get("x-real-ip") || "unknown";
  const ua = request.headers.get("user-agent") || "";
  const raw = `${ip}||${ua}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(raw);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function POST(request: Request) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { pollId, optionIndex } = await request.json();

  if (!pollId || optionIndex === undefined || optionIndex < 0) {
    return NextResponse.json({ error: "Missing pollId or optionIndex" }, { status: 400 });
  }

  const voterHash = await getVoterHash(request);

  const { error } = await supabase
    .from("poll_votes")
    .insert({ poll_id: pollId, option_index: optionIndex, voter_hash: voterHash });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Already voted", voted: true }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: results } = await supabase
    .from("poll_votes")
    .select("option_index")
    .eq("poll_id", pollId);

  const counts: Record<number, number> = {};
  for (const row of results || []) {
    const idx = row.option_index as number;
    counts[idx] = (counts[idx] || 0) + 1;
  }

  return NextResponse.json({ voted: true, counts, total: results?.length || 0 });
}

export async function GET(request: Request) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { searchParams } = new URL(request.url);
  const pollId = searchParams.get("pollId");

  if (!pollId) {
    return NextResponse.json({ error: "Missing pollId" }, { status: 400 });
  }

  const { data: results } = await supabase
    .from("poll_votes")
    .select("option_index")
    .eq("poll_id", pollId);

  const counts: Record<number, number> = {};
  for (const row of results || []) {
    const idx = row.option_index as number;
    counts[idx] = (counts[idx] || 0) + 1;
  }

  return NextResponse.json({ counts, total: results?.length || 0 });
}
