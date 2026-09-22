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

  // Side directions from interior angles, keeping side 0 direction and orientation
  directionsFromAngles: function (angles, dir0, orientation) {
    const dirs = [dir0];
    for (let k = 1; k < angles.length; k++) {
      dirs.push(dirs[k - 1] + orientation * (Math.PI - angles[k] * Math.PI / 180));
    }
    return dirs;
  },

  // Build points by walking sides from start point
  buildPolygon: function (lengths, dirs, start) {
    const pts = [{ x: start.x, y: start.y }];
    for (let k = 0; k < lengths.length - 1; k++) {
      const p = pts[k];
      pts.push({ x: p.x + lengths[k] * Math.cos(dirs[k]), y: p.y + lengths[k] * Math.sin(dirs[k]) });
    }
    return pts;
  },

  // Close the polygon exactly: with fixed directions, recompute two sides (a, b)
  // so that sum(L_k * u_k) = 0. Returns candidate length arrays, best first.
  solveClosure: function (lengths, dirs, lockedIndex) {
    const n = lengths.length;
    const u = dirs.map(d => ({ x: Math.cos(d), y: Math.sin(d) }));
    const candidates = [];

    for (let a = 0; a < n; a++) {
      for (let b = a + 1; b < n; b++) {
        if (a === lockedIndex || b === lockedIndex) continue;
        const det = u[a].x * u[b].y - u[a].y * u[b].x;
        if (Math.abs(det) < 1e-9) continue;

        let rx = 0, ry = 0;
        for (let k = 0; k < n; k++) {
          if (k === a || k === b) continue;
          rx += lengths[k] * u[k].x;
          ry += lengths[k] * u[k].y;
        }
        // Solve La * u[a] + Lb * u[b] = -R
        const La = (-rx * u[b].y + ry * u[b].x) / det;
        const Lb = (-u[a].x * ry + u[a].y * rx) / det;
        if (La <= 1e-6 || Lb <= 1e-6) continue;

        const cost = Math.abs(La - lengths[a]) / lengths[a] + Math.abs(Lb - lengths[b]) / lengths[b];
        const result = [...lengths];
        result[a] = La;
        result[b] = Lb;
        candidates.push({ cost, lengths: result });
      }
    }

    return candidates.sort((x, y) => x.cost - y.cost).map(c => c.lengths);
  }
};
