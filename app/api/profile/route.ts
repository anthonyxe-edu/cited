import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// camelCase (app) ↔ snake_case (DB)
function toDb(body: Record<string, unknown>) {
  return {
    age_range:         body.ageRange,
    sex:               body.sex,
    activity_level:    body.activityLevel,
    goals:             body.goals,
    diet_pattern:      body.dietPattern,
    sleep_quality:     body.sleepQuality,
    health_conditions: body.healthConditions,
    supplements:       body.supplements,
  };
}

function fromDb(row: Record<string, unknown>) {
  return {
    ageRange:         row.age_range,
    sex:              row.sex,
    activityLevel:    row.activity_level,
    goals:            row.goals,
    dietPattern:      row.diet_pattern,
    sleepQuality:     row.sleep_quality,
    healthConditions: row.health_conditions,
    supplements:      row.supplements,
  };
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("profiles")
    .select("age_range,sex,activity_level,goals,diet_pattern,sleep_quality,health_conditions,supplements")
    .eq("id", user.id)
    .single();

  return NextResponse.json(data ? fromDb(data) : {});
}

export async function PUT(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { data, error } = await supabase
    .from("profiles")
    .upsert({ id: user.id, ...toDb(body) })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(fromDb(data));
}
