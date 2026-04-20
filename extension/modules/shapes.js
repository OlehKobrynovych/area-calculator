// Shape drawing and management module
window.Shapes = {
  // Generate a regular polygon with N sides
  generateRegularPolygon: function (sides, radius) {
    const points = [];
    for (let i = 0; i < sides; i++) {
      const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
      points.push({
        x: radius * Math.cos(angle),
        y: radius * Math.sin(angle)
      });
    }
    return points;
  },

  // Generate an isosceles triangle
  generateTriangle: function (side) {
    const h = (side * Math.sqrt(3)) / 2;
    return [
      { x: 0, y: -h / 2 },
      { x: side / 2, y: h / 2 },
      { x: -side / 2, y: h / 2 }
    ];
  },

  generateRectangle: function (w, h) {
    return [
      { x: -w / 2, y: -h / 2 },
      { x: w / 2, y: -h / 2 },
      { x: w / 2, y: h / 2 },
      { x: -w / 2, y: h / 2 }
    ];
  },

  generateLShape: function (a, b, c, d) {
    // a=total width, b=total height, c=inner width, d=inner height
    const pts = [
      { x: 0, y: 0 },
      { x: a, y: 0 },
      { x: a, y: d },
      { x: c, y: d },
      { x: c, y: b },
      { x: 0, y: b }
    ];
    const offsetX = a / 2;
    const offsetY = b / 2;
    return pts.map(p => ({ x: p.x - offsetX, y: p.y - offsetY }));
  },

  // Update side length with shape-specific logic
  handleSideLengthChange: function (index, newLength) {
    const state = window.AppState;
    if (!state.points || state.points.length < 3) return;

    const mode = state.currentShapeMode;

    if (mode === "l-shape") {
      // For L-shape, just stretch the side without cyclic optimization
      this.applyStretchUpdate(index, newLength);
    }
    else {
      // Default for Square, Rectangle, Custom, Triangle: Maximized area logic
      this.applyFlexibleUpdate(index, newLength);
    }
  },

  applyStretchUpdate: function(index, newLength) {
    const state = window.AppState;
    const n = state.points.length;
    const p1 = state.points[index];
    const p2 = state.points[(index + 1) % n];
    const currentDist = window.Calculations.calculateDistance(p1, p2);
    
    if (currentDist > 0) {
      const ratio = newLength / currentDist;
      p2.x = p1.x + (p2.x - p1.x) * ratio;
      p2.y = p1.y + (p2.y - p1.y) * ratio;
    }
    this.finalizeUpdate();
  },

  applyFlexibleUpdate: function(index, newLength) {
    const state = window.AppState;
    const n = state.points.length;
    const lengths = state.points.map((p, i) => {
      if (i === index) return newLength;
      const nextP = state.points[(i + 1) % n];
      return window.Calculations.calculateDistance(p, nextP);
    });

    const optimizedPoints = window.Calculations.solveCyclicPolygon(lengths);
    if (optimizedPoints && optimizedPoints.length > 0) {
      state.points = optimizedPoints;
    } else {
      this.applyStretchUpdate(index, newLength);
      return;
    }
    this.finalizeUpdate();
  },

  finalizeUpdate: function() {
    window.Drawing.updateTransform(true);
    window.Drawing.redrawCanvas();
    window.AppState.shapeArea = window.Calculations.calculatePolygonArea(window.AppState.points);
    window.UI.updateResultText();
  }
};
