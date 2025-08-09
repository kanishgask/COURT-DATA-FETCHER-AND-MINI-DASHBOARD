import requests
from bs4 import BeautifulSoup
import re
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select, WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import time
import logging
from urllib.parse import urljoin
import pytesseract
import os
from PIL import Image, ImageEnhance, ImageFilter

# ✅ Configure Tesseract path for Windows (change if installed in a different folder)
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

# Test configuration
try:
    print(f"✓ Tesseract version: {pytesseract.get_tesseract_version()}")
except Exception as e:
    print(f"❌ Tesseract configuration error: {e}")

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CourtScraper:
    def __init__(self, target_court="delhi_high_court", demo_mode=False):
        self.demo_mode = demo_mode
        
        if self.demo_mode:
            from demo_scraper import DemoCourtScraper
            self.demo_scraper = DemoCourtScraper()
            logger.info("🎭 Running in DEMO MODE - using simulated data")
            return
        
        self.target_court = target_court
        self.setup_court_config()
        self.setup_selenium()
        self.session = requests.Session()
        
    def setup_court_config(self):
        if self.target_court == "delhi_high_court":
            self.base_url = "https://delhihighcourt.nic.in"
            self.case_search_url = "https://delhihighcourt.nic.in/app/case-number"
            self.form_selectors = {
                'form_id': 'search1',
                'case_type': 'select[name="case_type"]',
                'case_number': 'input[name="case_number"]',
                'year': 'select[name="year"]',
                'captcha_input': 'input[name="captchaInput"]',
                'captcha_image': 'img[src*="captcha"]',
                'submit': 'button[id="search"]'
            }
        else:
            raise ValueError(f"Unsupported court: {self.target_court}")
    
    def setup_selenium(self):
        chrome_options = Options()
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--window-size=1920,1080")
        service = Service(ChromeDriverManager().install())
        self.driver = webdriver.Chrome(service=service, options=chrome_options)
        self.wait = WebDriverWait(self.driver, 15)
        logger.info("✓ Chrome WebDriver initialized successfully")
    
    def search_case(self, case_type, case_number, filing_year):
        if self.demo_mode:
            return self.demo_scraper.search_case(case_type, case_number, filing_year)
        
        try:
            logger.info(f"Searching case: {case_type} {case_number}/{filing_year}")
            self.driver.get(self.case_search_url)
            time.sleep(3)
            
            form = self.wait.until(EC.presence_of_element_located((By.ID, self.form_selectors['form_id'])))
            logger.info("✓ Form loaded successfully")
            
            if not self.fill_search_form_exact(case_type, case_number, filing_year):
                return {"error": "Failed to fill search form"}
            
            if not self.handle_captcha_exact():
                return {"error": "CAPTCHA solving failed"}
            
            if not self.submit_form_and_wait_exact():
                return {"error": "Form submission failed"}
            
            return self.parse_case_details()
            
        except Exception as e:
            logger.error(f"Search failed: {str(e)}")
            return {"error": f"Search failed: {str(e)}"}
    
    def fill_search_form_exact(self, case_type, case_number, filing_year):
        try:
            case_type_select = Select(self.wait.until(
                EC.presence_of_element_located((By.CSS_SELECTOR, self.form_selectors['case_type']))
            ))
            
            matched = False
            for option in case_type_select.options:
                if option.text != 'Select' and case_type.lower() in option.text.lower():
                    case_type_select.select_by_visible_text(option.text)
                    matched = True
                    break
            if not matched:
                case_type_select.select_by_index(1)
            
            case_number_input = self.wait.until(
                EC.presence_of_element_located((By.CSS_SELECTOR, self.form_selectors['case_number']))
            )
            case_number_input.clear()
            case_number_input.send_keys(case_number)
            
            year_select = Select(self.wait.until(
                EC.presence_of_element_located((By.CSS_SELECTOR, self.form_selectors['year']))
            ))
            if str(filing_year) in [o.text for o in year_select.options]:
                year_select.select_by_visible_text(str(filing_year))
            else:
                year_select.select_by_visible_text('2024')
            
            return True
        except Exception as e:
            logger.error(f"Form filling failed: {str(e)}")
            return False
        
    def handle_captcha_exact(self):
        try:
            captcha_images = self.driver.find_elements(By.CSS_SELECTOR, self.form_selectors['captcha_image'])
            captcha_inputs = self.driver.find_elements(By.CSS_SELECTOR, self.form_selectors['captcha_input'])
            
            if captcha_images and captcha_inputs:
                return self.solve_numeric_captcha(captcha_images[0], captcha_inputs[0])
            return True
        except Exception as e:
            logger.error(f"CAPTCHA handling failed: {str(e)}")
            return False

    def solve_numeric_captcha(self, captcha_image, captcha_input):
        try:
            captcha_image.screenshot("captcha_temp.png")
            image = Image.open("captcha_temp.png").convert('L')
            image = ImageEnhance.Contrast(image).enhance(2.5)
            image = ImageEnhance.Sharpness(image).enhance(2.0)
            image = image.filter(ImageFilter.MedianFilter(size=1))
            
            custom_config = r'--oem 3 --psm 8 -c tessedit_char_whitelist=0123456789'
            captcha_text = pytesseract.image_to_string(image, config=custom_config).strip()
            captcha_numbers = re.sub(r'[^0-9]', '', captcha_text)
            
            if captcha_numbers and 3 <= len(captcha_numbers) <= 8:
                captcha_input.clear()
                captcha_input.send_keys(captcha_numbers)
                return True
            return False
        except Exception as e:
            logger.error(f"Numeric CAPTCHA solving failed: {str(e)}")
            return False
        finally:
            for f in ["captcha_temp.png"]:
                if os.path.exists(f):
                    os.remove(f)

    def submit_form_and_wait_exact(self):
        try:
            submit_button = self.wait.until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, self.form_selectors['submit']))
            )
            submit_button.click()
            self.wait.until(
                EC.any_of(
                    EC.presence_of_element_located((By.TAG_NAME, "table")),
                    EC.presence_of_element_located((By.CLASS_NAME, "result"))
                )
            )
            return True
        except Exception as e:
            logger.error(f"Form submission failed: {str(e)}")
            return False
    
    def parse_case_details(self):
        try:
            page_source = self.driver.page_source
            soup = BeautifulSoup(page_source, 'html.parser')
            if "no record" in soup.get_text().lower():
                return {"error": "No results found"}
            return {"status": "Success", "html_length": len(page_source)}
        except Exception as e:
            return {"error": f"Parsing failed: {str(e)}"}
    
    def __del__(self):
        try:
            if hasattr(self, 'driver'):
                self.driver.quit()
        except:
            pass

if __name__ == "__main__":
    print("Testing Court Scraper...")
    real_scraper = CourtScraper(demo_mode=False)
    result = real_scraper.search_case("ARB.A.", "123", 2024)
    print(result)

