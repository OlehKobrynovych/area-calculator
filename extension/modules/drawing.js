// Canvas drawing module
window.Drawing = {
  // Calculate auto-scale to fit shape in canvas
  calculateAutoScale: function(points) {
    if (!points || points.length < 2) {
      return { scale: 1, offsetX: 0, offsetY: 0 };
    }

    const canvas = window.AppState.canvas;
    const padding = 40;

    // Find bounding box
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    for (const p of points) {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    }

    const shapeWidth = maxX - minX;
    const shapeHeight = maxY - minY;

    if (shapeWidth <= 0 || shapeHeight <= 0) {
      return { scale: 1, offsetX: 0, offsetY: 0 };
    }

    // Available space
    const availableWidth = canvas.width - padding * 2;
    const availableHeight = canvas.height - padding * 2;

    // Scale = minimum of two directions
    const scaleX = availableWidth / shapeWidth;
    const scaleY = availableHeight / shapeHeight;
    const scale = Math.min(scaleX, scaleY);

    // Center the shape
    const scaledWidth = shapeWidth * scale;
    const scaledHeight = shapeHeight * scale;
    const offsetX = (canvas.width - scaledWidth) / 2 - minX * scale;
    const offsetY = (canvas.height - scaledHeight) / 2 - minY * scale;

    return { scale, offsetX, offsetY };
  },

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
    if (points.length === 0) return;

    // Use stored scale/offset from state (don't recalculate on every draw)
    const scale = state.scale;
    const offsetX = state.offsetX;
    const offsetY = state.offsetY;

    // Helper to transform point coordinates
    const tx = (x) => x * scale + offsetX;
    const ty = (y) => y * scale + offsetY;

    // Draw filled shape if closed
    if (state.isShapeClosed && points.length >= 3) {
      ctx.fillStyle = "rgba(24, 119, 242, 0.1)";
      ctx.beginPath();
      points.forEach((point, i) => {
        if (i === 0) {
          ctx.moveTo(tx(point.x), ty(point.y));
        } else {
          ctx.lineTo(tx(point.x), ty(point.y));
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
          ctx.moveTo(tx(point.x), ty(point.y));
        } else {
          ctx.lineTo(tx(point.x), ty(point.y));
        }
      });
      if (state.isShapeClosed) {
        ctx.closePath();
      }
      ctx.stroke();
    }

    // Draw points (with scaled radius for visibility)
    // Fixed formula: 4 / scale makes points smaller when zoomed in, larger when zoomed out
    const pointRadius = Math.max(3, Math.min(6, 4 / scale));
    points.forEach((point, i) => {
      ctx.beginPath();
      if (i === points.length - 1 && !state.isShapeClosed) {
        ctx.fillStyle = "#28a745"; // Green for last point
      } else {
        ctx.fillStyle = "#dc3545"; // Red for other points
      }
      ctx.arc(tx(point.x), ty(point.y), pointRadius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw side labels (A, B, C, D...) for closed shapes
    if (state.isShapeClosed && points.length >= 3) {
      this.drawSideLabels(points, scale, offsetX, offsetY);
    }

    // Draw line to mouse if not closed
    if (points.length > 0 && !state.isShapeClosed) {
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      const lastPoint = points[points.length - 1];
      ctx.moveTo(tx(lastPoint.x), ty(lastPoint.y));
      ctx.lineTo(state.mouseX, state.mouseY);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  },

  // RAF handle for throttling
  _rafHandle: null,

  // Handle canvas mouse move (with requestAnimationFrame throttling)
  handleMouseMove: function(e) {
    const state = window.AppState;
    const canvas = state.canvas;

    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    state.mouseX = e.clientX - rect.left;
    state.mouseY = e.clientY - rect.top;

    if (state.currentShapeMode === "custom" && state.points.length > 0 && !state.isShapeClosed) {
      // Throttle redraws using requestAnimationFrame
      if (this._rafHandle) return;

      this._rafHandle = requestAnimationFrame(() => {
        this._rafHandle = null;
        this.redrawCanvas();
      });
    }
  },

  // Handle canvas click
  handleCanvasClick: function(e) {
    const state = window.AppState;

    if (e.button !== 0 || state.currentShapeMode !== "custom") return;
    if (state.isShapeClosed) return;

    const canvas = state.canvas;
    const rect = canvas.getBoundingClientRect();
    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;

    // Convert canvas coords to logical coords
    // For first point, use canvas coords directly (scale=1, offset=0)
    // For subsequent points, convert using current transform
    let x, y;
    if (state.points.length === 0) {
      x = canvasX;
      y = canvasY;
    } else {
      // Convert from canvas to logical using inverse transform
      x = (canvasX - state.offsetX) / state.scale;
      y = (canvasY - state.offsetY) / state.scale;
    }

    state.points.push({ x, y });
    state.isShapeClosed = false;

    // Recalculate and store scale/offset after adding point
    this.updateTransform();
    this.redrawCanvas();
  },

  // Update transform and store in state
  updateTransform: function() {
    const state = window.AppState;
    const { scale, offsetX, offsetY } = this.calculateAutoScale(state.points);
    state.scale = scale;
    state.offsetX = offsetX;
    state.offsetY = offsetY;
  },

  // Undo last point
  undoLastPoint: function() {
    const state = window.AppState;

    if (state.currentShapeMode === "custom" && state.points.length > 0) {
      state.points.pop();
      state.isShapeClosed = false;
      // Recalculate transform after removing point
      this.updateTransform();
      this.redrawCanvas();
    }
  },

  // Close shape
  closeShape: function() {
    const state = window.AppState;

    if (state.currentShapeMode === "custom" && state.points.length >= 3) {
      state.isShapeClosed = true;

      // Fix the transform for closed shape
      this.updateTransform();

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

  // Draw side labels for custom shape (with scaling support)
  drawSideLabels: function(points, scale, transformOffsetX, transformOffsetY) {
    const state = window.AppState;
    const ctx = state.ctx;

    if (!ctx || points.length < 3) return;

    // Use default scale if not provided
    scale = scale || 1;
    transformOffsetX = transformOffsetX || 0;
    transformOffsetY = transformOffsetY || 0;

    // Helper to transform coordinates
    const tx = (x) => x * scale + transformOffsetX;
    const ty = (y) => y * scale + transformOffsetY;

    ctx.fillStyle = "#000";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const wallLengths = window.Shapes.getCustomWallLengths();

    // Calculate polygon winding direction to ensure labels are always outside
    let signedArea = 0;
    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];
      signedArea += (p2.x - p1.x) * (p2.y + p1.y);
    }
    const isClockwise = signedArea > 0;

    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];

      // Calculate midpoint in transformed coordinates
      const midX = tx((p1.x + p2.x) / 2);
      const midY = ty((p1.y + p2.y) / 2);

      // Calculate direction in LOGICAL space (not transformed)
      // This ensures correct perpendicular direction regardless of scale
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const length = Math.sqrt(dx * dx + dy * dy);

      let labelOffsetX = 0;
      let labelOffsetY = 0;
      if (length > 0) {
        // Perpendicular direction (rotate 90 degrees)
        // Flip direction based on polygon winding to ensure labels are outside
        const perpX = isClockwise ? -dy / length : dy / length;
        const perpY = isClockwise ? dx / length : -dx / length;
        // Fixed 15px offset in screen space
        labelOffsetX = perpX * 15;
        labelOffsetY = perpY * 15;
      }

      const sideLetter = String.fromCharCode(65 + i);
      const sideValue = wallLengths[i] !== undefined ? wallLengths[i].toFixed(1) : "";
      const unitText = state.shapeUnit === "m" ? "м" : "см";
      const labelText = sideValue ? `${sideLetter}: ${sideValue}${unitText}` : sideLetter;

      ctx.fillText(labelText, midX + labelOffsetX, midY + labelOffsetY);
    }
  },

  // Clear canvas
  clearCanvas: function() {
    const state = window.AppState;
    state.reset();
    this.redrawCanvas();
  }
};
