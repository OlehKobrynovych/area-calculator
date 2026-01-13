// UI management module
window.UI = {
  // Create input field
  createInputField: function (id, label, type, value, min) {
    type = type || "number";
    value = value || "";
    min = min || 0;

    const div = document.createElement("div");
    div.classList.add("input-group");

    const labelElem = document.createElement("label");
    labelElem.setAttribute("for", id);
    labelElem.textContent = label;

    const inputElem = document.createElement("input");
    inputElem.type = type;
    inputElem.id = id;
    inputElem.value = Math.round(parseFloat(value)) || 0; // Ensure integer value
    inputElem.min = min;
    inputElem.step = "1";

    div.appendChild(labelElem);
    div.appendChild(inputElem);

    return inputElem;
  },

  // Generate shape inputs for circle only (other shapes use unified point system)
  generateShapeInputs: function (mode) {
    const state = window.AppState;
    state.shapeInputs.innerHTML = "";
    state.shapeDimensions = {};

    // Only circle uses the old system
    if (mode !== "circle") {
      return;
    }

    const defaults = window.Shapes.getDefaultDimensions(mode);
    const commonInputHandler = this.handleShapeInputChange.bind(this);
    const unitText = state.shapeUnit === "m" ? "м" : "см";

    const inputElem = this.createInputField(
      "circ-side-r",
      `Радіус R (${unitText})`,
      "number",
      defaults.radius
    );
    state.shapeInputs.appendChild(inputElem.parentNode);
    state.shapeDimensions.radius = inputElem;
    inputElem.addEventListener("input", commonInputHandler);

    // Initial calculation and draw for circle
    this.handleShapeInputChange();
  },

  // Handle shape input change
  handleShapeInputChange: function () {
    const state = window.AppState;

    // Calculate area
    state.shapeArea = window.Calculations.calculatePredefinedShapeArea(
      state.currentShapeMode,
      state.shapeDimensions
    );

    // Redraw shape
    window.Drawing.redrawCanvas();

    // Update result text
    if (state.shapeArea > 0) {
      state.resultText.textContent = `Площа фігури: ${(
        state.shapeArea / 10000
      ).toFixed(2)} м². Готово до розрахунку.`;
    } else {
      state.resultText.textContent = "Будь ласка, введіть дійсні розміри.";
    }
  },

  // Update shape UI visibility
  updateShapeUI: function () {
    const state = window.AppState;

    // Drawing section always visible
    state.drawingSection.style.display = "block";
    state.canvas.style.display = "block";

    if (state.currentShapeMode === "custom") {
      state.drawInstruction.style.display = "block";
      state.canvasButtons.style.display = "flex";
      // Show unit section and inputs only if shape is closed
      if (state.isShapeClosed) {
        state.shapeInputs.style.display = "block";
        state.shapeUnitSection.style.display = "block";
      } else {
        state.shapeInputs.style.display = "none";
        state.shapeUnitSection.style.display = "none";
      }
    } else if (state.currentShapeMode === "circle") {
      // Circle uses old system (no points)
      state.drawInstruction.style.display = "none";
      state.canvasButtons.style.display = "none";
      state.shapeInputs.style.display = "block";
      state.shapeUnitSection.style.display = "block";
      this.generateShapeInputs(state.currentShapeMode);
    } else {
      // Rectangle, L-shape, Triangle - use unified custom shape system
      state.drawInstruction.style.display = "none";
      state.canvasButtons.style.display = "none";
      state.shapeInputs.style.display = "block";
      state.shapeUnitSection.style.display = "block";

      // Initialize as custom shape with generated points
      window.Shapes.initPredefinedAsCustom(state.currentShapeMode);

      // Immediately calculate and display area for predefined shapes
      const pixelArea = window.Calculations.calculateCustomShapeArea(
        state.points
      );
      const areaCm2 = pixelArea / (state.CM_TO_PX_SCALE * state.CM_TO_PX_SCALE);
      if (areaCm2 > 0) {
        state.shapeArea = areaCm2;
        state.resultText.textContent = `Площа фігури: ${(
          areaCm2 / 10000
        ).toFixed(2)} м². Готово до розрахунку.`;
      }
    }

    window.Drawing.redrawCanvas();
  },

  // Update shape input labels based on unit
  updateShapeLabels: function (unit) {
    const unitText = unit === "m" ? "м" : "см";
    const state = window.AppState;

    // Update labels in shape inputs
    const labels = state.shapeInputs.querySelectorAll("label");
    labels.forEach((label) => {
      const text = label.textContent;
      // Replace unit in parentheses: (см) or (м)
      label.textContent = text.replace(/\(см\)|\(м\)/g, `(${unitText})`);
    });
  },

  // Recalculate area after unit change (points stay the same visually)
  recalculatePointsFromInputs: function () {
    const state = window.AppState;

    if (state.currentShapeMode === "circle") {
      // Circle uses old system, just redraw
      this.handleShapeInputChange();
      return;
    }

    // Points stay the same on canvas - only the interpretation changes
    // Just redraw to update labels with new unit
    window.Drawing.redrawCanvas();
  },

  // Handle shape button click
  handleShapeButtonClick: function (shape) {
    const state = window.AppState;

    // Update active button
    document
      .querySelectorAll(".shape-btn")
      .forEach((btn) => btn.classList.remove("active"));
    document
      .querySelector(`.shape-btn[data-shape="${shape}"]`)
      .classList.add("active");

    // Update state
    state.currentShapeMode = shape;
    state.reset();

    // Update UI
    this.updateShapeUI();
  },
};
