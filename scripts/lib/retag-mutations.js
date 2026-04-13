"use strict";

/**
 * retag-mutations.js — Pure mutation logic for scripts/cas/retag.js
 *
 * No filesystem, no process.exit. Imported by scripts/cas/retag.js for
 * testability. Part of T40 CAS tag quality plan — see:
 *   .claude/skills/shared/CONVENTIONS.md §14
 *   .planning/cas-tag-quality/PLAN.md
 *
 * Entries are keyed by composite (source, candidate, type) since the journal
 * schema has no dedicated id field.
 */

const VALID_CATEGORIES = [
  "domain",
  "technology",
  "concept",
  "technique",
  "pattern",
  "applicability",
  "quality",
  "taxonomic",
];

function entryKey(e) {
  return `${e.source}|${e.candidate}|${e.type}`;
}

/**
 * Validate a single batch entry. Returns an array of error messages
 * (empty when valid). Extracted from validateBatchShape to keep the
 * top-level function within the cognitive-complexity budget.
 */
function validateBatchEntry(entry, index) {
  if (!entry || typeof entry !== "object") {
    return [`entries[${index}]: must be an object`];
  }
  const errors = [];
  if (typeof entry.source !== "string" || !entry.source) {
    errors.push(`entries[${index}]: source must be non-empty string`);
  }
  if (typeof entry.candidate !== "string" || !entry.candidate) {
    errors.push(`entries[${index}]: candidate must be non-empty string`);
  }
  if (typeof entry.type !== "string" || !entry.type) {
    errors.push(`entries[${index}]: type must be non-empty string`);
  }
  if (!Array.isArray(entry.tags)) {
    errors.push(`entries[${index}]: tags must be an array`);
  }
  return errors;
}

/**
 * Validate a single new_vocabulary item. Returns an array of error messages.
 */
function validateNewVocabItem(nv, index) {
  if (!nv || typeof nv !== "object") {
    return [`new_vocabulary[${index}]: must be an object`];
  }
  const errors = [];
  if (typeof nv.tag !== "string" || !nv.tag) {
    errors.push(`new_vocabulary[${index}]: tag must be non-empty string`);
  }
  if (typeof nv.category !== "string" || !VALID_CATEGORIES.includes(nv.category)) {
    errors.push(`new_vocabulary[${index}]: category must be one of ${VALID_CATEGORIES.join("/")}`);
  }
  if (typeof nv.definition !== "string" || nv.definition.trim().length < 10) {
    errors.push(`new_vocabulary[${index}]: definition must be a string of at least 10 characters`);
  }
  return errors;
}

/**
 * Validate a batch file's top-level shape.
 * @param {object} batch
 * @returns {{valid: boolean, errors: string[]}}
 */
function validateBatchShape(batch) {
  const errors = [];
  if (!batch || typeof batch !== "object") {
    errors.push("batch must be an object");
    return { valid: false, errors };
  }
  if (typeof batch.batch_id !== "string" || batch.batch_id.trim() === "") {
    errors.push("batch_id must be a non-empty string");
  }
  if (Array.isArray(batch.entries)) {
    for (let i = 0; i < batch.entries.length; i++) {
      errors.push(...validateBatchEntry(batch.entries[i], i));
    }
  } else {
    errors.push("entries must be an array");
  }
  if (batch.new_vocabulary !== undefined) {
    if (Array.isArray(batch.new_vocabulary)) {
      for (let i = 0; i < batch.new_vocabulary.length; i++) {
        errors.push(...validateNewVocabItem(batch.new_vocabulary[i], i));
      }
    } else {
      errors.push("new_vocabulary must be an array when present");
    }
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Find the reason a new vocabulary tag cannot be added, if any.
 * Returns a human-readable suffix (e.g. "already exists (category: X)") or
 * null when the tag is safe to add. Keeps addNewVocabulary's control flow
 * flat and lets it skip the brittle "inspect last error" heuristic.
 */
function findVocabularyAdditionConflict(vocab, tag) {
  if (vocab.tags[tag]) {
    return `already exists (category: ${vocab.tags[tag].category})`;
  }
  const synonym = vocab.synonyms?.[tag];
  if (synonym) {
    return `is already a synonym for "${synonym}"`;
  }
  if (vocab.forbidden) {
    for (const arr of Object.values(vocab.forbidden)) {
      if (Array.isArray(arr) && arr.includes(tag)) {
        return "is in the forbidden list";
      }
    }
  }
  return null;
}

/**
 * Add new vocabulary entries. Returns a new vocab object (does not mutate input).
 */
function addNewVocabulary(vocab, newVocabList) {
  const errors = [];
  const out = structuredClone(vocab);
  for (const nv of newVocabList) {
    const { tag, category, definition } = nv;
    const conflict = findVocabularyAdditionConflict(out, tag);
    if (conflict) {
      errors.push(`new_vocabulary: tag "${tag}" ${conflict}`);
      continue;
    }
    out.tags[tag] = {
      category,
      definition: definition.trim(),
      count: 0,
      added_at: new Date().toISOString().slice(0, 10),
    };
  }
  return { vocab: out, errors };
}

/**
 * Flatten vocab.forbidden (an object of category -> string[]) into a Set
 * for O(1) membership checks during classification. Returns an empty Set
 * when vocab.forbidden is missing or not an object.
 */
function buildForbiddenFlatSet(vocab) {
  const set = new Set();
  if (vocab.forbidden) {
    for (const arr of Object.values(vocab.forbidden)) {
      if (Array.isArray(arr)) for (const t of arr) set.add(t);
    }
  }
  return set;
}

/**
 * Classify a tag list against vocabulary + synonyms + forbidden.
 * Returns:
 *   canonicalTags     — de-duplicated tags after synonym resolution
 *   invalid           — tags not found in vocabulary (post-synonym)
 *   forbidden         — tags that match the forbidden lists
 *   synonymsApplied   — map of old → canonical for any synonyms resolved
 */
function classifyTags(tags, vocab) {
  const synonymsApplied = {};
  const canonicalTags = [];
  const invalid = [];
  const forbidden = [];
  const forbiddenFlat = buildForbiddenFlatSet(vocab);
  for (const raw of tags) {
    const trimmed = String(raw).trim();
    if (!trimmed) continue;
    if (forbiddenFlat.has(trimmed)) {
      forbidden.push({ tag: trimmed });
      continue;
    }
    const synonym = vocab.synonyms?.[trimmed];
    let canonical = trimmed;
    if (synonym) {
      canonical = synonym;
      synonymsApplied[trimmed] = canonical;
    }
    if (!vocab.tags[canonical]) {
      invalid.push({ tag: canonical });
      continue;
    }
    if (!canonicalTags.includes(canonical)) {
      canonicalTags.push(canonical);
    }
  }
  return { canonicalTags, invalid, forbidden, synonymsApplied };
}

/**
 * Count tags in semantic categories (everything except taxonomic).
 */
function semanticCount(tags, vocab) {
  let count = 0;
  for (const tag of tags) {
    const entry = vocab.tags[tag];
    if (!entry) continue;
    if (entry.category !== "taxonomic") count++;
  }
  return count;
}

/**
 * Apply a batch to journal entries.
 * Matches entries by composite (source, candidate, type) key.
 * Returns updated journal entries list + retag report.
 */
function applyBatch(journalEntries, batch, vocab) {
  const entryUpdates = new Map();
  const retagged = [];
  const unmatched = [];
  const entryByKey = new Map();
  for (const e of journalEntries) {
    const k = entryKey(e);
    if (!entryByKey.has(k)) entryByKey.set(k, []);
    entryByKey.get(k).push(e);
  }
  for (const be of batch.entries) {
    const k = `${be.source}|${be.candidate}|${be.type}`;
    const matches = entryByKey.get(k);
    if (!matches || matches.length === 0) {
      unmatched.push(k);
      continue;
    }
    const classified = classifyTags(be.tags, vocab);
    entryUpdates.set(k, classified.canonicalTags);
    retagged.push(k);
  }
  const newJournalEntries = journalEntries.map((e) => {
    const k = entryKey(e);
    if (entryUpdates.has(k)) {
      return { ...e, tags: entryUpdates.get(k) };
    }
    return e;
  });
  return {
    entryUpdates,
    journalEntries: newJournalEntries,
    retagged,
    unmatched,
  };
}

/**
 * Recompute all vocabulary tag counts from the journal entries.
 * Tags not in vocabulary are ignored (not auto-added).
 */
function recomputeCounts(vocab, journalEntries) {
  const out = structuredClone(vocab);
  for (const k of Object.keys(out.tags)) {
    out.tags[k].count = 0;
  }
  for (const e of journalEntries) {
    const tags = e.tags || [];
    for (const t of tags) {
      if (out.tags[t]) {
        out.tags[t].count++;
      }
    }
  }
  out.last_updated = new Date().toISOString().slice(0, 10);
  return out;
}

/**
 * Assert journal invariants preserved across the apply.
 * Throws if any invariant fails.
 */
function assertRegression(rawLinesBefore, rawLinesAfter, batch, applyRes) {
  if (rawLinesBefore.length !== rawLinesAfter.length) {
    throw new Error(
      `regression guard: line count changed ${rawLinesBefore.length} -> ${rawLinesAfter.length}`
    );
  }
  const beforeKeys = new Set();
  for (const { entry } of rawLinesBefore) {
    if (entry) beforeKeys.add(entryKey(entry));
  }
  const afterKeys = new Set();
  for (const { entry } of rawLinesAfter) {
    if (entry) afterKeys.add(entryKey(entry));
  }
  for (const k of beforeKeys) {
    if (!afterKeys.has(k)) {
      throw new Error(`regression guard: entry "${k}" lost during apply`);
    }
  }
  for (const k of applyRes.retagged) {
    if (!afterKeys.has(k)) {
      throw new Error(`regression guard: retargeted key "${k}" not present post-apply`);
    }
  }
}

module.exports = {
  VALID_CATEGORIES,
  entryKey,
  validateBatchShape,
  addNewVocabulary,
  classifyTags,
  semanticCount,
  applyBatch,
  recomputeCounts,
  assertRegression,
};
