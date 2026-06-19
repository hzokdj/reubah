document.addEventListener("DOMContentLoaded", function () {
  const elements = {
    imageInput: document.getElementById("imageInput"),
    previewDiv: document.getElementById("preview"),
    uploadArea: document.getElementById("uploadArea"),
    fileStatus: document.getElementById("fileStatus"),
    fileName: document.getElementById("fileName"),
    fileSize: document.getElementById("fileSize"),
    uploadText: document.getElementById("uploadText"),
    widthInput: document.getElementById("widthInput"),
    heightInput: document.getElementById("heightInput"),
    removePreviewBtn: document.getElementById("removePreview"),
    formatSelect: document.getElementById("formatSelect")  
  };

  function isHeicFile(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    return ext === 'heic' || ext === 'heif' || 
           file.type === 'image/heic' || file.type === 'image/heif';
  }

  function initializeImagePreview() {
    if (!elements.imageInput || !elements.uploadArea) {
      console.error("未找到预览所需元素");
      return;
    }

    setupEventListeners();
  }

  function setupEventListeners() {
    elements.imageInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) handleFileSelect(file);
    });

    if (elements.removePreviewBtn) {
      elements.removePreviewBtn.addEventListener("click", (e) => {
        e.preventDefault();
        resetForm();
      });
    }

    setupDragAndDrop();
  }

  function setupDragAndDrop() {
    elements.uploadArea.addEventListener("dragover", (e) => {
      e.preventDefault();
      elements.uploadArea.classList.add("border-indigo-500");
    });

    elements.uploadArea.addEventListener("dragleave", (e) => {
      e.preventDefault();
      elements.uploadArea.classList.remove("border-indigo-500");
    });

    elements.uploadArea.addEventListener("drop", (e) => {
      e.preventDefault();
      elements.uploadArea.classList.remove("border-indigo-500");

      if (e.dataTransfer.files.length) {
        elements.imageInput.files = e.dataTransfer.files;
        handleFileSelect(e.dataTransfer.files[0]);
      }
    });
  }

  function handleFileSelect(file) {
    const isImage = file.type.startsWith("image/");
    const isHeic = file.name.toLowerCase().endsWith('.heic') || 
                  file.name.toLowerCase().endsWith('.heif');
    
    if (!isImage && !isHeic) {
        alert("请选择图片文件");
        return;
    }

    updateFileStatus(file);
    previewImage(file);
}

  function updateFileStatus(file) {
    if (!elements.fileStatus) return;

    elements.fileStatus.classList.remove("hidden");
    elements.fileStatus.classList.add("bg-green-50");
    elements.fileName.textContent = file.name;
    elements.fileSize.textContent = ` (${(file.size / (1024 * 1024)).toFixed(2)} MB)`;
  }

  function previewImage(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        if (!elements.previewDiv) return;

        elements.previewDiv.classList.remove("hidden");
        const img = elements.previewDiv.querySelector("img") || document.createElement("img");
        img.className = "max-w-full rounded-lg";
        
        if (isHeicFile(file)) {
            img.src = '/static/images/heic-placeholder.svg';
            img.alt = 'HEIC 图片占位符';
            elements.uploadArea.classList.add("border-green-500");
            if (elements.uploadText) {
                elements.uploadText.innerHTML = '<span class="text-green-500">HEIC 文件已准备处理</span>';
            }
            
            if (elements.formatSelect) {
                if (elements.formatSelect.value === "heic") {
                    elements.formatSelect.value = "jpeg";
                }
            }
        } else {
            img.src = e.target.result;
            img.alt = '图片预览';
            img.onload = () => updateImageInfo(img);
        }

        if (!elements.previewDiv.querySelector("img")) {
            elements.previewDiv.appendChild(img);
        }
    };
    reader.readAsDataURL(file);
}

  function updateImageInfo(img) {
    // 核心修改：px → 像素
    const dimensions = `${img.naturalWidth} × ${img.naturalHeight} 像素`;
    const dimensionsElement = elements.previewDiv.querySelector(".image-dimensions");
    if (dimensionsElement) {
      dimensionsElement.textContent = dimensions;
    }

    elements.uploadArea.classList.add("border-green-500");
    if (elements.uploadText) {
      elements.uploadText.innerHTML = '<span class="text-green-500">文件已准备处理</span>';
    }

    if (elements.widthInput) elements.widthInput.placeholder = img.naturalWidth;
    if (elements.heightInput) elements.heightInput.placeholder = img.naturalHeight;
  }

  function resetForm() {
    elements.imageInput.value = "";
    elements.previewDiv.classList.add("hidden");
    elements.fileStatus.classList.add("hidden");
    elements.uploadArea.classList.remove("border-green-500");
    
    if (elements.uploadText) {
        elements.uploadText.innerHTML = `
            <label for="imageInput" class="relative cursor-pointer rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none">
                <span class="inline-flex items-center px-4 py-2 border border-indigo-500 text-sm rounded-full hover:bg-indigo-50 transition-colors">
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                    选择文件
                </span>
            </label>
            <p class="text-gray-500">或将图片拖放到此处</p>
        `;
    }

    if (elements.widthInput) elements.widthInput.placeholder = "宽度（像素）";
    if (elements.heightInput) elements.heightInput.placeholder = "高度（像素）";
    
    setupEventListeners();
  }

  initializeImagePreview();
});
