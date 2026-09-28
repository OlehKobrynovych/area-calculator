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

  // Apply user-entered values: sides {index: cm}, angles {index: degrees}.
  // All sides and entered angles are kept; other angles change to close the shape,
  // nearest vertices after `start` first, wrapping around.
  // Returns false if impossible (shape stays unchanged).
  applyEdits: function (sides, angles, start) {
    const state = window.AppState;
    const n = state.points ? state.points.length : 0;
    if (n < 3) return false;

    const C = window.Calculations;
    const lengths = C.getSideLengths(state.points);
    const targetAngles = C.getInteriorAngles(state.points);
    for (const i in sides) {
      if (!(sides[i] > 0)) return false;
      lengths[i] = sides[i];
    }
    for (const i in angles) {
      if (!(angles[i] > 0 && angles[i] < 360)) return false;
      targetAngles[i] = angles[i];
    }

    const order = [];
    for (let k = 0; k < n; k++) {
      const v = (start + k) % n;
      if (!(v in angles)) order.push(v);
    }
    return this.closeByAngles(lengths, targetAngles, order);
  },

  // With fixed sides exactly 3 angles must change to close the polygon.
  // Tries free vertices from `order` (earlier = preferred); all other angles are kept.
  closeByAngles: function (lengths, angles, order) {
    const state = window.AppState;
    const C = window.Calculations;
    const orientation = C.signedDoubleArea(state.points) >= 0 ? 1 : -1;

    for (let c = 2; c < order.length; c++)
      for (let b = 1; b < c; b++)
        for (let a = 0; a < b; a++) {
          // `order` is already cyclic, as solveWithFreeJoints needs
          const j1 = order[a], j2 = order[b], j3 = order[c];
          const pts = this.solveWithFreeJoints(lengths, angles, orientation, j1, j2, j3);
          if (!pts || window.Drawing.hasSelfIntersection(pts)) continue;
          const got = C.getInteriorAngles(pts);
          const kept = angles.every((ang, k) =>
            k === j1 || k === j2 || k === j3 || Math.abs(got[k] - ang) < 0.01);
          if (!kept) continue;
          state.points = pts;
          this.finalizeUpdate();
          return true;
        }
    return false;
  },

  // Min area among convex shapes with given sides and every angle in [minAngle, 180°].
  // At the minimum all angles but 3 sit on a bound (convexity allows at most 2 at minAngle);
  // the 3 free ones form a rigid triangle of chords. Returns {area, angles (deg)} or null.
  getMinAreaShape: function (lengths, minAngle) {
    // Depends only on sides: cache so angle edits don't recompute
    const key = lengths.map(l => l.toFixed(4)).join(",") + "|" + minAngle;
    if (this._minAreaCache && this._minAreaCache.key === key) return this._minAreaCache.result;

    const C = window.Calculations;
    const n = lengths.length;
    const tol = 1e-6;
    let best = null;

    for (let j1 = 0; j1 < n; j1++)
      for (let j2 = j1 + 1; j2 < n; j2++)
        for (let j3 = j2 + 1; j3 < n; j3++) {
          const fixed = [];
          for (let k = 0; k < n; k++) if (k !== j1 && k !== j2 && k !== j3) fixed.push(k);
          // Vertices at minAngle: none, one or two of the fixed ones; the rest are 180°
          const sharp = [[]];
          fixed.forEach((a, x) => {
            sharp.push([a]);
            fixed.slice(x + 1).forEach(b => sharp.push([a, b]));
          });

          for (const s of sharp) {
            const angles = new Array(n).fill(180);
            s.forEach(k => { angles[k] = minAngle; });
            const c12 = this.buildChain(lengths, angles, 1, j1, j2);
            const c23 = this.buildChain(lengths, angles, 1, j2, j3);
            const c31 = this.buildChain(lengths, angles, 1, j3, j1);
            const end = c => Math.hypot(c[c.length - 1].x, c[c.length - 1].y);
            const d12 = end(c12), d23 = end(c23), d31 = end(c31);
            if (d12 > d23 + d31 || d23 > d12 + d31 || d31 > d12 + d23) continue;
            // Chord triangle is part of a convex shape, so its area is a lower bound
            const hs = (d12 + d23 + d31) / 2;
            const triArea = Math.sqrt(Math.max(0, hs * (hs - d12) * (hs - d23) * (hs - d31)));
            if (best && triArea >= best.area) continue;

            const x = (d12 * d12 + d31 * d31 - d23 * d23) / (2 * d12);
            const y = Math.sqrt(Math.max(0, d31 * d31 - x * x));
            for (const sy of [1, -1]) {
              const p1 = { x: 0, y: 0 }, p2 = { x: d12, y: 0 }, p3 = { x, y: sy * y };
              const pts = new Array(n);
              const put = (chain, start) => chain.forEach((p, k) => { pts[(start + k) % n] = p; });
              put(this.placeChain(c12, p1, p2), j1);
              put(this.placeChain(c23, p2, p3), j2);
              put(this.placeChain(c31, p3, p1), j3);

              const got = C.getInteriorAngles(pts);
              const sum = got.reduce((t, a) => t + a, 0);
              if (Math.abs(sum - (n - 2) * 180) > 0.01) continue;
              if (got.some(a => a < minAngle - tol || a > 180 + tol)) continue;
              if (fixed.some(k => Math.abs(got[k] - angles[k]) > 0.01)) continue;

              const area = C.calculatePolygonArea(pts);
              if (!best || area < best.area) best = { area, angles: got };
            }
          }
        }
    this._minAreaCache = { key, result: best };
    return best;
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

  finalizeUpdate: function() {
    window.Drawing.updateTransform(true);
    window.Drawing.redrawCanvas();
    window.AppState.shapeArea = window.Calculations.calculatePolygonArea(window.AppState.points);
    window.UI.updateResultText();
    document.dispatchEvent(new CustomEvent('shapeChanged'));
  }
};
