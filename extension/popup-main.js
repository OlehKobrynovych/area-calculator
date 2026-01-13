// Main initialization file
document.addEventListener("DOMContentLoaded", () => {
  const state = window.AppState;

  // Initialize DOM references
  state.canvas = document.getElementById("canvas");
  state.ctx = state.canvas.getContext("2d");
  state.materialWidthInput = document.getElementById("material-width");
  state.materialHeightInput = document.getElementById("material-height");
  state.unitsPerPackInput = document.getElementById("units-per-pack");
  state.materialPriceInput = document.getElementById("material-price");
  state.resultText = document.getElementById("result-text");
  state.materialResultDisplay = document.getElementById("material-result-display");
  state.closeShapeBtn = document.getElementById("close-shape-btn");
  state.clearBtn = document.getElementById("clear-btn");
  state.undoLastPointBtn = document.getElementById("undo-last-point-btn");
  state.shapeInputs = document.getElementById("shape-inputs");
  state.drawingSection = document.querySelector(".drawing-section");
  state.drawInstruction = document.querySelector(".draw-instruction");
  state.canvasButtons = document.querySelector(".canvas-buttons");
  state.shapeButtonsContainer = document.querySelector(".shape-buttons");
  state.shapeUnitSection = document.getElementById("shape-unit-section");
  state.shapeUnitRadios = document.querySelectorAll('input[name="shape-unit"]');
  state.materialUnitRadios = document.querySelectorAll('input[name="material-unit"]');

  // Set custom shape as active by default
  document
    .querySelector('.shape-btn[data-shape="custom"]')
    .classList.add("active");

  // --- Calculation Logic ---
  const updateMaterialCalculation = () => {
    let materialWidth = parseFloat(state.materialWidthInput.value) || 0;
    let materialHeight = parseFloat(state.materialHeightInput.value) || 0;
    const unitsPerPack = parseInt(state.unitsPerPackInput.value, 10) || 0; // Allow 0 for individual unit calculation

    // Convert material dimensions to cm for calculation
    if (state.materialUnit === "m") {
      materialWidth *= 100;
      materialHeight *= 100;
    }

    if (materialWidth <= 0 || materialHeight <= 0) {
      state.materialResultDisplay.innerHTML = `<p class="error">Будь ласка, введіть дійсні розміри матеріалу.</p>`;
      return;
    }

    if (state.shapeArea <= 0) {
      state.materialResultDisplay.textContent = "";
      return;
    }

    const result = window.Calculations.calculateMaterialRequirements(
      state.shapeArea,
      materialWidth,
      materialHeight,
      unitsPerPack > 0 ? unitsPerPack : 1 // Pass 1 if unitsPerPack is 0 to avoid division by zero
    );

    if (result) {
      let resultHTML = "";
      const materialPrice = parseFloat(state.materialPriceInput.value) || 0;
      let totalCost = 0;

      if (unitsPerPack > 0) {
        resultHTML += `<p>Вам знадобиться <strong>${result.packsNeeded}</strong> упаковок (${result.unitsNeeded} одиниць загалом).</p>`;
        if (materialPrice > 0) {
          totalCost = result.packsNeeded * materialPrice;
          resultHTML += `<p>Загальна вартість упаковок: <strong>${totalCost.toFixed(
            2
          )}</strong> грн.</p>`;
        }
      } else {
        resultHTML += `<p>Вам знадобиться <strong>${result.unitsNeeded}</strong> одиниць матеріалу.</p>`;
        if (materialPrice > 0) {
          totalCost = result.unitsNeeded * materialPrice;
          resultHTML += `<p>Загальна вартість: <strong>${totalCost.toFixed(
            2
          )}</strong> грн.</p>`;
        }
      }
      state.materialResultDisplay.innerHTML = resultHTML;
    } else {
      state.materialResultDisplay.innerHTML = `<p class="error">Помилка розрахунку.</p>`;
    }
  };

  // --- Event Handlers ---

  // Shape button event handler
  state.shapeButtonsContainer.addEventListener("click", (e) => {
    const targetButton = e.target.closest(".shape-btn");
    if (targetButton) {
      const shape = targetButton.dataset.shape;
      window.UI.handleShapeButtonClick(shape);
      // Also trigger recalculation when a predefined shape is drawn
      setTimeout(updateMaterialCalculation, 0);
    }
  });

  // Canvas event handlers
  state.canvas.addEventListener("mousemove", (e) => {
    window.Drawing.handleMouseMove(e);
  });

  state.canvas.addEventListener("mousedown", (e) => {
    window.Drawing.handleCanvasClick(e);
    if (state.currentShapeMode === "custom") {
      state.resultText.textContent =
        "Клацніть, щоб додати ще точок, або 'Замкнути фігуру'.";
    }
  });

  // Button event handlers
  state.undoLastPointBtn.addEventListener("click", () => {
    window.Drawing.undoLastPoint();
    if (state.points.length > 0) {
      state.resultText.textContent =
        "Точку скасовано. Продовжуйте додавати точки.";
    } else {
      state.resultText.textContent = "Будь ласка, намалюйте фігуру.";
    }
    updateMaterialCalculation(); // Recalculate if shape was closed and is now open
  });

  state.closeShapeBtn.addEventListener("click", () => {
    const pointsBeforeClose = state.points.length;
    window.Drawing.closeShape();
    // Display area and then calculate tiles
    if (state.isShapeClosed && state.shapeArea > 0) {
      const areaInMeters = (state.shapeArea / 10000).toFixed(2);
      state.resultText.textContent = `Площа фігури: ${areaInMeters} м²`;
      updateMaterialCalculation();
    } else if (pointsBeforeClose < 3) {
      state.resultText.textContent =
        "Потрібно щонайменше 3 точки, щоб замкнути фігуру.";
    }
  });

  state.clearBtn.addEventListener("click", () => {
    window.Drawing.clearCanvas();
    state.resultText.textContent = "Будь ласка, намалюйте фігуру.";
    state.materialResultDisplay.textContent = "";
    updateMaterialCalculation();
  });

  // Input event listeners for automatic calculation
  state.materialWidthInput.addEventListener("input", updateMaterialCalculation);
  state.materialHeightInput.addEventListener("input", updateMaterialCalculation);
  state.unitsPerPackInput.addEventListener("input", updateMaterialCalculation);
  state.materialPriceInput.addEventListener("input", updateMaterialCalculation);

  // Shape unit change handler
  state.shapeUnitRadios.forEach((radio) => {
    radio.addEventListener("change", (e) => {
      const newUnit = e.target.value;
      if (newUnit !== state.shapeUnit) {
        state.shapeUnit = newUnit;
        window.UI.updateShapeLabels(newUnit);

        // Recalculate points based on new unit interpretation
        // Input values stay the same, but they now represent different real-world sizes
        window.UI.recalculatePointsFromInputs();

        // Recalculate area using the new function
        const newArea = window.Calculations.calculateAreaFromInputs();
        if (newArea > 0) {
          state.shapeArea = newArea;
          state.resultText.textContent = `Площа фігури: ${(
            newArea / 10000
          ).toFixed(2)} м². Готово до розрахунку.`;
        } else {
          state.resultText.textContent = "Будь ласка, введіть дійсні розміри.";
        }

        updateMaterialCalculation();
      }
    });
  });

  // Material unit change handler
  state.materialUnitRadios.forEach((radio) => {
    radio.addEventListener("change", (e) => {
      const newUnit = e.target.value;
      if (newUnit !== state.materialUnit) {
        state.materialUnit = newUnit;
        updateMaterialCalculation();
      }
    });
  });

  // Initial setup
  window.UI.updateShapeUI();
});
