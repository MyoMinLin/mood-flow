---
title: "Mood-Based Search"
trigger_condition: "After mood tracking feature ships and has been used for 2+ weeks with real data"
planted_date: 2026-06-20
status: dormant
---

# Mood-Based Search

## Idea
Allow users to search and filter their diary entries by mood. Examples:
- "Show me entries when I was happy"
- "What was I talking about when I felt anxious?"
- "Find all entries from my most content week"

## Why This Could Be Valuable
- Turns mood data from passive labels into active discovery
- Helps users find patterns they wouldn't notice by scrolling
- Voice entries with mood tags become a searchable emotional archive
- Natural extension of the mood timeline — not just see trends, but drill into them

## Dependencies
- Mood tracking feature must be shipped and collecting data
- Entries need indexed mood_label and mood_confidence fields
- UI needs a search/filter component (doesn't exist yet)

## Open Questions
- Should search be text-based ("happy") or visual (click on a mood in the chart)?
- Should it support mood combinations ("happy AND energized")?
- How to handle entries where user overrode AI mood — search both or just final?

## Trigger
Plant this seed when:
1. Mood tracking has been live for 2+ weeks
2. User has 10+ entries with mood labels
3. User asks "how do I find entries where I felt X?"
