# Research Questions

## Cloud API for Text Sentiment Analysis

**Added:** 2026-06-20
**Context:** Mood tracking feature for VoiceDiary
**Priority:** High — blocks implementation

### Question
Which cloud API should we use for text-based sentiment/mood analysis on diary entries?

### Candidates to Evaluate
- **OpenAI API** — GPT-based sentiment analysis via chat completions
- **Google Cloud Natural Language API** — dedicated sentiment analysis endpoint
- **Azure Cognitive Services** — Text Analytics sentiment endpoint
- **Hugging Face Inference API** — open-source sentiment models
- **Cohere** — classify endpoint with custom labels

### Evaluation Criteria
1. **Accuracy** — how well does it detect nuanced emotions (not just positive/negative)?
2. **Cost** — per-request pricing at scale (~1000 entries/month)?
3. **Latency** — response time for a single entry analysis?
4. **Emotion granularity** — does it return more than positive/neutral/negative? (e.g., happy, sad, anxious, content, frustrated)
5. **Privacy policy** — is text data used for training? Can we opt out?
6. **Ease of integration** — REST API, SDK availability for browser-side calls?

### Constraints
- App is currently client-side only (Vite + vanilla JS)
- Cloud API calls will be made from the browser (or via a lightweight proxy)
- Budget-conscious — this is a personal/small project
