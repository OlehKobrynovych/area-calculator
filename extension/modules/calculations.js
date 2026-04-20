// Mathematical calculations module
window.Calculations = {
  // Calculate polygon area using shoelace formula (Gauss)
  // Assumes points are in logical units (cm)
  calculatePolygonArea: function (points) {
    if (!points || points.length < 3) return 0;
    
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];
      area += (p1.x * p2.y) - (p2.x * p1.y);
    }
    return Math.abs(area) / 2;
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

  // Resolve self-intersections using 2-opt swap
  resolveIntersections: function (points) {
    let pts = [...points];
    let improved = true;
    let iterations = 0;
    const maxIterations = 50;

    while (improved && iterations < maxIterations) {
      improved = false;
      iterations++;
      const n = pts.length;

      for (let i = 0; i < n; i++) {
        for (let j = i + 2; j < n; j++) {
          if (i === 0 && j === n - 1) continue;

          const p1 = pts[i];
          const p2 = pts[(i + 1) % n];
          const p3 = pts[j];
          const p4 = pts[(j + 1) % n];

          if (this.doSegmentsIntersect(p1, p2, p3, p4)) {
            const segmentToReverse = pts.slice(i + 1, j + 1);
            segmentToReverse.reverse();
            pts.splice(i + 1, j - i, ...segmentToReverse);
            improved = true;
            break;
          }
        }
        if (improved) break;
      }
    }
    return pts;
  },

  // Find intersection of two circles (used to preserve side lengths while changing angles)
  findCircleIntersection: function (p1, p3, R1, R2, prevP2) {
    const dx = p3.x - p1.x;
    const dy = p3.y - p1.y;
    const d = Math.sqrt(dx * dx + dy * dy);

    if (d > R1 + R2) {
      // Circles too far apart, place p2 on line between p1 and p3
      const ratio = R1 / d;
      return { point: { x: p1.x + dx * ratio, y: p1.y + dy * ratio } };
    }
    if (d < Math.abs(R1 - R2)) {
      // One circle inside another, place p2 on line
      const ratio = R1 / d;
      return { point: { x: p1.x + dx * ratio, y: p1.y + dy * ratio } };
    }

    const a = (R1 * R1 - R2 * R2 + d * d) / (2 * d);
    const h = Math.sqrt(Math.max(0, R1 * R1 - a * a));
    const x2 = p1.x + (a * dx) / d;
    const y2 = p1.y + (a * dy) / d;

    const paX = x2 + (h * dy) / d;
    const paY = y2 - (h * dx) / d;
    const pbX = x2 - (h * dy) / d;
    const pbY = y2 + (h * dx) / d;

    const d1 = Math.sqrt(Math.pow(paX - prevP2.x, 2) + Math.pow(paY - prevP2.y, 2));
    const d2 = Math.sqrt(Math.pow(pbX - prevP2.x, 2) + Math.pow(pbY - prevP2.y, 2));

    return { point: d1 < d2 ? { x: paX, y: paY } : { x: pbX, y: pbY } };
  },

  // Solve for coordinates of a cyclic polygon (max area for given side lengths)
  solveCyclicPolygon: function(lengths) {
    const n = lengths.length;
    if (n < 3) return [];

    const maxL = Math.max(...lengths);
    const sumL = lengths.reduce((a, b) => a + b, 0);

    // Geometry check: no side can be longer than the sum of others
    if (maxL >= sumL - maxL) {
        return null; // Impossible to form a closed polygon
    }

    // Solve for circumradius R using Bisection method
    // sum(2 * asin(Li / 2R)) = 2 * PI
    let low = maxL / 2;
    let high = sumL / 2;
    let R = high;

    for (let i = 0; i < 40; i++) {
      R = (low + high) / 2;
      let sumAngles = 0;
      for (let l of lengths) {
        sumAngles += 2 * Math.asin(Math.min(1, l / (2 * R)));
      }
      if (sumAngles > 2 * Math.PI) low = R;
      else high = R;
    }

    // Place points on the circle
    const points = [];
    let currentAngle = 0;
    for (let l of lengths) {
      points.push({
        x: R * Math.cos(currentAngle),
        y: R * Math.sin(currentAngle)
      });
      currentAngle += 2 * Math.asin(Math.min(1, l / (2 * R)));
    }

    return points;
  }
};
