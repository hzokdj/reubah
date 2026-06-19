document.addEventListener("DOMContentLoaded", function () {
  const elements = {
    form: document.getElementById("uploadForm"),
    progress: document.getElementById("progress"),
    result: document.getElementById("result"),
    formatSelect: document.getElementById("formatSelect"),
    qualitySelect: document.getElementById("qualitySelect"),
    widthInput: document.getElementById("widthInput"),
    heightInput: document.getElementById("heightInput"),
    removeBackground: document.getElementById("removeBackground"),
    bgRemovalOptions: document.getElementById("bgRemovalOptions"),
    resizeModeSelect: document.getElementById("resizeModeSelect"),
    optimize: document.getElementById("optimize")
  };

  if (!elements.form || !elements.form.querySelector('input[type="file"]')) {
    console.error("未找到表单所需元素");
    return;
  }

  const fileInput = elements.form.querySelector('input[type="file"]');
  const MAX_FILE_SIZE = 32 * 1024 * 1024;

  setupQuickActions();

  if (elements.removeBackground) {
    elements.removeBackground.addEventListener("change", () => {
      if (elements.bgRemovalOptions) {
        elements.bgRemovalOptions.classList.toggle("hidden", !elements.removeBackground.checked);
      }
    });
  }

  elements.form.addEventListener("submit", handleFormSubmit);

  function setupQuickActions() {
    const actions = {
      optimize: () => {
        elements.formatSelect.value = "webp";
        elements.qualitySelect.value = "medium";
        elements.widthInput.value = "";
        elements.heightInput.value = "";
      },
      resize: () => elements.widthInput.focus(),
      adjust: () => {
        elements.formatSelect.value = "png";
        elements.qualitySelect.value = "lossless";
      },
      convert: () => elements.formatSelect.focus()
    };

    document.querySelectorAll("[data-action]").forEach(button => {
      button.addEventListener("click", (e) => {
        e.preventDefault();
        const action = button.dataset.action;
        if (actions[action]) {
          actions[action]();
          updateQuickActionStyles(button);
        }
      });
    });
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    if (!validateFile()) return;

    const formData = createFormData();

    try {
      await processImage(formData);
    } catch (error) {
      console.error("错误：", error);
      showError(error.message);
    }
  }

  function validateFile() {
    if (!fileInput.files || !fileInput.files.length) {
      showError("请先上传文件");
      return false;
    }

    const file = fileInput.files[0];
    if (file.size > MAX_FILE_SIZE) {
      showError("文件大小超出限制");
      return false;
    }

    const isImage = file.type.startsWith('image/');
    const isHeic = isHeicFile(file);

    if (!isImage && !isHeic) {
      showError("无效的文件格式");
      return false;
    }

    return true;
  }

  function isHeicFile(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    return ext === 'heic' || ext === 'heif' ||
           file.type === 'image/heic' || file.type === 'image/heif';
  }

  function createFormData() {
    const formData = new FormData();
    const file = fileInput.files[0];

    if (isHeicFile(file)) {
      const heicBlob = new Blob([file], { type: 'image/heic' });
      formData.append("image", heicBlob, file.name);
      formData.append("sourceFormat", "heic");

      const outputFormat = elements.formatSelect?.value;
      if (!outputFormat || outputFormat === "heic") {
        formData.append("format", "jpeg");
      } else {
        formData.append("format", outputFormat);
      }
    } else {
      formData.append("image", file);
      formData.append("format", elements.formatSelect?.value || "jpeg");
    }

    if (elements.qualitySelect?.value) {
      formData.append("quality", elements.qualitySelect.value);
    }
    if (elements.widthInput?.value) {
      formData.append("width", elements.widthInput.value);
    }
    if (elements.heightInput?.value) {
      formData.append("height", elements.heightInput.value);
    }
    if (elements.resizeModeSelect) {
      formData.append("resizeMode", elements.resizeModeSelect.value || "fit");
    }
    if (elements.removeBackground?.checked) {
      formData.append("removeBackground", "true");
    }
    if (elements.optimize?.checked) {
      formData.append("optimize", "true");
    }

    return formData;
  }

  async function processImage(formData) {
    showProgress();
    const submitButton = elements.form.querySelector('button[type="submit"]');
    if (submitButton) submitButton.disabled = true;

    try {
      const response = await fetch("/process", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "发生未知错误" }));
        throw new Error(errorData.error?.message || errorData.message || "处理失败");
      }

      await handleSuccess(response, elements.formatSelect?.value || "jpeg");
    } catch (error) {
      console.error("处理错误：", error);
      showError(error.message || "图片处理失败");
    } finally {
      hideProgress();
      if (submitButton) submitButton.disabled = false;
    }
  }

  function showProgress() {
    if (elements.progress) {
      elements.progress.style.display = "block";
      const text = elements.progress.querySelector(".text-sm");
      if (text) text.textContent = "处理中…";
    }
    if (elements.result) {
      elements.result.style.display = "none";
    }
  }

  function hideProgress() {
    if (elements.progress) {
      elements.progress.style.display = "none";
    }
  }

  function showError(message) {
    const map = {
      "No file uploaded": "未上传文件",
      "File Too Large": "文件过大",
      "Invalid File Format": "无效的文件格式",
      "Timeout": "超时",
      "Failed": "失败",
      "Error": "错误"
    };

    const msg = map[message] || message;

    const errorDiv = document.createElement("div");
    errorDiv.className = "bg-red-50 border-l-4 border-red-400 p-4 mb-4";
    errorDiv.innerHTML = `
      <div class="flex">
        <div class="ml-3">
          <p class="text-sm text-red-700">${msg}</p>
        </div>
      </div>
    `;
    elements.form.prepend(errorDiv);
    setTimeout(() => errorDiv.remove(), 5000);
  }

  async function handleSuccess(response, format) {
    if (!elements.result) return;

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    const resultPreview = elements.result.querySelector(".result-preview");
    const resultInfo = elements.result.querySelector(".result-info");

    if (resultPreview && resultInfo) {
      resultPreview.innerHTML = `<img src="${url}" alt="处理后的图片" class="max-w-full rounded-lg">`;
      resultInfo.innerHTML = `
        <div class="flex justify-between items-center">
          <p class="text-sm text-gray-600">大小：${(blob.size / 1024).toFixed(2)} KB</p>
          <a href="${url}" 
             download="已处理.${format}" 
             class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
            下载图片
          </a>
        </div>
      `;
    }

    elements.result.style.display = "block";
  }

  function updateQuickActionStyles(button) {
    document.querySelectorAll("[data-action]").forEach((btn) => {
      btn.classList.remove("bg-indigo-50", "border-indigo-500", "text-indigo-700");
    });
    button.classList.add("bg-indigo-50", "border-indigo-500", "text-indigo-700");
  }

  function isHeicFile(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    return ext === 'heic' || ext === 'heif' ||
           file.type === 'image/heic' || file.type === 'image/heif';
  }
});
