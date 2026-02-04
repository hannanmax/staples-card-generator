#!/usr/bin/env python3
"""
Staples Take-to-Cash Card Generator - Web App
Flask backend for generating product display cards
"""

import os
import json
import re
from io import BytesIO
from datetime import datetime
from flask import Flask, render_template, request, jsonify, send_file

# PDF generation
from reportlab.lib.pagesizes import inch
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# Barcode generation
import barcode
from barcode.writer import ImageWriter
from PIL import Image
import requests
from bs4 import BeautifulSoup

app = Flask(__name__)

# Card dimensions
CARD_WIDTH = 5 * inch
CARD_HEIGHT = 7 * inch

# Brand logo URLs (using public CDN logos)
BRAND_LOGOS = {
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
    'jabra': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Jabra_Logo.svg/512px-Jabra_Logo.svg.png',
    'sennheiser': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Sennheiser_logo.svg/512px-Sennheiser_logo.svg.png',
}

def download_image(url: str) -> Image.Image:
    """Download image from URL and return as PIL Image"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code == 200:
            return Image.open(BytesIO(response.content))
    except Exception as e:
        print(f"Image download error: {e}")
    return None


def get_brand_logo(brand: str) -> Image.Image:
    """Get brand logo image"""
    brand_lower = brand.lower().strip()

    # Check for known brands
    for key in BRAND_LOGOS:
        if key in brand_lower or brand_lower in key:
            logo = download_image(BRAND_LOGOS[key])
            if logo:
                return logo

    return None


def generate_barcode(code: str) -> Image.Image:
    """Generate barcode image from code"""
    try:
        code_clean = re.sub(r'[^0-9A-Za-z]', '', str(code))
        if not code_clean:
            return None

        if code_clean.isdigit() and len(code_clean) >= 11:
            if len(code_clean) == 12:
                bc_class = barcode.get_barcode_class('upca')
            elif len(code_clean) == 13:
                bc_class = barcode.get_barcode_class('ean13')
            else:
                bc_class = barcode.get_barcode_class('code128')
                code_clean = code_clean[:20]
        else:
            bc_class = barcode.get_barcode_class('code128')
            code_clean = code_clean[:20]

        if bc_class == barcode.get_barcode_class('upca'):
            code_clean = code_clean[:12].zfill(12)

        bc = bc_class(code_clean, writer=ImageWriter())
        buffer = BytesIO()
        bc.write(buffer, options={
            'write_text': True,
            'font_size': 8,
            'text_distance': 3,
            'module_height': 10,
            'module_width': 0.33,
            'quiet_zone': 2
        })
        buffer.seek(0)
        return Image.open(buffer)
    except Exception as e:
        print(f"Barcode error: {e}")
        return None


def create_card_pdf(product: dict) -> BytesIO:
    """Generate a 5x7 PDF card matching Staples design"""

    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=(CARD_WIDTH, CARD_HEIGHT))

    margin = 0.4 * inch
    content_width = CARD_WIDTH - (2 * margin)
    center_x = CARD_WIDTH / 2

    # Leave space at top for hole punch
    y = CARD_HEIGHT - margin - 0.15*inch

    # ===== BRAND LOGO =====
    brand = product.get('brand', '')
    logo_img = get_brand_logo(brand)

    if logo_img:
        # Scale logo to fit
        logo_max_width = 1.5 * inch
        logo_max_height = 0.6 * inch

        # Calculate scale
        w_scale = logo_max_width / logo_img.width
        h_scale = logo_max_height / logo_img.height
        scale = min(w_scale, h_scale)

        logo_width = logo_img.width * scale
        logo_height = logo_img.height * scale

        # Save logo to buffer
        logo_buffer = BytesIO()
        logo_img.save(logo_buffer, format='PNG')
        logo_buffer.seek(0)
        logo_reader = ImageReader(logo_buffer)

        logo_x = center_x - (logo_width / 2)
        logo_y = y - logo_height - 0.1*inch

        c.drawImage(logo_reader, logo_x, logo_y, width=logo_width, height=logo_height,
                   preserveAspectRatio=True, mask='auto')

        y = logo_y - 0.2*inch
    else:
        # Fallback to text brand name
        if brand:
            c.setFont("Helvetica-Bold", 16)
            brand_upper = brand.upper()
            brand_width = c.stringWidth(brand_upper, "Helvetica-Bold", 16)
            c.drawString(center_x - brand_width/2, y - 0.4*inch, brand_upper)
            y -= 0.7*inch

    # ===== PRODUCT NAME =====
    c.setFont("Helvetica", 14)
    c.setFillColor(colors.Color(0.4, 0.4, 0.4))
    name = product.get('name', '')

    # Wrap product name if needed
    words = name.split()
    lines = []
    current = ""
    for word in words:
        test = f"{current} {word}".strip()
        if c.stringWidth(test, "Helvetica", 14) < content_width:
            current = test
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)

    for line in lines[:2]:
        line_width = c.stringWidth(line, "Helvetica", 14)
        c.drawString(center_x - line_width/2, y - 0.2*inch, line)
        y -= 0.28*inch

    y -= 0.2*inch

    # ===== PRODUCT IMAGE =====
    image_url = product.get('image_url', '')
    product_img = None
    if image_url:
        product_img = download_image(image_url)

    img_max_width = 2.8 * inch
    img_max_height = 2.2 * inch

    if product_img:
        # Scale image to fit
        w_scale = img_max_width / product_img.width
        h_scale = img_max_height / product_img.height
        scale = min(w_scale, h_scale)

        img_width = product_img.width * scale
        img_height = product_img.height * scale

        img_buffer = BytesIO()
        product_img.save(img_buffer, format='PNG')
        img_buffer.seek(0)
        img_reader = ImageReader(img_buffer)

        img_x = center_x - (img_width / 2)
        img_y = y - img_height

        c.drawImage(img_reader, img_x, img_y, width=img_width, height=img_height,
                   preserveAspectRatio=True, mask='auto')

        y = img_y - 0.3*inch
    else:
        # Placeholder
        placeholder_height = 1.8 * inch
        y -= placeholder_height + 0.3*inch

    # ===== TAGLINE =====
    tagline = product.get('tagline', '')
    if tagline:
        c.setFont("Helvetica-Bold", 11)
        c.setFillColor(colors.black)
        tagline_width = c.stringWidth(tagline, "Helvetica-Bold", 11)
        c.drawString(center_x - tagline_width/2, y, tagline)
        y -= 0.35*inch

    # ===== FEATURES =====
    features = product.get('features', [])
    if features:
        c.setFont("Helvetica", 8)
        c.setFillColor(colors.black)

        # Each feature can have up to 3 lines
        for feat in features[:4]:
            text = f"• {feat}"

            # Wrap text to max 3 lines
            words = text.split()
            lines = []
            current_line = ""

            for word in words:
                test = f"{current_line} {word}".strip()
                if c.stringWidth(test, "Helvetica", 8) < content_width - 0.2*inch:
                    current_line = test
                else:
                    if current_line:
                        lines.append(current_line)
                    current_line = word
            if current_line:
                lines.append(current_line)

            # Limit to 3 lines, truncate third line if needed
            for i, line in enumerate(lines[:3]):
                if i == 2 and len(lines) > 3:
                    # Truncate third line if there's more text
                    max_width = content_width - 0.4*inch
                    while c.stringWidth(line + "...", "Helvetica", 8) > max_width and len(line) > 10:
                        line = line[:-1]
                    line = line.rstrip() + "..."

                # Indent continuation lines
                x_pos = margin + 0.1*inch if i == 0 else margin + 0.2*inch
                c.drawString(x_pos, y, line)
                y -= 0.13*inch

            y -= 0.02*inch  # Small gap between features

        y -= 0.05*inch

    # ===== BOTTOM SECTION =====
    bottom_y = margin - 0.05*inch

    # Horizontal line
    c.setStrokeColor(colors.Color(0.8, 0.8, 0.8))
    c.setLineWidth(0.5)
    c.line(margin, bottom_y + 0.58*inch, CARD_WIDTH - margin, bottom_y + 0.58*inch)

    # Model and SKU
    c.setFont("Helvetica", 7)
    c.setFillColor(colors.Color(0.5, 0.5, 0.5))

    model = product.get('model', '')
    sku = product.get('sku', '')

    if model:
        c.drawString(margin, bottom_y + 0.44*inch, f"Model: {model}")
    c.drawString(margin, bottom_y + 0.3*inch, f"Sku: {sku}")

    # Footer text
    c.setFont("Helvetica", 7)
    c.setFillColor(colors.black)
    c.drawString(margin, bottom_y + 0.16*inch, "Please take to an associate for assistance.")
    c.drawString(margin, bottom_y + 0.04*inch, "For display purposes only.")

    # Barcode (right side)
    upc = product.get('upc') or sku
    if upc:
        bc_img = generate_barcode(str(upc))
        if bc_img:
            bc_buffer = BytesIO()
            bc_img.save(bc_buffer, format='PNG')
            bc_buffer.seek(0)
            bc_reader = ImageReader(bc_buffer)

            bc_width = 1.3 * inch
            bc_height = 0.45 * inch
            bc_x = CARD_WIDTH - margin - bc_width
            bc_y = bottom_y + 0.02*inch

            c.drawImage(bc_reader, bc_x, bc_y, width=bc_width, height=bc_height,
                       preserveAspectRatio=True, anchor='c', mask='auto')

    c.save()
    buffer.seek(0)
    return buffer


def fetch_from_stocktrack(sku: str) -> dict:
    """Fetch product data from StockTrack.ca API"""

    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json',
    }

    try:
        url = f'https://stocktrack.ca/st/search.php?q={sku}'
        response = requests.get(url, headers=headers, timeout=10)

        if response.status_code == 200:
            data = response.json()
            results = data.get('results', [{}])
            hits = results[0].get('hits', []) if results else []

            if hits:
                hit = hits[0]

                # Extract product name from title or handle
                name = hit.get('title', '')
                if not name:
                    handle = hit.get('handle', '')
                    name_parts = handle.split('-')[2:]
                    name = ' '.join(name_parts).replace('-', ' ').title()

                # Extract brand
                brand = hit.get('vendor', '').replace('_', ' ').title()
                if brand.endswith(' Brand'):
                    brand = brand[:-6]

                # Extract price
                price = str(hit.get('variants_min_price', 0))

                # Extract features from bullets
                features = []
                meta = hit.get('meta', {})
                props = meta.get('props', {})
                bullets = props.get('bullets', '')
                if bullets:
                    feature_list = bullets.split(';')
                    features = [f.strip() for f in feature_list if f.strip()][:4]

                # Get image URL
                image_url = hit.get('image', '') or hit.get('product_image', '')

                # Get UPC/barcode
                upc = hit.get('barcode', '') or ''

                # Try to extract tagline (first short feature or description)
                tagline = ''
                if features and len(features[0]) < 50:
                    tagline = features[0]
                    features = features[1:]

                product = {
                    'sku': sku,
                    'name': name,
                    'brand': brand,
                    'price': price,
                    'model': '',
                    'upc': str(upc),
                    'tagline': tagline,
                    'features': features,
                    'image_url': image_url
                }

                return product

    except Exception as e:
        print(f"StockTrack API error: {e}")

    return None


def scrape_staples_product(sku: str) -> dict:
    """Fetch product data - try StockTrack API"""
    return fetch_from_stocktrack(sku)


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/lookup/<sku>')
def lookup_product(sku):
    """Look up product by SKU"""
    sku = re.sub(r'[^0-9]', '', sku)

    if not sku:
        return jsonify({'error': 'Invalid SKU'}), 400

    # Try StockTrack API
    product = scrape_staples_product(sku)

    if product:
        return jsonify(product)
    else:
        return jsonify({
            'error': 'Product not found',
            'sku': sku
        }), 404


@app.route('/api/generate', methods=['POST'])
def generate_card():
    """Generate a PDF card from product data"""
    data = request.get_json()

    if not data:
        return jsonify({'error': 'No data provided'}), 400

    required = ['sku', 'name']
    for field in required:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400

    # Build product dict
    product = {
        'sku': data.get('sku', ''),
        'name': data.get('name', ''),
        'brand': data.get('brand', ''),
        'price': data.get('price', ''),
        'model': data.get('model', ''),
        'upc': data.get('upc', '') or data.get('sku', ''),
        'tagline': data.get('tagline', ''),
        'image_url': data.get('image_url', ''),
        'features': []
    }

    # Collect features
    for i in range(1, 5):
        feat = data.get(f'feature{i}', '').strip()
        if feat:
            product['features'].append(feat)

    try:
        pdf_buffer = create_card_pdf(product)

        return send_file(
            pdf_buffer,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f"card_{product['sku']}.pdf"
        )
    except Exception as e:
        print(f"PDF generation error: {e}")
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5001)
