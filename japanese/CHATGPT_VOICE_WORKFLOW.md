# ChatGPT Voice Workflow for Daily Japanese

This is the practical daily workflow. The interface is the ChatGPT app in voice mode. This repo is only the memory system: prompts, logs, vocabulary, mistakes, and reading material.

## Daily Loop

Total time: 15 minutes speaking plus 5 minutes logging.

1. Choose today's day from `data/month_1_plan.md`.
2. Copy the relevant reading from `data/readings.md`; kanji words include hiragana in parentheses.
3. Paste the full start prompt from `prompts/voice_session_full_prompt.md` into ChatGPT.
4. Start voice mode and answer out loud.
5. At the end, paste `prompts/daily_end_prompt.md`.
6. Save the returned log as `logs/YYYY-MM-DD.md`.
7. Add useful words to `data/vocab.csv`.
8. Add repeated mistakes to `data/mistake_patterns.md`.
9. Tomorrow, paste yesterday's log into the next start prompt.

## What to Paste at the Start

Each day, paste these four things into ChatGPT before voice mode:

1. Today's topic and goal from `data/month_1_plan.md`.
2. Today's reading from `data/readings.md`.
3. Yesterday's log from `logs/YYYY-MM-DD.md`.
4. Recent vocabulary and mistakes from `data/vocab.csv` and `data/mistake_patterns.md`.

Keep the context compact. The goal is continuity, not a huge database dump.

## Voice Session Shape

Ask ChatGPT to run the session like this:

| Time | Activity | What ChatGPT should do |
|---|---|---|
| 0:00-2:00 | Warm-up | Ask one easy question |
| 2:00-5:00 | Review | Reuse yesterday's words |
| 5:00-10:00 | Main topic | Have a casual conversation |
| 10:00-12:00 | Reading aloud | Have you read today's passage |
| 12:00-14:00 | Corrections | Give natural versions of your sentences |
| 14:00-15:00 | Homework | Assign 3-5 sentences |

## Correction Style

Use this correction style in every session:

```text
Good try.

You said:
「...」

More natural:
「...」

Meaning:
...

Repeat:
...
```

Corrections should happen after you finish answering, not while you are trying to speak.

## If ChatGPT Gets Too Textbook-Like

Paste this:

```text
Please make this more conversational. Ask me one natural question at a time. Do not explain grammar unless I ask. After I answer, correct only the most important thing and give me a natural version to repeat.
```

## If ChatGPT Asks Too Much at Once

Paste this:

```text
Please slow down. Ask only one short Japanese question at a time. Wait for my answer before continuing.
```

## If the Session Loses Context

Paste this:

```text
Quick context reset:
I am practicing beginner conversational Japanese.
My interests are games, anime, music, movies, travel, Japanese food, desserts, Hokkaido, Obihiro, and soft cream.
Today's topic is: ___.
Please continue with one simple Japanese question.
```

## End-of-Day Log

At the end, ask for the daily log and save it.

Recommended file:

```text
logs/YYYY-MM-DD.md
```

The log is the source of truth. ChatGPT memory is optional. Markdown logs are the real continuity.

## Weekly Maintenance

Once per week:

1. Read the last 7 logs.
2. Pick 10 words you actually used.
3. Pick 3 repeated mistakes.
4. Update `data/vocab.csv`.
5. Update `data/mistake_patterns.md`.
6. Make the next week focus on those weak points.

## Month 1 Goal

By the end of 30 days, you should be able to:

- Introduce yourself and your Japanese goals.
- Talk about Hokkaido and Obihiro.
- Talk about food, desserts, games, anime, music, and movies.
- Ask simple travel questions.
- Read short Japanese passages out loud.
- Recover when stuck by using repair phrases.
- Save useful vocabulary and corrections without relying on ChatGPT memory.
