document.addEventListener("DOMContentLoaded", () => {
  initializeTabs();
  initializeSliders();
  initializeModeToggles();

  initializeColorMapping();
  populateProfileSelector();
  loadColorMapping();

  try {
    loadAllSavedSettings();
  } catch (error) {
    console.warn("Erro ao carregar configurações:", error);
  }
});

/* ---------- Navegação entre abas ---------- */
function initializeTabs() {
  const buttons = document.querySelectorAll(".options-btn");
  const sections = document.querySelectorAll(".content-section");

  function switchTab(targetTabId) {
    buttons.forEach((btn) => btn.classList.remove("active"));
    sections.forEach((section) => section.classList.remove("active"));

    const selectedButton = document.querySelector(
      `[data-tab="${targetTabId}"]`
    );
    const selectedSection = document.getElementById(targetTabId);

    if (selectedButton && selectedSection) {
      selectedButton.classList.add("active");
      selectedSection.classList.add("active");
    }
  }

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const tabId = button.getAttribute("data-tab");
      switchTab(tabId);
    });
  });

  if (!document.querySelector(".content-section.active")) {
    const firstTabId = buttons[0]?.getAttribute("data-tab");
    if (firstTabId) switchTab(firstTabId);
  }
}

/* ---------- Botões ---------- */
const previewContainer = document.querySelector(".preview-img");

// Cria imagem de pré-visualização se não existir
if (previewContainer && previewContainer.children.length === 0) {
  const img = document.createElement("img");
  img.src = "../../assets/images/preview.avif"; // substitua se necessário
  img.alt = "Prévia de ajustes visuais";
  img.style.width = "300px";
  img.style.borderRadius = "10px";
  img.style.transition = "filter 0.3s ease, background-color 0.3s ease";
  previewContainer.appendChild(img);
}

const previewImg = previewContainer?.querySelector("img");

const profileName = document.getElementById("profile-name-input");
const baseFilter = document.getElementById("color-blindness-select");
const contrastSlider = document.getElementById("contrast-range");
const saturationSlider = document.getElementById("saturation-range");
const contrastValue = document.getElementById("contrast-value");
const saturationValue = document.getElementById("saturation-value");
const resetBtn = document.querySelector(".reset-btn");

resetBtn.addEventListener("click", (e) => {
  // Impede o botão (que é type="reset") de limpar o formulário antes da hora
  e.preventDefault();

  // Resetar Nome e Filtro Base
  profileName.value = "";
  baseFilter.value = "none";

  // Resetar Sliders (valor e visualização)
  contrastSlider.value = 100;
  saturationSlider.value = 100;
  if (contrastValue) contrastValue.textContent = "100%";
  if (saturationValue) saturationValue.textContent = "100%";

  // Resetar Toggles
  document.getElementById("reading-mode").checked = false;
  document.getElementById("night-vision").checked = false;

  const overlay = document.querySelector(".color-overlay");
  overlay.style.background = "none";

  document.getElementById("color1-mapper").value = "#ff0000";
  document.getElementById("color2-mapper").value = "#00ff00";
  document.getElementById("color3-mapper").value = "#0000ff";

  // Resetar Seletor de Perfil Salvo
  const profileSelector = document.getElementById("saved-profiles");
  if (profileSelector) {
    profileSelector.value = ""; // Volta para "Selecione um perfil..."
  }

  // Sincroniza TODAS as atualizações visuais
  updateSliderLook(contrastSlider, contrastValue);
  updateSliderLook(saturationSlider, saturationValue);
  applyVisualEffects(previewImg); // Aplica filtros (com 'none') e modos (desligados)
});

/* ---------- Sliders de Contraste e Saturação ---------- */
function initializeSliders() {
  if (contrastSlider && saturationSlider) {
    updateSliderLook(contrastSlider, contrastValue);
    updateSliderLook(saturationSlider, saturationValue);
    applyVisualEffects(previewImg);

    contrastSlider.addEventListener("input", () => {
      updateSliderLook(contrastSlider, contrastValue);
      applyVisualEffects(previewImg);
      saveVisualSettings();
    });

    saturationSlider.addEventListener("input", () => {
      updateSliderLook(saturationSlider, saturationValue);
      applyVisualEffects(previewImg);
      saveVisualSettings();
    });
  }
}

const colorBlindnessSelect = document.getElementById("color-blindness-select");

if (colorBlindnessSelect) {
  colorBlindnessSelect.addEventListener("change", () => {
    applyVisualEffects(previewImg);
    saveVisualSettings(); // salva o filtro no storage
  });
}

/* ---------- Atualização visual dos sliders ---------- */
function updateSliderLook(slider, valueDisplay) {
  const min = slider.min;
  const max = slider.max;
  const value = slider.value;
  valueDisplay.textContent = `${value}%`;
  const percentage = ((value - min) / (max - min)) * 100;
  slider.style.background = `linear-gradient(to right, #7B4EAC ${percentage}%, #352957 ${percentage}%)`;
}

/* ---------- Aplica contraste, saturação e modos ---------- */
function applyVisualEffects(previewImg) {
  if (!previewImg) return;

  // 1. Coleta TODOS os valores
  const contrast = document.getElementById("contrast-range").value;
  const saturation = document.getElementById("saturation-range").value;
  const readingMode = document.getElementById("reading-mode").checked;
  const nightVision = document.getElementById("night-vision").checked;
  const filterType = document.getElementById("color-blindness-select").value;

  // 2. Lógica dos Modos (Brilho, Saturação, Cor de Fundo)
  let brightness = 100;
  let hueRotate = 0;
  let backgroundColor = "transparent";

  if (readingMode) {
    brightness = 110;
    backgroundColor = "#fdf6e3"; // tom amarelado de papel
  }

  if (nightVision) {
    brightness = 70;
    hueRotate = 180;
    backgroundColor = "#0d0d1a";
  }

  // 3. Lógica dos Filtros de Daltonismo
  let filterCSS = "none";
  switch (filterType) {
    case "protanopia":
      filterCSS = 'url("#protanopia")';
      break;
    case "deuteranopia":
      filterCSS = 'url("#deuteranopia")';
      break;
    case "tritanopia":
      filterCSS = 'url("#tritanopia")';
      break;
    case "protanomalia":
      filterCSS = "grayscale(0.4) sepia(0.3) hue-rotate(-15deg)";
      break;
    case "deuteranomalia":
      filterCSS = "grayscale(0.3) sepia(0.3) hue-rotate(-10deg)";
      break;
    case "tritanomalia":
      filterCSS = "grayscale(0.3) sepia(0.4) hue-rotate(35deg)";
      break;
    case "achromatopsia":
      filterCSS = "grayscale(100%)";
      break;
    case "monocromia":
      filterCSS = "grayscale(80%) contrast(120%)";
      break;
    default:
      filterCSS = ""; // As outras configs tbm podem ser alteradas, independente do filtro
  }

  // 4. Aplica o fundo
  previewImg.style.backgroundColor = backgroundColor;

  // 5. Aplica TODOS os filtros de uma vez na ordem correta
  previewImg.style.filter = `
        ${filterCSS}
        contrast(${contrast}%)
        saturate(${saturation}%)
        brightness(${brightness}%)
        hue-rotate(${hueRotate}deg)
    `;
}

/* ---------- Modos: Leitura e Noturno ---------- */
function initializeModeToggles() {
  const readingToggle = document.getElementById("reading-mode");
  const nightToggle = document.getElementById("night-vision");
  const previewImg = document.querySelector(".preview-img img");

  if (readingToggle && nightToggle) {
    readingToggle.addEventListener("change", () => {
      applyVisualEffects(previewImg);
      saveVisualSettings();
    });

    nightToggle.addEventListener("change", () => {
      applyVisualEffects(previewImg);
      saveVisualSettings();
    });
  }
}

/* ---------- Salva valores ---------- */
function saveVisualSettings() {
  const contrast = document.getElementById("contrast-range").value;
  const saturation = document.getElementById("saturation-range").value;
  const readingMode = document.getElementById("reading-mode").checked;
  const nightVision = document.getElementById("night-vision").checked;
  const colorBlindness = document.getElementById(
    "color-blindness-select"
  ).value;

  const settings = {
    contrast,
    saturation,
    readingMode,
    nightVision,
    colorBlindness,
  };

  if (typeof chrome !== "undefined" && chrome.storage) {
    chrome.storage.local.set({ visualSettings: settings }).then(() => {
      console.log("Configurações visuais salvas:", settings);
      chrome.runtime?.sendMessage({
        action: "applyVisualSettings",
        settings,
      });
    });
  }
}

/* ---------- Carrega configurações salvas ---------- */
function loadAllSavedSettings() {
  if (typeof chrome !== "undefined" && chrome.storage) {
    chrome.storage.local
      .get(["userProfiles", "customColors", "visualSettings"])
      .then((data) => {
        updateUI(data.userProfiles, data.customColors);

        if (data.visualSettings) {
          const {
            colorBlindness,
            contrast,
            saturation,
            readingMode,
            nightVision,
          } = data.visualSettings;
          const contrastSlider = document.getElementById("contrast-range");
          const saturationSlider = document.getElementById("saturation-range");
          const contrastValue = document.getElementById("contrast-value");
          const saturationValue = document.getElementById("saturation-value");
          const previewImg = document.querySelector(".preview-img img");
          const readingToggle = document.getElementById("reading-mode");
          const nightToggle = document.getElementById("night-vision");

          if (colorBlindness) {
            document.getElementById("color-blindness-select").value =
              colorBlindness;
          }

          if (contrastSlider && saturationSlider) {
            contrastSlider.value = contrast || 100;
            saturationSlider.value = saturation || 100;
            updateSliderLook(contrastSlider, contrastValue);
            updateSliderLook(saturationSlider, saturationValue);
          }

          if (readingToggle) readingToggle.checked = !!readingMode;
          if (nightToggle) nightToggle.checked = !!nightVision;

          applyVisualEffects(previewImg);
        }
      })
      .catch((error) => {
        console.warn("Erro ao carregar configurações:", error);
      });
  }
}

/* ---------- Funções auxiliares originais ---------- */
function updateUI(userProfiles, customColors) {
  if (userProfiles) console.log("Loading user profiles:", userProfiles);
  if (customColors) console.log("Loading custom colors:", customColors);
}

/* ---------- Salvar perfil completo ---------- */
document.getElementById("profile-form")?.addEventListener("submit", (e) => {
  e.preventDefault();

  const profileName = document
    .getElementById("profile-name-input")
    .value.trim();
  if (!profileName) {
    alert("Digite um nome para o perfil.");
    return;
  }

  const profileData = {
    name: profileName,
    baseFilter: document.getElementById("color-blindness-select").value,
    contrast: document.getElementById("contrast-range").value,
    saturation: document.getElementById("saturation-range").value,
    readingMode: document.getElementById("reading-mode").checked,
    nightVision: document.getElementById("night-vision").checked,
    colorMap: {
      red: document.getElementById("color1-mapper").value,
      green: document.getElementById("color2-mapper").value,
      blue: document.getElementById("color3-mapper").value,
    },
    savedAt: new Date().toISOString(),
  };

  if (typeof chrome !== "undefined" && chrome.storage) {
    chrome.storage.local.get(["userProfiles"]).then((data) => {
      const profiles = data.userProfiles || [];
      const existingIndex = profiles.findIndex((p) => p.name === profileName);

      if (existingIndex >= 0) {
        profiles[existingIndex] = profileData; // Atualiza
      } else {
        profiles.push(profileData); // Novo
      }

      chrome.storage.local.set({ userProfiles: profiles }).then(() => {
        console.log("Perfil salvo:", profileData);
        alert("Perfil salvo com sucesso!");
      });
    });
  }

  applyColorMapping(document.querySelector(".preview-img img"));
});

/* ---------- Mapeamento de cores ---------- */
function initializeColorMapping() {
  const colorInputs = [
    document.getElementById("color1-mapper"),
    document.getElementById("color2-mapper"),
    document.getElementById("color3-mapper"),
  ];

  colorInputs.forEach((input) => {
    input.addEventListener("input", () => {
      applyColorMapping();
      saveColorMapping();
    });
  });
}

/* ---------- Aplica as cores mapeadas na imagem ---------- */
function applyColorMapping() {
  const overlay = document.querySelector(".color-overlay");
  if (!overlay) return;

  const red = document.getElementById("color1-mapper").value;
  const green = document.getElementById("color2-mapper").value;
  const blue = document.getElementById("color3-mapper").value;

  // Cria gradiente suave entre as cores mapeadas
  overlay.style.background = `linear-gradient(135deg, ${red} 0%, ${green} 50%, ${blue} 100%)`;
}

/* ---------- Salva apenas o mapeamento ---------- */
function saveColorMapping() {
  const colorMap = {
    red: document.getElementById("color1-mapper").value,
    green: document.getElementById("color2-mapper").value,
    blue: document.getElementById("color3-mapper").value,
  };

  if (typeof chrome !== "undefined" && chrome.storage) {
    chrome.storage.local.set({ customColors: colorMap }).then(() => {
      console.log("Mapeamento de cores salvo:", colorMap);
    });
  }
}

/* ---------- Carrega mapeamento salvo ---------- */
function loadColorMapping() {
  if (typeof chrome !== "undefined" && chrome.storage) {
    chrome.storage.local.get(["customColors"]).then((data) => {
      const colors = data.customColors;
      if (colors) {
        document.getElementById("color1-mapper").value =
          colors.red || "#ff0000";
        document.getElementById("color2-mapper").value =
          colors.green || "#00ff00";
        document.getElementById("color3-mapper").value =
          colors.blue || "#0000ff";
        applyColorMapping(document.querySelector(".preview-img img"));
      }
    });
  }
}

/* ---------- Carregar e aplicar presets ---------- */
function populateProfileSelector() {
  const baseFiltersDiv = document.querySelector(".base-filters");
  if (!baseFiltersDiv) return;

  let selector = document.getElementById("saved-profiles");
  if (!selector) {
    const label = document.createElement("label");
    label.textContent = "Perfis Salvos:";
    label.style.marginTop = "10px";

    selector = document.createElement("select");
    selector.id = "saved-profiles";
    selector.innerHTML = '<option value="">Selecione um perfil...</option>';

    baseFiltersDiv.appendChild(label);
    baseFiltersDiv.appendChild(selector);
  }

  if (typeof chrome !== "undefined" && chrome.storage) {
    chrome.storage.local.get(["userProfiles"]).then((data) => {
      const profiles = data.userProfiles || [];
      selector.innerHTML = '<option value="">Selecione um perfil...</option>';
      profiles.forEach((p) => {
        const opt = document.createElement("option");
        opt.value = p.name;
        opt.textContent = p.name;
        selector.appendChild(opt);
      });
    });
  }

  selector.addEventListener("change", (e) => {
    const selected = e.target.value;
    if (!selected) return;

    chrome.storage.local.get(["userProfiles"]).then((data) => {
      const profile = (data.userProfiles || []).find(
        (p) => p.name === selected
      );
      if (!profile) return;

      document.getElementById("profile-name-input").value = profile.name;
      document.getElementById("color-blindness-select").value =
        profile.baseFilter;
      document.getElementById("contrast-range").value = profile.contrast;
      document.getElementById("saturation-range").value = profile.saturation;
      document.getElementById("reading-mode").checked = profile.readingMode;
      document.getElementById("night-vision").checked = profile.nightVision;
      document.getElementById("color1-mapper").value = profile.colorMap.red;
      document.getElementById("color2-mapper").value = profile.colorMap.green;
      document.getElementById("color3-mapper").value = profile.colorMap.blue;

      updateSliderLook(
        document.getElementById("contrast-range"),
        document.getElementById("contrast-value")
      );
      updateSliderLook(
        document.getElementById("saturation-range"),
        document.getElementById("saturation-value")
      );
      applyVisualEffects(document.querySelector(".preview-img img"));
      applyColorMapping(document.querySelector(".preview-img img"));
    });
  });
}
