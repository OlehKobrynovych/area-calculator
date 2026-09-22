// Canvas drawing module
window.Drawing = {
  // Update transform based on points (logical CM) with smoothing
  updateTransform: function(immediate = false) {
    const state = window.AppState;
    if (state.points.length === 0) {
      state.scale = 1;
      state.offsetX = 0;
      state.offsetY = 0;
      return;
    }

    const canvas = state.canvas;
    const padding = 50;

    // Find bounding box
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    state.points.forEach(p => {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    });

    const shapeWidth = maxX - minX;
    const shapeHeight = maxY - minY;

    const availableWidth = canvas.width - padding * 2;
    const availableHeight = canvas.height - padding * 2;

    // Target values
    let targetScale = 1;
    if (shapeWidth > 0 && shapeHeight > 0) {
      targetScale = Math.min(availableWidth / shapeWidth, availableHeight / shapeHeight);
    }
    
    const targetOffsetX = (canvas.width - shapeWidth * targetScale) / 2 - minX * targetScale;
    const targetOffsetY = (canvas.height - shapeHeight * targetScale) / 2 - minY * targetScale;

    // Apply smoothing if dragging and not forced immediate
    if (state.isDragging && !immediate) {
      const lerp = 0.15; // Smoothing factor (0.1 - 0.2 is usually best)
      state.scale += (targetScale - state.scale) * lerp;
      state.offsetX += (targetOffsetX - state.offsetX) * lerp;
      state.offsetY += (targetOffsetY - state.offsetY) * lerp;
    } else {
      // Set immediately
      state.scale = targetScale;
      state.offsetX = targetOffsetX;
      state.offsetY = targetOffsetY;
    }
  },

  // Redraw entire canvas
  redrawCanvas: function() {
    const state = window.AppState;
    const ctx = state.ctx;
    if (!ctx) return;

    ctx.clearRect(0, 0, state.canvas.width, state.canvas.height);

    if (state.currentShapeMode === "circle") {
      this.drawCircle();
    } else {
      this.drawPolygon();
    }
  },

  // Logical to Screen conversion
  tx: function(x) { return x * window.AppState.scale + window.AppState.offsetX; },
  ty: function(y) { return y * window.AppState.scale + window.AppState.offsetY; },

  // Screen to Logical conversion
  getLogicalMousePos: function(e) {
    const state = window.AppState;
    const rect = state.canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    return {
      x: (screenX - state.offsetX) / state.scale,
      y: (screenY - state.offsetY) / state.scale
    };
  },

  handleMouseDown: function(e) {
    const state = window.AppState;
    if (state.currentShapeMode === "circle") return;

    const mousePos = this.getLogicalMousePos(e);
    const threshold = 12 / state.scale; // Detection radius

    const index = state.points.findIndex(p => {
      const dist = Math.sqrt(Math.pow(p.x - mousePos.x, 2) + Math.pow(p.y - mousePos.y, 2));
      return dist < threshold;
    });

    if (index !== -1) {
      state.isDragging = true;
      state.draggedPointIndex = index;
    }
  },

  handleMouseMove: function(e) {
    const state = window.AppState;
    const mousePos = this.getLogicalMousePos(e);
    const threshold = 12 / state.scale;

    if (state.isDragging) {
      const prev = state.points[state.draggedPointIndex];
      state.points[state.draggedPointIndex] = { x: mousePos.x, y: mousePos.y };

      // Reject moves that make the polygon self-intersecting (shoelace would be wrong)
      if (this.hasSelfIntersection(state.points)) {
        state.points[state.draggedPointIndex] = prev;
        return;
      }

      // Transform stays fixed during drag so the point follows the cursor;
      // it is re-fitted on mouseup

      state.shapeArea = window.Calculations.calculatePolygonArea(state.points);
      window.UI.updateResultText();
      
      window.UI.syncSideInputs();

      this.requestRedraw();
    } else {
      // Hover detection logic
      const index = state.points.findIndex(p => {
        const dist = Math.sqrt(Math.pow(p.x - mousePos.x, 2) + Math.pow(p.y - mousePos.y, 2));
        return dist < threshold;
      });

      if (index !== -1) {
        state.canvas.style.cursor = 'pointer';
        state.hoveredPointIndex = index;
      } else {
        state.canvas.style.cursor = 'default';
        state.hoveredPointIndex = -1;
      }
      this.requestRedraw();
    }
  },

  handleMouseUp: function() {
    const state = window.AppState;
    if (state.isDragging) {
      state.isDragging = false;
      state.draggedPointIndex = -1;
      this.updateTransform(true);
      this.redrawCanvas();
      window.UI.createSideInputs(state.points);
      const event = new CustomEvent('shapeChanged');
      document.dispatchEvent(event);
    }
  },

  drawPolygon: function() {
    const state = window.AppState;
    const ctx = state.ctx;
    const pts = state.points;
    if (pts.length === 0) return;

    if (state.isShapeClosed && pts.length >= 3) {
      ctx.fillStyle = "rgba(0, 123, 255, 0.1)";
      ctx.beginPath();
      pts.forEach((p, i) => {
        if (i === 0) ctx.moveTo(this.tx(p.x), this.ty(p.y));
        else ctx.lineTo(this.tx(p.x), this.ty(p.y));
      });
      ctx.closePath();
      ctx.fill();
    }

    ctx.strokeStyle = "#007bff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    pts.forEach((p, i) => {
      if (i === 0) ctx.moveTo(this.tx(p.x), this.ty(p.y));
      else ctx.lineTo(this.tx(p.x), this.ty(p.y));
    });
    if (state.isShapeClosed) ctx.closePath();
    ctx.stroke();

    pts.forEach((p, i) => {
      ctx.beginPath();
      const isHighlighted = (i === state.draggedPointIndex || i === state.hoveredPointIndex);
      const radius = isHighlighted ? 6 : 4;
      ctx.fillStyle = isHighlighted ? "#28a745" : "#dc3545";
      ctx.arc(this.tx(p.x), this.ty(p.y), radius, 0, Math.PI * 2);
      ctx.fill();
      if (isHighlighted) {
          ctx.strokeStyle = "white";
          ctx.lineWidth = 2;
          ctx.stroke();
      }
    });

    if (state.isShapeClosed) this.drawLabels();
  },

  drawCircle: function() {
    const state = window.AppState;
    const ctx = state.ctx;
    const radius = state.circleRadius || 50;
    const padding = 50;
    const available = Math.min(state.canvas.width, state.canvas.height) - padding * 2;
    const scale = available / (radius * 2);
    const cx = state.canvas.width / 2;
    const cy = state.canvas.height / 2;
    const rPx = radius * scale;

    ctx.fillStyle = "rgba(0, 123, 255, 0.1)";
    ctx.strokeStyle = "#007bff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, rPx, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    ctx.fillStyle = "#000";
    ctx.textAlign = "center";
    const unit = state.shapeUnit === "m" ? "м" : "см";
    const val = (radius / (state.shapeUnit === "m" ? 100 : 1)).toFixed(2);
    ctx.fillText(`R: ${val} ${unit}`, cx, cy - rPx - 10);
  },

  drawLabels: function() {
    const state = window.AppState;
    const ctx = state.ctx;
    const pts = state.points;
    ctx.fillStyle = "#000";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";

    let sum = 0;
    for (let i = 0; i < pts.length; i++) {
        const p1 = pts[i];
        const p2 = pts[(i + 1) % pts.length];
        sum += (p2.x - p1.x) * (p2.y + p1.y);
    }
    const isCW = sum > 0;

    pts.forEach((p1, i) => {
      const p2 = pts[(i + 1) % pts.length];
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      
      if (len > 0) {
          const nx = isCW ? -dy / len : dy / len;
          const ny = isCW ? dx / len : -dx / len;
          const labelX = this.tx(midX + nx * (15 / state.scale));
          const labelY = this.ty(midY + ny * (15 / state.scale));
          const sideLetter = String.fromCharCode(65 + i);
          const unit = state.shapeUnit === "m" ? "м" : "см";
          const multiplier = state.shapeUnit === "m" ? 100 : 1;
          const displayVal = (len / multiplier).toFixed(2);
          ctx.fillText(`${sideLetter}: ${displayVal}${unit}`, labelX, labelY);
      }
    });

    // Angle labels inside each vertex (along the bisector)
    const angles = window.Calculations.getInteriorAngles(pts);
    ctx.fillStyle = "#6b21a8";
    pts.forEach((p, i) => {
      const prev = pts[(i - 1 + pts.length) % pts.length];
      const next = pts[(i + 1) % pts.length];
      const d1 = window.Calculations.calculateDistance(p, prev);
      const d2 = window.Calculations.calculateDistance(p, next);
      if (d1 === 0 || d2 === 0) return;
      let bx = (prev.x - p.x) / d1 + (next.x - p.x) / d2;
      let by = (prev.y - p.y) / d1 + (next.y - p.y) / d2;
      const bl = Math.sqrt(bx * bx + by * by);
      if (bl < 1e-6) return;
      const sign = angles[i] > 180 ? -1 : 1;
      const offset = 36 / state.scale;
      const x = this.tx(p.x + sign * bx / bl * offset);
      const y = this.ty(p.y + sign * by / bl * offset);
      ctx.fillText(`${String.fromCharCode(65 + i)} ${angles[i].toFixed(1)}°`, x, y + 4);
    });
  },

  hasSelfIntersection: function(pts) {
    const n = pts.length;
    if (n < 4) return false;
    for (let i = 0; i < n; i++) {
      for (let j = i + 2; j < n; j++) {
        if (i === 0 && j === n - 1) continue; // adjacent via wrap-around
        if (window.Calculations.doSegmentsIntersect(pts[i], pts[(i + 1) % n], pts[j], pts[(j + 1) % n])) {
          return true;
        }
      }
    }
    return false;
  },

  _raf: null,
  requestRedraw: function() {
    if (this._raf) return;
    this._raf = requestAnimationFrame(() => {
        this._raf = null;
        this.redrawCanvas();
    });
  }
};
