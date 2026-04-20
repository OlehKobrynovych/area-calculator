// UI management module
window.UI = {
  // Update result text display
  updateResultText: function() {
    const state = window.AppState;
    if (state.shapeArea > 0) {
      const unit = state.shapeUnit === "m" ? "м²" : "см²";
      const area = state.shapeUnit === "m" ? state.shapeArea / 10000 : state.shapeArea;
      state.resultText.textContent = `Площа фігури: ${area.toFixed(2)} ${unit}. Готово до розрахунку.`;
    } else {
      state.resultText.textContent = "Будь ласка, введіть дійсні розміри.";
    }
  },

  // Update existing input values without recreating DOM (prevents focus loss)
  syncSideInputs: function() {
    const state = window.AppState;
    const multiplier = state.shapeUnit === "m" ? 100 : 1;
    
    state.points.forEach((p1, i) => {
      const p2 = state.points[(i + 1) % state.points.length];
      const len = window.Calculations.calculateDistance(p1, p2);
      const input = document.getElementById(`side-input-${i}`);
      if (input && document.activeElement !== input) {
        input.value = (len / multiplier).toFixed(2);
      }
    });
  },

  // Create side inputs dynamically
  createSideInputs: function(points) {
    const state = window.AppState;
    state.dynamicInputsContainer.innerHTML = "";
    const unit = state.shapeUnit === "m" ? "м" : "см";
    const multiplier = state.shapeUnit === "m" ? 100 : 1;

    points.forEach((p1, i) => {
      const p2 = points[(i + 1) % points.length];
      const len = window.Calculations.calculateDistance(p1, p2);
      const displayVal = (len / multiplier).toFixed(2);
      
      const div = document.createElement("div");
      div.classList.add("input-group");
      const label = document.createElement("label");
      const sideLetter = String.fromCharCode(65 + i);
      label.textContent = `Сторона ${sideLetter} (${unit}):`;
      
      const input = document.createElement("input");
      input.type = "number";
      input.id = `side-input-${i}`;
      input.value = displayVal;
      input.step = "0.01";
      
      input.addEventListener("change", (e) => {
        const newVal = parseFloat(e.target.value) || 0;
        window.Shapes.handleSideLengthChange(i, newVal * multiplier);
        // Sync other inputs (like opposite sides) without focus loss
        this.syncSideInputs();
      });
      
      div.appendChild(label);
      div.appendChild(input);
      state.dynamicInputsContainer.appendChild(div);
    });
  },

  // Handle shape button clicks
  handleShapeButtonClick: function(shape) {
    const state = window.AppState;
    state.reset();
    state.currentShapeMode = shape;
    
    state.customSidesConfig.style.display = "none";
    state.canvasButtons.style.display = "none"; 

    const m = state.shapeUnit === "m" ? 100 : 1;

    if (shape === "custom") {
      state.customSidesConfig.style.display = "block";
      state.canvasButtons.style.display = "flex"; 
    } else if (shape === "square") {
      state.points = window.Shapes.generateRectangle(1 * m, 1 * m);
      state.isShapeClosed = true;
    } else if (shape === "rectangle") {
      state.points = window.Shapes.generateRectangle(2 * m, 1 * m);
      state.isShapeClosed = true;
    } else if (shape === "triangle") {
      state.points = window.Shapes.generateTriangle(1 * m);
      state.isShapeClosed = true;
    } else if (shape === "l-shape") {
      state.points = window.Shapes.generateLShape(2 * m, 2 * m, 1 * m, 1 * m);
      state.isShapeClosed = true;
    } else if (shape === "circle") {
      state.circleRadius = 0.5 * m;
      this.createCircleInput();
    }

    if (shape !== "circle" && state.points.length > 0) {
      window.Drawing.updateTransform(true);
      this.createSideInputs(state.points);
      state.shapeArea = window.Calculations.calculatePolygonArea(state.points);
    } else if (shape === "circle") {
      state.shapeArea = window.Calculations.calculateCircleArea(state.circleRadius);
    }
    
    this.updateResultText();
    window.Drawing.redrawCanvas();
  },

  createCircleInput: function() {
    const state = window.AppState;
    state.dynamicInputsContainer.innerHTML = "";
    const unit = state.shapeUnit === "m" ? "м" : "см";
    const multiplier = state.shapeUnit === "m" ? 100 : 1;
    const displayVal = (state.circleRadius / multiplier).toFixed(2);

    const div = document.createElement("div");
    div.classList.add("input-group");
    const label = document.createElement("label");
    label.textContent = `Радіус R (${unit}):`;
    const input = document.createElement("input");
    input.type = "number";
    input.value = displayVal;
    input.step = "0.01";
    
    input.addEventListener("change", (e) => {
      const newVal = parseFloat(e.target.value) || 0;
      state.circleRadius = newVal * multiplier;
      state.shapeArea = window.Calculations.calculateCircleArea(state.circleRadius);
      window.Drawing.redrawCanvas();
      this.updateResultText();
    });
    
    div.appendChild(label);
    div.appendChild(input);
    state.dynamicInputsContainer.appendChild(div);
  },

  handleConfirmSides: function() {
    const state = window.AppState;
    const count = parseInt(state.sidesCountInput.value) || 4;
    const multiplier = state.shapeUnit === "m" ? 100 : 1;
    const radius = multiplier / (2 * Math.sin(Math.PI / count));

    state.points = window.Shapes.generateRegularPolygon(count, radius);
    state.isShapeClosed = true;
    state.shapeArea = window.Calculations.calculatePolygonArea(state.points);
    window.Drawing.updateTransform(true);
    this.createSideInputs(state.points);
    this.updateResultText();
    window.Drawing.redrawCanvas();
  }
};
