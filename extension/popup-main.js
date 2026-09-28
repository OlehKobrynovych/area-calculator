// Main initialization file
document.addEventListener("DOMContentLoaded", () => {
  const state = window.AppState;

  // Initialize DOM references
  state.canvas = document.getElementById("canvas");
  state.ctx = state.canvas.getContext("2d");
  state.shapeButtonsContainer = document.getElementById("shape-buttons");
  state.canvasButtons = document.getElementById("canvas-buttons");
  state.shapeInputs = document.getElementById("inputs-section");
  state.resultText = document.getElementById("area-result");
  state.materialResultDisplay = document.getElementById("material-result");
  state.langSelect = document.getElementById("lang-select");

  state.customSidesConfig = document.getElementById("custom-sides-config");
  state.sidesCountInput = document.getElementById("sides-count");
  state.confirmSidesBtn = document.getElementById("confirm-sides");
  state.dynamicInputsContainer = document.getElementById("dynamic-inputs");

  // Material calculation inputs
  state.materialWidthInput = document.getElementById("material-width");
  state.materialHeightInput = document.getElementById("material-height");
  state.unitsPerPackInput = document.getElementById("units-per-pack");
  state.materialPriceInput = document.getElementById("material-price");

  // --- Material Calculation Logic ---
  const updateMaterialCalculation = () => {
    const dict = window.UI.translations[state.currentLanguage];
    
    // Negative values are treated as 0 (inputs are not rewritten while typing)
    const width = Math.max(0, parseFloat(state.materialWidthInput.value) || 0);
    const height = Math.max(0, parseFloat(state.materialHeightInput.value) || 0);
    const perPack = Math.max(0, parseInt(state.unitsPerPackInput.value) || 0);
    const price = Math.max(0, parseFloat(state.materialPriceInput.value) || 0);

    state.tileLayout = null;
    const redrawLayout = () => {
      if (state.showTileLayout) {
        window.Drawing.updateTransform(true);
        window.Drawing.redrawCanvas();
      }
    };

    if (width <= 0 || height <= 0) {
      state.materialResultDisplay.innerHTML = "";
      state.materialResultDisplay.style.display = "none";
      redrawLayout();
      return;
    }
    if (state.shapeArea <= 0) {
      state.materialResultDisplay.style.display = "block";
      state.materialResultDisplay.innerHTML = `<p>${dict.hint_no_shape}</p>`;
      redrawLayout();
      return;
    }

    // Count tiles by actual layout (cut tiles count as whole); area formula only as fallback
    const shapePoints = state.currentShapeMode === "circle"
      ? window.Shapes.generateRegularPolygon(96, state.circleRadius)
      : state.points;
    state.tileLayout = window.Calculations.getTileLayout(shapePoints, width, height);
    redrawLayout();

    const result = window.Calculations.calculateMaterialRequirements(
      state.shapeArea, width, height, perPack
    );
    if (result && state.tileLayout) {
      result.unitsNeeded = state.tileLayout.count;
      result.packsNeeded = perPack > 0 ? Math.ceil(result.unitsNeeded / perPack) : 0;
    }

    if (result) {
      state.materialResultDisplay.style.display = "block";
      const currency = dict.unit_currency;
      let html = `<p>${dict.result_needed}: <strong>${result.unitsNeeded}</strong> ${dict.unit_pcs}</p>`;
      if (state.tileLayout) {
        html += `<p class="tile-split"><span class="tile-full">${dict.result_full}: ${state.tileLayout.full}</span>, ` +
          `<span class="tile-cut">${dict.result_cut}: ${state.tileLayout.cut}</span></p>`;
      }
      if (perPack > 0) {
        html += `<p>${dict.result_packs}: <strong>${result.packsNeeded}</strong></p>`;
        if (price > 0) {
          const totalCost = result.packsNeeded * price;
          html += `<p>${dict.result_cost}: <strong>${totalCost.toFixed(2)}</strong> ${currency}.</p>`;
        }
      } else if (price > 0) {
        const totalCost = result.unitsNeeded * price;
        html += `<p>${dict.result_cost}: <strong>${totalCost.toFixed(2)}</strong> ${currency}.</p>`;
      }
      state.materialResultDisplay.innerHTML = html;
    }
  };

  // --- Event Listeners ---

  // Language Selection
  state.langSelect.addEventListener("change", (e) => {
    state.currentLanguage = e.target.value;
    window.UI.translateUI();
    updateMaterialCalculation();
  });

  // Shape Selection
  state.shapeButtonsContainer.addEventListener("click", (e) => {
    const btn = e.target.closest(".shape-btn");
    if (btn) {
      document.querySelectorAll(".shape-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      window.UI.handleShapeButtonClick(btn.dataset.shape);
      updateMaterialCalculation();
    }
  });

  // Global Unit Change
  document.querySelectorAll('input[name="shape-unit"]').forEach(radio => {
    radio.addEventListener("change", (e) => {
      // Geometry is always stored in cm; only the displayed unit changes
      state.shapeUnit = e.target.value;
      window.Drawing.redrawCanvas();

      if (state.currentShapeMode === "circle") {
          window.UI.createCircleInput();
      } else if (state.points.length > 0) {
          window.UI.createSideInputs(state.points);
      }

      window.UI.updateResultText();
      updateMaterialCalculation();
    });
  });

  // Canvas Dragging
  state.canvas.addEventListener("mousedown", (e) => window.Drawing.handleMouseDown(e));
  window.addEventListener("mousemove", (e) => window.Drawing.handleMouseMove(e));
  window.addEventListener("mouseup", () => window.Drawing.handleMouseUp());

  // Listen for internal shape changes to update material
  document.addEventListener("shapeChanged", updateMaterialCalculation);

  document.getElementById("clear-btn").addEventListener("click", () => {
    state.reset();
    window.Drawing.redrawCanvas();
    window.UI.updateResultText();
    updateMaterialCalculation();
  });

  // Custom Sides Confirmation
  state.confirmSidesBtn.addEventListener("click", () => {
    window.UI.handleConfirmSides();
    updateMaterialCalculation();
  });

  // Material Inputs
  [state.materialWidthInput, state.materialHeightInput, state.unitsPerPackInput, state.materialPriceInput].forEach(input => {
    input.addEventListener("input", updateMaterialCalculation);
  });

  // Tile layout overlay on the canvas
  document.getElementById("show-tile-layout").addEventListener("change", (e) => {
    state.showTileLayout = e.target.checked;
    window.Drawing.updateTransform(true);
    window.Drawing.redrawCanvas();
  });

  // Initial UI Setup
  window.UI.handleShapeButtonClick("custom");
  window.UI.translateUI(); // Set initial language
  updateMaterialCalculation();
});
