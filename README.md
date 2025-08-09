# Indian Court Case Metadata Fetcher 🏛️

<img width="1639" height="910" alt="image" src="https://github.com/user-attachments/assets/af8bb7fa-0c00-400a-a5a1-706ebfc6bc63" />
  
*Figure 1: Court Data Fetcher Application Interface*

## Table of Contents
1. [Project Overview](#project-overview-)
2. [Key Features](#key-features-)
3. [Technology Stack](#technology-stack-)
4. [Installation Guide](#installation-guide-)
   - [Prerequisites](#prerequisites)
   - [Setup Steps](#setup-steps)
5. [User Guide](#user-guide-)
   - [Search Functionality](#search-functionality)
   - [Understanding Results](#understanding-results)
6. [System Architecture](#system-architecture-)
   - [Data Flow Diagram](#data-flow-diagram)
   - [Database Schema](#database-schema)
7. [API Documentation](#api-documentation-)
8. [Development Roadmap](#development-roadmap-)
9. [Contributing Guidelines](#contributing-guidelines-)
10. [FAQs](#faqs-)
11. [License](#license-)

## Project Overview 📜

The Indian Court Case Metadata Fetcher is a web-based application designed to provide quick access to case information from various Indian courts. The system serves as a centralized interface for:

- Legal professionals
- Law students
- Journalists
- General public



## Key Features ✨

| Feature | Description | Example |
|---------|-------------|---------|
| **Multi-Court Search** | Search across multiple court jurisdictions | Delhi HC, Bombay HC |
| **Comprehensive Metadata** | Retrieve detailed case information | Parties, Dates, Status |
| **Document Access** | Download court orders/judgments | PDF, DOC formats |
| **Query History** | Automatic tracking of past searches | Local SQLite storage |
| **Responsive Design** | Mobile-friendly interface | Adapts to all devices |

## Technology Stack 💻

**Frontend:**
- Jinja2 Templating
- Bootstrap 5.2
- Vanilla JavaScript

**Backend:**
- Python 3.10
- Flask 2.3
- SQLAlchemy ORM

**Data Processing:**
- BeautifulSoup 4.12
- Requests 2.31

**Database:**
- SQLite (Development)
- PostgreSQL (Production-ready)

## Installation Guide ⚙️

### Prerequisites

- Python 3.10+
- pip 23.0+
- Virtualenv (Recommended)

```bash
# Verify installations
python --version
pip --version

Setup Steps
Environment Setup

bash
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
.venv\Scripts\activate    # Windows
Dependency Installation

bash
pip install -r requirements.txt
Database Initialization

bash
flask init-db
Running the Application

bash
flask run --host=0.0.0.0 --port=5000
https://screenshots/setup-terminal.png
Figure 3: Successful Application Startup

User Guide 📖
Search Functionality
Navigate to the search page

Fill the search form:

Case Type (Dropdown menu)

Case Number (Text input)

Year (Numeric input)

Click "Search" button

html
<!-- Sample Form Structure -->
<form method="POST">
  <select name="case_type">
    <option value="CIVIL">Civil</option>
    <option value="CRIMINAL">Criminal</option>
  </select>
  <input type="text" name="case_number" required>
  <input type="number" name="year" min="1950" max="2025">
  <button type="submit">Search</button>
</form>
Understanding Results
The results page displays:

Case Header

Court Name

Case Number

Case Title

Parties Section

Petitioner

Respondent

Dates Information

Filing Date

Next Hearing

Disposal Date (if applicable)

Documents Section

Downloadable orders

Judgment copies

https://screenshots/results-annotated.png
Figure 4: Annotated Results Page

System Architecture 🏗️
Data Flow Diagram
Diagram
#<img width="648" height="516" alt="image" src="https://github.com/user-attachments/assets/ef7b3d2b-fb27-4d60-9bda-c9231366bb34" />











Database Schema
sql
CREATE TABLE search_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_ip VARCHAR(45),
    case_type VARCHAR(20) NOT NULL,
    case_number VARCHAR(50) NOT NULL,
    year INTEGER NOT NULL,
    search_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    result_count INTEGER
);

CREATE TABLE cached_cases (
    case_hash VARCHAR(64) PRIMARY KEY,
    case_data JSON NOT NULL,
    last_updated TIMESTAMP
);
API Documentation 📡
Public Endpoints
GET /api/v1/case

json
{
  "parameters": {
    "type": "string",
    "number": "string",
    "year": "integer"
  },
  "response": {
    "success": "boolean",
    "data": "object",
    "error": "string|null"
  }
}
Example Request:

bash
curl -X GET "http://localhost:5000/api/v1/case?type=CIVIL&number=123&year=2023"
