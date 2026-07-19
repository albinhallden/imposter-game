# Imposter

A free, mobile-friendly party word game you play by passing a single phone around a group. Everyone gets a secret word — except the imposter(s), who have to bluff their way through the round without getting caught.

## How it works

1. Set the number of players, how many imposters, and a word category (or "All").
2. Pass the phone around. Each player taps to reveal their card — everyone sees the secret word except the imposter(s), who see a "You are the imposter" card instead.
3. Going around the group (starting with a randomly chosen player), everyone says one word describing the secret word without saying the word itself.
4. Discuss and vote on who you think the imposter is, using the built-in round timer if you like.
5. Reveal the imposter and the word to see who was right.

## Features

- 13 word categories (animals, food, jobs, countries, sports, places, objects, movies, brands, celebrities, superheroes, video games, cartoon characters), each with 15 words per language
- 8 languages: English, Svenska, Norsk, Dansk, Suomi, Français, Deutsch, Español, each served from its own route (`/en/`, `/sv/`, etc.) with automatic browser-language detection on first visit
- Support for multiple imposters per round
- Custom player names
- A discussion timer with a randomly chosen starting player
- A "How to Play" screen
- No build step, no backend, no dependencies — plain HTML/CSS/JS

## Project structure

```
index.html          Root redirect: detects browser language and forwards to /<lang>/
<lang>/index.html    Per-language entry point (en, sv, no, da, fi, fr, de, es)
app.js               All game logic and rendering (shared across languages)
translations.js      UI strings and word-category labels per language
words.js             The word lists per category and language
style.css            Styling
sitemap.xml, robots.txt   SEO basics
```

## Running locally

This is a static site with no build step. Serve the directory with any static file server, for example:

```
npx serve .
```

Then open `http://localhost:3000/` (or whichever port the server reports).

## About this project

This project was built as a way to explore what's possible when building software almost entirely through conversation with [Claude Code](https://claude.com/claude-code), Anthropic's coding agent. From the initial game logic to the multi-language support, new word categories, UI refinements, and SEO setup, the vast majority of the code in this repository was written by Claude Code based on iterative feedback and direction.
