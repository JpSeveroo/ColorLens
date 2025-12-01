import { COLOR_FILTERS_DATA } from "../utils/filters.js";

document.addEventListener("DOMContentLoaded", () => {
  injectSvgFilters();
  initializeTabs();
  initializeSliders();
  initializeModeToggles();

  initializeColorMapping();
  populateProfileSelector();
  initializeDeleteProfile();
  initializeRenameProfile();
  loadColorMapping();

  try {
    loadAllSavedSettings();
  } catch (error) {
    console.warn("Erro ao carregar configurações:", error);
  }
});

function mapContrastToFunctional(visualValue) {
  const val = Number(visualValue);
  
  if (val <= 100) {
      return 50 + (val / 100) * 50;
  }
  
  return val;
}

function mapFunctionalToVisual(functionalValue) {
  const val = Number(functionalValue);

  if (val < 100) {
      return ((val - 50) / 50) * 100;
  }
  
  return val;
}

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

function populateFilterSelect() {
  const filterSelect = document.getElementById('color-blindness-select');
  if (!filterSelect) return;

  const noneOption = document.createElement('option');
  noneOption.value = 'none';
  noneOption.textContent = 'Nenhum';
  filterSelect.appendChild(noneOption);

  for (const key in COLOR_FILTERS_DATA) {
    if (key === 'none') continue;

    const filterData = COLOR_FILTERS_DATA[key];
    const option = document.createElement('option');
    option.value = filterData.id;
    option.textContent = key;
    filterSelect.appendChild(option);
  }
}

const previewContainer = document.querySelector(".preview-container");

if (previewContainer && previewContainer.children.length === 0) {
  const list = [
    "../../assets/images/imagem balao teste 1.jpg",
    "../../assets/images/lapiz de cor 4k.jpg",
    "../../assets/images/arara 4k1.jpeg"
  ];
  for (let i = 0; i < 3; i++) {
    const img = document.createElement("img");
    img.src = list[i]; 
    img.alt = "Prévia de ajustes visuais";
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "cover";
    img.style.borderRadius = "inherit";
    img.style.transition = "filter 0.3s ease, background-color 0.3s ease";
    previewContainer.appendChild(img);
  }
}

const previewImgs = previewContainer?.querySelectorAll("img");

const profileName = document.getElementById("profile-name-input");
const baseFilter = document.getElementById("color-blindness-select");

const contrastSlider = document.getElementById("contrast");
const saturationSlider = document.getElementById("saturation");
const contrastValueInput = document.getElementById("contrast-input");
const saturationValueInput = document.getElementById("saturation-input");
const resetBtn = document.querySelector(".reset-btn");

resetBtn.addEventListener("click", (e) => {
  e.preventDefault();

  profileName.value = "";
  baseFilter.value = "none";
  contrastSlider.value = 100;
  saturationSlider.value = 100;
  if (contrastValueInput) contrastValueInput.value = 100;
  if (saturationValueInput) saturationValueInput.value = 100;

  const overlay = document.querySelector(".color-overlay");
  overlay.style.background = "none";

  document.getElementById('enable-color-mapping').checked = false;
  document.getElementById("color1-mapper").value = "#ff0000";
  document.getElementById("color2-mapper").value = "#00ff00";
  document.getElementById("color3-mapper").value = "#0000ff";

  const profileSelector = document.getElementById("saved-profiles");
  if (profileSelector) {
    profileSelector.value = ""; 
  }

  updateSliderLook(contrastSlider, contrastValueInput);
  updateSliderLook(saturationSlider, saturationValueInput);
  applyVisualEffects(previewImgs); 
  applyColorMapping();
});

function initializeSliders() {
  if (contrastSlider && saturationSlider) {
    updateSliderLook(contrastSlider, contrastValueInput);
    updateSliderLook(saturationSlider, saturationValueInput);
    applyVisualEffects(previewImgs);

    contrastSlider.addEventListener("input", () => {
      contrastValueInput.value = contrastSlider.value;
      updateSliderLook(contrastSlider, contrastValueInput);
      applyVisualEffects(previewImgs);
      saveVisualSettings();
    });

    contrastValueInput?.addEventListener("input", () => {
      let value = parseInt(contrastValueInput.value, 10);
      if (isNaN(value) || value < 0) value = 0;
      if (value > 200) value = 200;
      contrastValueInput.value = value;
      contrastSlider.value = value;
      updateSliderLook(contrastSlider, contrastValueInput);
      applyVisualEffects(previewImgs);
      saveVisualSettings();
    });

    saturationSlider.addEventListener("input", () => {
      saturationValueInput.value = saturationSlider.value;
      updateSliderLook(saturationSlider, saturationValueInput);
      applyVisualEffects(previewImgs);
      saveVisualSettings();
    });

    saturationValueInput?.addEventListener("input", () => {
      let value = parseInt(saturationValueInput.value, 10);
      if (isNaN(value) || value < 0) value = 0;
      if (value > 200) value = 200;
      saturationValueInput.value = value;
      saturationSlider.value = value;
      updateSliderLook(saturationSlider, saturationValueInput);
      applyVisualEffects(previewImgs);
      saveVisualSettings();
    });
  }
}

const colorBlindnessSelect = document.getElementById("color-blindness-select");

if (colorBlindnessSelect) {
  colorBlindnessSelect.addEventListener("change", () => {
    applyVisualEffects(previewImgs);
    saveVisualSettings(); 
  });
}

function updateSliderLook(slider, valueInput) {
  const min = parseInt(slider.min, 10);
  const max = parseInt(slider.max, 10);
  const value = parseInt(slider.value, 10);
  if (valueInput) valueInput.value = value;
  const percentage = ((value - min) / (max - min)) * 100;
  slider.style.background = `linear-gradient(to right, #7B4EAC ${percentage}%, #352957 ${percentage}%)`;
}

function applyVisualEffects(previewImgs) {
  if (!previewImgs) return;

  const contrastVisual = document.getElementById("contrast").value;
  const saturation = document.getElementById("saturation").value;
  const filterType = document.getElementById("color-blindness-select").value;
  const contrastFunctional = mapContrastToFunctional(contrastVisual);

  let brightness = 100;
  let hueRotate = 0;
  let backgroundColor = "transparent";
  let filterCSS = "none";

  const filterDataMap = {};
  for (const key in COLOR_FILTERS_DATA) {
    filterDataMap[COLOR_FILTERS_DATA[key].id] = COLOR_FILTERS_DATA[key];
  }

  const selectedFilter = filterDataMap[filterType];

  if (selectedFilter) {
    const svgFilters = [
      'protanopia', 'deuteranopia', 'tritanopia', 
      'protanomaly', 'deuteranomaly', 'tritanomaly'
    ];

    if (svgFilters.includes(filterType)) {
      filterCSS = `url("#${filterType}")`; 
    }
    else if (filterType === 'achromatopsia' || filterType === 'monocromia') {
      filterCSS = selectedFilter.value;
    }
    else { filterCSS = '' }
  }

  previewImgs.forEach((img) => {
    img.style.backgroundColor = backgroundColor;
  });


  previewImgs.forEach((img) => {
    img.style.filter = `
        ${filterCSS}
        contrast(${contrastFunctional}%)
        saturate(${saturation}%)
        brightness(${brightness}%)
        hue-rotate(${hueRotate}deg)
    `;
  });
}

function injectSvgFilters() {
  if (document.getElementById('colorlens-svg-filters')) {
      return;
  }

  const svgContainer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svgContainer.id = 'colorlens-svg-filters';
  svgContainer.style.display = 'none';

  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  
  for (const key in COLOR_FILTERS_DATA) {
      if (COLOR_FILTERS_DATA[key].svg) {
          defs.innerHTML += COLOR_FILTERS_DATA[key].svg;
      }
  }

  const anomalyFilters = `
    <filter id="protanomaly">
      <feColorMatrix type="matrix" values="0.817 0.183 0 0 0  0.333 0.667 0 0 0  0 0.125 0.875 0 0  0 0 0 1 0" />
    </filter>

    <filter id="deuteranomaly">
      <feColorMatrix type="matrix" values="0.8 0.2 0 0 0  0.258 0.742 0 0 0  0 0.142 0.858 0 0  0 0 0 1 0" />
    </filter>

    <filter id="tritanomaly">
      <feColorMatrix type="matrix" values="0.967 0.033 0 0 0  0 0.733 0.267 0 0  0 0.183 0.817 0 0  0 0 0 1 0" />
    </filter>
  `;

  if (!defs.innerHTML.includes('id="protanomaly"')) {
      defs.innerHTML += anomalyFilters;
  }

  svgContainer.appendChild(defs);
  document.documentElement.appendChild(svgContainer);
}

function initializeModeToggles() {
  const readingToggle = document.getElementById("reading-mode");
  const nightToggle = document.getElementById("night-vision");
  const previewImgs = document.querySelectorAll(".preview-img img");

  if (readingToggle && nightToggle) {
    readingToggle.addEventListener("change", () => {
      applyVisualEffects(previewImgs);
      saveVisualSettings();
    });

    nightToggle.addEventListener("change", () => {
      applyVisualEffects(previewImgs);
      saveVisualSettings();
    });
  }
}

function saveVisualSettings() {
  const contrastVisual = document.getElementById("contrast").value;
  const contrast = mapContrastToFunctional(contrastVisual);
  const saturation = document.getElementById("saturation").value;
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
      console.log("Configurações visuais salvas (Funcional):", settings);
      chrome.runtime?.sendMessage({
        action: "applyVisualSettings",
        settings,
      });
    });
  }
}

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

          const contrastSlider = document.getElementById("contrast");
          const saturationSlider = document.getElementById("saturation");
          const contrastValueInput = document.getElementById("contrast-input");
          const saturationValueInput = document.getElementById("saturation-input");
          const previewImgs = document.querySelectorAll(".preview-img img");
          const readingToggle = document.getElementById("reading-mode");
          const nightToggle = document.getElementById("night-vision");

          if (colorBlindness) {
            document.getElementById("color-blindness-select").value =
              colorBlindness;
          }

          if (contrastSlider && saturationSlider) {
            const contrastVisual = mapFunctionalToVisual(contrast || 100);
            
            contrastSlider.value = contrastVisual;
            saturationSlider.value = saturation || 100;
            updateSliderLook(contrastSlider, contrastValueInput);
            updateSliderLook(saturationSlider, saturationValueInput);
          }

          if (readingToggle) readingToggle.checked = !!readingMode;
          if (nightToggle) nightToggle.checked = !!nightVision;

          applyVisualEffects(previewImgs);
        }
      })
      .catch((error) => {
        console.warn("Erro ao carregar configurações:", error);
      });
  }
}

function updateUI(userProfiles, customColors) {
  if (userProfiles) console.log("Loading user profiles:", userProfiles);
  if (customColors) console.log("Loading custom colors:", customColors);
}

document.getElementById("profile-form")?.addEventListener("submit", (e) => {
  e.preventDefault();

  const profileName = document
    .getElementById("profile-name-input")
    .value.trim();
  if (!profileName) {
    alert("Digite um nome para o perfil.");
    return;
  }

  const contrastVisual = document.getElementById("contrast").value;
  const contrastFunctional = mapContrastToFunctional(contrastVisual);

  const profileData = {
    name: profileName,
    baseFilter: document.getElementById("color-blindness-select").value,
    contrast: contrastFunctional, 
    saturation: document.getElementById("saturation").value,
    readingMode: document.getElementById("reading-mode").checked,
    nightVision: document.getElementById("night-vision").checked,
    colorMap: {
      red: document.getElementById("color1-mapper").value,
      green: document.getElementById("color2-mapper").value,
      blue: document.getElementById("color3-mapper").value,
      enabled: document.getElementById('enable-color-mapping').checked
    },
    savedAt: new Date().toISOString(),
  };

  if (typeof chrome !== "undefined" && chrome.storage) {
    chrome.storage.local.get(["userProfiles"]).then((data) => {
      const profiles = data.userProfiles || [];
      const existingIndex = profiles.findIndex((p) => p.name === profileName);

      if (profiles.length >= 6 && existingIndex === -1) {
        alert("Limite de 6 perfis atingido. Exclua um perfil existente para salvar um novo.");
        return;
      }

      if (existingIndex >= 0) {
        if (!confirm("Já existe um perfil com esse nome. Deseja sobrescrevê-lo?")) return;
        profiles[existingIndex] = profileData; 
      } else {
        profiles.push(profileData); 
      }

      chrome.storage.local.set({ userProfiles: profiles }).then(() => {
        console.log("Perfil salvo:", profileData);
        alert("Perfil salvo com sucesso!");

        populateProfileSelector();
      });
    });
  }

  applyColorMapping();
});

function initializeColorMapping() {
  const colorInputs = [
    document.getElementById("color1-mapper"),
    document.getElementById("color2-mapper"),
    document.getElementById("color3-mapper"),
  ];

  const enableToggle = document.getElementById('enable-color-mapping');

  const updateAndSave = () => {
    applyColorMapping();
    saveColorMapping();
  };

  colorInputs.forEach((input) => {
    input.addEventListener("input", updateAndSave);
  });

  if (enableToggle) {
    enableToggle.addEventListener('change', updateAndSave);
  }
}

function applyColorMapping() {
  const overlays = document.querySelectorAll(".color-overlay");
  if (!overlays) return;

  const isEnabled = document.getElementById('enable-color-mapping').checked;
  if (!isEnabled) {
    overlays.forEach(el => {
      el.style.background = 'none';
    });
    return;
  }

  const red = document.getElementById("color1-mapper").value;
  const green = document.getElementById("color2-mapper").value;
  const blue = document.getElementById("color3-mapper").value;

  overlays.forEach(el => {
    el.style.background = `linear-gradient(135deg, ${red} 0%, ${green} 50%, ${blue} 100%)`;
  });
}

function saveColorMapping() {
  const colorMap = {
    red: document.getElementById("color1-mapper").value,
    green: document.getElementById("color2-mapper").value,
    blue: document.getElementById("color3-mapper").value,
    enabled: document.getElementById('enable-color-mapping').checked
  };

  if (typeof chrome !== "undefined" && chrome.storage) {
    chrome.storage.local.set({ customColors: colorMap }).then(() => {
      console.log("Mapeamento de cores salvo:", colorMap);
    });
  }
}

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
        document.getElementById('enable-color-mapping').checked = !!colors.enabled;

        applyColorMapping();
      }
    });
  }
}

function populateProfileSelector() {
  const profileNameDiv = document.querySelector(".profile-name");
  if (!profileNameDiv) return;

  let selector = document.getElementById("saved-profiles");
  if (!selector) {
    const label = document.createElement("label");
    label.textContent = "Perfis Salvos:";
    label.style.marginTop = "10px";

    selector = document.createElement("select");
    selector.id = "saved-profiles";
    selector.innerHTML = '<option value="">Selecione um perfil...</option>';

    profileNameDiv.appendChild(label);
    profileNameDiv.appendChild(selector);
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
      const contrastRange = document.getElementById("contrast");
      const saturationRange = document.getElementById("saturation");
      const contrastInput = document.getElementById("contrast-input");
      const saturationInput = document.getElementById("saturation-input");

      contrastRange.value = mapFunctionalToVisual(profile.contrast);
      
      saturationRange.value = profile.saturation;
      document.getElementById("reading-mode").checked = profile.readingMode;
      document.getElementById("night-vision").checked = profile.nightVision;
      document.getElementById("color1-mapper").value = profile.colorMap.red;
      document.getElementById("color2-mapper").value = profile.colorMap.green;
      document.getElementById("color3-mapper").value = profile.colorMap.blue;
      document.getElementById('enable-color-mapping').checked = !!profile.colorMap.enabled;

      updateSliderLook(contrastRange, contrastInput);
      updateSliderLook(saturationRange, saturationInput);
      applyVisualEffects(document.querySelectorAll(".preview-img img"));
      applyColorMapping();
    });
  });
}

function initializeDeleteProfile() {
  const deleteBtn = document.getElementById('delete-profile-btn');
  const selector = document.getElementById('saved-profiles');

  if (!deleteBtn || !selector) return;

  deleteBtn.addEventListener('click', () => {
    const selectedProfile = selector.value;
    if (!selectedProfile) {
      alert('Selecione um perfil para excluir.');
      return;
    }

    if (!confirm(`Tem certeza que deseja excluir o perfil "${selectedProfile}"?`)) {
      return;
    }

    chrome.storage.local.get(['userProfiles']).then((data) => {
      let profiles = data.userProfiles || [];
      profiles = profiles.filter(p => p.name !== selectedProfile);

      chrome.storage.local.set({ userProfiles: profiles }).then(() => {
        alert(`Perfil "${selectedProfile}" excluído com sucesso!`);
        populateProfileSelector(); // recarrega lista
        document.getElementById("reset-form-btn").click();
      });
    });
  });
}

function initializeRenameProfile() {
  const renameBtn = document.getElementById('rename-profile-btn');
  const selector = document.getElementById('saved-profiles');

  if (!renameBtn || !selector) return;

  renameBtn.addEventListener('click', () => {
    const selectedProfile = selector.value;
    if (!selectedProfile) {
      alert('Selecione um perfil para renomear.');
      return;
    }

    const newName = prompt('Digite o novo nome para o perfil:', selectedProfile);
    if (!newName || newName.trim() === '' || newName === selectedProfile) return;

    chrome.storage.local.get(['userProfiles']).then((data) => {
      const profiles = data.userProfiles || [];
      const existing = profiles.find(p => p.name === selectedProfile);

      if (!existing) {
        alert('Perfil não encontrado.');
        return;
      }

      const duplicate = profiles.some(p => p.name === newName.trim());
      if (duplicate) {
        alert('Já existe um perfil com esse nome.');
        return;
      }

      existing.name = newName.trim();

      chrome.storage.local.set({ userProfiles: profiles }).then(() => {
        alert(`Perfil "${selectedProfile}" renomeado para "${newName}"`);
        populateProfileSelector(); // atualiza a lista
        document.getElementById('profile-name-input').value = newName;
      });
    });
  });
}