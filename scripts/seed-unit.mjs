#!/usr/bin/env node
// Minimal content-loading tool — spec Section 7 explicitly allows the
// content pipeline to "start as a spreadsheet import" for Phase 1. This is
// that, in script form: point it at a JSON file shaped like
// content/units/unit-1.example.json and it upserts a unit + its words.
//
// Uses the admin (secret-key) client because it needs to write to
// units/words, which have no client-side INSERT policy on purpose — normal
// users (even signed in) can't write lesson content, only this
// trusted, locally-run script can. Never expose this script's logic to a
// web route without adding real authorization first.
//
// Usage:
//   node --env-file=.env.local scripts/seed-unit.mjs content/units/unit-1.example.json
// or, via the npm script:
//   npm run seed -- content/units/unit-1.example.json

import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const filePath = process.argv[2];
if (!filePath) {
  console.error(
    "Usage: npm run seed -- <path-to-unit-json>\n" +
      "Example: npm run seed -- content/units/unit-1.example.json"
  );
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;
if (!url || !secretKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY.\n" +
      "Run with: node --env-file=.env.local scripts/seed-unit.mjs <file>"
  );
  process.exit(1);
}

const raw = await readFile(filePath, "utf-8");
const unitData = JSON.parse(raw);

if (!unitData.title || !Array.isArray(unitData.words)) {
  console.error('Content file must have a "title" and a "words" array.');
  process.exit(1);
}

const supabase = createClient(url, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// --- Unit: find-or-create by title. Titles aren't declared unique in the
// schema, so this is a best-effort match, not a DB-enforced guarantee —
// fine for one founder seeding content by hand, revisit if that changes.
let unitId;
const { data: existingUnit, error: findUnitError } = await supabase
  .from("units")
  .select("id")
  .eq("title", unitData.title)
  .maybeSingle();

if (findUnitError) {
  console.error("Error looking up unit:", findUnitError.message);
  process.exit(1);
}

if (existingUnit) {
  unitId = existingUnit.id;
  console.log(`Unit "${unitData.title}" already exists (${unitId}) — reusing it.`);
} else {
  const { data: newUnit, error: insertUnitError } = await supabase
    .from("units")
    .insert({
      title: unitData.title,
      order: unitData.order ?? 0,
      source_reference: unitData.source_reference ?? null,
    })
    .select("id")
    .single();

  if (insertUnitError) {
    console.error("Error creating unit:", insertUnitError.message);
    process.exit(1);
  }
  unitId = newUnit.id;
  console.log(`Created unit "${unitData.title}" (${unitId}).`);
}

// --- Words: find-or-create by (unit_id, vietnamese_text).
let created = 0;
let skipped = 0;

for (const word of unitData.words) {
  if (!word.vietnamese_text || !word.english_text) {
    console.warn("Skipping word missing vietnamese_text/english_text:", word);
    continue;
  }

  const { data: existingWord, error: findWordError } = await supabase
    .from("words")
    .select("id")
    .eq("unit_id", unitId)
    .eq("vietnamese_text", word.vietnamese_text)
    .maybeSingle();

  if (findWordError) {
    console.error(
      `Error looking up word "${word.vietnamese_text}":`,
      findWordError.message
    );
    continue;
  }

  if (existingWord) {
    skipped++;
    continue;
  }

  const { error: insertWordError } = await supabase.from("words").insert({
    unit_id: unitId,
    vietnamese_text: word.vietnamese_text,
    english_text: word.english_text,
    tone_pattern: word.tone_pattern ?? null,
    audio_url: word.audio_url ?? null,
  });

  if (insertWordError) {
    console.error(
      `Error inserting word "${word.vietnamese_text}":`,
      insertWordError.message
    );
    continue;
  }

  created++;
}

console.log(`Done. ${created} word(s) added, ${skipped} already existed.`);
