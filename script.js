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

  container.innerHTML = "";

  for (let i = 0; i < n; i++) {
    container.innerHTML += `
      <div class="point">
        <strong>Point ${label(i)}</strong><br>
        X: <input id="x${i}" value="${100 + i * 500}">
        Y: <input id="y${i}" value="${100 + i * 300}">
        H: <input id="h${i}" value="${2500}">
      </div>
    `;
  }
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
  const pts = getPoints();
  if (!pts) return;

  let result = "<h3>Edge Lengths (Adjusted)</h3>";

  let maxSpan = 0;

  // Edges
  for (let i = 0; i < pts.length; i++) {
    let next = (i + 1) % pts.length;

    let d = distance(pts[i], pts[next]);
    let tension = getTensionFactor(d);
    let adjusted = d * (1 - tension);

    if (d > maxSpan) maxSpan = d;

    result += `
      ${label(i)} → ${label(next)}:
      ${d.toFixed(0)}mm → 
      <strong>${adjusted.toFixed(0)}mm</strong>
      (${(tension * 100).toFixed(0)}% reduction)<br>
    `;
  }

  // Diagonals
  if (pts.length >= 4) {
    let diagonals = calculateDiagonals(pts);

    result += "<h3>Diagonals</h3>";

    diagonals.forEach(d => {
      result += `
        ${label(d.from)} → ${label(d.to)}:
        ${d.d.toFixed(0)}mm<br>
      `;
    });
  }

  // Height check
  result += "<h3>Height Check</h3>";
  result += checkHeights(pts);

  // Hardware
  result += "<h3>Hardware Suggestion</h3>";
  result += hardwareSuggestion(maxSpan);

  document.getElementById("results").innerHTML = result;

  drawCanvas(pts);
}

// Draw layout
function drawCanvas(pts) {
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  let maxX = Math.max(...pts.map(p => p.x));
  let maxY = Math.max(...pts.map(p => p.y));

  let scale = 250 / Math.max(maxX, maxY);

  ctx.beginPath();

  pts.forEach((p, i) => {
    let x = p.x * scale + 20;
    let y = p.y * scale + 20;

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);

    ctx.fillText(label(i), x + 5, y + 5);
  });

  ctx.closePath();
  ctx.stroke();

  pts.forEach(p => {
    let x = p.x * scale + 20;
    let y = p.y * scale + 20;

    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  });
}

// Init
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
