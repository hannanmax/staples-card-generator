document.addEventListener('DOMContentLoaded', () => {
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

        // Update preview elements
        preview.brand.textContent = brand;
        preview.name.textContent = name;
        preview.tagline.textContent = tagline;
        preview.model.textContent = model ? `Model: ${model}` : '';
        preview.sku.textContent = `Sku: ${sku}`;

        // Update image preview
        if (imageUrl) {
            preview.image.innerHTML = `<img src="${imageUrl}" alt="Product" onerror="this.parentElement.innerHTML='<span>[Image Error]</span>'">`;
        } else {
            preview.image.innerHTML = '<span>[Product Image]</span>';
        }

        // Features - each on its own line
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

    // Product lookup
    async function lookupProduct() {
        const sku = lookupSkuInput.value.trim().replace(/[^0-9]/g, '');

        if (!sku) {
            showStatus(lookupStatus, 'Please enter a SKU number', 'error');
            return;
        }

        setLoading(lookupBtn, true);
        hideStatus(lookupStatus);

        try {
            const response = await fetch(`/api/lookup/${sku}`);
            const data = await response.json();

            if (response.ok) {
                populateForm(data);
                showStatus(lookupStatus, `Found: ${data.name}`, 'success');
            } else {
                showStatus(lookupStatus, data.error || 'Product not found. You can enter details manually.', 'error');
                fields.sku.value = sku;
                updatePreview();
            }
        } catch (error) {
            showStatus(lookupStatus, 'Network error. Please try again.', 'error');
            console.error('Lookup error:', error);
        } finally {
            setLoading(lookupBtn, false);
        }
    }

    // Generate card
    async function generateCard(e) {
        e.preventDefault();

        const sku = fields.sku.value.trim();
        const name = fields.name.value.trim();

        if (!sku || !name) {
            alert('Please fill in SKU and Product Name');
            return;
        }

        setLoading(generateBtn, true);

        const formData = {
            sku: sku,
            name: name,
            brand: fields.brand.value.trim(),
            model: fields.model.value.trim(),
            upc: fields.upc.value.trim(),
            tagline: fields.tagline.value.trim(),
            image_url: fields.image_url.value.trim(),
            feature1: fields.feature1.value.trim(),
            feature2: fields.feature2.value.trim(),
            feature3: fields.feature3.value.trim(),
            feature4: fields.feature4.value.trim()
        };

        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                // Download the PDF
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `card_${sku}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                a.remove();
            } else {
                const data = await response.json();
                alert(data.error || 'Failed to generate card');
            }
        } catch (error) {
            alert('Network error. Please try again.');
            console.error('Generate error:', error);
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
});
