# Staples Take-to-Cash Card Generator

A web application to generate 5x7 inch product display cards for Staples retail stores. These cards are placed on display hooks for high-value items that customers must take to the cash register to purchase.

## Features

- **SKU Lookup** - Enter a Staples SKU to automatically fetch product details (name, brand, price, features, image, UPC)
- **Brand Logos** - Automatically adds brand logos for major brands (Bose, Beats, Apple, Sony, Samsung, JBL, etc.)
- **Product Images** - Fetches and includes product images on the card
- **UPC Barcodes** - Generates scannable barcodes from the product UPC
- **PDF Generation** - Creates print-ready 5x7 inch PDF cards (client-side)

## Live Demo

[https://staples-card-generator.vercel.app](https://staples-card-generator.vercel.app)

## Tech Stack

- **Frontend**: Vanilla HTML/CSS/JavaScript
- **PDF Generation**: jsPDF (client-side)
- **Barcode Generation**: JsBarcode (client-side)
- **API Proxy**: Cloudflare Workers (CORS proxy)
- **Product Data**: StockTrack.ca API
- **Hosting**: Vercel

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

## Local Development

1. Clone the repository:
```bash
git clone https://github.com/hannanmax/staples-card-generator.git
cd staples-card-generator
```

2. Serve the public folder with any static server:
```bash
npx serve public
# or
python -m http.server 8000 -d public
```

3. Open http://localhost:3000 (or 8000)

## Deployment

The app is configured for Vercel deployment. Simply push to the main branch and Vercel will automatically deploy.

### Cloudflare Worker (API Proxy)

The app uses a Cloudflare Worker to proxy requests to StockTrack.ca (to avoid CORS issues). The worker code is in `cloudflare-worker.js`. To deploy your own:

1. Create a free account at [Cloudflare Workers](https://workers.cloudflare.com)
2. Create a new Worker and paste the code from `cloudflare-worker.js`
3. Deploy and update the `STOCKTRACK_PROXY` URL in `public/app.js`

## License

MIT License

## Author

Hannan - Staples Canada Associate
