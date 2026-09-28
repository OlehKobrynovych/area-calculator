// Mathematical calculations module
window.Calculations = {
  // Calculate polygon area using shoelace formula (Gauss)
  // Assumes points are in logical units (cm)
  calculatePolygonArea: function (points) {
    if (!points || points.length < 3) return 0;
    return Math.abs(this.signedDoubleArea(points)) / 2;
  },

  // Shoelace sum (2 * signed area); sign gives orientation
  signedDoubleArea: function (points) {
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];
      area += (p1.x * p2.y) - (p2.x * p1.y);
    }
    return area;
  },

  // Calculate circle area
  calculateCircleArea: function (radius) {
    return Math.PI * radius * radius;
  },

  // Calculate distance between two points
  calculateDistance: function (p1, p2) {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  },

  // Calculate material requirements
  // areaCm2: area in cm2
  // materialWidth, materialHeight: in cm
  calculateMaterialRequirements: function (areaCm2, materialWidth, materialHeight, unitsPerPack) {
    if (areaCm2 <= 0 || materialWidth <= 0 || materialHeight <= 0) return null;

    const materialArea = materialWidth * materialHeight;
    // Use a small epsilon to avoid 100.000000001 becoming 101
    const unitsNeeded = Math.ceil((areaCm2 / materialArea) - 0.00001);

    let packsNeeded = 0;
    if (unitsPerPack > 0) {
      packsNeeded = Math.ceil(unitsNeeded / unitsPerPack);
    }

    return {
      unitsNeeded,
      packsNeeded
    };
  },

  // Check if two line segments (p1, p2) and (p3, p4) intersect
  doSegmentsIntersect: function (p1, p2, p3, p4) {
    function ccw(A, B, C) {
      return (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x);
    }
    return (
      ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4)
    );
  },

  // Side i goes from point i to point i+1
  getSideLengths: function (points) {
    return points.map((p, i) => this.calculateDistance(p, points[(i + 1) % points.length]));
  },

  // Direction (radians) of each side
  getSideDirections: function (points) {
    return points.map((p, i) => {
      const q = points[(i + 1) % points.length];
      return Math.atan2(q.y - p.y, q.x - p.x);
    });
  },

  // Interior angle (degrees) at each vertex i, between side i-1 and side i
  getInteriorAngles: function (points) {
    const n = points.length;
    const s = this.signedDoubleArea(points) >= 0 ? 1 : -1;
    const dirs = this.getSideDirections(points);
    return dirs.map((d, i) => {
      let turn = d - dirs[(i - 1 + n) % n];
      while (turn > Math.PI) turn -= 2 * Math.PI;
      while (turn <= -Math.PI) turn += 2 * Math.PI;
      return (Math.PI - s * turn) * 180 / Math.PI;
    });
  },

  // Max area for given sides: the polygon inscribed in a circle.
  // Returns {area, angles (deg)} or null if the sides can't form a polygon.
  getMaxAreaShape: function (lengths) {
    const n = lengths.length;
    const total = lengths.reduce((s, l) => s + l, 0);
    const maxIdx = lengths.indexOf(Math.max(...lengths));
    const M = lengths[maxIdx];
    if (n < 3 || M >= total - M - 1e-9) return null;

    const theta = (R, l) => 2 * Math.asin(Math.min(1, l / (2 * R)));
    const sumTheta = R => lengths.reduce((s, l) => s + theta(R, l), 0);
    // Center inside the polygon if the arcs at the smallest radius already cover the circle
    const inside = sumTheta(M / 2) >= 2 * Math.PI;
    const h = inside
      ? R => sumTheta(R) - 2 * Math.PI
      : R => sumTheta(R) - 2 * theta(R, M);

    let lo = M / 2, hi = M;
    const sLo = Math.sign(h(lo));
    while (Math.sign(h(hi)) === sLo && hi < 1e12) hi *= 2;
    for (let k = 0; k < 200; k++) {
      const mid = (lo + hi) / 2;
      if (Math.sign(h(mid)) === sLo) lo = mid; else hi = mid;
    }
    const R = (lo + hi) / 2;

    // Longest side's triangle is subtracted when the center is outside
    const sign = lengths.map((l, i) => (!inside && i === maxIdx ? -1 : 1));
    const th = lengths.map(l => theta(R, l));
    const area = th.reduce((s, t, i) => s + sign[i] * R * R * Math.sin(t) / 2, 0);
    const half = th.map((t, i) => sign[i] * (Math.PI - t) / 2);
    const angles = half.map((c, i) => (half[(i - 1 + n) % n] + c) * 180 / Math.PI);
    return { area, angles };
  },

  // Clip polygon to half-plane a*x + b*y <= c (Sutherland–Hodgman step)
  clipHalfPlane: function (pts, a, b, c) {
    const out = [];
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i], q = pts[(i + 1) % pts.length];
      const dp = a * p.x + b * p.y - c, dq = a * q.x + b * q.y - c;
      if (dp <= 0) out.push(p);
      if ((dp < 0 && dq > 0) || (dp > 0 && dq < 0)) {
        const t = dp / (dp - dq);
        out.push({ x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t });
      }
    }
    return out;
  },

  // Tiles of a w×h grid (axis-aligned, origin ox/oy) that overlap the polygon
  countGridTiles: function (pts, w, h, ox, oy, box, collect) {
    const eps = w * h * 1e-6;
    let full = 0, cut = 0;
    const tiles = [];
    const j0 = Math.floor((box.minY - oy) / h), j1 = Math.ceil((box.maxY - oy) / h);
    for (let j = j0; j < j1; j++) {
      const y0 = oy + j * h;
      let row = this.clipHalfPlane(pts, 0, -1, -y0);
      row = this.clipHalfPlane(row, 0, 1, y0 + h);
      if (row.length < 3 || this.calculatePolygonArea(row) < eps) continue;
      let rMin = Infinity, rMax = -Infinity;
      row.forEach(p => { rMin = Math.min(rMin, p.x); rMax = Math.max(rMax, p.x); });
      for (let i = Math.floor((rMin - ox) / w); i < Math.ceil((rMax - ox) / w); i++) {
        const x0 = ox + i * w;
        let cell = this.clipHalfPlane(row, -1, 0, -x0);
        cell = this.clipHalfPlane(cell, 1, 0, x0 + w);
        if (cell.length < 3) continue;
        const a = this.calculatePolygonArea(cell);
        if (a < eps) continue;
        const isFull = a > w * h - eps * 10;
        if (isFull) full++; else cut++;
        if (collect) tiles.push({ x: x0, y: y0, full: isFull });
      }
    }
    return { full, cut, count: full + cut, tiles };
  },

  // Best placement of w×h tiles covering the polygon: tries grid rotations along the
  // sides and several offsets, minimizing the number of tiles (offcuts are not reused).
  // Returns {count, full, cut, tiles: [{corners: [4 points], full}]} or null if too many tiles.
  getTileLayout: function (points, w, h) {
    const area = this.calculatePolygonArea(points);
    if (!(area > 0) || !(w > 0) || !(h > 0)) return null;

    // Grid angles: 0 and each side direction (mod 90°)
    const angles = [0];
    this.getSideDirections(points).forEach(d => {
      const a = ((d % (Math.PI / 2)) + Math.PI / 2) % (Math.PI / 2);
      if (!angles.some(b => Math.abs(a - b) < 1e-3 || Math.abs(a - b) > Math.PI / 2 - 1e-3)) angles.push(a);
    });
    const sizes = w === h ? [[w, h]] : [[w, h], [h, w]];

    // Keep the work bounded for tiny tiles on large shapes
    let box0 = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
    points.forEach(p => {
      box0.minX = Math.min(box0.minX, p.x); box0.maxX = Math.max(box0.maxX, p.x);
      box0.minY = Math.min(box0.minY, p.y); box0.maxY = Math.max(box0.maxY, p.y);
    });
    const diag = Math.hypot(box0.maxX - box0.minX, box0.maxY - box0.minY);
    const tilesPerTry = (diag + w + h) * (diag + w + h) / (w * h);
    if (tilesPerTry > 200000) return null;
    const steps = tilesPerTry * angles.length * sizes.length * 25 > 400000 ? 1 : 4;

    let best = null;
    for (const t of angles) {
      const cos = Math.cos(t), sin = Math.sin(t);
      // Polygon in the grid frame
      const rot = points.map(p => ({ x: p.x * cos + p.y * sin, y: -p.x * sin + p.y * cos }));
      const box = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
      rot.forEach(p => {
        box.minX = Math.min(box.minX, p.x); box.maxX = Math.max(box.maxX, p.x);
        box.minY = Math.min(box.minY, p.y); box.maxY = Math.max(box.maxY, p.y);
      });
      for (const [tw, th] of sizes) {
        // Offsets: grid aligned to min / max edge, plus fractions of a tile
        const oxs = [box.minX, box.maxX], oys = [box.minY, box.maxY];
        for (let k = 1; k < steps; k++) {
          oxs.push(box.minX + k * tw / steps);
          oys.push(box.minY + k * th / steps);
        }
        for (const ox of oxs)
          for (const oy of oys) {
            const r = this.countGridTiles(rot, tw, th, ox, oy, box, false);
            if (!best || r.count < best.count || (r.count === best.count && r.full > best.full))
              best = { ...r, t, tw, th, ox, oy, box, rot };
          }
      }
    }

    // Tile corners back in shape coordinates
    const { tiles } = this.countGridTiles(best.rot, best.tw, best.th, best.ox, best.oy, best.box, true);
    const cos = Math.cos(best.t), sin = Math.sin(best.t);
    const back = (x, y) => ({ x: x * cos - y * sin, y: x * sin + y * cos });
    return {
      count: best.count,
      full: best.full,
      cut: best.cut,
      tiles: tiles.map(tl => ({
        full: tl.full,
        corners: [back(tl.x, tl.y), back(tl.x + best.tw, tl.y),
                  back(tl.x + best.tw, tl.y + best.th), back(tl.x, tl.y + best.th)]
      }))
    };
  }
};
