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

  // Side i changed: angles stay, two other sides are recomputed to close the shape.
  // Returns false if the change is impossible (shape stays unchanged).
  handleSideLengthChange: function (index, newLength) {
    const state = window.AppState;
    if (!state.points || state.points.length < 3 || !(newLength > 0)) return false;

    const C = window.Calculations;
    const lengths = C.getSideLengths(state.points);
    lengths[index] = newLength;
    return this.applyGeometry(lengths, C.getInteriorAngles(state.points), index);
  },

  // Angle at vertex i changed, all sides stay the same.
  // With fixed sides exactly 3 other angles must change; the nearest following
  // vertices are tried first, then farther ones up to the last.
  handleAngleChange: function (index, newAngle) {
    const state = window.AppState;
    const n = state.points ? state.points.length : 0;
    if (n < 4 || !(newAngle > 0 && newAngle < 360)) return false;

    const C = window.Calculations;
    const lengths = C.getSideLengths(state.points);
    const angles = C.getInteriorAngles(state.points);
    angles[index] = newAngle;
    const orientation = C.signedDoubleArea(state.points) >= 0 ? 1 : -1;

    // Free joints as offsets after index: 1 <= a < b < c <= n-1, nearest first
    const triples = [];
    for (let c = 3; c < n; c++)
      for (let b = 2; b < c; b++)
        for (let a = 1; a < b; a++) triples.push([a, b, c]);

    for (const [a, b, c] of triples) {
      const j1 = (index + a) % n, j2 = (index + b) % n, j3 = (index + c) % n;
      const pts = this.solveWithFreeJoints(lengths, angles, orientation, j1, j2, j3);
      if (!pts || window.Drawing.hasSelfIntersection(pts)) continue;
      if (Math.abs(C.getInteriorAngles(pts)[index] - newAngle) > 0.01) continue;
      state.points = pts;
      this.finalizeUpdate();
      return true;
    }
    return false;
  },

  // Local coordinates of the chain from vertex `from` to vertex `to` (walking forward),
  // keeping the interior angles strictly between them
  buildChain: function (lengths, angles, orientation, from, to) {
    const n = lengths.length;
    const pts = [{ x: 0, y: 0 }];
    let dir = 0;
    for (let k = from; ; k = (k + 1) % n) {
      if (k !== from) dir += orientation * (Math.PI - angles[k] * Math.PI / 180);
      const p = pts[pts.length - 1];
      pts.push({ x: p.x + lengths[k] * Math.cos(dir), y: p.y + lengths[k] * Math.sin(dir) });
      if ((k + 1) % n === to) break;
    }
    return pts;
  },

  // Rigidly move a local chain so its ends land on start/end
  placeChain: function (local, start, end) {
    const last = local[local.length - 1];
    const rot = Math.atan2(end.y - start.y, end.x - start.x) - Math.atan2(last.y, last.x);
    const cos = Math.cos(rot), sin = Math.sin(rot);
    return local.map(p => ({ x: start.x + p.x * cos - p.y * sin, y: start.y + p.x * sin + p.y * cos }));
  },

  // Only angles at j1, j2, j3 change; polygon = rigid chain j3→j1 + chain j1→j2 + chain j2→j3
  solveWithFreeJoints: function (lengths, angles, orientation, j1, j2, j3) {
    const state = window.AppState;
    const C = window.Calculations;
    const old = state.points;

    const main = this.buildChain(lengths, angles, orientation, j3, j1);
    const c12 = this.buildChain(lengths, angles, orientation, j1, j2);
    const c23 = this.buildChain(lengths, angles, orientation, j2, j3);
    const d12 = Math.hypot(c12[c12.length - 1].x, c12[c12.length - 1].y);
    const d23 = Math.hypot(c23[c23.length - 1].x, c23[c23.length - 1].y);

    // Keep main chain anchored at old p[j3] with the old direction of side j3
    const oldDir = C.getSideDirections(old)[j3];
    const placedMain = main.map(p => ({
      x: old[j3].x + p.x * Math.cos(oldDir) - p.y * Math.sin(oldDir),
      y: old[j3].y + p.x * Math.sin(oldDir) + p.y * Math.cos(oldDir)
    }));
    const p1 = placedMain[placedMain.length - 1];
    const p3 = placedMain[0];

    // p[j2] = intersection of circles (p1, d12) and (p3, d23), closest to old p[j2] first
    const dx = p3.x - p1.x, dy = p3.y - p1.y;
    const d = Math.hypot(dx, dy);
    if (d === 0 || d > d12 + d23 || d < Math.abs(d12 - d23)) return null;
    const along = (d12 * d12 - d23 * d23 + d * d) / (2 * d);
    const h = Math.sqrt(Math.max(0, d12 * d12 - along * along));
    const mx = p1.x + along * dx / d, my = p1.y + along * dy / d;
    const options = [
      { x: mx + h * dy / d, y: my - h * dx / d },
      { x: mx - h * dy / d, y: my + h * dx / d }
    ].sort((a, b) => C.calculateDistance(a, old[j2]) - C.calculateDistance(b, old[j2]));

    const n = lengths.length;
    for (const p2 of options) {
      const result = new Array(n);
      const put = (chain, start) => chain.forEach((p, k) => { result[(start + k) % n] = p; });
      put(placedMain, j3);
      put(this.placeChain(c12, p1, p2), j1);
      put(this.placeChain(c23, p2, p3), j2);
      if (!window.Drawing.hasSelfIntersection(result)) return result;
    }
    return null;
  },

  applyGeometry: function (lengths, angles, lockedIndex) {
    const state = window.AppState;
    const C = window.Calculations;
    const orientation = C.signedDoubleArea(state.points) >= 0 ? 1 : -1;
    const dirs = C.directionsFromAngles(angles, C.getSideDirections(state.points)[0], orientation);

    const candidates = C.solveClosure(lengths, dirs, lockedIndex);
    const found = candidates
      .map(l => C.buildPolygon(l, dirs, state.points[0]))
      .find(pts => !window.Drawing.hasSelfIntersection(pts));
    if (!found) return false;

    state.points = found;
    this.finalizeUpdate();
    return true;
  },

  finalizeUpdate: function() {
    window.Drawing.updateTransform(true);
    window.Drawing.redrawCanvas();
    window.AppState.shapeArea = window.Calculations.calculatePolygonArea(window.AppState.points);
    window.UI.updateResultText();
    document.dispatchEvent(new CustomEvent('shapeChanged'));
  }
};
