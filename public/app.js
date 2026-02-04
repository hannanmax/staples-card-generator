const { jsPDF } = window.jspdf;

// Brand logos (Wikipedia Commons URLs)
const BRAND_LOGOS = {
    'bose': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Bose_logo.svg/512px-Bose_logo.svg.png',
    'beats': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Beats_Electronics_logo.svg/440px-Beats_Electronics_logo.svg.png',
    'apple': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/391px-Apple_logo_black.svg.png',
    'sony': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Sony_logo.svg/512px-Sony_logo.svg.png',
    'samsung': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Samsung_Logo.svg/512px-Samsung_Logo.svg.png',
    'jbl': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/JBL_logo.svg/512px-JBL_logo.svg.png',
    'logitech': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Logitech_logo.svg/512px-Logitech_logo.svg.png',
    'microsoft': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Microsoft_logo.svg/512px-Microsoft_logo.svg.png',
    'hp': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/HP_logo_2012.svg/480px-HP_logo_2012.svg.png',
    'dell': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Dell_Logo.svg/512px-Dell_Logo.svg.png',
    'lenovo': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Lenovo_logo_2015.svg/512px-Lenovo_logo_2015.svg.png',
    'google': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_2015_logo.svg/512px-Google_2015_logo.svg.png',
};

// Elements
const lookupSkuInput = document.getElementById('lookup-sku');
const lookupBtn = document.getElementById('lookup-btn');
const lookupStatus = document.getElementById('lookup-status');
const cardForm = document.getElementById('card-form');
const generateBtn = document.getElementById('generate-btn');
const clearBtn = document.getElementById('clear-btn');

// Form fields
const fields = {
    sku: document.getElementById('sku'),
    name: document.getElementById('name'),
    brand: document.getElementById('brand'),
    model: document.getElementById('model'),
    upc: document.getElementById('upc'),
    tagline: document.getElementById('tagline'),
    image_url: document.getElementById('image_url'),
    feature1: document.getElementById('feature1'),
    feature2: document.getElementById('feature2'),
    feature3: document.getElementById('feature3'),
    feature4: document.getElementById('feature4')
};

// Preview elements
const preview = {
    brand: document.getElementById('preview-brand'),
    name: document.getElementById('preview-name'),
    image: document.getElementById('preview-image'),
    tagline: document.getElementById('preview-tagline'),
    features: document.getElementById('preview-features'),
    model: document.getElementById('preview-model'),
    sku: document.getElementById('preview-sku')
};

// Status message helper
function showStatus(element, message, type) {
    element.textContent = message;
    element.className = `status-message ${type}`;
}

function hideStatus(element) {
    element.className = 'status-message';
    element.textContent = '';
}

// Button loading state
function setLoading(btn, loading) {
    const textSpan = btn.querySelector('.btn-text');
    const loadingSpan = btn.querySelector('.btn-loading');

    if (loading) {
        textSpan.style.display = 'none';
        loadingSpan.style.display = 'inline-flex';
        btn.disabled = true;
    } else {
        textSpan.style.display = 'inline';
        loadingSpan.style.display = 'none';
        btn.disabled = false;
    }
}

// Update preview
function updatePreview() {
    const sku = fields.sku.value || '-------';
    const name = fields.name.value || 'Product Name';
    const brand = fields.brand.value.toUpperCase() || 'BRAND';
    const model = fields.model.value;
    const tagline = fields.tagline.value;
    const imageUrl = fields.image_url.value;

    preview.brand.textContent = brand;
    preview.name.textContent = name;
    preview.tagline.textContent = tagline;
    preview.model.textContent = model ? `Model: ${model}` : '';
    preview.sku.textContent = `Sku: ${sku}`;

    if (imageUrl) {
        preview.image.innerHTML = `<img src="${imageUrl}" alt="Product" onerror="this.parentElement.innerHTML='<span>[Image Error]</span>'">`;
    } else {
        preview.image.innerHTML = '<span>[Product Image]</span>';
    }

    const features = [];
    for (let i = 1; i <= 4; i++) {
        const feat = fields[`feature${i}`].value.trim();
        if (feat) features.push(feat);
    }

    if (features.length > 0) {
        preview.features.innerHTML = features
            .map(f => {
                const text = f.length > 80 ? f.substring(0, 77) + '...' : f;
                return `<div class="preview-feature-item">• ${text}</div>`;
            })
            .join('');
    } else {
        preview.features.innerHTML = '';
    }
}

// Populate form with product data
function populateForm(data) {
    fields.sku.value = data.sku || '';
    fields.name.value = data.name || '';
    fields.brand.value = data.brand || '';
    fields.model.value = data.model || '';
    fields.upc.value = data.upc || '';
    fields.tagline.value = data.tagline || '';
    fields.image_url.value = data.image_url || '';

    const features = data.features || [];
    for (let i = 0; i < 4; i++) {
        fields[`feature${i + 1}`].value = features[i] || '';
    }

    updatePreview();
}

// Attach real-time preview updates
Object.values(fields).forEach(field => {
    field.addEventListener('input', updatePreview);
});

// CORS proxy for StockTrack API
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

// Product lookup via CORS proxy
async function lookupProduct() {
    const sku = lookupSkuInput.value.trim().replace(/[^0-9]/g, '');

    if (!sku) {
        showStatus(lookupStatus, 'Please enter a SKU number', 'error');
        return;
    }

    setLoading(lookupBtn, true);
    hideStatus(lookupStatus);

    try {
        // Fetch via CORS proxy
        const apiUrl = `https://stocktrack.ca/st/search.php?q=${sku}`;
        const response = await fetch(CORS_PROXY + encodeURIComponent(apiUrl));
        const data = await response.json();

        const results = data.results || [{}];
        const hits = results[0]?.hits || [];

        if (!hits.length) {
            showStatus(lookupStatus, 'Product not found.', 'error');
            fields.sku.value = sku;
            updatePreview();
            return;
        }

        const hit = hits[0];

        // Extract product data
        let name = hit.title || '';
        if (!name) {
            const handle = hit.handle || '';
            const nameParts = handle.split('-').slice(2);
            name = nameParts.join(' ').replace(/-/g, ' ');
            name = name.charAt(0).toUpperCase() + name.slice(1);
        }

        let brand = (hit.vendor || '').replace(/_/g, ' ');
        brand = brand.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
        if (brand.endsWith(' Brand')) brand = brand.slice(0, -6);

        const price = String(hit.variants_min_price || 0);

        const meta = hit.meta || {};
        const props = meta.props || {};
        const bullets = props.bullets || '';
        let features = [];
        if (bullets) {
            features = bullets.split(';').map(f => f.trim()).filter(f => f).slice(0, 4);
        }

        const imageUrl = hit.image || hit.product_image || '';
        const upc = hit.barcode || '';

        let tagline = '';
        if (features.length && features[0].length < 50) {
            tagline = features[0];
            features = features.slice(1);
        }

        const product = {
            sku,
            name,
            brand,
            price,
            model: '',
            upc: String(upc),
            tagline,
            features,
            image_url: imageUrl
        };

        populateForm(product);
        showStatus(lookupStatus, `Found: ${name}`, 'success');

    } catch (error) {
        showStatus(lookupStatus, 'Network error. Please try again.', 'error');
        console.error('Lookup error:', error);
    } finally {
        setLoading(lookupBtn, false);
    }
}

// Load image as base64
async function loadImageAsBase64(url) {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error('Image load error:', error);
        return null;
    }
}

// Get brand logo URL
function getBrandLogoUrl(brand) {
    const brandLower = brand.toLowerCase();
    for (const [key, url] of Object.entries(BRAND_LOGOS)) {
        if (brandLower.includes(key) || key.includes(brandLower)) {
            return url;
        }
    }
    return null;
}

// Generate barcode as data URL
function generateBarcodeDataUrl(code) {
    const canvas = document.getElementById('barcode-canvas');
    try {
        JsBarcode(canvas, code, {
            format: code.length === 12 ? 'UPC' : code.length === 13 ? 'EAN13' : 'CODE128',
            width: 2,
            height: 50,
            displayValue: true,
            fontSize: 12,
            margin: 5
        });
        return canvas.toDataURL('image/png');
    } catch (error) {
        console.error('Barcode error:', error);
        return null;
    }
}

// Wrap text to fit width
function wrapText(doc, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    words.forEach(word => {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = doc.getTextWidth(testLine);
        if (testWidth > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = testLine;
        }
    });
    if (currentLine) lines.push(currentLine);
    return lines;
}

// Generate PDF card
async function generateCard(e) {
    e.preventDefault();

    const sku = fields.sku.value.trim();
    const name = fields.name.value.trim();

    if (!sku || !name) {
        alert('Please fill in SKU and Product Name');
        return;
    }

    setLoading(generateBtn, true);

    try {
        // Card dimensions: 5x7 inches
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'in',
            format: [5, 7]
        });

        const pageWidth = 5;
        const pageHeight = 7;
        const margin = 0.4;
        const contentWidth = pageWidth - (2 * margin);
        const centerX = pageWidth / 2;

        let y = margin + 0.15; // Space for hole punch

        // Brand
        const brand = fields.brand.value.trim().toUpperCase();
        const brandLogoUrl = getBrandLogoUrl(brand);

        if (brandLogoUrl) {
            try {
                const logoData = await loadImageAsBase64(brandLogoUrl);
                if (logoData) {
                    const logoWidth = 1.2;
                    const logoHeight = 0.5;
                    doc.addImage(logoData, 'PNG', centerX - logoWidth/2, y, logoWidth, logoHeight);
                    y += logoHeight + 0.15;
                }
            } catch (e) {
                // Fallback to text
                doc.setFontSize(16);
                doc.setFont('helvetica', 'bold');
                doc.text(brand, centerX, y + 0.3, { align: 'center' });
                y += 0.5;
            }
        } else if (brand) {
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text(brand, centerX, y + 0.3, { align: 'center' });
            y += 0.5;
        }

        // Product name
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        const nameLines = wrapText(doc, name, contentWidth);
        nameLines.slice(0, 2).forEach(line => {
            doc.text(line, centerX, y + 0.15, { align: 'center' });
            y += 0.22;
        });
        y += 0.1;

        // Product image
        const imageUrl = fields.image_url.value.trim();
        if (imageUrl) {
            try {
                const imgData = await loadImageAsBase64(imageUrl);
                if (imgData) {
                    const imgWidth = 2.2;
                    const imgHeight = 1.8;
                    doc.addImage(imgData, 'PNG', centerX - imgWidth/2, y, imgWidth, imgHeight);
                    y += imgHeight + 0.2;
                }
            } catch (e) {
                y += 0.3;
            }
        } else {
            y += 0.3;
        }

        // Tagline
        const tagline = fields.tagline.value.trim();
        if (tagline) {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text(tagline, centerX, y + 0.1, { align: 'center' });
            y += 0.3;
        }

        // Features
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);

        for (let i = 1; i <= 4; i++) {
            const feat = fields[`feature${i}`].value.trim();
            if (feat) {
                const bulletText = `• ${feat}`;
                const featLines = wrapText(doc, bulletText, contentWidth - 0.2);
                featLines.slice(0, 3).forEach((line, idx) => {
                    const xPos = idx === 0 ? margin + 0.1 : margin + 0.2;
                    doc.text(line, xPos, y + 0.1);
                    y += 0.13;
                });
                y += 0.02;
            }
        }

        // Bottom section
        const bottomY = pageHeight - margin - 0.05;

        // Horizontal line
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.01);
        doc.line(margin, bottomY - 0.55, pageWidth - margin, bottomY - 0.55);

        // Model and SKU
        doc.setFontSize(7);
        doc.setTextColor(128, 128, 128);

        const model = fields.model.value.trim();
        if (model) {
            doc.text(`Model: ${model}`, margin, bottomY - 0.4);
        }
        doc.text(`Sku: ${sku}`, margin, bottomY - 0.25);

        // Footer text
        doc.setTextColor(0, 0, 0);
        doc.text('Please take to an associate for assistance.', margin, bottomY - 0.1);
        doc.text('For display purposes only.', margin, bottomY + 0.02);

        // Barcode
        const upc = fields.upc.value.trim() || sku;
        const barcodeData = generateBarcodeDataUrl(upc);
        if (barcodeData) {
            const bcWidth = 1.3;
            const bcHeight = 0.45;
            doc.addImage(barcodeData, 'PNG', pageWidth - margin - bcWidth, bottomY - 0.45, bcWidth, bcHeight);
        }

        // Save PDF
        doc.save(`card_${sku}.pdf`);

    } catch (error) {
        console.error('PDF generation error:', error);
        alert('Error generating PDF. Please try again.');
    } finally {
        setLoading(generateBtn, false);
    }
}

// Clear form
function clearForm() {
    Object.values(fields).forEach(field => {
        field.value = '';
    });
    lookupSkuInput.value = '';
    hideStatus(lookupStatus);
    updatePreview();
}

// Event listeners
lookupBtn.addEventListener('click', lookupProduct);
lookupSkuInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        lookupProduct();
    }
});

cardForm.addEventListener('submit', generateCard);
clearBtn.addEventListener('click', clearForm);

// Initial preview update
updatePreview();
