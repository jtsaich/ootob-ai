# Japanese Daily Conversation Practice System

This repo now supports a daily routine that sits beside the quiz reviewer. The quiz is still useful for recall, but this system is for speaking, reading aloud, and building continuity between voice sessions.

## Goal

Build a repeatable 15-minute Japanese practice routine focused on natural conversation.

Priority order:

1. Speak first.
2. Correct gently.
3. Repeat the natural version.
4. Save the useful vocabulary and mistakes.
5. Bring yesterday's context into the next session.

The target is not perfect grammar. The target is keeping a casual Japanese conversation going longer than before.

## Learner Profile

Current level:

- Knows some words and phrases.
- Can say simple things, but pauses while speaking.
- Wants structure without textbook-style drills.
- Wants topics connected to games, anime, music, movies, travel, food, desserts, Hokkaido, Obihiro, and soft cream.
- Speaking is the priority. Reading aloud and short writing support speaking.

Known personal topics:

- Went to Hokkaido last year.
- Went to Obihiro in August.
- Ate 豚丼.
- Likes dessert.
- Likes ソフトクリーム.
- Wants to talk about travel, food, anime, games, music, and movies.

## Daily Routine

Each practice session should take about 15 minutes.

| Time | Activity | Purpose |
|---|---|---|
| 0:00-2:00 | Warm-up conversation | Start speaking immediately |
| 2:00-5:00 | Review yesterday | Reuse old vocabulary |
| 5:00-10:00 | Main topic | Practice natural conversation |
| 10:00-12:00 | Read aloud | Improve rhythm and pronunciation |
| 12:00-14:00 | Corrections | Learn natural phrasing |
| 14:00-15:00 | Homework | Prepare tomorrow |

## Daily Workflow

1. Open `daily.html`.
2. Choose the current day in the 30-day plan.
3. Paste yesterday's log, recent vocabulary, and recent mistakes into the context fields.
4. Copy the voice session prompt.
5. Paste it into ChatGPT voice and practice.
6. At the end, copy the daily end prompt and ask ChatGPT for the log.
7. Paste the log into `logs/YYYY-MM-DD.md` or into the log box in `daily.html`.
8. Update `data/vocab.csv` and `data/mistake_patterns.md` when something repeats.

## Teacher Behavior Rules

The Japanese teacher should:

1. Prioritize casual conversation.
2. Ask one simple question at a time.
3. Let the learner finish speaking before correcting.
4. Correct gently.
5. Give a more natural version of the learner's sentence.
6. Ask follow-up questions like a real conversation partner.
7. Use simple Japanese first.
8. Explain in English only when needed.
9. Avoid fake textbook dialogue.
10. Keep topics connected to the learner's interests.

Correction format:

```text
Good try.

You said:
「去年は北海道の帯広、8月旅行しました。」

More natural:
「去年の8月に北海道の帯広へ旅行しました。」

Meaning:
"I traveled to Obihiro, Hokkaido last August."

Repeat:
去年の8月に北海道の帯広へ旅行しました。
```

## Files

| File | Purpose |
|---|---|
| `daily.html` | Daily prompt builder, reading practice, and local log box |
| `prompts/base_teacher_prompt.md` | Reusable teacher behavior and learner profile |
| `prompts/daily_start_prompt.md` | Template for starting a voice session |
| `prompts/daily_end_prompt.md` | Template for asking for the session log |
| `prompts/reading_generation_prompt.md` | Prompt for generating current-topic readings |
| `templates/daily_log_template.md` | Markdown log format |
| `templates/monthly_review_template.md` | Monthly review format |
| `data/month_1_plan.md` | 30-day conversation curriculum |
| `data/readings.md` | Original beginner-friendly reading passages |
| `data/interests.md` | Personalized topic profile |
| `data/vocab.csv` | Vocabulary memory file |
| `data/useful_phrases.md` | Reusable phrase bank |
| `data/mistake_patterns.md` | Repeated correction patterns |
| `logs/` | Daily practice logs |

## First Session Prompt

Use this on Day 1:

```text
Today is Day 1 of my 30-day Japanese daily conversation plan.

Please run a 15-minute Japanese conversation practice session.

Today's topic:
Self-introduction and why I want to practice Japanese.

Please help me say:

- I want to practice Japanese every day.
- I want to speak more naturally.
- I like games, anime, music, movies, travel, and food.
- I went to Hokkaido last year.
- I want to have casual conversations with friends.

Please ask me simple Japanese questions one by one.
After I answer, correct me naturally.
At the end, give me a daily log and homework.
```

## Reading Aloud Rule

Reading should be:

- 3-6 sentences.
- Original or summarized, not copied from long copyrighted text.
- Simple but natural Japanese.
- Connected to the day's topic or learner interests.
- Written with hiragana in parentheses after kanji words, like `日本語（にほんご）`.
- Followed by vocabulary and two conversation questions.

## Monthly Review

At the end of 30 days, create a monthly review using `templates/monthly_review_template.md`.

Review:

- Total practice days.
- Topics practiced.
- Most useful phrases.
- Repeated mistakes.
- Vocabulary actually used.
- Confidence before and after.
- Next month focus.

## Success Criteria

After 30 days, the learner should be able to:

- Talk about a past trip.
- Talk about food they ate.
- Talk about games, anime, music, and movies.
- Ask simple travel questions.
- Order food casually.
- Say what they like and why.
- Read a short Japanese text aloud.
- Write a short Japanese diary entry.
- Recover when stuck.
- Track vocabulary and mistakes without relying on chat memory.
