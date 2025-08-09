# SWE-Bench Results Data Structure

## Core Result Schema

```json
{
  "results": [
    {
      "id": "unique_result_id",
      "date": "2024-01-15",
      "model_name": "GPT-4",
      "model_version": "gpt-4-0125-preview",
      "organization": "OpenAI",
      "score": 12.29,
      "total_instances": 2294,
      "solved_instances": 282,
      "benchmark_version": "swe-bench-lite",
      "methodology": "direct",
      "source_url": "https://example.com/paper-or-repo",
      "paper_title": "Optional paper title",
      "notes": "Any additional context"
    }
  ]
}
```

## Model Metadata Schema

```json
{
  "models": [
    {
      "model_name": "GPT-4",
      "organization": "OpenAI",
      "release_date": "2023-03-14",
      "parameters": "1.76T",
      "architecture": "transformer",
      "model_type": "language_model"
    }
  ]
}
```

## Key Design Decisions
- Date format: YYYY-MM-DD for easy sorting
- Score as percentage (0-100)
- Separate model metadata for normalization
- Source tracking for verification
- Flexible notes field for context