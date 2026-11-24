// Run with: node qa-audit.js
// Rebuilds and checks every question pool without a browser or external packages.
const fs = require('node:fs');
const vm = require('node:vm');

global.window = {};
vm.runInThisContext(fs.readFileSync(__dirname + '/question-banks.js', 'utf8'), { filename: 'question-banks.js' });
vm.runInThisContext(fs.readFileSync(__dirname + '/question-engine.js', 'utf8'), { filename: 'question-engine.js' });
vm.runInThisContext(fs.readFileSync(__dirname + '/progress-store.js', 'utf8'), { filename: 'progress-store.js' });

const prohibited = [/以上|以下|未満/, /被除数|乗数|除数|被乗数/, /undefined|NaN|\[object Object\]/, /\d+十|14十/, /\bPは\b/];
const summary = { total: 0, units: [], kinds: { basic: 0, applied: 0, cbt: 0 }, tiers: { jump: 0 }, phraseFlags: [], scopeFlags: [], answerIssues: [], explanationAnswerFlags: [], directEquationChecks: 0, directEquationIssues: [], sessionAuditFailures: [], choiceBalanceFailures: [], choiceOrderFailures: [], answerModePromptFailures: [], answerFormatChoices: { time: 0, remainder: 0, packedRemainder: 0 }, rolloverAudit: null, progressAudit: null, feedbackAudit: null, persistenceAudit: null, compositeInputAudit: null };
const stableShuffle = (items) => [...items];
const indexSource = fs.readFileSync(__dirname + '/index.html', 'utf8');
const triangleDescription = /\['三角形','図形アトリエ','([^']+)'\]/.exec(indexSource)?.[1] || '';
if (/角度|角の|角を|角が|角は|角に|角と|開き方/.test(triangleDescription)) summary.scopeFlags.push({ unit: 17, prompt: `unit description: ${triangleDescription}` });

for (let unit = 0; unit < 20; unit += 1) {
  const items = window.questionEngine.generate(unit);
  const engineAudit = window.questionEngine.audit(unit);
  const score = () => 0;
  const regular = window.questionEngine.selectSession(items, new Set(), 'regular', score, stableShuffle).questions;
  const cbt = window.questionEngine.selectSession(items, new Set(), 'cbt', score, stableShuffle).questions;
  const seen = new Set(items.slice(0, 10).map((q) => q.id));
  const unseenFirst = window.questionEngine.selectSession(items, seen, 'regular', score, stableShuffle).questions;
  if (regular.length !== 10 || new Set(regular.map((q) => q.id)).size !== 10 || regular.filter((q) => q.kind === 'basic').length !== 5 || regular.filter((q) => q.kind === 'applied').length !== 2 || regular.filter((q) => q.kind === 'cbt').length !== 3 || regular.filter((q) => q.tier === 'jump').length !== 1) {
    summary.sessionAuditFailures.push({ unit: unit + 1, mode: 'regular composition' });
  }
  if (cbt.length !== 10 || cbt.some((q) => q.kind !== 'cbt') || new Set(cbt.map((q) => q.id)).size !== 10) {
    summary.sessionAuditFailures.push({ unit: unit + 1, mode: 'CBT selection' });
  }
  if (cbt.filter((q) => q.skill.startsWith('CBT・活用')).length < 3) summary.sessionAuditFailures.push({ unit: unit + 1, mode: 'CBT set includes applied questions' });
  if (unit !== 15 && regular.filter((q) => q.kind === 'cbt' && q.skill.startsWith('CBT・活用')).length < 1) summary.sessionAuditFailures.push({ unit: unit + 1, mode: 'regular set includes an applied CBT question' });
  if (unseenFirst.length !== 10 || unseenFirst.some((q) => seen.has(q.id))) {
    summary.sessionAuditFailures.push({ unit: unit + 1, mode: 'unseen priority' });
  }
  const cbtItems = items.filter((q) => q.kind === 'cbt');
  const cbtChoiceCount = cbtItems.filter((q) => q.choices).length;
  const cbtTypedCount = cbtItems.length - cbtChoiceCount;
  const cbtAppliedCount = cbtItems.filter((q) => q.skill.startsWith('CBT・活用')).length;
  if (cbtAppliedCount < cbtItems.length * 0.15) summary.sessionAuditFailures.push({ unit: unit + 1, mode: 'CBT applied-question coverage', cbtApplied: cbtAppliedCount, cbtTotal: cbtItems.length });
  const jumpItems = items.filter((q) => q.tier === 'jump');
  if (!jumpItems.length || jumpItems.some((q) => q.kind !== 'applied')) summary.sessionAuditFailures.push({ unit: unit + 1, mode: 'jump coverage' });
  const unitSummary = { unit: unit + 1, questions: items.length, uniquePrompts: engineAudit.uniquePrompts, checkedEquationStatements: engineAudit.checkedEquationStatements, jump: jumpItems.length, regular: { basic: regular.filter((q) => q.kind === 'basic').length, applied: regular.filter((q) => q.kind === 'applied').length, cbt: regular.filter((q) => q.kind === 'cbt').length, jump: regular.filter((q) => q.tier === 'jump').length }, cbt: cbtItems.length, cbtChoice: cbtChoiceCount, cbtTyped: cbtTypedCount, cbtApplied: cbtAppliedCount };
  summary.units.push(unitSummary);
  if ([2, 4, 9].includes(unit + 1) && (cbtChoiceCount / cbtItems.length < 0.2 || cbtTypedCount / cbtItems.length < 0.2)) summary.choiceBalanceFailures.push({ unit: unit + 1, cbt: cbtItems.length, cbtChoice: cbtChoiceCount, cbtTyped: cbtTypedCount });
  summary.total += items.length;
  for (const q of items) {
    summary.kinds[q.kind] += 1;
    if (q.tier === 'jump') summary.tiers.jump += 1;
    if (!q.choices) {
      const clean = (value) => String(value).replace(/[，,\s]/g, '');
      const answerText = clean(q.answer);
      const explanationText = clean(q.explain);
      const mixedLength = /^(\d+km\d+m)$/.exec(answerText);
      const mixedMass = /^(\d+kg\d+g)$/.exec(answerText);
      if ((mixedLength && /何km何m/.test(q.prompt) && !explanationText.includes(mixedLength[1])) || (mixedMass && /何kg何g/.test(q.prompt) && !explanationText.includes(mixedMass[1]))) {
        summary.explanationAnswerFlags.push({ unit: unit + 1, id: q.id, answer: q.answer, explain: q.explain });
      }
      const contextAnswer = /^(\d+)(袋|箱|束|パック)できて(\d+)(本|こ|個|まい)あまる$/.exec(answerText);
      const contextBareAnswer = /^(\d+)(袋|箱|束|パック)、(\d+)(本|こ|個|まい)あまり$/.exec(answerText);
      const context = contextAnswer || contextBareAnswer;
      if (context && (!explanationText.includes(`${context[1]}${context[2]}`) || !explanationText.includes(`${context[3]}${context[4]}`))) {
        summary.explanationAnswerFlags.push({ unit: unit + 1, id: q.id, answer: q.answer, explain: q.explain });
      }
    }
    const content = [q.skill, q.prompt, q.hint, q.explain, ...(q.choices || []).map((x) => x[1])].join(' ');
    if (!q.choices && /選びましょう|選びなさい|選んでください|どれが正しい|正しいものは|正しい考え方は/.test(q.prompt)) summary.answerModePromptFailures.push({ unit: unit + 1, id: q.id, prompt: q.prompt });
    if (q.choices && /答えを入力|分子と分母を入力|答えを書きましょう/.test(q.prompt)) summary.answerModePromptFailures.push({ unit: unit + 1, id: q.id, prompt: q.prompt });
    if (unit === 16 && /(?:こ分|つ分)/.test(q.explain) && !/〔F1:\d+〕/.test(q.explain)) summary.explanationAnswerFlags.push({ unit: unit + 1, id: q.id, issue: 'fraction explanation does not name the one-part fraction', explain: q.explain });
    const direct = /^([\d,().＋－×÷+\- ]+)＝[？?]$/.exec(q.prompt);
    if (direct && /^-?[\d,]+(?:\.\d+)?$/.test(q.answer)) {
      const computed = window.questionEngine.evaluateExpression(direct[1]);
      const expected = Number(String(q.answer).replace(/,/g, ''));
      if (computed !== null) {
        summary.directEquationChecks += 1;
        if (Math.abs(computed - expected) > 1e-8) summary.directEquationIssues.push({ unit: unit + 1, id: q.id, prompt: q.prompt, answer: q.answer, computed });
      }
    }
    const fractionSum = /^〔F(\d+):(\d+)〕([＋－])〔F(\d+):(\d+)〕＝？$/.exec(q.prompt);
    if (fractionSum) {
      const [, n1, d1, op, n2, d2] = fractionSum;
      const expected = /^F(\d+):(\d+)$/.exec(q.answer);
      const numerator = Number(n1) * Number(d2) + (op === '＋' ? 1 : -1) * Number(n2) * Number(d1);
      const denominator = Number(d1) * Number(d2);
      if (expected) {
        summary.directEquationChecks += 1;
        if (numerator * Number(expected[2]) !== Number(expected[1]) * denominator) summary.directEquationIssues.push({ unit: unit + 1, id: q.id, prompt: q.prompt, answer: q.answer });
      }
    }
    if (unit === 16 && /角度|角A|角B|角の大きさ|同じ大きさの角|同じ開き方|辺の開き方|角が|角を|角は|角に|角と|辺が4本ある/.test(content)) summary.scopeFlags.push({ unit: 17, id: q.id, prompt: q.prompt });
    for (const pattern of prohibited) {
      const match = content.match(pattern);
      if (match) summary.phraseFlags.push({ unit: unit + 1, id: q.id, text: match[0], prompt: q.prompt });
    }
    if (q.choices && q.kind === 'cbt') {
      if (/^\d+時\d+分$/.test(q.correctValue || '')) summary.answerFormatChoices.time += 1;
      if (/^\d+あまり\d+$/.test(q.correctValue || '')) summary.answerFormatChoices.remainder += 1;
      if (/^\d+箱、\d+こあまり$/.test(q.correctValue || '')) summary.answerFormatChoices.packedRemainder += 1;
    }
    if (q.choices) {
      const letters = q.choices.map(([letter]) => String(letter));
      if (letters.join('') !== 'ABCD') summary.choiceOrderFailures.push({ unit: unit + 1, id: q.id, letters });
      const selected = q.choices.find((choice) => String(choice[0]) === String(q.answer));
      if (!selected || (q.correctValue !== undefined && String(selected[1]) !== String(q.correctValue))) {
        summary.answerIssues.push({ unit: unit + 1, id: q.id, prompt: q.prompt });
      }
    }
  }
}

// Exercise the real session rollover helper with a small pool: the final unseen
// items must stay in history until displayed, then a fresh cycle may begin.
const tinyPool = Array.from({ length: 12 }, (_, i) => ({ id: `q${i}` }));
const deterministicShuffle = (list) => [...list];
const priorSeen = new Set(tinyPool.slice(0, 10).map((q) => q.id));
const lastSession = window.questionEngine.rolloverSession(tinyPool, priorSeen, deterministicShuffle);
const afterLastSession = new Set([...priorSeen, ...lastSession.questions.map((q) => q.id)]);
const freshSession = window.questionEngine.rolloverSession(tinyPool, afterLastSession, deterministicShuffle);
summary.rolloverAudit = {
  finalUnseenPreserved: lastSession.seenIds.size === 10 && lastSession.questions.some((q) => !priorSeen.has(q.id)),
  lastSessionHasNoDuplicates: new Set(lastSession.questions.map((q) => q.id)).size === 10,
  poolExhaustionStartsNewCycle: freshSession.reset && freshSession.seenIds.size === 0 && new Set(freshSession.questions.map((q) => q.id)).size === 10,
};
const sampleProgress = window.questionEngine.summarizeProgress({
  u1q1: { attempts: 2, correct: 1 },
  u1gb2: { attempts: 1, correct: 1 },
  u10q1: { attempts: 5, correct: 5 },
  invalid: { attempts: 9, correct: 9 },
}, 0);
summary.progressAudit = {
  countsOnlyThisUnit: sampleProgress.answered === 2 && sampleProgress.attempts === 3 && sampleProgress.correct === 2,
  accuracyRoundedCorrectly: sampleProgress.accuracy === 67,
  poolSizeCorrect: sampleProgress.total === 600,
};

summary.feedbackAudit = {
  choiceShowsAnswerText: window.questionEngine.correctValueForDisplay({ answer: 'C', choices: [['A', '3'], ['B', '4'], ['C', '5'], ['D', '6']] }) === '5',
  fractionUsesStackableMarkup: window.questionEngine.correctValueForDisplay({ answer: 'F3:4' }) === '〔F3:4〕',
  bareFractionChoiceTokensAreRenderedVertically: indexSource.includes(String.raw`\bF(\d+):(\d+)\b`),
  fractionCbtHasReasoningAndInputFormats: (() => { const qs = window.questionEngine.generate(15).filter((q) => q.kind === 'cbt'); return new Set(qs.map((q) => q.skill)).size >= 3 && qs.some((q) => q.choices) && qs.some((q) => !q.choices); })(),
  unitIsIncluded: window.questionEngine.correctValueForDisplay({ answer: '12', unit: 'kg' }) === '12kg',
  alreadyIncludedUnitIsNotRepeated: window.questionEngine.correctValueForDisplay({ answer: '3kg', unit: 'kg' }) === '3kg',
};
const memoryStorage = new Map();
window.localStorage = {
  getItem: (key) => memoryStorage.has(key) ? memoryStorage.get(key) : null,
  setItem: (key, value) => memoryStorage.set(key, String(value)),
  removeItem: (key) => memoryStorage.delete(key),
};
const legacyRows = {};
for (let i = 0; i < 2000; i += 1) legacyRows[`u${(i % 20) + 1}gb${i}`] = { skill: '計算の工夫と説明', attempts: 3, correct: 2, lastCorrect: false, lastAt: 1760000000000 + i };
const legacyJson = JSON.stringify(legacyRows);
window.localStorage.setItem('park-record-v1', legacyJson);
const migrated = window.progressStore.readAll();
const beforeRecord = migrated.u1gb0;
window.progressStore.record('u1gb0', 1, true);
const afterRecord = window.progressStore.readAll().u1gb0;
const compactSize = [...memoryStorage.entries()].filter(([key]) => key.startsWith('park-record-u')).reduce((sum, [, value]) => sum + value.length, 0);
summary.persistenceAudit = {
  migratesLegacyRecords: Object.keys(migrated).length === 2000 && beforeRecord.attempts === 3 && beforeRecord.correct === 2,
  updatesOnlyQuestionCount: afterRecord.attempts === 4 && afterRecord.correct === 3,
  storesCompactPerUnitData: memoryStorage.has('park-record-store-v2') && !memoryStorage.has('park-record-v1') && compactSize < legacyJson.length,
  legacyChars: legacyJson.length,
  compactChars: compactSize,
  reductionPercent: Math.round((1 - compactSize / legacyJson.length) * 100),
};
summary.compositeInputAudit = {
  remainderParts: JSON.stringify(window.questionEngine.parseCompositeAnswer('7あまり3')) === JSON.stringify({ values: ['7', '3'], labels: ['商', 'あまり'] }),
  lengthParts: JSON.stringify(window.questionEngine.parseCompositeAnswer('1km750m')) === JSON.stringify({ values: ['1', '750'], labels: ['km', 'm'] }),
  massParts: JSON.stringify(window.questionEngine.parseCompositeAnswer('2kg150g')) === JSON.stringify({ values: ['2', '150'], labels: ['kg', 'g'] }),
  timeParts: JSON.stringify(window.questionEngine.parseCompositeAnswer('8時05分')) === JSON.stringify({ values: ['8', '05'], labels: ['時', '分'] }),
  contextParts: JSON.stringify(window.questionEngine.parseCompositeAnswer('4箱、2こあまり')) === JSON.stringify({ values: ['4', '2'], labels: ['箱', 'このあまり'] }),
  ordinaryTextStaysText: window.questionEngine.parseCompositeAnswer('二等辺三角形') === null,
};
console.log(JSON.stringify(summary, null, 2));
if (summary.total !== 40000 || summary.phraseFlags.length || summary.scopeFlags.length || summary.answerIssues.length || summary.explanationAnswerFlags.length || summary.directEquationIssues.length || summary.sessionAuditFailures.length || summary.choiceBalanceFailures.length || summary.choiceOrderFailures.length || summary.answerModePromptFailures.length || Object.values(summary.rolloverAudit).some((ok) => !ok) || Object.values(summary.progressAudit).some((ok) => !ok) || Object.values(summary.feedbackAudit).some((ok) => !ok) || Object.values(summary.persistenceAudit).some((ok) => !ok) || Object.values(summary.compositeInputAudit).some((ok) => !ok)) process.exitCode = 1;
