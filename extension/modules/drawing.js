// Canvas drawing module
window.Drawing = {
  // Redraw entire canvas
  redrawCanvas: function() {
    const state = window.AppState;
    const ctx = state.ctx;
    const canvas = state.canvas;

    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Circle uses old predefined system, others use unified point system
    if (state.currentShapeMode === "circle") {
      window.Shapes.drawPredefinedShape(state.currentShapeMode, state.shapeDimensions);
    } else {
      // Custom, rectangle, l-shape, triangle all use point-based drawing
      this.drawCustomShape();
    }
  },

  // Draw custom shape
  drawCustomShape: function() {
    const state = window.AppState;
    const ctx = state.ctx;
    const canvas = state.canvas;
    const points = state.points;

    if (!ctx || !canvas) return;

    // Draw filled shape if closed
    if (state.isShapeClosed && points.length >= 3) {
      ctx.fillStyle = "rgba(24, 119, 242, 0.1)";
      ctx.beginPath();
      points.forEach((point, i) => {
        if (i === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      ctx.closePath();
      ctx.fill();
    }

    // Draw polygon lines
    if (points.length > 0) {
      ctx.strokeStyle = "#007bff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      points.forEach((point, i) => {
        if (i === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      if (state.isShapeClosed) {
        ctx.closePath();
      }
      ctx.stroke();
    }

    // Draw points
    points.forEach((point, i) => {
      ctx.beginPath();
      if (i === points.length - 1 && !state.isShapeClosed) {
        ctx.fillStyle = "#28a745"; // Green for last point
      } else {
        ctx.fillStyle = "#dc3545"; // Red for other points
      }
      ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw side labels (A, B, C, D...) for closed shapes
    if (state.isShapeClosed && points.length >= 3) {
      this.drawSideLabels(points);
    }

    // Draw line to mouse if not closed
    if (points.length > 0 && !state.isShapeClosed) {
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(points[points.length - 1].x, points[points.length - 1].y);
      ctx.lineTo(state.mouseX, state.mouseY);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  },

  // Handle canvas mouse move
  handleMouseMove: function(e) {
    const state = window.AppState;
    const canvas = state.canvas;

    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    state.mouseX = e.clientX - rect.left;
    state.mouseY = e.clientY - rect.top;

    if (state.currentShapeMode === "custom" && state.points.length > 0 && !state.isShapeClosed) {
      this.redrawCanvas();
    }
  },

  // Handle canvas click
  handleCanvasClick: function(e) {
    const state = window.AppState;

    if (e.button !== 0 || state.currentShapeMode !== "custom") return;

    const canvas = state.canvas;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    state.points.push({ x, y });
    state.isShapeClosed = false;
    this.redrawCanvas();
  },

  // Undo last point
  undoLastPoint: function() {
    const state = window.AppState;

    if (state.currentShapeMode === "custom" && state.points.length > 0) {
      state.points.pop();
      state.isShapeClosed = false;
      this.redrawCanvas();
    }
  },

  // Close shape
  closeShape: function() {
    const state = window.AppState;

    if (state.currentShapeMode === "custom" && state.points.length >= 3) {
      state.isShapeClosed = true;
      // Calculate area and store it in the state
      state.shapeArea = window.Calculations.calculateCustomShapeArea(state.points);

      // Create wall input fields for the custom shape (before redraw so labels have values)
      window.Shapes.createWallInputsForCustomShape(state.points);

      this.redrawCanvas();

    } else if (state.currentShapeMode === "custom") {
      // This case can be handled by the UI logic in popup-main.js if needed
      // For now, we just prevent closing an invalid shape.
      console.warn("Attempted to close a shape with fewer than 3 points.");
    }
  },

  // Draw side labels for custom shape
  drawSideLabels: function(points) {
    const state = window.AppState;
    const ctx = state.ctx;

    if (!ctx || points.length < 3) return;

    ctx.fillStyle = "#000";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const wallLengths = window.Shapes.getCustomWallLengths();

    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];
      
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;

      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const length = Math.sqrt(dx * dx + dy * dy);

      let offsetX = 0;
      let offsetY = 0;
      if (length > 0) {
        offsetX = (-dy / length) * 15;
        offsetY = (dx / length) * 15;
      }

      const sideLetter = String.fromCharCode(65 + i);
      const sideValue = wallLengths[i] !== undefined ? wallLengths[i].toFixed(1) : "";
      const unitText = state.shapeUnit === "m" ? "м" : "см";
      const labelText = sideValue ? `${sideLetter}: ${sideValue}${unitText}` : sideLetter;

      ctx.fillText(labelText, midX + offsetX, midY + offsetY);
    }
  },

  // Clear canvas
  clearCanvas: function() {
    const state = window.AppState;
    state.reset();
    this.redrawCanvas();
  }
};
