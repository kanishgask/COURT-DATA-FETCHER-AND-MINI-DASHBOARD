from flask import Flask, render_template, request, jsonify, send_file
import os
import time
import re
from datetime import datetime
from sraper import CourtScraper
from database import DatabaseManager
from config import Config
import requests
from io import BytesIO
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__, 
           template_folder='../frontend/templates', 
           static_folder='../frontend/static')
app.config.from_object(Config)

# Initialize components
db_manager = DatabaseManager(app.config['DATABASE_PATH'])

# Global scraper instance
scraper = None

def get_scraper():
    """Get scraper instance (with demo mode for now)"""
    global scraper
    if scraper is None:
        # Use demo mode until we get the real scraper working
        scraper = CourtScraper(demo_mode=True)
    return scraper

@app.route('/')
def index():
    """Render the main search form"""
    try:
        recent_queries = db_manager.get_recent_queries(5)
        return render_template('index.html', recent_queries=recent_queries)
    except Exception as e:
        logger.error(f"Index page error: {str(e)}")
        return render_template('index.html', recent_queries=[])

@app.route('/search', methods=['POST'])
def search_case():
    """Handle case search requests with improved validation and error handling"""
    # Initialize variables
    query_id = None
    start_time = time.time()
    
    try:
        # Get form data with defaults
        case_type = request.form.get('case_type', '').strip().upper()
        case_number = request.form.get('case_number', '').strip()
        filing_year = request.form.get('filing_year', '').strip()

        # Validate inputs
        if not all([case_type, case_number, filing_year]):
            logger.warning("Missing required fields")
            return jsonify({"error": "All fields (case type, number, and year) are required"}), 400

        # Validate case type (Delhi HC specific)
        valid_case_types = ['CRL', 'WPC', 'FAO', 'RFA', 'LPA']  # Add more as needed
        if case_type not in valid_case_types:
            logger.warning(f"Invalid case type: {case_type}")
            return jsonify({"error": f"Invalid case type. Must be one of: {', '.join(valid_case_types)}"}), 400

        # Validate case number format
        if not re.match(r'^[0-9A-Z/-]+$', case_number):
            logger.warning(f"Invalid case number format: {case_number}")
            return jsonify({"error": "Case number can only contain numbers, letters, and hyphens"}), 400

        # Validate year
        try:
            filing_year = int(filing_year)
            current_year = datetime.now().year
            if not (1950 <= filing_year <= current_year):
                logger.warning(f"Invalid year: {filing_year}")
                return jsonify({"error": f"Year must be between 1950 and {current_year}"}), 400
        except ValueError:
            logger.warning(f"Non-numeric year: {filing_year}")
            return jsonify({"error": "Year must be a valid number"}), 400

        # Log the query
        query_id = db_manager.log_query(case_type, case_number, filing_year)
        logger.info(f"Search initiated - ID: {query_id}, Case: {case_type} {case_number}/{filing_year}")

        # Perform search
        court_scraper = get_scraper()
        result = court_scraper.search_case(case_type, case_number, filing_year)
        
        # Handle scraper errors
        if "error" in result:
            logger.error(f"Scraper error: {result['error']}")
            db_manager.update_query_status(query_id, 'failed', error_message=result["error"])
            return jsonify({"error": result["error"]}), 400

        # Calculate search duration
        search_duration = round(time.time() - start_time, 2)
        
        # Save successful result
        db_manager.save_case_details(
            query_id,
            result.get("parties_names", "N/A"),
            result.get("filing_date", "N/A"), 
            result.get("next_hearing_date", "N/A"),
            result.get("case_status", "N/A"),
            result.get("pdf_links", []),
            result.get("additional_info", {})
        )
        
        db_manager.update_query_status(query_id, 'success')
        logger.info(f"Search completed successfully in {search_duration}s")

        # Return formatted response
        return jsonify({
            "success": True,
            "query_id": str(query_id),
            "case_info": {
                "type": case_type,
                "number": case_number,
                "year": filing_year,
                "parties": result.get("parties_names"),
                "filing_date": result.get("filing_date"),
                "next_hearing": result.get("next_hearing_date"),
                "status": result.get("case_status")
            },
            "documents": {
                "available": len(result.get("pdf_links", [])),
                "links": result.get("pdf_links", [])
            },
            "metrics": {
                "search_duration": search_duration,
                "timestamp": datetime.now().isoformat()
            }
        })

    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        if query_id:
            db_manager.update_query_status(query_id, 'failed', error_message=str(e))
        return jsonify({
            "error": "An unexpected error occurred",
            "details": str(e)
        }), 500

@app.route('/health')
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "mode": "demo"})

@app.route('/download_pdf')
def download_pdf():
    """Proxy PDF downloads to avoid CORS issues"""
    pdf_url = request.args.get('url')
    if not pdf_url:
        return jsonify({"error": "No URL provided"}), 400
    
    # For demo mode, return a message since these are example URLs
    if 'example.com' in pdf_url:
        return jsonify({
            "message": "This is a demo PDF link. In production, this would download the actual court document.",
            "demo_url": pdf_url
        }), 200
    
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
        response = requests.get(pdf_url, headers=headers, timeout=30)
        response.raise_for_status()
        
        return send_file(
            BytesIO(response.content),
            mimetype='application/pdf',
            as_attachment=True,
            download_name='court_document.pdf'
        )
        
    except Exception as e:
        logger.error(f"PDF download failed: {str(e)}")
        return jsonify({"error": f"Download failed: {str(e)}"}), 500

if __name__ == '__main__':
    print("🚀 Starting Court Data Fetcher...")
    print("📍 Mode: DEMO (using simulated data)")
    print("🌐 Server: http://localhost:5000")
    
    app.run(debug=True, host='0.0.0.0', port=5000)