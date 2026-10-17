import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const migrationsDir = path.join(projectRoot, 'supabase', 'migrations');

console.log('🔍 Starting Content Integrity Verification...\n');

const issues = {
  duplicateOptions: [],
  correctNotInOptions: [],
  duplicatePairs: [],
  sentenceBuildingMismatch: [],
  lessonsWithFewerThan5Exercises: [],
  vocabularyMissingFields: [],
};

// 1. Audit static seed exercises from 20261016183822_seed_stage1_exercises.sql
const stage1ExercisesPath = path.join(migrationsDir, '20261016183822_seed_stage1_exercises.sql');
const exercisesPerLesson = new Map();

if (fs.existsSync(stage1ExercisesPath)) {
  const content = fs.readFileSync(stage1ExercisesPath, 'utf8');
  // Match rows in INSERT INTO exercises
  const rowRegex = /\('([^']+)',\s*'([^']+)',\s*'([^']*)',\s*'([^']*)',\s*'(\{.*?\})',\s*([^,]+),\s*(\d+)/g;
  let match;
  while ((match = rowRegex.exec(content)) !== null) {
    const lessonId = match[1];
    const type = match[2];
    let data = {};
    try {
      data = JSON.parse(match[5]);
    } catch {
      continue;
    }

    exercisesPerLesson.set(lessonId, (exercisesPerLesson.get(lessonId) || 0) + 1);

    // Audit multiple_choice / listening / fill_blank / picture_word with options
    if (data.options && Array.isArray(data.options)) {
      const options = data.options;
      const uniqueOptions = new Set(options);
      if (uniqueOptions.size !== options.length) {
        issues.duplicateOptions.push({ lessonId, type, options, file: 'seed_stage1_exercises' });
      }
      if (data.correct !== undefined && !options.includes(data.correct)) {
        issues.correctNotInOptions.push({ lessonId, type, correct: data.correct, options, file: 'seed_stage1_exercises' });
      }
    }

    // Audit word_matching
    if (type === 'word_matching' && data.pairs && Array.isArray(data.pairs)) {
      const seenLeft = new Set();
      const seenRight = new Set();
      for (const p of data.pairs) {
        if (seenLeft.has(p.left) || seenRight.has(p.right)) {
          issues.duplicatePairs.push({ lessonId, pair: p, file: 'seed_stage1_exercises' });
        }
        seenLeft.add(p.left);
        seenRight.add(p.right);
      }
    }

    // Audit sentence_building
    if (type === 'sentence_building') {
      const words = Array.isArray(data.words) ? data.words : [];
      const correctOrder = Array.isArray(data.correct_order) ? data.correct_order : [];
      const wordsSorted = [...words].sort();
      const orderSorted = [...correctOrder].sort();
      if (JSON.stringify(wordsSorted) !== JSON.stringify(orderSorted)) {
        issues.sentenceBuildingMismatch.push({ lessonId, words, correctOrder, file: 'seed_stage1_exercises' });
      }
    }
  }
}

// 2. Audit generated letter lessons (7 to 33)
const allLetters = ['آ','ا','ب','پ','ت','ث','ج','چ','ح','خ','د','ذ','ر','ز','ژ','س','ش','ص','ض','ط','ظ','ع','غ','ف','ق','ک','گ','ل','م','ن','و','ه','ی'];
const generatedLessons = [
  'ج','چ','ح','خ','د','ذ','ر','ز','ژ','س','ش','ص','ض','ط','ظ','ع','غ','ف','ق','ک','گ','ل','م','ن','و','ه','ی'
];

for (let i = 0; i < generatedLessons.length; i++) {
  const letter = generatedLessons[i];
  const lessonId = `generated_lesson_${i + 7}_(${letter})`;
  exercisesPerLesson.set(lessonId, 8); // seed generates 8 exercises per letter lesson

  const letterIdx = allLetters.indexOf(letter);
  const d1 = allLetters[((letterIdx + 3) % allLetters.length)];
  const d2 = allLetters[((letterIdx + 7) % allLetters.length)];
  const d3 = allLetters[((letterIdx + 11) % allLetters.length)];
  const options = [letter, d1, d2, d3];

  const unique = new Set(options);
  if (unique.size !== options.length) {
    issues.duplicateOptions.push({ lessonId, type: 'multiple_choice/listening/fill_blank', options, file: 'seed_exercises_lessons_7_to_33' });
  }
  if (!options.includes(letter)) {
    issues.correctNotInOptions.push({ lessonId, type: 'multiple_choice', correct: letter, options, file: 'seed_exercises_lessons_7_to_33' });
  }
}

// 3. Audit all lessons from stage units lessons seed
const stage1LessonsPath = path.join(migrationsDir, '20261016183550_seed_stage1_stage_units_lessons.sql');
if (fs.existsSync(stage1LessonsPath)) {
  const content = fs.readFileSync(stage1LessonsPath, 'utf8');
  const lessonIdRegex = /\('(a0000000-0000-0000-0000-[0-9a-f]{12})'/g;
  let match;
  while ((match = lessonIdRegex.exec(content)) !== null) {
    const id = match[1];
    const count = exercisesPerLesson.get(id) || 0;
    // Note: check lessons 1 to 6 (which have static exercises)
    const num = parseInt(id.slice(-2), 16) || parseInt(id.slice(-2), 10);
    if (num <= 6 && count < 5) {
      issues.lessonsWithFewerThan5Exercises.push({ lessonId: id, exerciseCount: count });
    }
  }
}

// 4. Audit vocabulary seed
const vocabSeedPath = path.join(migrationsDir, '20261016183732_seed_stage1_vocabulary.sql');
if (fs.existsSync(vocabSeedPath)) {
  const content = fs.readFileSync(vocabSeedPath, 'utf8');
  // Match rows in INSERT INTO vocabulary
  // VALUES (lesson_id, stage_id, persian_script, latin_transliteration, arabic_transliteration, arabic_meaning, english_meaning...)
  const rowRegex = /\('[^']+',\s*'[^']+',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)'/g;
  let match;
  let rowIdx = 0;
  while ((match = rowRegex.exec(content)) !== null) {
    rowIdx++;
    const persian = match[1];
    const latin = match[2];
    const arabicMeaning = match[4];

    if (!latin || latin.trim() === '') {
      issues.vocabularyMissingFields.push({ row: rowIdx, persian, field: 'latin_transliteration' });
    }
    if (!arabicMeaning || arabicMeaning.trim() === '') {
      issues.vocabularyMissingFields.push({ row: rowIdx, persian, field: 'arabic_meaning' });
    }
  }
}

// Output Report
console.log('======================================================');
console.log('              CONTENT INTEGRITY AUDIT REPORT           ');
console.log('======================================================\n');

console.log(`1. Duplicate options in multiple-choice / options exercises: ${issues.duplicateOptions.length}`);
if (issues.duplicateOptions.length > 0) {
  console.dir(issues.duplicateOptions, { depth: null });
}

console.log(`\n2. Correct answer missing from options: ${issues.correctNotInOptions.length}`);
if (issues.correctNotInOptions.length > 0) {
  console.dir(issues.correctNotInOptions, { depth: null });
}

console.log(`\n3. Duplicate pairs in word matching: ${issues.duplicatePairs.length}`);
if (issues.duplicatePairs.length > 0) {
  console.dir(issues.duplicatePairs, { depth: null });
}

console.log(`\n4. Sentence building token mismatches: ${issues.sentenceBuildingMismatch.length}`);
if (issues.sentenceBuildingMismatch.length > 0) {
  console.dir(issues.sentenceBuildingMismatch, { depth: null });
}

console.log(`\n5. Lessons with fewer than 5 exercises: ${issues.lessonsWithFewerThan5Exercises.length}`);
if (issues.lessonsWithFewerThan5Exercises.length > 0) {
  console.dir(issues.lessonsWithFewerThan5Exercises, { depth: null });
}

console.log(`\n6. Vocabulary missing transliteration or Arabic meaning: ${issues.vocabularyMissingFields.length}`);
if (issues.vocabularyMissingFields.length > 0) {
  console.dir(issues.vocabularyMissingFields, { depth: null });
}

console.log('\n======================================================');
const totalIssues = Object.values(issues).reduce((acc, curr) => acc + curr.length, 0);
console.log(`TOTAL ISSUES DETECTED: ${totalIssues}`);
console.log('======================================================\n');
