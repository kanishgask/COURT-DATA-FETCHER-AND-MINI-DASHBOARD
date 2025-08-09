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


Step-by-Step Setup
Clone the repository

bash
git clone https://github.com/Deepak1804322/court-data-fetcher-dashboard
cd court-dashboard
Set up virtual environment

bash
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate
Install dependencies

bash
pip install -r requirements.txt
Initialize database

bash
flask init-db
Run the application

bash
flask run
Access the application
Open your browser and visit:
👉 http://localhost:5000

https://screenshots/setup-terminal.png
Figure 2: Successful application startup

📖 User Guide
1. Performing a Search
Select Case Type from dropdown (CIVIL/CRIMINAL)

Enter Case Number

Specify Filing Year

Click Search button

2. Understanding Results
The results page displays:

Case header with unique identifier

Parties section showing petitioner vs respondent

Dates information including:

Filing date

Next hearing date

Disposal date (if case is closed)

Documents section with downloadable:

Court orders

Final judgments (when available)

https://screenshots/results-page.png
Figure 3: Sample case results with annotations

3. Managing Search History
All your searches are automatically saved in the local database. To view history:

bash
sqlite3 queries.db "SELECT * FROM search_history;"
🔌 API Reference
The application provides RESTful endpoints for programmatic access:

GET /api/v1/search
Parameters:

case_type (string): CIVIL/CRIMINAL

case_number (string): Case identifier

year (integer): Filing year

Example Request:

bash
curl -X GET "http://localhost:5000/api/v1/search?case_type=CIVIL&case_number=123&year=2023"
Success Response (200):

json
{
  "status": "success",
  "data": {
    "case_number": "123",
    "title": "John Doe vs State of Maharashtra",
    "filing_date": "2023-06-14",
    "next_hearing": "2025-08-10",
    "status": "Pending",
    "documents": {
      "latest_order": "https://bombayhighcourt.nic.in/orders/123.pdf"
    }
  }
}
Error Response (404):

json
{
  "status": "error",
  "message": "Case not found"
}
🗃️ Database Schema
The application uses SQLite with the following structure:

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
    court_code VARCHAR(10),
    case_data JSON NOT NULL,
    last_updated TIMESTAMP
);
🚧 Development Roadmap
Short-Term (Q3 2024)
Add authentication system

Implement case tracking alerts

Support for 3 additional High Courts

Medium-Term (Q4 2024)
PDF text extraction for search

Advanced filters (Judge name, Act)

Bulk case lookup

Long-Term (2025)
AI-powered case prediction

Mobile app version

Integration with legal research tools

🤝 Contributing Guidelines
We welcome contributions from developers, legal professionals, and researchers:

Reporting Issues

Use GitHub Issues template

Include steps to reproduce

Attach relevant screenshots

Code Contributions

Fork the repository

Create a feature branch

Submit PR with clear description

Documentation Improvements

Update README

Add code comments

Write tutorials

First-time contributors are encouraged to look for good first issue labeled tasks.

📜 License
This project is licensed under the MIT License - see the LICENSE file for details.
