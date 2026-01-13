// Shape drawing and management module
window.Shapes = {
  // Get default dimensions for each shape type
  getDefaultDimensions: function (mode) {
    switch (mode) {
      case "rectangle":
        return { width: 100, height: 100 };
      case "l-shape":
        // 6 sides: A (top), B (right-top), C (right-bottom), D (bottom-right), E (bottom-left), F (left)
        return {
          sideA: 300,
          sideB: 200,
          sideC: 100,
          sideD: 100,
          sideE: 200,
          sideF: 300,
        };
      case "triangle":
        return { sideA: 150, sideB: 150, sideC: 150 };
      case "circle":
        return { radius: 100 };
      default:
        return {};
    }
  },

  // Validate shape dimensions
  validateShapeDimensions: function (mode, dimensions) {
    const getVal = (inputRef) => parseFloat(inputRef.value) || 0;

    switch (mode) {
      case "l-shape":
        // For L-shape with 6 sides: A (top), B (right-top), C (inner horizontal), D (inner vertical), E (bottom), F (left)
        // Validation: C < A (inner width < outer width), D < F (inner height < outer height)
        const sideA = getVal(dimensions.sideA);
        const sideC = getVal(dimensions.sideC);
        const sideD = getVal(dimensions.sideD);
        const sideF = getVal(dimensions.sideF);
        if (sideC >= sideA) {
          console.warn("L-shape validation failed: sideC must be less than sideA");
          return false;
        }
        if (sideD >= sideF) {
          console.warn("L-shape validation failed: sideD must be less than sideF");
          return false;
        }
        return true;
      case "triangle":
        // Triangle inequality: sum of any two sides must be greater than the third
        const triA = getVal(dimensions.sideA);
        const triB = getVal(dimensions.sideB);
        const triC = getVal(dimensions.sideC);
        if (triA + triB <= triC || triA + triC <= triB || triB + triC <= triA) {
          console.warn("Triangle validation failed: invalid triangle sides");
          return false;
        }
        return true;
      default:
        return true;
    }
  },

  // Draw predefined shapes on canvas
  drawPredefinedShape: function (mode, dimensions) {
    const state = window.AppState;
    const ctx = state.ctx;
    const canvas = state.canvas;

    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const getVal = (inputRef) => parseFloat(inputRef.value) || 0;
    const CM_TO_PX = state.CM_TO_PX_SCALE;

    // Common shape styles
    const shapeStrokeColor = "#007bff";
    const shapeFillColor = "rgba(24, 119, 242, 0.1)";
    const lineWidth = 2;

    // Common label styles
    const labelColor = "#000";
    const labelFont = "12px Arial";

    switch (mode) {
      case "rectangle": {
        const sideA_val = getVal(dimensions.sideA); // top
        const sideB_val = getVal(dimensions.sideB); // right
        const sideC_val = getVal(dimensions.sideC); // bottom
        const sideD_val = getVal(dimensions.sideD); // left

        // Calculate sides in pixels
        const topWidth = sideA_val * CM_TO_PX;
        const rightHeight = sideB_val * CM_TO_PX;
        const bottomWidth = sideC_val * CM_TO_PX;
        const leftHeight = sideD_val * CM_TO_PX;

        // Build trapezoid from bottom-left corner
        // Bottom-left is the anchor point
        const maxWidth = Math.max(topWidth, bottomWidth);
        const maxHeight = Math.max(leftHeight, rightHeight);

        // Center the shape bounding box on canvas
        const startX = (canvas.width - maxWidth) / 2;
        const startY = (canvas.height - maxHeight) / 2;

        // Vertices: start from bottom-left, go clockwise
        // Bottom-left corner (anchor)
        const blX = startX + (maxWidth - bottomWidth) / 2;
        const blY = startY + leftHeight;

        // Bottom-right corner
        const brX = blX + bottomWidth;
        const brY = startY + rightHeight;

        // Top-right corner
        const trX = startX + (maxWidth + topWidth) / 2;
        const trY = startY;

        // Top-left corner
        const tlX = startX + (maxWidth - topWidth) / 2;
        const tlY = startY;

        // Draw filled shape
        ctx.fillStyle = shapeFillColor;
        ctx.strokeStyle = shapeStrokeColor;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        ctx.moveTo(tlX, tlY); // Top-left
        ctx.lineTo(trX, trY); // Top-right
        ctx.lineTo(brX, brY); // Bottom-right
        ctx.lineTo(blX, blY); // Bottom-left
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Draw labels
        ctx.fillStyle = labelColor;
        ctx.font = labelFont;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const unitTextRect = state.shapeUnit === "m" ? "м" : "см";
        ctx.fillText(
          `A: ${sideA_val}${unitTextRect}`,
          (tlX + trX) / 2,
          tlY - 10
        );
        ctx.fillText(
          `B: ${sideB_val}${unitTextRect}`,
          (trX + brX) / 2 + 30,
          (trY + brY) / 2
        );
        ctx.fillText(
          `C: ${sideC_val}${unitTextRect}`,
          (blX + brX) / 2,
          Math.max(blY, brY) + 15
        );
        ctx.fillText(
          `D: ${sideD_val}${unitTextRect}`,
          (tlX + blX) / 2 - 30,
          (tlY + blY) / 2
        );
        break;
      }
      case "l-shape": {
        // Get all 6 sides
        const sideA_val = getVal(dimensions.sideA); // top
        const sideB_val = getVal(dimensions.sideB); // right-top (vertical)
        const sideC_val = getVal(dimensions.sideC); // right-bottom (horizontal, going left)
        const sideD_val = getVal(dimensions.sideD); // inner vertical (going down)
        const sideE_val = getVal(dimensions.sideE); // bottom-left (horizontal)
        const sideF_val = getVal(dimensions.sideF); // left (vertical, going up)

        const sideA = sideA_val * CM_TO_PX;
        const sideB = sideB_val * CM_TO_PX;
        const sideC = sideC_val * CM_TO_PX;
        const sideD = sideD_val * CM_TO_PX;
        const sideE = sideE_val * CM_TO_PX;
        const sideF = sideF_val * CM_TO_PX;

        // Calculate bounding box
        const totalWidth = Math.max(sideA, sideE + sideC);
        const totalHeight = sideF;

        const startX = (canvas.width - totalWidth) / 2;
        const startY = (canvas.height - totalHeight) / 2;

        // Vertices (clockwise from top-left)
        // p1 = top-left, p2 = top-right, p3 = right corner (after B)
        // p4 = inner corner, p5 = inner bottom, p6 = bottom-left
        const p1x = startX,
          p1y = startY;
        const p2x = startX + sideA,
          p2y = startY;
        const p3x = p2x,
          p3y = startY + sideB;
        const p4x = p3x - sideC,
          p4y = p3y;
        const p5x = p4x,
          p5y = p4y + sideD;
        const p6x = startX,
          p6y = startY + sideF;

        // Draw filled shape
        ctx.fillStyle = shapeFillColor;
        ctx.strokeStyle = shapeStrokeColor;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        ctx.moveTo(p1x, p1y);
        ctx.lineTo(p2x, p2y);
        ctx.lineTo(p3x, p3y);
        ctx.lineTo(p4x, p4y);
        ctx.lineTo(p5x, p5y);
        ctx.lineTo(p6x, p6y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Draw labels
        ctx.fillStyle = labelColor;
        ctx.font = labelFont;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const unitTextL = state.shapeUnit === "m" ? "м" : "см";
        ctx.fillText(`A: ${sideA_val}${unitTextL}`, (p1x + p2x) / 2, p1y - 10);
        ctx.fillText(`B: ${sideB_val}${unitTextL}`, p2x + 25, (p2y + p3y) / 2);
        ctx.fillText(`C: ${sideC_val}${unitTextL}`, (p3x + p4x) / 2, p3y - 10);
        ctx.fillText(`D: ${sideD_val}${unitTextL}`, p4x - 25, (p4y + p5y) / 2);
        ctx.fillText(`E: ${sideE_val}${unitTextL}`, (p5x + p6x) / 2, p5y + 15);
        ctx.fillText(`F: ${sideF_val}${unitTextL}`, p6x - 25, (p1y + p6y) / 2);
        break;
      }
      case "triangle": {
        const sideA_val = getVal(dimensions.sideA);
        const sideB_val = getVal(dimensions.sideB);
        const sideC_val = getVal(dimensions.sideC);

        // Calculate triangle vertices using cosine rule
        const a = sideA_val * CM_TO_PX;
        const b = sideB_val * CM_TO_PX;
        const c = sideC_val * CM_TO_PX;

        // Check if triangle is valid
        if (a + b <= c || a + c <= b || b + c <= a) {
          if (state.resultText) {
            state.resultText.textContent =
              "Недійсний трикутник: сторони не утворюють дійсний трикутник.";
          }
          break;
        }

        // Calculate angle at vertex A using cosine rule
        const cosA = (b * b + c * c - a * a) / (2 * b * c);
        const angleA = Math.acos(Math.max(-1, Math.min(1, cosA)));

        // Vertex positions
        const Ax = 0,
          Ay = 0;
        const Bx = c,
          By = 0;
        const Cx = b * Math.cos(angleA);
        const Cy = b * Math.sin(angleA);

        // Center the triangle on canvas
        const minX = Math.min(Ax, Bx, Cx);
        const maxX = Math.max(Ax, Bx, Cx);
        const minY = Math.min(Ay, By, Cy);
        const maxY = Math.max(Ay, By, Cy);

        const offsetX = (canvas.width - (maxX - minX)) / 2 - minX;
        const offsetY = (canvas.height - (maxY - minY)) / 2 - minY;

        const p1x = Ax + offsetX,
          p1y = Ay + offsetY;
        const p2x = Bx + offsetX,
          p2y = By + offsetY;
        const p3x = Cx + offsetX,
          p3y = Cy + offsetY;

        // Draw filled shape
        ctx.fillStyle = shapeFillColor;
        ctx.strokeStyle = shapeStrokeColor;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        ctx.moveTo(p1x, p1y);
        ctx.lineTo(p2x, p2y);
        ctx.lineTo(p3x, p3y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Draw labels
        ctx.fillStyle = labelColor;
        ctx.font = labelFont;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const unitTextTri = state.shapeUnit === "m" ? "м" : "см";
        ctx.fillText(
          `A: ${sideA_val}${unitTextTri}`,
          (p2x + p3x) / 2 + 20,
          (p2y + p3y) / 2
        );
        ctx.fillText(
          `B: ${sideB_val}${unitTextTri}`,
          (p1x + p3x) / 2 - 20,
          (p1y + p3y) / 2
        );
        ctx.fillText(
          `C: ${sideC_val}${unitTextTri}`,
          (p1x + p2x) / 2,
          (p1y + p2y) / 2 + 15
        );
        break;
      }
      case "circle": {
        const circRadius_val = getVal(dimensions.radius);
        const circRadius = circRadius_val * CM_TO_PX;

        // Auto-scale circle to fit canvas
        const padding = 40;
        const availableSize = Math.min(canvas.width, canvas.height) - padding * 2;
        const scale = circRadius > 0 ? Math.min(1, availableSize / (circRadius * 2)) : 1;
        const scaledRadius = circRadius * scale;

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        // Draw filled shape
        ctx.fillStyle = shapeFillColor;
        ctx.strokeStyle = shapeStrokeColor;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        ctx.arc(centerX, centerY, scaledRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Draw radius line
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + scaledRadius, centerY);
        ctx.stroke();

        // Draw label
        ctx.fillStyle = labelColor;
        ctx.font = labelFont;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const unitTextCirc = state.shapeUnit === "m" ? "м" : "см";
        ctx.fillText(
          `R: ${circRadius_val}${unitTextCirc}`,
          centerX + scaledRadius / 2,
          centerY - 15
        );
        break;
      }
    }
  },

  // Create input fields for custom shape walls (NEW FEATURE)
  createWallInputsForCustomShape: function (points) {
    if (!points || points.length < 3) return;

    const state = window.AppState;
    const lengths = window.Calculations.calculateWallLengths(points);
    const CM_TO_PX = state.CM_TO_PX_SCALE;

    // Store original points for scaling
    state.originalPoints = points.map((p) => ({ x: p.x, y: p.y }));

    // Store original wall lengths for angle-based editing
    state.originalWallLengths = lengths.slice();

    state.shapeInputs.innerHTML = "";
    state.customWallInputs = [];

    const unitText = state.shapeUnit === "m" ? "м" : "см";
    // Display value = pixels / CM_TO_PX (visual units, same for cm and m)
    lengths.forEach((lengthPx, index) => {
      const displayValue = lengthPx / CM_TO_PX;
      const sideLetter = String.fromCharCode(65 + index);
      const inputField = window.UI.createInputField(
        `custom-wall-${index}`,
        `Сторона ${sideLetter} (${unitText})`,
        "number",
        Math.round(displayValue),
        0
      );
      state.customWallInputs.push(inputField);
      state.shapeInputs.appendChild(inputField.parentNode);

      inputField.addEventListener("input", () => {
        this.handleCustomWallInputChange(index);
      });
    });

    if (state.shapeInputs) {
      state.shapeInputs.style.display = "block";
    }
    if (state.shapeUnitSection) {
      state.shapeUnitSection.style.display = "block";
    }
  },

  handleCustomWallInputChange: function (changedIndex) {
    const state = window.AppState;

    if (!state.originalPoints || state.originalPoints.length < 3) return;
    if (!state.originalWallLengths || state.originalWallLengths.length < 3)
      return;

    // Get the new length for the changed side
    // Input value is used directly for visual size (1 unit = 1 pixel regardless of cm/m)
    // The unit (cm/m) only affects the final area calculation, not the visual representation
    const inputValue =
      parseFloat(state.customWallInputs[changedIndex].value) || 0;
    const CM_TO_PX = state.CM_TO_PX_SCALE;
    const newLengthPx = inputValue * CM_TO_PX;

    if (newLengthPx <= 0) return;

    // Get current points (start from original each time)
    const points = state.originalPoints.map((p) => ({ x: p.x, y: p.y }));
    const numPoints = points.length;

    // Indices
    const p1Index = changedIndex;
    const p2Index = (changedIndex + 1) % numPoints;
    const p3Index = (changedIndex + 2) % numPoints;

    const p1 = points[p1Index];
    const origP2 = points[p2Index];
    const p3 = points[p3Index];

    // R1 = new length of the changed side
    const R1 = newLengthPx;

    // R2 = original length of the next side (we try to preserve it)
    const R2 = state.originalWallLengths[p2Index];

    // Find new p2 position using circle intersection
    const result = window.Calculations.findCircleIntersection(
      p1,
      p3,
      R1,
      R2,
      origP2
    );

    // Update p2 with the calculated position
    points[p2Index] = result.point;

    // Update state points
    state.points = points;

    // Update transform after geometry change
    window.Drawing.updateTransform();
    window.Drawing.redrawCanvas();

    // Recalculate area based on new points
    // Unit multiplier converts visual units to real-world cm
    const unitMultiplier = state.shapeUnit === "m" ? 100 : 1;
    const pixelArea = window.Calculations.calculateCustomShapeArea(
      state.points
    );
    // Area in visual units squared, then convert to cm²
    const areaVisualUnits = pixelArea / (CM_TO_PX * CM_TO_PX);
    const areaCm2 = areaVisualUnits * unitMultiplier * unitMultiplier;
    if (areaCm2 > 0) {
      state.shapeArea = areaCm2;
      state.resultText.textContent = `Площа фігури: ${(areaCm2 / 10000).toFixed(
        2
      )} м². Готово до розрахунку.`;
    }

    // Update other side lengths in inputs based on new points
    this.updateWallInputsFromPoints(changedIndex);

    // Update originalPoints and originalWallLengths for the next edit
    // This must be done AFTER updateWallInputsFromPoints so subsequent edits work from the new geometry
    const newLengths = window.Calculations.calculateWallLengths(state.points);
    state.originalPoints = state.points.map((p) => ({ x: p.x, y: p.y }));
    state.originalWallLengths = newLengths.slice();
  },

  updateWallInputsFromPoints: function (skipIndex = -1) {
    const state = window.AppState;
    if (!state.points || !state.customWallInputs) return;

    const CM_TO_PX = state.CM_TO_PX_SCALE;
    const lengths = window.Calculations.calculateWallLengths(state.points);

    // Display value = pixels / CM_TO_PX (visual units, same for cm and m)
    lengths.forEach((lengthPx, index) => {
      // Skip the input that was just changed by user
      if (index === skipIndex) return;

      if (state.customWallInputs[index]) {
        const displayValue = lengthPx / CM_TO_PX;
        state.customWallInputs[index].value = Math.round(displayValue);
      }
    });

    // NOTE: Do NOT update originalPoints here!
    // originalPoints should only be set once when the shape is first closed
    // Updating them here causes cumulative errors when editing multiple sides
  },

  calculateCentroid: function (points) {
    const sum = points.reduce(
      (acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }),
      { x: 0, y: 0 }
    );
    return { x: sum.x / points.length, y: sum.y / points.length };
  },

  calculateScaleFactor: function (sideIndex) {
    const state = window.AppState;
    sideIndex = sideIndex || 0;
    if (!state.customWallInputs || state.customWallInputs.length === 0)
      return 1;
    if (!state.originalPoints || state.originalPoints.length < 2) return 1;

    const newLength = parseFloat(state.customWallInputs[sideIndex].value) || 0;
    const originalLengths = window.Calculations.calculateWallLengths(
      state.originalPoints
    );
    const CM_TO_PX = state.CM_TO_PX_SCALE;

    if (originalLengths.length > sideIndex && originalLengths[sideIndex] > 0) {
      const originalCm = originalLengths[sideIndex] / CM_TO_PX;
      if (originalCm > 0 && newLength > 0) {
        return newLength / originalCm;
      }
    }
    return 1;
  },

  calculateCustomAreaFromInputs: function (sideIndex) {
    const state = window.AppState;
    sideIndex = sideIndex || 0;
    if (!state.customWallInputs || state.customWallInputs.length < 3) return 0;

    const unitMultiplier = state.shapeUnit === "m" ? 100 : 1; // Convert to cm
    const wallLengths = state.customWallInputs.map(
      (input) => (parseFloat(input.value) || 0) * unitMultiplier
    );

    const originalLengths = window.Calculations.calculateWallLengths(
      state.originalPoints
    );
    const CM_TO_PX = state.CM_TO_PX_SCALE;

    let scaleFactor = 1;
    if (originalLengths.length > sideIndex && originalLengths[sideIndex] > 0) {
      const originalCm = originalLengths[sideIndex] / CM_TO_PX;
      if (originalCm > 0) {
        scaleFactor = wallLengths[sideIndex] / originalCm;
      }
    }

    const pixelArea = window.Calculations.calculateCustomShapeArea(
      state.originalPoints
    );
    return (pixelArea * scaleFactor * scaleFactor) / (CM_TO_PX * CM_TO_PX);
  },

  getCustomWallLengths: function () {
    const state = window.AppState;
    if (!state.customWallInputs) return [];
    return state.customWallInputs.map((input) => parseFloat(input.value) || 0);
  },

  // Generate points from rectangle dimensions
  generateRectanglePoints: function (sideA, sideB, sideC, sideD) {
    const state = window.AppState;
    const CM_TO_PX = state.CM_TO_PX_SCALE;
    const canvas = state.canvas;

    // Convert to pixels
    const a = sideA * CM_TO_PX;
    const b = sideB * CM_TO_PX;
    const c = sideC * CM_TO_PX;
    const d = sideD * CM_TO_PX;

    // Calculate trapezoid vertices
    const maxWidth = Math.max(a, c);
    const maxHeight = Math.max(b, d);
    const startX = (canvas.width - maxWidth) / 2;
    const startY = (canvas.height - maxHeight) / 2;

    // Top-left (p0), Top-right (p1), Bottom-right (p2), Bottom-left (p3)
    const tlX = startX + (maxWidth - a) / 2;
    const tlY = startY;
    const trX = tlX + a;
    const trY = startY;
    const brX = startX + (maxWidth + c) / 2;
    const brY = startY + b;
    const blX = startX + (maxWidth - c) / 2;
    const blY = startY + d;

    return [
      { x: tlX, y: tlY },
      { x: trX, y: trY },
      { x: brX, y: brY },
      { x: blX, y: blY },
    ];
  },

  // Generate points from L-shape dimensions
  generateLShapePoints: function (sideA, sideB, sideC, sideD, sideE, sideF) {
    const state = window.AppState;
    const CM_TO_PX = state.CM_TO_PX_SCALE;
    const canvas = state.canvas;

    // Convert to pixels
    const a = sideA * CM_TO_PX;
    const b = sideB * CM_TO_PX;
    const c = sideC * CM_TO_PX;
    const d = sideD * CM_TO_PX;
    const e = sideE * CM_TO_PX;
    const f = sideF * CM_TO_PX;

    const totalWidth = Math.max(a, e + c);
    const totalHeight = f;
    const startX = (canvas.width - totalWidth) / 2;
    const startY = (canvas.height - totalHeight) / 2;

    // 6 vertices clockwise from top-left
    return [
      { x: startX, y: startY }, // p0: top-left
      { x: startX + a, y: startY }, // p1: top-right
      { x: startX + a, y: startY + b }, // p2: after B
      { x: startX + a - c, y: startY + b }, // p3: after C
      { x: startX + a - c, y: startY + b + d }, // p4: after D
      { x: startX, y: startY + f }, // p5: bottom-left
    ];
  },

  // Generate points from triangle dimensions (3 sides)
  generateTrianglePoints: function (sideA, sideB, sideC) {
    const state = window.AppState;
    const CM_TO_PX = state.CM_TO_PX_SCALE;
    const canvas = state.canvas;

    const a = sideA * CM_TO_PX;
    const b = sideB * CM_TO_PX;
    const c = sideC * CM_TO_PX;

    // Check if triangle is valid
    if (a + b <= c || a + c <= b || b + c <= a) {
      return null;
    }

    // Calculate angle at vertex A using cosine rule
    const cosA = (b * b + c * c - a * a) / (2 * b * c);
    const angleA = Math.acos(Math.max(-1, Math.min(1, cosA)));

    // Vertex positions
    const Ax = 0,
      Ay = 0;
    const Bx = c,
      By = 0;
    const Cx = b * Math.cos(angleA);
    const Cy = b * Math.sin(angleA);

    // Center the triangle on canvas
    const minX = Math.min(Ax, Bx, Cx);
    const maxX = Math.max(Ax, Bx, Cx);
    const minY = Math.min(Ay, By, Cy);
    const maxY = Math.max(Ay, By, Cy);

    const offsetX = (canvas.width - (maxX - minX)) / 2 - minX;
    const offsetY = (canvas.height - (maxY - minY)) / 2 - minY;

    return [
      { x: Ax + offsetX, y: Ay + offsetY },
      { x: Bx + offsetX, y: By + offsetY },
      { x: Cx + offsetX, y: Cy + offsetY },
    ];
  },

  // Initialize predefined shape as custom shape (unified system)
  initPredefinedAsCustom: function (mode) {
    const state = window.AppState;
    const defaults = this.getDefaultDimensions(mode);
    let points = null;

    switch (mode) {
      case "rectangle":
        points = this.generateRectanglePoints(
          defaults.width,
          defaults.height,
          defaults.width,
          defaults.height
        );
        break;
      case "l-shape":
        points = this.generateLShapePoints(
          defaults.sideA,
          defaults.sideB,
          defaults.sideC,
          defaults.sideD,
          defaults.sideE,
          defaults.sideF
        );
        break;
      case "triangle":
        points = this.generateTrianglePoints(
          defaults.sideA,
          defaults.sideB,
          defaults.sideC
        );
        break;
      default:
        return false;
    }

    if (!points || points.length < 3) {
      return false;
    }

    // Set up as custom shape
    state.points = points;
    state.isShapeClosed = true;

    // Update transform for the new shape
    window.Drawing.updateTransform();

    // Create wall inputs using the unified custom shape system
    this.createWallInputsForCustomShape(points);

    return true;
  },
};
