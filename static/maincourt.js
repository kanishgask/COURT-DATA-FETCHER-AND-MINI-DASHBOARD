// Global state
let isSearching = false;
let currentTheme = 'light';

document.addEventListener('DOMContentLoaded', function () {
    console.log('Court Data Fetcher initialized');

    // Initialize components
    initializeTheme();
    populateYears();
    setupRecentSearches();
    setupModals();

    // Form setup
    const searchForm = document.getElementById('searchForm');
    searchForm.addEventListener('submit', handleFormSubmit);
    addInputValidation();

    // Button event listeners
    document.getElementById('clearBtn').addEventListener('click', clearForm);
    document.getElementById('share-btn').addEventListener('click', showShareModal);
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
    document.getElementById('info-btn').addEventListener('click', () => showModal('info-modal'));
});

// Theme Management
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
}

function toggleTheme() {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
}

function setTheme(theme) {
    currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    const themeIcon = document.getElementById('theme-icon');
    themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

// Form Functions
function populateYears() {
    const yearSelect = document.getElementById('filing_year');
    const currentYear = new Date().getFullYear();

    yearSelect.innerHTML = '<option value="">Select Year</option>';

    for (let year = currentYear; year >= 1950; year--) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    }
}

function addInputValidation() {
    const caseNumberInput = document.getElementById('case_number');
    caseNumberInput.addEventListener('input', function (e) {
        e.target.value = e.target.value.replace(/[^0-9A-Za-z/-]/g, '');
    });
}

function clearForm() {
    document.getElementById('searchForm').reset();
    hideError();
    hideResults();
}

// Search Handling
async function handleFormSubmit(event) {
    event.preventDefault();

    if (isSearching) return;

    // Reset UI
    hideError();
    hideResults();

    // Validate form
    const formData = new FormData(event.target);
    const validation = validateFormData(formData);

    if (!validation.valid) {
        displayError(validation.message);
        return;
    }

    // Start search
    isSearching = true;
    showLoading();
    updateSearchButton(true);
    animateProgressBar();

    try {
        // Simulate API call (replace with actual fetch)
        const response = await simulateSearch(formData);

        if (response.success) {
            displayResults(response.data);
            addToRecentSearches(formData, response.data);
        } else {
            displayError(response.error || 'An error occurred while searching');
        }
    } catch (error) {
        console.error('Search error:', error);
        displayError('Network error: Please check your connection and try again');
    } finally {
        hideLoading();
        updateSearchButton(false);
        isSearching = false;
    }
}

// Simulated search function (replace with actual API call)
async function simulateSearch(formData) {
    return new Promise(resolve => {
        setTimeout(() => {
            const caseType = formData.get('case_type');
            const caseNumber = formData.get('case_number');
            const year = formData.get('filing_year');

            // Simulate success or failure randomly
            const shouldFail = Math.random() < 0.2; // 20% chance of failure

            if (shouldFail) {
                resolve({
                    success: false,
                    error: 'Case not found in the system'
                });
            } else {
                resolve({
                    success: true,
                    data: {
                        case_number: `${caseType} ${caseNumber}/${year}`,
                        parties_names: `Petitioner: State of Delhi\nRespondent: John Doe`,
                        filing_date: '2023-03-15',
                        next_hearing_date: '2024-08-25',
                        case_status: 'Pending',
                        search_duration: 1.25,
                        pdf_links: [
                            { url: 'https://example.com/doc1.pdf', title: 'Bail Application' },
                            { url: 'https://example.com/doc2.pdf', title: 'Previous Order' }
                        ],
                        timeline: [
                            { date: '2023-03-15', event: 'Case filed' },
                            { date: '2023-05-10', event: 'First hearing' },
                            { date: '2023-07-22', event: 'Evidence submitted' }
                        ]
                    }
                });
            }
        }, 2000); // Simulate network delay
    });
}

function validateFormData(formData) {
    const case_type = formData.get('case_type');
    const case_number = formData.get('case_number');
    const filing_year = formData.get('filing_year');

    if (!case_type) return { valid: false, message: 'Please select a case type' };
    if (!case_number) return { valid: false, message: 'Please enter a case number' };
    if (!filing_year) return { valid: false, message: 'Please select a filing year' };

    return { valid: true };
}

// Results Display
function displayResults(data) {
    // Update basic info
    updateElement('parties-names', data.parties_names);
    updateElement('filing-date', formatDate(data.filing_date));
    updateElement('next-hearing', formatDate(data.next_hearing_date));
    updateElement('case-status', data.case_status);
    updateElement('search-duration', data.search_duration?.toFixed(2) || '0.00');

    // Update documents
    displayPdfLinks(data.pdf_links || []);

    // Update timeline
    displayTimeline(data.timeline || []);

    showResults();
    scrollToElement('results');
}

function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value || 'Not available';
        element.style.color = value ? '' : '#9ca3af';
        element.style.fontStyle = value ? '' : 'italic';
    }
}

function displayPdfLinks(pdfLinks) {
    const pdfList = document.getElementById('pdf-list');
    pdfList.innerHTML = '';

    if (pdfLinks.length === 0) {
        pdfList.innerHTML = '<p class="no-docs">No documents available</p>';
        return;
    }

    pdfLinks.forEach((pdf, index) => {
        const pdfItem = document.createElement('div');
        pdfItem.className = 'document-item';

        const docInfo = document.createElement('div');
        docInfo.className = 'document-info';

        const docTitle = document.createElement('div');
        docTitle.className = 'document-title';
        docTitle.textContent = pdf.title || `Document ${index + 1}`;

        const docDate = document.createElement('div');
        docDate.className = 'document-date';
        docDate.textContent = pdf.date ? formatDate(pdf.date) : 'Date not available';

        docInfo.append(docTitle, docDate);

        const docActions = document.createElement('div');
        docActions.className = 'document-actions';

        const previewBtn = document.createElement('button');
        previewBtn.className = 'document-btn preview-btn';
        previewBtn.innerHTML = '<i class="fas fa-eye"></i> Preview';
        previewBtn.onclick = () => previewDocument(pdf.url);

        const downloadBtn = document.createElement('a');
        downloadBtn.className = 'document-btn download-btn';
        downloadBtn.href = `/download_pdf?url=${encodeURIComponent(pdf.url)}`;
        downloadBtn.target = '_blank';
        downloadBtn.innerHTML = '<i class="fas fa-download"></i> Download';

        docActions.append(previewBtn, downloadBtn);
        pdfItem.append(docInfo, docActions);
        pdfList.appendChild(pdfItem);
    });
}

function displayTimeline(events) {
    const timeline = document.getElementById('timeline');
    timeline.innerHTML = '';

    if (events.length === 0) {
        timeline.innerHTML = '<div class="timeline-empty"><p>No timeline data available</p></div>';
        return;
    }

    events.forEach(event => {
        const item = document.createElement('div');
        item.className = 'timeline-item';

        const date = document.createElement('div');
        date.className = 'timeline-date';
        date.textContent = formatDate(event.date);

        const content = document.createElement('div');
        content.className = 'timeline-content';
        content.textContent = event.event;

        item.append(date, content);
        timeline.appendChild(item);
    });
}

// Recent Searches
function setupRecentSearches() {
    const recentSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    updateRecentSearchesUI(recentSearches);
}

function addToRecentSearches(formData, result) {
    const recentSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');

    const newSearch = {
        case_type: formData.get('case_type'),
        case_number: formData.get('case_number'),
        year: formData.get('filing_year'),
        result: {
            status: result.case_status,
            next_hearing: result.next_hearing_date
        },
        timestamp: new Date().toISOString()
    };

    // Keep only the last 5 searches
    const updatedSearches = [newSearch, ...recentSearches].slice(0, 5);
    localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
    updateRecentSearchesUI(updatedSearches);
}

function updateRecentSearchesUI(searches) {
    const recentList = document.getElementById('recent-list');
    recentList.innerHTML = '';

    if (searches.length === 0) {
        document.getElementById('recent-searches').classList.add('hidden');
        return;
    }

    searches.forEach(search => {
        const item = document.createElement('div');
        item.className = 'recent-item';
        item.onclick = () => loadRecentSearch(search);

        const caseInfo = document.createElement('span');
        caseInfo.textContent = `${search.case_type} ${search.case_number}/${search.year}`;

        const dateInfo = document.createElement('span');
        dateInfo.className = 'recent-date';
        dateInfo.textContent = formatDate(search.timestamp, true);

        item.append(caseInfo, dateInfo);
        recentList.appendChild(item);
    });

    document.getElementById('recent-searches').classList.remove('hidden');
}

function loadRecentSearch(search) {
    document.getElementById('case_type').value = search.case_type;
    document.getElementById('case_number').value = search.case_number;
    document.getElementById('filing_year').value = search.year;
}

// Modal Functions
function setupModals() {
    // Close modals when clicking outside
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });

    // Close modals with escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal.active').forEach(modal => {
                closeModal(modal.id);
            });
        }
    });
}

function showModal(id) {
    document.getElementById(id).classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
    document.body.style.overflow = '';
}

function showShareModal() {
    const caseNumber = document.getElementById('parties-names').textContent;
    const shareUrl = `${window.location.origin}/share?case=${encodeURIComponent(caseNumber)}`;
    document.getElementById('share-url').value = shareUrl;
    showModal('share-modal');
}

function shareVia(method) {
    const shareUrl = document.getElementById('share-url').value;
    const caseNumber = document.getElementById('parties-names').textContent;

    switch (method) {
        case 'email':
            window.open(`mailto:?subject=Court Case Details&body=Check out this case: ${caseNumber}%0A%0A${shareUrl}`);
            break;
        case 'whatsapp':
            window.open(`https://wa.me/?text=Check out this court case: ${caseNumber} - ${shareUrl}`);
            break;
        case 'copy':
            navigator.clipboard.writeText(shareUrl);
            alert('Link copied to clipboard!');
            break;
    }

    closeModal('share-modal');
}

// UI Helpers
function showLoading() {
    document.getElementById('loading').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loading').classList.add('hidden');
}

function showResults() {
    document.getElementById('results').classList.remove('hidden');
}

function hideResults() {
    document.getElementById('results').classList.add('hidden');
}

function showError() {
    document.getElementById('error').classList.remove('hidden');
}

function hideError() {
    document.getElementById('error').classList.add('hidden');
}

function displayError(message) {
    document.getElementById('error-message').textContent = message;
    showError();
    scrollToElement('error');
}

function updateSearchButton(isLoading) {
    const searchBtn = document.getElementById('searchBtn');
    const btnText = searchBtn.querySelector('.btn-text');
    const btnSpinner = searchBtn.querySelector('.btn-spinner');

    searchBtn.disabled = isLoading;
    btnText.textContent = isLoading ? 'Searching...' : 'Search Case';
    btnSpinner.style.display = isLoading ? 'inline-flex' : 'none';
}

function animateProgressBar() {
    const progressBar = document.getElementById('progress-bar');
    progressBar.style.width = '0%';

    let width = 0;
    const interval = setInterval(() => {
        if (width >= 90) {
            clearInterval(interval);
            return;
        }
        width += 5;
        progressBar.style.width = `${width}%`;
    }, 300);
}

function scrollToElement(id) {
    document.getElementById(id).scrollIntoView({
        behavior: 'smooth',
        block: 'center'
    });
}

// Utility Functions
function formatDate(dateString, short = false) {
    if (!dateString) return 'Not available';

    const date = new Date(dateString);
    if (isNaN(date)) return dateString; // Return as-is if invalid date

    if (short) {
        return date.toLocaleDateString();
    }

    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function previewDocument(url) {
    // In a real implementation, this would open a PDF viewer
    console.log('Previewing document:', url);
    window.open(url, '_blank');
}

function startNewSearch() {
    clearForm();
    scrollToElement('searchForm');
}

function printResults() {
    window.print();
}

function saveToBookmarks() {
    // In a real implementation, this would save to localStorage or backend
    alert('Case bookmarked!');
}

function downloadResults() {
    // In a real implementation, this would generate a PDF or CSV
    alert('Downloading case details...');
}

function reportError() {
    const errorMsg = document.getElementById('error-message').textContent;
    const mailtoLink = `mailto:support@courtfetcher.com?subject=Error Report&body=${encodeURIComponent(errorMsg)}`;
    window.location.href = mailtoLink;
}
// Global state
let isSearching = false;
let currentTheme = 'light';

// Initialize application
document.addEventListener('DOMContentLoaded', function () {
    console.log('Court Data Fetcher initialized');

    // Initialize components
    initializeTheme();
    populateYears();
    setupRecentSearches();
    setupModals();
    setupEventListeners();
});

function setupEventListeners() {
    // Form setup
    const searchForm = document.getElementById('searchForm');
    searchForm.addEventListener('submit', handleFormSubmit);

    // Button event listeners
    document.getElementById('clearBtn').addEventListener('click', clearForm);
    document.getElementById('share-btn').addEventListener('click', showShareModal);
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
    document.getElementById('info-btn').addEventListener('click', () => showModal('info-modal'));

    // Footer links
    document.querySelector('[onclick="showAbout()"]').addEventListener('click', showAbout);
    document.querySelector('[onclick="showPrivacy()"]').addEventListener('click', showPrivacy);
    document.querySelector('[onclick="showContact()"]').addEventListener('click', showContact);
}

// [Keep all your existing functions from the previous implementation]
// Add these missing functions at the end:

function showAbout() {
    const modalContent = `
        <h3>About Court Data Fetcher</h3>
        <p>This application helps users search for case details from Delhi High Court.</p>
        <p>Version: 1.0.0</p>
    `;
    showCustomModal('About', modalContent);
}

function showPrivacy() {
    const modalContent = `
        <h3>Privacy Policy</h3>
        <p>We respect your privacy. All search data is processed securely and not stored permanently.</p>
    `;
    showCustomModal('Privacy Policy', modalContent);
}

function showContact() {
    const modalContent = `
        <h3>Contact Us</h3>
        <p>Email: support@courtdatafetcher.com</p>
        <p>Phone: +1 (555) 123-4567</p>
    `;
    showCustomModal('Contact Information', modalContent);
}

function showCustomModal(title, content) {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>${title}</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                ${content}
            </div>
        </div>
    `;

    modal.querySelector('.modal-close').addEventListener('click', () => {
        modal.remove();
    });

    document.body.appendChild(modal);
}

// Initialize the rest of your existing code...