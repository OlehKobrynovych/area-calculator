// UI management module
window.UI = {
  translations: {
    uk: {
      title: "Калькулятор площі",
      shape_custom: "Довільна",
      shape_square: "Квадрат",
      shape_rectangle: "Прямокутник",
      shape_triangle: "Трикутник",
      shape_l_shape: "Г-подібна",
      shape_circle: "Круг",
      unit_cm: "см",
      unit_m: "м",
      unit_cm_short: "см",
      unit_m_short: "м",
      unit_currency: "грн",
      btn_clear: "Очистити",
      label_sides_count: "Кількість сторін:",
      hint_init: "Будь ласка, введіть параметри фігури.",
      hint_sides: "Будь ласка, введіть кількість сторін.",
      hint_invalid: "Будь ласка, введіть дійсні розміри.",
      area_label: "Площа фігури",
      ready_label: "Готово до розрахунку.",
      material_title: "Розрахунок матеріалу",
      mat_width: "Ширина",
      mat_height: "Довжина",
      mat_per_pack: "В упаковці",
      mat_price: "Ціна",
      result_needed: "Вам знадобиться",
      result_packs: "Кількість упаковок",
      result_cost: "Загальна вартість",
      unit_pcs: "шт.",
      side_label: "Сторона",
      angle_label: "Кут",
      hint_no_shape: "Спочатку задайте фігуру — площа поки 0.",
      error_impossible: "Така фігура неможлива — значення не застосовано.",
      radius_label: "Радіус R"
    },
    en: {
      title: "Area Calculator",
      shape_custom: "Custom",
      shape_square: "Square",
      shape_rectangle: "Rectangle",
      shape_triangle: "Triangle",
      shape_l_shape: "L-Shape",
      shape_circle: "Circle",
      unit_cm: "cm",
      unit_m: "m",
      unit_cm_short: "cm",
      unit_m_short: "m",
      unit_currency: "USD",
      btn_clear: "Clear",
      label_sides_count: "Number of sides:",
      hint_init: "Please enter shape parameters.",
      hint_sides: "Please enter number of sides.",
      hint_invalid: "Please enter valid dimensions.",
      area_label: "Shape Area",
      ready_label: "Ready for calculation.",
      material_title: "Material Calculation",
      mat_width: "Width",
      mat_height: "Length",
      mat_per_pack: "Per pack",
      mat_price: "Price",
      result_needed: "You will need",
      result_packs: "Number of packs",
      result_cost: "Total cost",
      unit_pcs: "pcs.",
      side_label: "Side",
      angle_label: "Angle",
      hint_no_shape: "Define a shape first — area is 0.",
      error_impossible: "This shape is impossible — value not applied.",
      radius_label: "Radius R"
    }
  },

  translateUI: function() {
    const state = window.AppState;
    const lang = state.currentLanguage;
    const dict = this.translations[lang];

    // Update all elements with data-i18n attribute
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      if (dict[key]) {
        el.textContent = dict[key];
      }
    });

    // Refresh dynamic parts
    this.updateResultText();
    if (state.currentShapeMode === "circle") {
      this.createCircleInput();
    } else if (state.points.length > 0) {
      this.createSideInputs(state.points);
    }
    
    // Trigger material recalculation to update its texts
    const event = new CustomEvent('shapeChanged');
    document.dispatchEvent(event);
  },

  // Update result text display
  updateResultText: function() {
    const state = window.AppState;
    const dict = this.translations[state.currentLanguage];
    
    if (state.shapeArea > 0) {
      const unitLabel = state.shapeUnit === "m" ? (state.currentLanguage === "uk" ? "м²" : "m²") : (state.currentLanguage === "uk" ? "см²" : "cm²");
      const area = state.shapeUnit === "m" ? state.shapeArea / 10000 : state.shapeArea;
      const m2Label = state.currentLanguage === "uk" ? "м²" : "m²";
      const extra = state.shapeUnit === "m" ? "" : ` (${(state.shapeArea / 10000).toFixed(2)} ${m2Label})`;
      state.resultText.textContent = `${dict.area_label}: ${area.toFixed(2)} ${unitLabel}${extra}`;
    } else {
      state.resultText.textContent = dict.hint_init;
    }
  },

  // Update existing input values without recreating DOM (prevents focus loss)
  // Write current sides and angles into inputs (except `skipInput`, the one being typed in)
  syncSideInputs: function(skipInput) {
    const state = window.AppState;
    const multiplier = state.shapeUnit === "m" ? 100 : 1;
    const lengths = window.Calculations.getSideLengths(state.points);
    const angles = window.Calculations.getInteriorAngles(state.points);

    lengths.forEach((len, i) => {
      const sideInput = document.getElementById(`side-input-${i}`);
      if (sideInput && sideInput !== skipInput) sideInput.value = (len / multiplier).toFixed(2);
      const angleInput = document.getElementById(`angle-input-${i}`);
      if (angleInput && angleInput !== skipInput) angleInput.value = angles[i].toFixed(1);
    });
  },

  // Create side + angle inputs dynamically
  createSideInputs: function(points) {
    const state = window.AppState;
    const dict = this.translations[state.currentLanguage];

    state.dynamicInputsContainer.innerHTML = "";
    const unit = state.shapeUnit === "m" ? dict.unit_m_short : dict.unit_cm_short;
    const multiplier = state.shapeUnit === "m" ? 100 : 1;

    const addInput = (row, id, labelText, step, onChange) => {
      const div = document.createElement("div");
      div.classList.add("input-group");
      const label = document.createElement("label");
      label.textContent = labelText;
      const input = document.createElement("input");
      input.type = "number";
      input.id = id;
      input.step = step;
      // Live update while typing: every keystroke is applied to the shape
      // as it was when editing started, so intermediate digits don't accumulate
      let base = null;
      input.addEventListener("focus", () => {
        base = state.points.map(p => ({ ...p }));
      });
      input.addEventListener("input", (e) => {
        if (!base) base = state.points.map(p => ({ ...p }));
        state.points = base.map(p => ({ ...p }));
        const ok = onChange(parseFloat(e.target.value));
        if (!ok) {
          window.Shapes.finalizeUpdate(); // show the unchanged shape
          state.resultText.textContent = dict.error_impossible;
        }
        this.syncSideInputs(input);
      });
      input.addEventListener("change", () => {
        base = state.points.map(p => ({ ...p }));
        this.syncSideInputs();
      });
      div.appendChild(label);
      div.appendChild(input);
      row.appendChild(div);
    };

    points.forEach((p, i) => {
      const letter = String.fromCharCode(65 + i);
      const row = document.createElement("div");
      row.classList.add("side-angle-row");
      addInput(row, `side-input-${i}`, `${dict.side_label} ${letter} (${unit}):`, "0.01",
        v => window.Shapes.handleSideLengthChange(i, v * multiplier));
      addInput(row, `angle-input-${i}`, `${dict.angle_label} ${letter} (°):`, "0.1",
        v => window.Shapes.handleAngleChange(i, v));
      state.dynamicInputsContainer.appendChild(row);
      // Triangle with fixed sides has fixed angles
      if (points.length === 3) document.getElementById(`angle-input-${i}`).readOnly = true;
    });

    this.syncSideInputs();
  },

  // Handle shape button clicks
  handleShapeButtonClick: function(shape) {
    const state = window.AppState;
    state.reset();
    state.currentShapeMode = shape;
    
    state.customSidesConfig.style.display = "none";
    state.canvasButtons.style.display = "none"; 

    // Default sizes: 1 m (geometry is always in cm)
    const m = 100;

    if (shape === "custom") {
      state.customSidesConfig.style.display = "block";
      state.canvasButtons.style.display = "flex";
      // Start with a ready shape so area/material are visible immediately
      this.handleConfirmSides();
      return;
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
    const dict = this.translations[state.currentLanguage];
    state.dynamicInputsContainer.innerHTML = "";
    const unit = state.shapeUnit === "m" ? dict.unit_m_short : dict.unit_cm_short;
    const multiplier = state.shapeUnit === "m" ? 100 : 1;
    const displayVal = (state.circleRadius / multiplier).toFixed(2);

    const div = document.createElement("div");
    div.classList.add("input-group");
    const label = document.createElement("label");
    label.textContent = `${dict.radius_label} (${unit}):`;
    const input = document.createElement("input");
    input.type = "number";
    input.value = displayVal;
    input.step = "0.01";
    
    // On blur, restore the valid value if something invalid was left
    input.addEventListener("change", (e) => {
      e.target.value = (state.circleRadius / multiplier).toFixed(2);
    });
    input.addEventListener("input", (e) => {
      const newVal = parseFloat(e.target.value) || 0;
      if (newVal <= 0) return;
      state.circleRadius = newVal * multiplier;
      state.shapeArea = window.Calculations.calculateCircleArea(state.circleRadius);
      window.Drawing.redrawCanvas();
      this.updateResultText();
      document.dispatchEvent(new CustomEvent('shapeChanged'));
    });
    
    div.appendChild(label);
    div.appendChild(input);
    state.dynamicInputsContainer.appendChild(div);
  },

  handleConfirmSides: function() {
    const state = window.AppState;
    const count = Math.min(20, Math.max(3, parseInt(state.sidesCountInput.value) || 4));
    state.sidesCountInput.value = count;
    // Regular polygon with 1 m sides
    const radius = 100 / (2 * Math.sin(Math.PI / count));

    state.points = window.Shapes.generateRegularPolygon(count, radius);
    state.isShapeClosed = true;
    state.shapeArea = window.Calculations.calculatePolygonArea(state.points);
    window.Drawing.updateTransform(true);
    this.createSideInputs(state.points);
    this.updateResultText();
    window.Drawing.redrawCanvas();
  }
};
