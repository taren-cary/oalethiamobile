# Affirmation Images – Backend & Supabase Setup

This doc describes how the backend and Supabase Storage must support **life-context–based affirmation poster images** so the app can show one image per day per context.

---

## 1. Life-context slugs (7)

The app and backend use these **7 slugs** for classification and folder paths. They must match exactly.

| Slug | Description |
|------|-------------|
| `career` | Job, work, business, professional advancement |
| `growth` | Self-improvement, habits, confidence, learning, transformation |
| `health` | Body, fitness, wellness, mental health, sleep, diet |
| `finance` | Money, income, savings, debt, financial goals |
| `relationship` | Love, partnership, family, friends, connection |
| `spirituality` | Purpose, meaning, meditation, alignment, cosmic |
| `general` | Catch-all for broad or unclear goals |

**Default** when unknown: `general`.

---

## 2. Supabase Storage

### Bucket and paths

- **Bucket name:** `affirmation-images` (configured in backend).
- **Path convention:**  
  `{bucket}/{life_context}/{index}.jpg`  
  Example: `affirmation-images/career/0.jpg`, `affirmation-images/spirituality/9.jpg`.

### Image counts

- **Currently 10 images per context** in the backend (`AFFIRMATION_IMAGE_COUNT_PER_CONTEXT`). You can increase this (e.g. to ~100) and update the server constant when you add more images.
- Index is **0-based**. Files should be named `0.jpg`, `1.jpg`, … `9.jpg` (or up to your count) inside each context folder.

### Access

- Either make the bucket **public** and use public URLs, or generate **signed URLs** in the backend for the today-affirmation response. The app uses the `image_url` returned by the API as-is.

---

## 3. Generate timeline endpoint

- **Input:** User goal/outcome (and any other inputs you use).
- **Output:** Include in the JSON response:
  - `life_context`: one of the 7 slugs above (classify the goal into one context; default `general` if unsure).

The mobile app stores this in `action_timeline_generations.life_context` when the user saves the timeline.

---

## 4. Today-affirmation endpoint

**Route:** `GET /api/today-affirmation/:timelineId` (or equivalent).

- **Input:** `timelineId` (and auth).
- **Logic:**
  - Load the timeline (e.g. from DB); get `life_context` (default `general`).
  - Determine “today’s” affirmation index (e.g. `affirmation_index = daysSinceCreation % timeline_affirmations.length`).
  - Determine **image index** for today: e.g. `image_index = daysSinceCreation % imageCountForContext(life_context)` so the same image is used for the same day and context, and images cycle without repeating until all are used.
- **Output (JSON):** Include at least:
  - `affirmation_text`
  - `affirmation_index`
  - `affirmed` (boolean)
  - `life_context` (slug)
  - `image_index` (integer, 0-based)
  - **`image_url`**: full Supabase Storage URL (public or signed) for the image at  
    `{bucket}/{life_context}/{image_index}.jpg`  
    (or your actual path pattern). If you cannot build a URL (e.g. no images for that context), omit `image_url` or set it to `null`; the app will use a bundled fallback.

---

## 5. Database (already applied via Supabase MCP)

- **`action_timeline_generations`:** column `life_context` (text, nullable). Persist the value returned by the generate endpoint when the user saves.
- **`daily_affirmations`:** column `image_index` (integer, nullable). Optional; the app can set it when inserting rows; the backend can also compute it from `daysSinceCreation % imageCountForContext(life_context)` when serving today-affirmation.

---

## 6. Your checklist

1. **Create Supabase Storage bucket** (e.g. `affirmation-images`) and set policy (public or signed).
2. **Upload images** per context: e.g. `career/0.jpg` … `career/9.jpg`, and same for the other 6 slugs (7 folders total). Ensure filenames are 0-based indices.
3. **Backend: classify goal → `life_context`** in the generate endpoint and return it.
4. **Backend: today-affirmation**  
   - Reads `life_context` from the timeline (or default `general`).  
   - Computes `image_index` (e.g. `daysSinceCreation % imageCountForContext`).  
   - Builds **`image_url`** for `{bucket}/{life_context}/{image_index}.jpg` and returns it with `affirmation_text`, `affirmation_index`, `affirmed`, `life_context`, `image_index`.
5. **Configure image count per context** in the backend (e.g. 100, or actual counts per folder) so `image_index` never exceeds available files.

Once this is in place, the app will show one image per day per context and use the fallback poster when `image_url` is missing.
