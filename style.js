// Convert index to A, B, C... AA, AB...
function label(i) {
  let s = "";
  while (i >= 0) {
    s = String.fromCharCode((i % 26) + 65) + s;
    i = Math.floor(i / 26) - 1;
  }
  return s;
}

function generatePoints() {
  const container = document.getElementById("pointsContainer");
  const n = document.getElementById("numPoints").value;
  container.innerHTML = "";

  for (let i = 0; i < n; i++) {
    container.innerHTML += `
      <div class="point">
        <strong>Point ${label(i)}</strong><br>
        X: <input id="x${i}" value="${50 + i * 30}">
        Y: <input id="y${i}" value="${50 + i * 20}">
        H: <input id="h${i}" value="2500">
      </div>
    `;
  }
}

function getPoints() {
  const n = document.getElementById("numPoints").value;
  let pts = [];

  for (let i = 0; i < n; i++) {
    pts.push({
      x: parseFloat(document.getElementById(`x${i}`).value),
      y: parseFloat(document.getElementById(`y${i}`).value),
      h: parseFloat(document.getElementById(`h${i}`).value)
    });
  }

  return pts;
}

function distance(a, b) {
  return Math.sqrt(
    Math.pow(b.x - a.x, 2) +
    Math.pow(b.y - a.y, 2)
  );
}

function calculate() {
  const pts = getPoints();
  let result = "<h3>Edges:</h3>";

  let edges = [];

  for (let i = 0; i < pts.length; i++) {
    let next = (i + 1) % pts.length;
    let d = distance(pts[i], pts[next]);

    let tension = 0.1; // 10% reduction
    let adjusted = d * (1 - tension);

    edges.push({ from: i, to: next, d, adjusted });

    result += `
      ${label(i)} → ${label(next)}:
      ${d.toFixed(0)}mm → 
      <strong>${adjusted.toFixed(0)}mm</strong><br>
    `;
  }

  document.getElementById("results").innerHTML = result;

  drawCanvas(pts);
}

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

// Initialize on load
generatePoints();
