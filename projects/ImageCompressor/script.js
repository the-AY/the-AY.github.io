document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const uploadInput = document.getElementById('image-upload');
    const uploadPlaceholder = document.getElementById('upload-placeholder');
    const imagePreview = document.getElementById('image-preview');
    const fileInfo = document.getElementById('file-info');
    const editorControls = document.getElementById('editor-controls');
    
    // Stats
    const imageStats = document.getElementById('image-stats');
    const origSizeEl = document.getElementById('orig-size');
    const compSizeEl = document.getElementById('comp-size');
    const savingBadge = document.getElementById('saving-badge');

    // Controls
    const formatSelect = document.getElementById('format-select');
    const qualitySlider = document.getElementById('quality-slider');
    const qualityVal = document.getElementById('quality-val');
    const resizeWidth = document.getElementById('resize-width');
    const resizeHeight = document.getElementById('resize-height');
    const maintainRatio = document.getElementById('maintain-ratio');
    const applyResizeBtn = document.getElementById('apply-resize-btn');
    const downloadBtn = document.getElementById('download-btn');

    // Crop Controls
    const startCropBtn = document.getElementById('start-crop-btn');
    const applyCropBtn = document.getElementById('apply-crop-btn');
    const cancelCropBtn = document.getElementById('cancel-crop-btn');
    const cropRatioControls = document.getElementById('crop-ratio-controls');
    const cropRatio = document.getElementById('crop-ratio');

    // Tabs
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');

    // State
    let originalImage = null; // Image object
    let currentFile = null;
    let currentFileName = '';
    let cropper = null;
    let originalRatio = 1;
    let processedBlobUrl = null;

    // --- Tab Handling ---
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanels.forEach(p => p.classList.add('hidden'));
            
            btn.classList.add('active');
            const target = btn.getAttribute('data-tab');
            document.getElementById(`panel-${target}`).classList.remove('hidden');

            // Handle Cropper cleanup if switching away from crop
            if (target !== 'crop' && cropper) {
                cancelCropping();
            }
        });
    });

    // --- File Upload ---
    uploadInput.addEventListener('change', handleFileSelect);

    // Drag and Drop
    const canvasContainer = document.querySelector('.canvas-container');
    canvasContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
        canvasContainer.style.borderColor = 'var(--primary-color)';
    });
    canvasContainer.addEventListener('dragleave', (e) => {
        e.preventDefault();
        canvasContainer.style.borderColor = 'var(--border-color)';
    });
    canvasContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        canvasContainer.style.borderColor = 'var(--border-color)';
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            uploadInput.files = e.dataTransfer.files;
            handleFileSelect(e);
        }
    });

    function handleFileSelect(e) {
        const file = uploadInput.files[0];
        if (!file) return;

        if (!file.type.match('image.*')) {
            alert('Please select an image file (JPEG, PNG, WEBP).');
            return;
        }

        currentFile = file;
        currentFileName = file.name;
        origSizeEl.textContent = formatBytes(file.size);
        fileInfo.textContent = `${file.name} (${formatBytes(file.size)})`;
        fileInfo.classList.remove('hidden');
        
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                originalImage = img;
                originalRatio = img.width / img.height;
                
                // Set Resize Inputs
                resizeWidth.value = img.width;
                resizeHeight.value = img.height;

                // Show Image
                imagePreview.src = event.target.result;
                imagePreview.classList.remove('hidden');
                uploadPlaceholder.classList.add('hidden');
                
                // Enable Controls
                editorControls.classList.remove('disabled');
                imageStats.classList.remove('hidden');

                // Auto set format
                formatSelect.value = file.type === 'image/png' ? 'image/png' : 
                                     file.type === 'image/webp' ? 'image/webp' : 'image/jpeg';
                
                processImage();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }

    // --- Compress & Format ---
    qualitySlider.addEventListener('input', (e) => {
        qualityVal.textContent = Math.round(e.target.value * 100) + '%';
        processImage();
    });

    formatSelect.addEventListener('change', processImage);

    // --- Resize ---
    resizeWidth.addEventListener('input', () => {
        if (maintainRatio.checked && originalRatio) {
            resizeHeight.value = Math.round(resizeWidth.value / originalRatio);
        }
    });

    resizeHeight.addEventListener('input', () => {
        if (maintainRatio.checked && originalRatio) {
            resizeWidth.value = Math.round(resizeHeight.value * originalRatio);
        }
    });

    applyResizeBtn.addEventListener('click', () => {
        if (!originalImage) return;
        const w = parseInt(resizeWidth.value);
        const h = parseInt(resizeHeight.value);
        if (w > 0 && h > 0) {
            // Create a canvas to resize
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(originalImage, 0, 0, w, h);
            
            // Update originalImage reference
            const newImg = new Image();
            newImg.onload = () => {
                originalImage = newImg;
                originalRatio = w / h;
                processImage();
            };
            newImg.src = canvas.toDataURL(currentFile.type);
            
            // Visual feedback
            applyResizeBtn.textContent = 'Applied!';
            applyResizeBtn.classList.replace('btn-secondary', 'btn-primary');
            setTimeout(() => {
                applyResizeBtn.textContent = 'Apply Resize';
                applyResizeBtn.classList.replace('btn-primary', 'btn-secondary');
            }, 1500);
        }
    });

    // --- Crop ---
    startCropBtn.addEventListener('click', () => {
        if (!originalImage) return;
        
        // Hide/Show Buttons
        startCropBtn.classList.add('hidden');
        applyCropBtn.classList.remove('hidden');
        cancelCropBtn.classList.remove('hidden');
        cropRatioControls.classList.remove('hidden');

        // Initialize Cropper
        cropper = new Cropper(imagePreview, {
            viewMode: 2,
            background: false,
            autoCropArea: 0.8,
            aspectRatio: cropRatio.value === 'free' ? NaN : parseFloat(cropRatio.value),
        });
    });

    cropRatio.addEventListener('change', () => {
        if (cropper) {
            const val = cropRatio.value;
            cropper.setAspectRatio(val === 'free' ? NaN : parseFloat(val));
        }
    });

    cancelCropBtn.addEventListener('click', cancelCropping);

    function cancelCropping() {
        if (cropper) {
            cropper.destroy();
            cropper = null;
        }
        startCropBtn.classList.remove('hidden');
        applyCropBtn.classList.add('hidden');
        cancelCropBtn.classList.add('hidden');
        cropRatioControls.classList.add('hidden');
        processImage(); // Restore preview
    }

    applyCropBtn.addEventListener('click', () => {
        if (!cropper) return;
        
        const canvas = cropper.getCroppedCanvas();
        if (!canvas) return;

        // Update originalImage reference
        const newImg = new Image();
        newImg.onload = () => {
            originalImage = newImg;
            originalRatio = newImg.width / newImg.height;
            resizeWidth.value = newImg.width;
            resizeHeight.value = newImg.height;
            cancelCropping(); // cleanup UI
        };
        newImg.src = canvas.toDataURL(currentFile.type);
    });

    // --- Core Processing Logic ---
    function processImage() {
        if (!originalImage || cropper) return;

        const canvas = document.createElement('canvas');
        canvas.width = originalImage.width;
        canvas.height = originalImage.height;
        const ctx = canvas.getContext('2d');
        
        // Fill white background for JPEGs if image has transparency
        if (formatSelect.value === 'image/jpeg') {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        ctx.drawImage(originalImage, 0, 0);

        const format = formatSelect.value;
        const quality = parseFloat(qualitySlider.value);

        canvas.toBlob((blob) => {
            if (!blob) return;

            // Cleanup old blob url
            if (processedBlobUrl) {
                URL.revokeObjectURL(processedBlobUrl);
            }

            processedBlobUrl = URL.createObjectURL(blob);
            imagePreview.src = processedBlobUrl;

            // Update Stats
            compSizeEl.textContent = formatBytes(blob.size);
            
            const saved = ((currentFile.size - blob.size) / currentFile.size) * 100;
            if (saved > 0) {
                savingBadge.textContent = `${saved.toFixed(1)}% Saved`;
                savingBadge.style.color = 'var(--success-color)';
                savingBadge.style.background = 'rgba(16, 185, 129, 0.15)';
            } else {
                savingBadge.textContent = `+${Math.abs(saved).toFixed(1)}% Larger`;
                savingBadge.style.color = 'var(--danger-color)';
                savingBadge.style.background = 'rgba(239, 68, 68, 0.15)';
            }

        }, format, quality);
    }

    // --- Download ---
    downloadBtn.addEventListener('click', () => {
        if (!processedBlobUrl) return;
        
        const format = formatSelect.value.split('/')[1];
        let newFileName = currentFileName.substring(0, currentFileName.lastIndexOf('.')) || currentFileName;
        newFileName += `_compressed.${format}`;

        const a = document.createElement('a');
        a.href = processedBlobUrl;
        a.download = newFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });

    // --- Utility ---
    function formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
});
