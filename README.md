# CC Learning – KLEE preparation site

A plain HTML/CSS/JavaScript site (no build step) that gathers public YouTube videos for the Kerala Law Entrance Exam (KLEE) with notes, quizzes, mock tests and progress tracking. Every course is unlocked.

## What is inside

- Three courses: **KLEE 3-Year LLB Complete**, **KLEE 5-Year Integrated LLB**, **KLEE Previous Papers and Revision**
- Course pages with working **Overview / Syllabus / Video sources / FAQ** tabs
- Lesson page: embedded YouTube video, **Notes / Resources / Quiz / Discussion** tabs, mark-as-complete, previous/next
- Three timed mock tests (question palette, flagging, negative marking, topic breakdown, answer review)
- Dashboard with progress rings and test history, login (browser-only), dark mode, mobile menu

Progress, notes and test history are saved in your own browser (localStorage). Nothing is sent to a server.

## About the content

- The videos are public YouTube videos owned by their creators. They play through YouTube's official embedded player, and each lesson has a "Watch on YouTube" link. If a creator removes or restricts a video, that lesson will stop playing.
- The quizzes and mock tests are original practice questions, not official KLEE papers.
- Always check the official KLEE notification for the current syllabus, pattern and dates.

## Important: YouTube needs a web address

YouTube blocks embedded videos on pages opened straight from a file (`file:///...`). Use one of these:

- **GitHub Pages** (below), or
- a local server: run `python3 -m http.server` in this folder and open http://localhost:8000

## Publish on GitHub Pages

1. Create a new repository on GitHub (for example `cc-learning`).
2. Upload `index.html`, `styles.css`, `app.js` and `README.md` to the **main folder** of the repository (drag and drop works on the GitHub website), or push with git:
   ```
   git init
   git add .
   git commit -m "CC Learning"
   git branch -M main
   git remote add origin https://github.com/<your-username>/cc-learning.git
   git push -u origin main
   ```
3. Go to **Settings → Pages**, set **Source** to "Deploy from a branch", choose `main` and `/ (root)`, and save.
4. After a minute the site is live at `https://<your-username>.github.io/cc-learning/`.

## Adding or changing videos

Open `app.js` and edit the `COURSES` array. Each lesson is one line:

```js
L('Lesson title', 'YOUTUBE_VIDEO_ID')
```

The video ID is the part after `v=` in a YouTube link (for `youtube.com/watch?v=PqKPMGoXrxk` it is `PqKPMGoXrxk`).
