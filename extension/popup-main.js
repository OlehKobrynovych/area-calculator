// Main initialization file
document.addEventListener("DOMContentLoaded", () => {
  const state = window.AppState;

  // Initialize DOM references
  state.canvas = document.getElementById("canvas");
  state.ctx = state.canvas.getContext("2d");
  state.shapeButtonsContainer = document.getElementById("shape-buttons");
  state.drawInstruction = document.getElementById("draw-instruction");
  state.canvasButtons = document.getElementById("canvas-buttons");
  state.shapeInputs = document.getElementById("inputs-section");
  state.resultText = document.getElementById("area-result");
  state.materialResultDisplay = document.getElementById("material-result");
  
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
    // Clamp to 0 to prevent negative values
    const width = Math.max(0, parseFloat(state.materialWidthInput.value) || 0);
    const height = Math.max(0, parseFloat(state.materialHeightInput.value) || 0);
    const perPack = Math.max(0, parseInt(state.unitsPerPackInput.value) || 0);
    const price = Math.max(0, parseFloat(state.materialPriceInput.value) || 0);

    // Reflect clamped values in UI
    state.materialWidthInput.value = width || "";
    state.materialHeightInput.value = height || "";
    state.unitsPerPackInput.value = perPack || "";
    state.materialPriceInput.value = price || "";

    if (width <= 0 || height <= 0 || state.shapeArea <= 0) {
      state.materialResultDisplay.innerHTML = "";
      return;
    }

    const result = window.Calculations.calculateMaterialRequirements(
      state.shapeArea, width, height, perPack
    );

    if (result) {
      let html = `<p>Вам знадобиться: <strong>${result.unitsNeeded}</strong> шт.</p>`;
      if (perPack > 0) {
        html += `<p>Кількість упаковок: <strong>${result.packsNeeded}</strong></p>`;
        if (price > 0) {
          const totalCost = result.packsNeeded * price;
          html += `<p>Загальна вартість: <strong>${totalCost.toFixed(2)}</strong> грн.</p>`;
        }
      } else if (price > 0) {
        const totalCost = result.unitsNeeded * price;
        html += `<p>Загальна вартість: <strong>${totalCost.toFixed(2)}</strong> грн.</p>`;
      }
      state.materialResultDisplay.innerHTML = html;
    }
  };

  // --- Event Listeners ---

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
      const oldUnit = state.shapeUnit;
      const newUnit = e.target.value;
      state.shapeUnit = newUnit;
      
      // If we switch units, we keep the numbers but the "real" size in CM changes
      // cm -> m: 10cm becomes 10m (1000cm) -> factor 100
      // m -> cm: 10m becomes 10cm -> factor 0.01
      let factor = 1;
      if (oldUnit === "cm" && newUnit === "m") factor = 100;
      else if (oldUnit === "m" && newUnit === "cm") factor = 0.01;

      if (state.points.length > 0) {
        state.points.forEach(p => {
          p.x *= factor;
          p.y *= factor;
        });
      }
      if (state.circleRadius) {
        state.circleRadius *= factor;
      }

      window.Drawing.updateTransform();
      window.Drawing.redrawCanvas();
      
      // Area needs to be recalculated because points/radius changed
      if (state.currentShapeMode === "circle") {
          state.shapeArea = window.Calculations.calculateCircleArea(state.circleRadius);
      } else {
          state.shapeArea = window.Calculations.calculatePolygonArea(state.points);
      }

      window.UI.updateResultText();
      
      // Refresh inputs to update labels (e.g. "cm" -> "m")
      if (state.currentShapeMode === "circle") {
        window.UI.createCircleInput();
      } else if (state.points.length > 0) {
        window.UI.createSideInputs(state.points);
      }
      
      updateMaterialCalculation();
    });
  });

  // Canvas Controls
  state.canvas.addEventListener("mousedown", (e) => window.Drawing.handleMouseDown(e));
  window.addEventListener("mousemove", (e) => window.Drawing.handleMouseMove(e));
  window.addEventListener("mouseup", () => window.Drawing.handleMouseUp());

  // Listen for internal shape changes to update material
  document.addEventListener('shapeChanged', updateMaterialCalculation);

  document.getElementById("clear-btn").addEventListener("click", () => {
    state.reset();
    window.Drawing.redrawCanvas();
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

  // Initial UI Setup
  window.UI.handleShapeButtonClick("custom");
});
