document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const processingStatus = document.getElementById('processing-status');
    const statusText = document.getElementById('status-text');
    const progressFill = document.getElementById('progress-fill');
    const resultsSection = document.getElementById('results-section');
    const previewCanvas = document.getElementById('preview-canvas');
    const debugCanvas = document.getElementById('debug-canvas');
    const numbersGrid = document.getElementById('numbers-grid');
    
    // Stats
    const statRed = document.getElementById('stat-red');
    const statBlack = document.getElementById('stat-black');
    const statGreen = document.getElementById('stat-green');
    
    const copyBtn = document.getElementById('copy-btn');
    const resetBtn = document.getElementById('reset-btn');

    let extractedData = [];

    // Drag and Drop Events
    dropZone.addEventListener('click', () => fileInput.click());
    
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            handleImage(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleImage(e.target.files[0]);
        }
    });

    resetBtn.addEventListener('click', () => {
        resultsSection.classList.add('hidden');
        dropZone.style.display = 'block';
        fileInput.value = '';
        extractedData = [];
    });

    copyBtn.addEventListener('click', () => {
        if (extractedData.length === 0) return;
        const textToCopy = extractedData.map(d => `${d.number} (${d.color})`).join('\n');
        navigator.clipboard.writeText(textToCopy).then(() => {
            const originalText = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
            setTimeout(() => { copyBtn.innerHTML = originalText; }, 2000);
        });
    });

    function handleImage(file) {
        if (!file.type.startsWith('image/')) {
            alert('Tolong upload file gambar yang valid.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => processImage(img);
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    async function processImage(img) {
        // Hide drop zone, show processing
        dropZone.style.display = 'none';
        processingStatus.classList.remove('hidden');
        resultsSection.classList.add('hidden');
        
        // Draw original to preview canvas
        const ctx = previewCanvas.getContext('2d', { willReadFrequently: true });
        // Scale down if too large to improve OCR speed
        const MAX_WIDTH = 1200;
        let scale = 1;
        if (img.width > MAX_WIDTH) {
            scale = MAX_WIDTH / img.width;
        }
        previewCanvas.width = img.width * scale;
        previewCanvas.height = img.height * scale;
        ctx.drawImage(img, 0, 0, previewCanvas.width, previewCanvas.height);

        // Preprocess for OCR (increase contrast, grayscale) on debug canvas
        const dCtx = debugCanvas.getContext('2d', { willReadFrequently: true });
        debugCanvas.width = previewCanvas.width;
        debugCanvas.height = previewCanvas.height;
        dCtx.drawImage(previewCanvas, 0, 0);
        
        // Basic thresholding to make text pop for Tesseract
        const imageData = dCtx.getImageData(0, 0, debugCanvas.width, debugCanvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            // Calculate luminance
            const brightness = (data[i] * 299 + data[i+1] * 587 + data[i+2] * 114) / 1000;
            // If bright enough, make it white (text), else black (bg)
            const val = brightness > 80 ? 255 : 0;
            data[i] = data[i+1] = data[i+2] = val; // RGB
        }
        dCtx.putImageData(imageData, 0, 0);

        try {
            statusText.innerText = 'Menyiapkan AI OCR...';
            progressFill.style.width = '10%';
            
            const worker = await Tesseract.createWorker({
                logger: m => {
                    if (m.status === 'recognizing text') {
                        statusText.innerText = `Membaca Angka: ${Math.round(m.progress * 100)}%`;
                        progressFill.style.width = `${10 + (m.progress * 90)}%`;
                    }
                }
            });
            
            await worker.loadLanguage('eng');
            await worker.initialize('eng');
            // Whitelist only numbers
            await worker.setParameters({
                tessedit_char_whitelist: '0123456789',
            });

            // Run OCR on the thresholded image
            const { data: { words } } = await worker.recognize(debugCanvas);
            await worker.terminate();

            extractColorsAndRender(words, ctx);

        } catch (error) {
            console.error(error);
            statusText.innerText = 'Gagal memproses gambar. Coba gambar lain.';
            progressFill.style.background = 'red';
            setTimeout(() => {
                processingStatus.classList.add('hidden');
                dropZone.style.display = 'block';
            }, 3000);
        }
    }

    function extractColorsAndRender(words, originalCtx) {
        processingStatus.classList.add('hidden');
        resultsSection.classList.remove('hidden');
        numbersGrid.innerHTML = '';
        extractedData = [];

        let counts = { red: 0, black: 0, green: 0 };

        words.forEach((word, index) => {
            const text = word.text.trim();
            const num = parseInt(text);
            
            // Only accept valid roulette numbers
            if (isNaN(num) || num < 0 || num > 36) return;

            const bbox = word.bbox; // {x0, y0, x1, y1}
            
            // Determine color from the center of the bounding box on the original image
            const centerX = Math.floor((bbox.x0 + bbox.x1) / 2);
            const centerY = Math.floor((bbox.y0 + bbox.y1) / 2);
            
            // Look at a slightly larger area to avoid white text center
            let r_avg = 0, g_avg = 0, b_avg = 0;
            let sampleCount = 0;
            
            // Sample pixels around the center to catch the text color
            const pad = 4;
            const imgData = originalCtx.getImageData(
                Math.max(0, bbox.x0 - pad), 
                Math.max(0, bbox.y0 - pad), 
                bbox.x1 - bbox.x0 + pad*2, 
                bbox.y1 - bbox.y0 + pad*2
            ).data;

            let maxColor = {r:0, g:0, b:0};
            for (let i = 0; i < imgData.length; i += 4) {
                const r = imgData[i];
                const g = imgData[i+1];
                const b = imgData[i+2];
                // Ignore pure black/dark background
                if (r > 40 || g > 40 || b > 40) {
                    // find brightest pixel that might indicate color
                    if (r + g + b > maxColor.r + maxColor.g + maxColor.b) {
                        maxColor = {r, g, b};
                    }
                }
            }

            // Simple heuristic for Roulette colors
            let color = 'black'; // default is actually black/white text
            if (maxColor.g > maxColor.r + 30 && maxColor.g > maxColor.b + 30) {
                color = 'green';
            } else if (maxColor.r > maxColor.g + 50 && maxColor.r > maxColor.b + 50) {
                color = 'red';
            }

            // Roulette logic correction: 0 is always green
            if (num === 0) color = 'green';

            extractedData.push({ number: num, color: color });
            counts[color]++;

            // Create DOM element
            const el = document.createElement('div');
            el.className = `number-box bg-${color}`;
            el.innerText = num;
            // add stagger animation
            el.style.animationDelay = `${index * 0.02}s`;
            numbersGrid.appendChild(el);
            
            // Draw box on preview canvas to show detection
            originalCtx.strokeStyle = color === 'red' ? '#ff2a55' : (color === 'green' ? '#00e676' : '#00f0ff');
            originalCtx.lineWidth = 2;
            originalCtx.strokeRect(bbox.x0, bbox.y0, bbox.x1 - bbox.x0, bbox.y1 - bbox.y0);
        });

        // Update stats
        statRed.innerText = counts.red;
        statBlack.innerText = counts.black;
        statGreen.innerText = counts.green;

        if (extractedData.length === 0) {
            numbersGrid.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color: var(--text-muted)">Tidak ada angka roulette yang terdeteksi. Coba gambar yang lebih jelas.</p>';
        }
    }
});
