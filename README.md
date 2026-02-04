# Staples Take-to-Cash Card Generator

A web application to generate 5x7 inch product display cards for Staples retail stores. These cards are placed on display hooks for high-value items that customers must take to the cash register to purchase.

## Features

- **SKU Lookup** - Enter a Staples SKU to automatically fetch product details (name, brand, price, features, image, UPC)
- **Brand Logos** - Automatically adds brand logos for major brands (Bose, Beats, Apple, Sony, Samsung, JBL, etc.)
- **Product Images** - Fetches and includes product images on the card
- **UPC Barcodes** - Generates scannable barcodes from the product UPC
- **PDF Generation** - Creates print-ready 5x7 inch PDF cards

## Installation

1. Clone the repository:
```bash
git clone https://github.com/hannanmax/staples-card-generator.git
cd staples-card-generator
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the application:
```bash
python app.py
```

4. Open your browser to `http://127.0.0.1:5001`

## Usage

1. Enter a Staples SKU number in the lookup field
2. Click "Look Up Product" to fetch product details
3. Edit any fields as needed (name, brand, tagline, features)
4. Click "Generate Card" to download the PDF

## Card Layout

The generated card includes:
- Brand logo (top)
- Product name
- Product image
- Tagline
- Features (up to 4, each can span 3 lines)
- Model number and SKU
- UPC barcode
- "Please take to an associate for assistance" footer

## Requirements

- Python 3.8+
- Flask
- ReportLab
- python-barcode
- Pillow
- requests
- beautifulsoup4

## Tech Stack

- **Backend**: Flask (Python)
- **PDF Generation**: ReportLab
- **Barcode Generation**: python-barcode
- **Product Data**: StockTrack.ca API
- **Frontend**: Vanilla JavaScript, HTML, CSS

## License

MIT License

## Author

Hannan - Staples Canada Associate
