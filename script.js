// Label generator A, B, C... AA, AB...
function label(i) {
  let s = "";
  while (i >= 0) {
    s = String.fromCharCode((i % 26) + 65) + s;
    i = Math.floor(i / 26) - 1;
  }
  return s;
}

// Generate input fields
function generatePoints() {
  const container = document.getElementById("pointsContainer");
  const n = parseInt(document.getElementById("numPoints").value);

  if (n !== 3) {
    container.innerHTML = "⚠️ Currently supports 3-point sails only";
    return;
  }

  container.innerHTML = `
    <h3>Measurements (mm)</h3>

    AB: <input id="ab" value="5000"><br>
    AC: <input id="ac" value="4500"><br>
    BC: <input id="bc" value="4800"><br>

    <h3>Heights</h3>

    Datum:
    <select id="datum">
      <option value="0">A</option>
      <option value="1">B</option>
      <option value="2">C</option>
    </select><br><br>

    A: <input id="h0" value="0"><br>
    B: <input id="h1" value="1000"><br>
    C: <input id="h2" value="300"><br>
  `;
}


// Get points safely
function getPoints() {
  const n = parseInt(document.getElementById("numPoints").value);
  let pts = [];

  for (let i = 0; i < n; i++) {
    let x = parseFloat(document.getElementById(`x${i}`).value);
    let y = parseFloat(document.getElementById(`y${i}`).value);
    let h = parseFloat(document.getElementById(`h${i}`).value);

    if (isNaN(x) || isNaN(y) || isNaN(h)) {
      alert(`Invalid input at Point ${label(i)}`);
      return null;
    }

    pts.push({ x, y, h });
  }

  return pts;
}

// 2D distance
function distance(a, b) {
  return Math.sqrt(
    (b.x - a.x) ** 2 +
    (b.y - a.y) ** 2
  );
}

// Choose tension based on size
function getTensionFactor(length) {
  if (length < 4000) return 0.08;
  if (length < 7000) return 0.10;
  return 0.12;
}

// Calculate diagonals (important for 4+ points)
function calculateDiagonals(pts) {
  let diagonals = [];

  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 2; j < pts.length; j++) {
      if (!(i === 0 && j === pts.length - 1)) {
        diagonals.push({
          from: i,
          to: j,
          d: distance(pts[i], pts[j])
        });
      }
    }
  }

  return diagonals;
}

// Height validation (twist check)
function checkHeights(pts) {
  let heights = pts.map(p => p.h);
  let max = Math.max(...heights);
  let min = Math.min(...heights);

  let diff = max - min;

  if (diff < 200) {
    return "⚠️ Warning: Very low height variation → risk of water pooling";
  }

  if (diff < 400) {
    return "⚠️ Moderate height variation → may need adjustment";
  }

  return "✅ Good height variation for tensioned sail";
}

// Hardware suggestion
function hardwareSuggestion(maxSpan) {
  let suggestion = "";

  if (maxSpan < 4000) {
    suggestion = `
      Turnbuckle: M8<br>
      Shackles: 8mm<br>
      Eye bolts: M10
    `;
  } else if (maxSpan < 6000) {
    suggestion = `
      Turnbuckle: M10<br>
      Shackles: 10mm<br>
      Eye bolts: M12
    `;
  } else {
    suggestion = `
      Turnbuckle: M12<br>
      Shackles: 12mm<br>
      Eye bolts: M12–M16
    `;
  }

  return suggestion;
}

// Main calculation
function calculate() {
  let ab = parseFloat(document.getElementById("ab").value);
  let ac = parseFloat(document.getElementById("ac").value);
  let bc = parseFloat(document.getElementById("bc").value);

  let datumIndex = parseInt(document.getElementById("datum").value);

  let heights = [
    parseFloat(document.getElementById("h0").value),
    parseFloat(document.getElementById("h1").value),
    parseFloat(document.getElementById("h2").value)
  ];

  if ([ab, ac, bc].some(isNaN)) {
    alert("Invalid measurements");
    return;
  }

  // Normalize heights (datum = 0)
  let datumHeight = heights[datumIndex];
  heights = heights.map(h => h - datumHeight);

  // 3D distances (accounts for height difference)
  function adjustedLength(base, h1, h2) {
    let dz = h2 - h1;
    return Math.sqrt(base * base + dz * dz);
  }

  let AB_3D = adjustedLength(ab, heights[0], heights[1]);
  let AC_3D = adjustedLength(ac, heights[0], heights[2]);
  let BC_3D = adjustedLength(bc, heights[1], heights[2]);

  // Apply tension reduction
  function tension(length) {
    if (length < 4000) return 0.08;
    if (length < 7000) return 0.10;
    return 0.12;
  }

  function adjusted(length) {
    let t = tension(length);
    return length * (1 - t);
  }

  let result = `
    <h3>3D Edge Lengths</h3>

    AB: ${AB_3D.toFixed(0)} → <strong>${adjusted(AB_3D).toFixed(0)}</strong><br>
    AC: ${AC_3D.toFixed(0)} → <strong>${adjusted(AC_3D).toFixed(0)}</strong><br>
    BC: ${BC_3D.toFixed(0)} → <strong>${adjusted(BC_3D).toFixed(0)}</strong><br>
  `;

  // Height check
  let maxH = Math.max(...heights);
  let minH = Math.min(...heights);
  let diff = maxH - minH;

  result += "<h3>Height Check</h3>";

  if (diff < 200) {
    result += "⚠️ Too flat (water pooling risk)";
  } else if (diff < 400) {
    result += "⚠️ Low variation";
  } else {
    result += "✅ Good tension shape";
  }

  // Hardware suggestion
  let maxSpan = Math.max(AB_3D, AC_3D, BC_3D);

  result += "<h3>Hardware</h3>";

  if (maxSpan < 4000) {
    result += "M8 Turnbuckle / M10 Eye Bolt";
  } else if (maxSpan < 6000) {
    result += "M10 Turnbuckle / M12 Eye Bolt";
  } else {
    result += "M12 Turnbuckle / M12–M16 Eye Bolt";
  }

  document.getElementById("results").innerHTML = result;

  drawTriangle(ab, ac, bc);
}

// Draw layout
function drawTriangle(ab, ac, bc) {
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Place A at origin
  let A = { x: 50, y: 200 };

  // Place B horizontally
  let B = { x: A.x + ab / 20, y: A.y };

  // Calculate C using triangle math
  let cosC = (ab*ab + ac*ac - bc*bc) / (2 * ab * ac);
  let angle = Math.acos(cosC);

  let C = {
    x: A.x + (ac / 20) * Math.cos(angle),
    y: A.y - (ac / 20) * Math.sin(angle)
  };

  // Draw triangle
  ctx.beginPath();
  ctx.moveTo(A.x, A.y);
  ctx.lineTo(B.x, B.y);
  ctx.lineTo(C.x, C.y);
  ctx.closePath();
  ctx.stroke();

  // Labels
  ctx.fillText("A", A.x, A.y);
  ctx.fillText("B", B.x, B.y);
  ctx.fillText("C", C.x, C.y);
}
// Init() 
 generatePoints(); 
