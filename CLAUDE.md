# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This repository is a static web application that visualizes the progression of AI model performance on the SWE-bench coding benchmark. It features interactive charts showing historical and projected performance data for various AI models (Claude, GPT, Gemini) along with underlying hardware drivers (FLOPS capacity and context length).

## Development Commands

### Local Development
```bash
# Serve the site locally using Ruby WEBrick server
ruby server.rb

# Alternative: Use any static file server
python -m http.server 8000
# or
npx http-server
```

### Build and Deploy
- The site auto-deploys to GitHub Pages when pushed to main branch
- Static HTML/CSS/JS files - no build step required

## Architecture

### Core Components

**Frontend Visualization**
- `index.html` - Main page with interactive Chart.js visualization
- `script.js` - Chart rendering, data processing, correlation analysis, and performance projections
- `styles.css` - Responsive styling with chart-specific layout

**Data Pipeline**
- `data/swe-bench-results.json` - Historical AI model benchmark scores
- `data/underlying-drivers.json` - Hardware roadmap data (FLOPS, context length)
- JSON structure includes model metadata, performance scores, dates, and organizational attribution

**Site Structure**
- `index.html` - Main page with template includes
- `_layouts/default.html` - Main page template
- `_includes/` - Reusable components (header, footer, head, social)

### Key Algorithms

**Correlation Analysis**
- Pearson correlation coefficients between hardware drivers and performance
- Log-scale transformations for compute and context length scaling
- Date-proximity matching for aligning performance and hardware data points

**Projection Engine** (`script.js:479-543`)
- Exponential scaling model with diminishing returns toward 100% ceiling
- Dual scaling factors: 60% weight on FLOPS capacity + 40% on context length growth
- Claude Opus projections use exponential curves: `basePerformance + (100 - basePerformance) * (1 - Math.exp(-totalBoost / 10))`

**Chart Rendering**
- Chart.js with time-series visualization
- Multi-axis support for performance scores vs. normalized hardware metrics
- Dynamic model grouping and color-coding by organization

### Data Flow

1. `loadResults()` fetches both JSON data files asynchronously
2. Data gets sorted chronologically and grouped by model family
3. `calculateCorrelations()` analyzes historical relationships between hardware and performance
4. `generateProjections()` creates future performance curves based on hardware roadmaps
5. Chart renders with historical data points, human performance baselines, and projections

## File Organization

```
/
├── data/                    # JSON data files
├── _layouts/               # HTML templates  
├── _includes/              # Reusable components
├── *.md                    # Methodology documentation
├── index.html              # Main visualization page
├── script.js              # Chart logic and projections
├── styles.css             # Styling
└── server.rb              # Local development server
```

## Development Notes

- The projection methodology is documented in `PROJECTION_METHODOLOGY.md` and `METHODOLOGY_VALIDITY_ANALYSIS.md`
- Chart annotations and labels are hardcoded in `script.js` for specific model positioning
- Hardware scaling assumptions are based on Nvidia roadmap data through 2027
- Performance ceiling capped at 99% to reflect real-world constraints