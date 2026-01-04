// ===========================
// CERTIFICATE GENERATOR APP
// ===========================

// Global State
const state = {
    certificateImage: null,
    canvas: null,
    ctx: null,
    parameters: [],
    excelData: [],
    maxParameters: 5,
    isDragging: false,
    draggedParam: null,
    dragOffset: { x: 0, y: 0 }
};

// ===========================
// INITIALIZATION
// ===========================

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    state.canvas = document.getElementById('certificateCanvas');
    state.ctx = state.canvas.getContext('2d');

    setupEventListeners();
}

function setupEventListeners() {
    // Certificate upload
    const uploadArea = document.getElementById('uploadArea');
    const certificateUpload = document.getElementById('certificateUpload');

    uploadArea.addEventListener('click', () => certificateUpload.click());
    certificateUpload.addEventListener('change', handleCertificateUpload);

    // Drag and drop for certificate
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--primary-color)';
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.borderColor = 'var(--border-color)';
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--border-color)';
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            loadCertificateImage(file);
        }
    });

    // Add parameter button
    document.getElementById('addParameterBtn').addEventListener('click', addParameter);

    // Excel upload
    const excelUploadArea = document.getElementById('excelUploadArea');
    const excelUpload = document.getElementById('excelUpload');

    excelUploadArea.addEventListener('click', () => excelUpload.click());
    excelUpload.addEventListener('change', handleExcelUpload);

    // Generation buttons
    document.getElementById('previewBtn').addEventListener('click', previewCertificate);
    document.getElementById('generateAllBtn').addEventListener('click', generateAllCertificates);

    // Canvas mouse events for dragging
    state.canvas.addEventListener('mousedown', handleCanvasMouseDown);
    state.canvas.addEventListener('mousemove', handleCanvasMouseMove);
    state.canvas.addEventListener('mouseup', handleCanvasMouseUp);
    state.canvas.addEventListener('mouseleave', handleCanvasMouseUp);
}

// ===========================
// CERTIFICATE IMAGE UPLOAD
// ===========================

function handleCertificateUpload(e) {
    const file = e.target.files[0];
    if (file) {
        loadCertificateImage(file);
    }
}

function loadCertificateImage(file) {
    const reader = new FileReader();

    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            state.certificateImage = img;
            setupCanvas(img);
            showSection('configSection');
            document.getElementById('certificatePreview').style.display = 'block';

            // Add first parameter automatically
            if (state.parameters.length === 0) {
                addParameter();
            }
        };
        img.src = e.target.result;
    };

    reader.readAsDataURL(file);
}

function setupCanvas(img) {
    // Set canvas size to match image, with max width constraint
    const maxWidth = 1200;
    const scale = Math.min(1, maxWidth / img.width);

    state.canvas.width = img.width * scale;
    state.canvas.height = img.height * scale;

    redrawCanvas();
}

function redrawCanvas() {
    if (!state.certificateImage) return;

    // Clear canvas
    state.ctx.clearRect(0, 0, state.canvas.width, state.canvas.height);

    // Draw certificate image
    state.ctx.drawImage(state.certificateImage, 0, 0, state.canvas.width, state.canvas.height);

    // Draw all parameters
    state.parameters.forEach(param => {
        drawParameter(param);
    });
}

function drawParameter(param) {
    state.ctx.save();

    // Set text properties
    let fontStyle = '';
    if (param.bold) fontStyle += 'bold ';
    if (param.italic) fontStyle += 'italic ';
    state.ctx.font = `${fontStyle}${param.fontSize}px ${param.fontFamily}`;
    state.ctx.fillStyle = param.color;
    state.ctx.textAlign = param.align || 'left';

    // Draw text
    const displayText = param.value || param.label;
    state.ctx.fillText(displayText, param.x, param.y);

    // Draw draggable indicator (crosshair + circle) - MUCH MORE VISIBLE
    // Use bright red color with white outline for maximum visibility
    const lineLength = 20;

    // Draw white background/outline for crosshair (for visibility on dark backgrounds)
    state.ctx.strokeStyle = '#ffffff';
    state.ctx.lineWidth = 4;

    // Horizontal line (white outline)
    state.ctx.beginPath();
    state.ctx.moveTo(param.x - lineLength, param.y);
    state.ctx.lineTo(param.x + lineLength, param.y);
    state.ctx.stroke();

    // Vertical line (white outline)
    state.ctx.beginPath();
    state.ctx.moveTo(param.x, param.y - lineLength);
    state.ctx.lineTo(param.x, param.y + lineLength);
    state.ctx.stroke();

    // Draw red crosshair on top
    state.ctx.strokeStyle = '#ef4444';
    state.ctx.lineWidth = 2;

    // Horizontal line (red)
    state.ctx.beginPath();
    state.ctx.moveTo(param.x - lineLength, param.y);
    state.ctx.lineTo(param.x + lineLength, param.y);
    state.ctx.stroke();

    // Vertical line (red)
    state.ctx.beginPath();
    state.ctx.moveTo(param.x, param.y - lineLength);
    state.ctx.lineTo(param.x, param.y + lineLength);
    state.ctx.stroke();

    // Draw center circle with white outline
    state.ctx.fillStyle = '#ffffff';
    state.ctx.beginPath();
    state.ctx.arc(param.x, param.y, 6, 0, Math.PI * 2);
    state.ctx.fill();

    state.ctx.fillStyle = '#ef4444';
    state.ctx.beginPath();
    state.ctx.arc(param.x, param.y, 4, 0, Math.PI * 2);
    state.ctx.fill();

    // Draw move icon text hint (only if no value set)
    if (!param.value) {
        // Draw white background for text
        state.ctx.font = 'bold 13px Arial';
        const hintText = '⟡ Drag me';
        const textWidth = state.ctx.measureText(hintText).width;

        state.ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        state.ctx.fillRect(param.x + 25, param.y - 18, textWidth + 12, 24);

        // Draw border
        state.ctx.strokeStyle = '#ef4444';
        state.ctx.lineWidth = 2;
        state.ctx.strokeRect(param.x + 25, param.y - 18, textWidth + 12, 24);

        // Draw text
        state.ctx.fillStyle = '#ef4444';
        state.ctx.fillText(hintText, param.x + 31, param.y - 2);
    }

    state.ctx.restore();
}

// ===========================
// PARAMETER MANAGEMENT
// ===========================

function addParameter() {
    if (state.parameters.length >= state.maxParameters) {
        alert(`Maximum ${state.maxParameters} parameters allowed`);
        return;
    }

    const paramIndex = state.parameters.length;
    const param = {
        id: Date.now(),
        label: `Parameter ${paramIndex + 1}`,
        x: state.canvas.width / 2,
        y: 100 + (paramIndex * 80),
        fontFamily: 'Arial',
        fontSize: 24,
        color: '#000000',
        bold: false,
        italic: false,
        align: 'center',
        value: ''
    };

    state.parameters.push(param);
    renderParameterCard(param);
    redrawCanvas();

    // Show excel section if we have at least one parameter
    if (state.parameters.length > 0) {
        showSection('excelSection');
    }
}

function renderParameterCard(param) {
    const container = document.getElementById('parametersContainer');
    const card = document.createElement('div');
    card.className = 'parameter-card';
    card.id = `param-${param.id}`;

    card.innerHTML = `
    <div class="parameter-header">
      <div class="parameter-title">
        <span class="parameter-badge">Param ${state.parameters.length}</span>
        <span id="param-label-${param.id}">${param.label}</span>
      </div>
      <button class="delete-param-btn" onclick="deleteParameter(${param.id})">
        <ion-icon name="trash-outline"></ion-icon>
      </button>
    </div>
    
    <div class="form-group">
      <label class="form-label">Parameter Label</label>
      <input type="text" class="form-input" value="${param.label}" 
             onchange="updateParameter(${param.id}, 'label', this.value)">
    </div>
    
    <div class="position-controls">
      <label class="form-label">
        <ion-icon name="move-outline"></ion-icon> 
        Position (Drag on canvas or enter values)
      </label>
      <div class="position-inputs">
        <div class="position-input-group">
          <label>X:</label>
          <input type="number" class="form-input position-input" 
                 id="pos-x-${param.id}" 
                 value="${Math.round(param.x)}" 
                 onchange="updatePosition(${param.id}, 'x', parseInt(this.value))">
        </div>
        <div class="position-input-group">
          <label>Y:</label>
          <input type="number" class="form-input position-input" 
                 id="pos-y-${param.id}" 
                 value="${Math.round(param.y)}" 
                 onchange="updatePosition(${param.id}, 'y', parseInt(this.value))">
        </div>
      </div>
    </div>
    
    <div class="form-row-3">
      <div class="form-group">
        <label class="form-label">Font Family</label>
        <select class="form-select" onchange="updateParameter(${param.id}, 'fontFamily', this.value)">
          <option value="Arial" ${param.fontFamily === 'Arial' ? 'selected' : ''}>Arial</option>
          <option value="Times New Roman" ${param.fontFamily === 'Times New Roman' ? 'selected' : ''}>Times New Roman</option>
          <option value="Georgia" ${param.fontFamily === 'Georgia' ? 'selected' : ''}>Georgia</option>
          <option value="Verdana" ${param.fontFamily === 'Verdana' ? 'selected' : ''}>Verdana</option>
          <option value="Courier New" ${param.fontFamily === 'Courier New' ? 'selected' : ''}>Courier New</option>
          <option value="Impact" ${param.fontFamily === 'Impact' ? 'selected' : ''}>Impact</option>
        </select>
      </div>
      
      <div class="form-group">
        <label class="form-label">Size</label>
        <input type="number" class="form-input" value="${param.fontSize}" min="12" max="72"
               onchange="updateParameter(${param.id}, 'fontSize', parseInt(this.value))">
      </div>
      
      <div class="form-group">
        <label class="form-label">Color</label>
        <input type="color" value="${param.color}" 
               onchange="updateParameter(${param.id}, 'color', this.value)">
      </div>
    </div>
    
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Text Style</label>
        <div class="style-buttons">
          <button class="style-btn ${param.bold ? 'active' : ''}" 
                  onclick="toggleStyle(${param.id}, 'bold')">
            <strong>B</strong>
          </button>
          <button class="style-btn ${param.italic ? 'active' : ''}" 
                  onclick="toggleStyle(${param.id}, 'italic')">
            <em>I</em>
          </button>
        </div>
      </div>
      
      <div class="form-group">
        <label class="form-label">Alignment</label>
        <select class="form-select" onchange="updateParameter(${param.id}, 'align', this.value)">
          <option value="left" ${param.align === 'left' ? 'selected' : ''}>Left</option>
          <option value="center" ${param.align === 'center' ? 'selected' : ''}>Center</option>
          <option value="right" ${param.align === 'right' ? 'selected' : ''}>Right</option>
        </select>
      </div>
    </div>
  `;

    container.appendChild(card);
}

function updateParameter(id, property, value) {
    const param = state.parameters.find(p => p.id === id);
    if (param) {
        param[property] = value;

        // Update label display
        if (property === 'label') {
            document.getElementById(`param-label-${id}`).textContent = value;
        }

        redrawCanvas();
    }
}

function updatePosition(id, axis, value) {
    const param = state.parameters.find(p => p.id === id);
    if (param) {
        param[axis] = value;
        redrawCanvas();
    }
}

function toggleStyle(id, style) {
    const param = state.parameters.find(p => p.id === id);
    if (param) {
        param[style] = !param[style];

        // Update button UI
        const card = document.getElementById(`param-${id}`);
        const buttons = card.querySelectorAll('.style-btn');
        buttons.forEach(btn => {
            if ((style === 'bold' && btn.querySelector('strong')) ||
                (style === 'italic' && btn.querySelector('em'))) {
                btn.classList.toggle('active', param[style]);
            }
        });

        redrawCanvas();
    }
}

function deleteParameter(id) {
    const index = state.parameters.findIndex(p => p.id === id);
    if (index !== -1) {
        state.parameters.splice(index, 1);
        document.getElementById(`param-${id}`).remove();
        redrawCanvas();

        // Update parameter badges
        updateParameterBadges();
    }
}

function updateParameterBadges() {
    state.parameters.forEach((param, index) => {
        const badge = document.querySelector(`#param-${param.id} .parameter-badge`);
        if (badge) {
            badge.textContent = `Param ${index + 1}`;
        }
    });
}

// ===========================
// CANVAS DRAGGING
// ===========================

function handleCanvasMouseDown(e) {
    const rect = state.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicking on any parameter
    for (let i = state.parameters.length - 1; i >= 0; i--) {
        const param = state.parameters[i];
        const distance = Math.sqrt(Math.pow(x - param.x, 2) + Math.pow(y - param.y, 2));

        if (distance < 30) { // Click tolerance
            state.isDragging = true;
            state.draggedParam = param;
            state.dragOffset.x = x - param.x;
            state.dragOffset.y = y - param.y;
            state.canvas.style.cursor = 'grabbing';
            break;
        }
    }
}

function handleCanvasMouseMove(e) {
    if (!state.isDragging || !state.draggedParam) return;

    const rect = state.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    state.draggedParam.x = x - state.dragOffset.x;
    state.draggedParam.y = y - state.dragOffset.y;

    // Update position inputs in real-time
    updatePositionInputs(state.draggedParam.id);

    redrawCanvas();
}

function handleCanvasMouseUp() {
    if (state.isDragging) {
        state.isDragging = false;
        state.draggedParam = null;
        state.canvas.style.cursor = 'crosshair';
    }
}

function updatePositionInputs(id) {
    const param = state.parameters.find(p => p.id === id);
    if (param) {
        const xInput = document.getElementById(`pos-x-${id}`);
        const yInput = document.getElementById(`pos-y-${id}`);
        if (xInput) xInput.value = Math.round(param.x);
        if (yInput) yInput.value = Math.round(param.y);
    }
}

// ===========================
// EXCEL FILE HANDLING
// ===========================

function handleExcelUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });

            // Get first sheet
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

            // Remove empty rows
            state.excelData = jsonData.filter(row => row.some(cell => cell !== undefined && cell !== ''));

            if (state.excelData.length < 2) {
                alert('Excel file must contain at least a header row and one data row');
                return;
            }

            processExcelData();
            showSection('generateSection');

        } catch (error) {
            alert('Error reading Excel file: ' + error.message);
        }
    };

    reader.readAsArrayBuffer(file);
}

function processExcelData() {
    const headers = state.excelData[0];
    const dataRows = state.excelData.slice(1);

    // Update UI
    document.getElementById('totalRows').textContent = dataRows.length;
    document.getElementById('totalColumns').textContent = headers.length;
    document.getElementById('validationStatus').textContent = 'Ready';

    // Show excel preview
    document.getElementById('excelPreview').style.display = 'block';

    // Create column mapping
    renderColumnMapping(headers);
}

function renderColumnMapping(headers) {
    const container = document.getElementById('columnMapping');
    container.innerHTML = '<h3 style="color: var(--text-primary); margin-bottom: 1rem;">Column Mapping</h3>';

    state.parameters.forEach((param, index) => {
        if (index < headers.length) {
            const row = document.createElement('div');
            row.className = 'mapping-row';
            row.innerHTML = `
        <span class="mapping-label">${param.label}</span>
        <ion-icon name="arrow-forward-outline" class="mapping-arrow"></ion-icon>
        <span class="mapping-value">Column: ${headers[index]}</span>
      `;
            container.appendChild(row);
        }
    });
}

// ===========================
// CERTIFICATE GENERATION
// ===========================

function previewCertificate() {
    if (state.excelData.length < 2) {
        alert('Please upload Excel data first');
        return;
    }

    // Get first data row (skip header)
    const firstRow = state.excelData[1];

    // Update parameter values
    state.parameters.forEach((param, index) => {
        param.value = firstRow[index] || '';
    });

    redrawCanvas();

    // Scroll to canvas
    state.canvas.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

async function generateAllCertificates() {
    if (state.excelData.length < 2) {
        alert('Please upload Excel data first');
        return;
    }

    if (state.parameters.length === 0) {
        alert('Please add at least one parameter');
        return;
    }

    // 1. IMMEDIATELY request save file handle to preserve user gesture
    let fileHandle = null;
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const zipFilename = `Certificates_${timestamp}.zip`;

    if (typeof window.showSaveFilePicker === 'function') {
        try {
            fileHandle = await window.showSaveFilePicker({
                suggestedName: zipFilename,
                types: [{
                    description: 'ZIP Archive',
                    accept: { 'application/zip': ['.zip'] },
                }],
            });
        } catch (pickError) {
            // User cancelled or browser blocked
            if (pickError.name === 'AbortError') return;
            console.warn('Native save dialog failed/denied, will fallback to standard download:', pickError);
        }
    }

    const dataRows = state.excelData.slice(1); // Skip header
    const totalCertificates = dataRows.length;

    // Show progress
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const progressStatus = document.getElementById('progressStatus');
    const generateBtn = document.getElementById('generateAllBtn');

    progressContainer.style.display = 'block';
    if (generateBtn) generateBtn.disabled = true;

    try {
        // Create ZIP
        const zip = new JSZip();

        for (let i = 0; i < totalCertificates; i++) {
            const row = dataRows[i];

            // Update progress
            const percent = ((i + 1) / totalCertificates * 100).toFixed(1);
            progressBar.style.width = percent + '%';
            progressText.textContent = `${i + 1} / ${totalCertificates}`;
            progressStatus.textContent = `Generating certificate ${i + 1} of ${totalCertificates}...`;

            // Update parameter values
            state.parameters.forEach((param, index) => {
                param.value = row[index] || '';
            });

            // Redraw canvas with new data
            redrawCanvas();

            // Wait a tick for canvas to update
            await new Promise(resolve => setTimeout(resolve, 10));

            // Convert canvas to blob
            const blob = await new Promise(resolve => state.canvas.toBlob(resolve, 'image/png'));

            if (!blob) throw new Error(`Failed to generate image for row ${i + 1}`);

            // Generate filename from first parameter (usually name)
            const filename = sanitizeFilename(row[0] || `Certificate_${i + 1}`) + '.png';

            // Add to ZIP
            zip.file(filename, blob);
        }

        // Generate ZIP file
        progressStatus.textContent = 'Creating ZIP file...';
        const zipBlob = await zip.generateAsync({
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: {
                level: 6
            }
        });

        // 2. Save the ZIP
        if (fileHandle) {
            progressStatus.textContent = 'Saving to disk...';
            const writable = await fileHandle.createWritable();
            await writable.write(zipBlob);
            await writable.close();
            console.log('File saved successfully via Native Save dialog');
        } else {
            // Fallback for browsers without showSaveFilePicker or if user denied it
            console.log('Using standard download fallback');
            saveAs(zipBlob, zipFilename);
        }

        // Show completion
        progressContainer.style.display = 'none';
        document.getElementById('completionMessage').style.display = 'block';
        if (generateBtn) generateBtn.disabled = false;

        // Reset parameter values
        state.parameters.forEach(param => {
            param.value = '';
        });
        redrawCanvas();

    } catch (error) {
        console.error('Error in batch generation:', error);
        alert('Error generating certificates: ' + error.message);
        progressContainer.style.display = 'none';
        if (generateBtn) generateBtn.disabled = false;
    }
}

function sanitizeFilename(name) {
    // Remove invalid filename characters
    return name.toString()
        .replace(/[^a-zA-Z0-9-_\s]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 100); // Limit length
}

// ===========================
// UTILITY FUNCTIONS
// ===========================

function showSection(sectionId) {
    document.getElementById(sectionId).style.display = 'block';
}

// Make functions globally accessible
window.updateParameter = updateParameter;
window.updatePosition = updatePosition;
window.toggleStyle = toggleStyle;
window.deleteParameter = deleteParameter;
