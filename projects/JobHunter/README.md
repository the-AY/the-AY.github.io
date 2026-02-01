# Job Hunter Pro & ATS Scanner

A powerful, local web application built with Python and Streamlit to help job seekers optimize their resumes and find opportunities faster.

## Features

### 1. ATS Resume Scanner
*   **Deep Analysis**: Parses your PDF resume to extract contact info, skills, and sections.
*   **Scoring Engine**: Gives you a "Parsability Score" (0-100) based on keywords, formatting, and content.
*   **Detailed Feedback**: Identifies missing critical sections (e.g., Skills, Experience) and suggests improvements.
*   **Visual Dashboard**: Uses interactive charts to visualize your resume's strength.

### 2. Intelligent Job Search
*   **Smart Link Generation**: Automatically creates complex Boolean search strings for LinkedIn, Google Jobs, Indeed, and Naukri.
    *   *Example*: `("Python Developer") AND ("Django" OR "Flask") AND ("Remote")`
*   **One-Click Search**: Opens these pre-filled searches in a new tab, saving you from manual typing.
*   **Aggregated Feeds**: Fetches latest remote jobs from public RSS feeds (e.g., WeWorkRemotely) and displays them in a sortable table.
*   **Excel Export**: Download found jobs to CSV for tracking.

## Installation & Usage

1.  **Prerequisites**: Make sure you have Python 3.9+ installed.
2.  **Run the Script**:
    *   Double-click `run_jobhunter.bat`.
    *   This will automatically install dependencies and launch the app in your browser.

## Manual Setup
If you prefer running via terminal:
```bash
pip install -r requirements.txt
python -m spacy download en_core_web_sm
streamlit run app.py
```

## Tech Stack
*   **UI**: Streamlit
*   **Parsing**: pdfminer.six, spacy
*   **Visuals**: Plotly
*   **Data**: Pandas, Feedparser
