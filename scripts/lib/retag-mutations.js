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
  if (!Array.isArray(batch.entries)) {
    errors.push("entries must be an array");
  } else {
    for (let i = 0; i < batch.entries.length; i++) {
      const e = batch.entries[i];
      if (!e || typeof e !== "object") {
        errors.push(`entries[${i}]: must be an object`);
        continue;
      }
      if (typeof e.source !== "string" || !e.source) {
        errors.push(`entries[${i}]: source must be non-empty string`);
      }
      if (typeof e.candidate !== "string" || !e.candidate) {
        errors.push(`entries[${i}]: candidate must be non-empty string`);
      }
      if (typeof e.type !== "string" || !e.type) {
        errors.push(`entries[${i}]: type must be non-empty string`);
      }
      if (!Array.isArray(e.tags)) {
        errors.push(`entries[${i}]: tags must be an array`);
      }
    }
  }
  if (batch.new_vocabulary !== undefined) {
    if (!Array.isArray(batch.new_vocabulary)) {
      errors.push("new_vocabulary must be an array when present");
    } else {
      for (let i = 0; i < batch.new_vocabulary.length; i++) {
        const nv = batch.new_vocabulary[i];
        if (!nv || typeof nv !== "object") {
          errors.push(`new_vocabulary[${i}]: must be an object`);
          continue;
        }
        if (typeof nv.tag !== "string" || !nv.tag) {
          errors.push(`new_vocabulary[${i}]: tag must be non-empty string`);
        }
        if (typeof nv.category !== "string" || !VALID_CATEGORIES.includes(nv.category)) {
          errors.push(
            `new_vocabulary[${i}]: category must be one of ${VALID_CATEGORIES.join("/")}`
          );
        }
        if (typeof nv.definition !== "string" || nv.definition.trim().length < 10) {
          errors.push(
            `new_vocabulary[${i}]: definition must be a string of at least 10 characters`
          );
        }
      }
    }
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Add new vocabulary entries. Returns a new vocab object (does not mutate input).
 */
function addNewVocabulary(vocab, newVocabList) {
  const errors = [];
  const out = JSON.parse(JSON.stringify(vocab));
  for (const nv of newVocabList) {
    const { tag, category, definition } = nv;
    if (out.tags[tag]) {
      errors.push(
        `new_vocabulary: tag "${tag}" already exists (category: ${out.tags[tag].category})`
      );
      continue;
    }
    if (out.synonyms && out.synonyms[tag]) {
      errors.push(`new_vocabulary: tag "${tag}" is already a synonym for "${out.synonyms[tag]}"`);
      continue;
    }
    if (out.forbidden) {
      for (const arr of Object.values(out.forbidden)) {
        if (Array.isArray(arr) && arr.includes(tag)) {
          errors.push(`new_vocabulary: tag "${tag}" is in the forbidden list`);
          break;
        }
      }
    }
    if (errors.length > 0 && errors[errors.length - 1].includes(`"${tag}"`)) continue;
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
  const forbiddenFlat = [];
  if (vocab.forbidden) {
    for (const arr of Object.values(vocab.forbidden)) {
      if (Array.isArray(arr)) forbiddenFlat.push(...arr);
    }
  }
  for (const raw of tags) {
    const trimmed = String(raw).trim();
    if (!trimmed) continue;
    if (forbiddenFlat.includes(trimmed)) {
      forbidden.push({ tag: trimmed });
      continue;
    }
    let canonical = trimmed;
    if (vocab.synonyms && vocab.synonyms[trimmed]) {
      canonical = vocab.synonyms[trimmed];
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
  let n = 0;
  for (const t of tags) {
    const entry = vocab.tags[t];
    if (!entry) continue;
    if (entry.category !== "taxonomic") n++;
  }
  return n;
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
  const out = JSON.parse(JSON.stringify(vocab));
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
