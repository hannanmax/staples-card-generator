module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { sku } = req.query;

  if (!sku) {
    return res.status(400).json({ error: 'SKU is required' });
  }

  // Clean SKU - only digits
  const cleanSku = sku.replace(/[^0-9]/g, '');

  if (!cleanSku) {
    return res.status(400).json({ error: 'Invalid SKU' });
  }

  try {
    // Fetch from StockTrack.ca API
    const url = `https://stocktrack.ca/st/search.php?q=${cleanSku}`;
    console.log('Fetching:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      console.log('Response not ok:', response.statusText);
      return res.status(404).json({ error: 'Product not found', sku: cleanSku });
    }

    const text = await response.text();
    console.log('Response length:', text.length);

    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      console.log('JSON parse error:', parseError.message);
      console.log('Response preview:', text.substring(0, 200));
      return res.status(500).json({ error: 'Invalid response from API', sku: cleanSku });
    }
    const results = data.results || [{}];
    const hits = results[0]?.hits || [];

    if (!hits.length) {
      return res.status(404).json({ error: 'Product not found', sku: cleanSku });
    }

    const hit = hits[0];

    // Extract product name
    let name = hit.title || '';
    if (!name) {
      const handle = hit.handle || '';
      const nameParts = handle.split('-').slice(2);
      name = nameParts.join(' ').replace(/-/g, ' ');
      name = name.charAt(0).toUpperCase() + name.slice(1);
    }

    // Extract brand
    let brand = (hit.vendor || '').replace(/_/g, ' ');
    brand = brand.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    if (brand.endsWith(' Brand')) {
      brand = brand.slice(0, -6);
    }

    // Extract price
    const price = String(hit.variants_min_price || 0);

    // Extract features from bullets
    const meta = hit.meta || {};
    const props = meta.props || {};
    const bullets = props.bullets || '';
    let features = [];
    if (bullets) {
      features = bullets.split(';').map(f => f.trim()).filter(f => f).slice(0, 4);
    }

    // Get image URL
    const imageUrl = hit.image || hit.product_image || '';

    // Get UPC/barcode
    const upc = hit.barcode || '';

    // Extract tagline (first short feature)
    let tagline = '';
    if (features.length && features[0].length < 50) {
      tagline = features[0];
      features = features.slice(1);
    }

    const product = {
      sku: cleanSku,
      name,
      brand,
      price,
      model: '',
      upc: String(upc),
      tagline,
      features,
      image_url: imageUrl,
    };

    return res.status(200).json(product);

  } catch (error) {
    console.error('Lookup error:', error);
    return res.status(500).json({ error: 'Failed to fetch product data' });
  }
}
