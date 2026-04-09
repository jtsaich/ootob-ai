# Japanese Quiz — Improvement Plan

## Design Spirit

**Like Wordle**: Focused, quick, honest. Open it, think hard for 5 minutes, close it. No gamification theater. The constraint is the design.

**Anti-Duolingo**: No XP, no hearts, no streaks that guilt you, no multiple choice (tests recognition, not recall), no reordering puzzles (too much of a crutch).

**Core goal**: Learn to actually *use* Japanese — read a sign, understand a question, respond in a conversation. Not pass a test.

---

## What's Broken Now

1. **Q&A mode always marks correct** — regardless of input. Lying to the user.
2. **Vocabulary is isolated** — learn 食べる but never 食べます/食べない/食べた. Unusable without conjugation.
3. **No particles** — は, を, に, で aren't in vocab. Can't form sentences without them.
4. **Everything is textbook polite** — only ですます form. Real Japanese has casual speech.
5. **Stats reward grinding** — accuracy inflated by Q&A mode, streak punishes learning from mistakes.

---

## Improvement Priorities

### 1. Fix Q&A Mode (stop lying)

- Check answer against key words from the hint pattern
- Accept multiple valid forms (e.g., for "what's your name": 私は＿＿です / ＿＿です / ＿＿と申します)
- Mark wrong when it's wrong — show what was expected vs. what you wrote
- **Hint button**: when stuck, tap to reveal one word from the answer at a time. First hint might give you the key noun. Second hint gives the particle. Third gives the verb form. Each hint used = not counted as fully correct (partial credit in SRS).

### 2. Sentence Translation Mode (the core addition)

New mode: **中文→日文 句子** (translate a sentence to Japanese)

New content file: `sentences.md`
```
我每天喝咖啡。 | 私は毎日コーヒーを飲みます。 | N5 | particles-を,は
我昨天去了學校。 | 昨日学校に行きました。 | N5 | past-tense,particles-に
這個比那個貴。 | これはあれより高いです。 | N4 | comparison-より
```

**How it works**:
- Show Chinese sentence, user writes the Japanese
- Check against answer, accept reasonable variations (e.g., わたし vs 私, コーヒー vs こーひー)
- **Progressive hints** when stuck:
  - Hint 1: reveal one key word (e.g., "コーヒー")
  - Hint 2: reveal the particle structure (e.g., "＿はまいにち＿を＿")
  - Hint 3: reveal most of the sentence, just one blank left
- Each hint used reduces the SRS "correct" weight (you got it, but with help)
- This teaches vocab + particles + conjugation + word order simultaneously

### 3. Expand Content for Real Usage

**Add to vocab.md**:
- Essential particles (は, が, を, に, で, へ, から, まで, の, と, も) with example phrases, not definitions
- Common conjugation forms: ます/ません/ました/ませんでした for key verbs
- Question words: 何, どこ, いつ, どう, なぜ, いくら

**Expand qa.md**:
- Add casual forms alongside polite (real people don't always speak in ですます)
- Add situation context: [レストランで], [駅で], [コンビニで]
- Multiple acceptable answers per question, pipe-separated
- More practical: asking price, asking directions, ordering food, declining politely

### 4. Honest Stats

**Remove**: accuracy % (fakeable), streak counter (punishes difficulty)

**Keep**: 今日 X 題, 已學 count

**Add**: 弱點 count — number of items where `wrong > correct`. This is the number that should go DOWN over time. This is the only metric that matters.

### 5. Daily Discipline (Wordle spirit)

Not a copy of Wordle, just the ethos: **a small, focused daily practice**.

- Show "今日の練習" at the top — 5 questions, curated mix:
  - 1-2 from your weak list (SRS-weighted)
  - 1-2 sentence translations
  - 1 Q&A
- Once done, show summary. You *can* keep going, but the daily 5 is the anchor.
- No share grid, no social — just a quiet sense of "I did my practice today."

---

## What NOT to Add

- Multiple choice — tests recognition, not recall. Always free-input.
- Word reordering — too much of a crutch, doesn't build real composition skill
- Audio/TTS — adds complexity, mediocre quality
- Accounts/login — localStorage is fine
- Gamification (XP, badges, levels) — the learning IS the reward
- AI-generated content — keep it curated, small, correct

---

## Implementation Order

| Phase | What | Why first |
|-------|------|-----------|
| 1 | Fix Q&A answer checking + add progressive hints | Stop lying, add the hint mechanic that applies everywhere |
| 2 | Add `sentences.md` + sentence translation mode | Highest learning value — teaches grammar in context |
| 3 | Expand vocab.md with particles + conjugations | Unblocks sentence-level understanding |
| 4 | Simplify stats (drop accuracy/streak, add 弱點 count) | Align metrics with actual learning |
| 5 | Daily 5-question practice | Creates habit without guilt |

---

## Technical Notes

- Everything stays as static HTML + .md files. No build step.
- New content file: `sentences.md` (same pipe-delimited format)
- Progressive hints: store hint state per question in JS (not localStorage — ephemeral per session)
- Hint-aware SRS: `srsRecord(item, 'full')` vs `srsRecord(item, 'hinted')` vs `srsRecord(item, false)` — hinted correct gives partial SRS credit
- localStorage schema already has `version: 1` — bump to 2 when SRS fields change
