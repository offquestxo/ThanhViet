#!/usr/bin/env node
// Minimal content-loading tool — spec Section 7 explicitly allows the
// content pipeline to "start as a spreadsheet import" for Phase 1. This is
// that, in script form: point it at a JSON file shaped like
// content/units/unit-1.example.json and it upserts a unit (optionally
// under a Collection) + its chunks (sentence/phrase-level, per Section 1a)
// + the Word entries each chunk references for Tone Tuner purposes.
//
// Collection grouping is optional and additive (migration 0004) — a
// content file without a "collection" key still works exactly as before,
// leaving the unit's collection_id untouched/null.
//
// Uses the admin (secret-key) client because it needs to write to
// units/chunks/words/chunk_words, which have no client-side INSERT policy
// on purpose — normal users (even signed in) can't write lesson content,
// only this trusted, locally-run script can. Never expose this script's
// logic to a web route without adding real authorization first.
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

if (!unitData.title || !Array.isArray(unitData.chunks)) {
  console.error('Content file must have a "title" and a "chunks" array.');
  process.exit(1);
}

const supabase = createClient(url, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// --- Collection: find-or-create by title, same best-effort match
// convention as everything else here (no DB-enforced uniqueness).
// Optional — content files with no "collection" key skip this entirely.
let collectionId = null;
if (unitData.collection?.title) {
  const { data: existingCollection, error: findCollectionError } = await supabase
    .from("collections")
    .select("id, icon_key, theme_key")
    .eq("title", unitData.collection.title)
    .maybeSingle();

  if (findCollectionError) {
    console.error("Error looking up collection:", findCollectionError.message);
    process.exit(1);
  }

  if (existingCollection) {
    collectionId = existingCollection.id;
    console.log(
      `Collection "${unitData.collection.title}" already exists (${collectionId}) — reusing it.`
    );

    // Backfill icon_key/theme_key (0005 — controlled presentation
    // metadata) if the content file specifies values that differ from
    // what's already there. Same backfill pattern as collection_id above.
    const updates = {};
    if (unitData.collection.icon_key && unitData.collection.icon_key !== existingCollection.icon_key) {
      updates.icon_key = unitData.collection.icon_key;
    }
    if (unitData.collection.theme_key && unitData.collection.theme_key !== existingCollection.theme_key) {
      updates.theme_key = unitData.collection.theme_key;
    }
    if (Object.keys(updates).length > 0) {
      const { error: updateCollectionError } = await supabase
        .from("collections")
        .update(updates)
        .eq("id", collectionId);

      if (updateCollectionError) {
        console.error("Error backfilling collection metadata:", updateCollectionError.message);
        process.exit(1);
      }
      console.log(`Updated collection metadata for "${unitData.collection.title}":`, updates);
    }
  } else {
    const { data: newCollection, error: insertCollectionError } = await supabase
      .from("collections")
      .insert({
        title: unitData.collection.title,
        description: unitData.collection.description ?? null,
        icon_key: unitData.collection.icon_key ?? undefined,
        theme_key: unitData.collection.theme_key ?? undefined,
      })
      .select("id")
      .single();

    if (insertCollectionError) {
      console.error("Error creating collection:", insertCollectionError.message);
      process.exit(1);
    }
    collectionId = newCollection.id;
    console.log(`Created collection "${unitData.collection.title}" (${collectionId}).`);
  }
}

// --- Unit: find-or-create by title. Titles aren't declared unique in the
// schema, so this is a best-effort match, not a DB-enforced guarantee —
// fine for one founder seeding content by hand, revisit if that changes.
let unitId;
const { data: existingUnit, error: findUnitError } = await supabase
  .from("units")
  .select("id, collection_id")
  .eq("title", unitData.title)
  .maybeSingle();

if (findUnitError) {
  console.error("Error looking up unit:", findUnitError.message);
  process.exit(1);
}

if (existingUnit) {
  unitId = existingUnit.id;
  console.log(`Unit "${unitData.title}" already exists (${unitId}) — reusing it.`);

  // Backfill collection_id on a pre-existing unit if the content file now
  // specifies one and the unit doesn't have it yet — the live "Unit 1 —
  // Greetings" row predates the collections feature and needs exactly
  // this to actually pick one up.
  if (collectionId && existingUnit.collection_id !== collectionId) {
    const { error: updateUnitError } = await supabase
      .from("units")
      .update({ collection_id: collectionId })
      .eq("id", unitId);

    if (updateUnitError) {
      console.error("Error backfilling unit's collection_id:", updateUnitError.message);
      process.exit(1);
    }
    console.log(`Linked unit "${unitData.title}" to collection ${collectionId}.`);
  }
} else {
  const { data: newUnit, error: insertUnitError } = await supabase
    .from("units")
    .insert({
      title: unitData.title,
      order: unitData.order ?? 0,
      source_reference: unitData.source_reference ?? null,
      collection_id: collectionId,
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

// --- Words: find-or-create by vietnamese_text alone. Words are no longer
// unit-scoped (Section 9 revision, migration 0003) — they're a shared
// global registry reached via chunk_words, so the same word (e.g. reused
// across chunks or units) resolves to one row rather than being
// re-inserted per chunk.
async function findOrCreateWord(word) {
  const { data: existingWord, error: findError } = await supabase
    .from("words")
    .select("id")
    .eq("vietnamese_text", word.vietnamese_text)
    .maybeSingle();

  if (findError) {
    console.error(
      `Error looking up word "${word.vietnamese_text}":`,
      findError.message
    );
    return null;
  }

  if (existingWord) {
    return { id: existingWord.id, created: false };
  }

  const { data: newWord, error: insertError } = await supabase
    .from("words")
    .insert({
      vietnamese_text: word.vietnamese_text,
      english_text: word.english_text,
      tone_pattern: word.tone_pattern ?? null,
      audio_url: word.audio_url ?? null,
    })
    .select("id")
    .single();

  if (insertError) {
    console.error(
      `Error inserting word "${word.vietnamese_text}":`,
      insertError.message
    );
    return null;
  }

  return { id: newWord.id, created: true };
}

// --- Chunks: find-or-create by (unit_id, vietnamese_text) — same
// best-effort match convention as units above.
let chunksCreated = 0;
let chunksSkipped = 0;
let wordsCreated = 0;
let wordsSkipped = 0;
let chunkWordsCreated = 0;
let chunkWordsSkipped = 0;

for (const [chunkIndex, chunk] of unitData.chunks.entries()) {
  if (!chunk.vietnamese_text || !chunk.english_text) {
    console.warn(
      "Skipping chunk missing vietnamese_text/english_text:",
      chunk
    );
    continue;
  }

  const { data: existingChunk, error: findChunkError } = await supabase
    .from("chunks")
    .select("id")
    .eq("unit_id", unitId)
    .eq("vietnamese_text", chunk.vietnamese_text)
    .maybeSingle();

  if (findChunkError) {
    console.error(
      `Error looking up chunk "${chunk.vietnamese_text}":`,
      findChunkError.message
    );
    continue;
  }

  let chunkId;
  if (existingChunk) {
    chunkId = existingChunk.id;
    chunksSkipped++;
  } else {
    const { data: newChunk, error: insertChunkError } = await supabase
      .from("chunks")
      .insert({
        unit_id: unitId,
        vietnamese_text: chunk.vietnamese_text,
        english_text: chunk.english_text,
        source_context: chunk.source_context ?? null,
        audio_url: chunk.audio_url ?? null,
        structural_concept: chunk.structural_concept ?? "none",
        display_order: chunk.display_order ?? chunkIndex,
      })
      .select("id")
      .single();

    if (insertChunkError) {
      console.error(
        `Error inserting chunk "${chunk.vietnamese_text}":`,
        insertChunkError.message
      );
      continue;
    }
    chunkId = newChunk.id;
    chunksCreated++;
  }

  // --- ChunkWords: each chunk lists the subset of Word entries it wants
  // tracked for Tone Tuner drills (not a full tokenization of the chunk).
  const words = Array.isArray(chunk.words) ? chunk.words : [];
  for (const [wordIndex, word] of words.entries()) {
    if (!word.vietnamese_text || !word.english_text) {
      console.warn(
        `Skipping word missing vietnamese_text/english_text in chunk "${chunk.vietnamese_text}":`,
        word
      );
      continue;
    }

    const wordResult = await findOrCreateWord(word);
    if (!wordResult) continue;
    if (wordResult.created) {
      wordsCreated++;
    } else {
      wordsSkipped++;
    }

    const { data: existingLink, error: findLinkError } = await supabase
      .from("chunk_words")
      .select("chunk_id")
      .eq("chunk_id", chunkId)
      .eq("word_id", wordResult.id)
      .maybeSingle();

    if (findLinkError) {
      console.error(
        `Error looking up chunk_words link for "${word.vietnamese_text}":`,
        findLinkError.message
      );
      continue;
    }

    if (existingLink) {
      chunkWordsSkipped++;
      continue;
    }

    const { error: insertLinkError } = await supabase
      .from("chunk_words")
      .insert({
        chunk_id: chunkId,
        word_id: wordResult.id,
        display_order: wordIndex,
      });

    if (insertLinkError) {
      console.error(
        `Error linking word "${word.vietnamese_text}" to chunk "${chunk.vietnamese_text}":`,
        insertLinkError.message
      );
      continue;
    }

    chunkWordsCreated++;
  }
}

console.log(
  `Done. Chunks: ${chunksCreated} created, ${chunksSkipped} already existed. ` +
    `Words: ${wordsCreated} created, ${wordsSkipped} already existed. ` +
    `Chunk-word links: ${chunkWordsCreated} created, ${chunkWordsSkipped} already existed.`
);
