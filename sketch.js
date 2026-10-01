// 3D Pose Skeleton with BlazePose (ml5.js + p5.js WEBGL)
// Based on the idea from The Coding Train's "3D Pose Estimation with ml5.js"
// Extras: smoothing (lerp), depth coloring, floor grid, live knee angle readout.

let video;
let bodyPose;
let poses = [];
let connections;

let smoothed = [];        // smoothed 3D keypoints
const SMOOTHING = 0.3;    // 0 = frozen, 1 = no smoothing (raw, jittery)
const MIN_CONF = 0.3;     // ignore keypoints the model isn't sure about

let kneeLabel;

function preload() {
  bodyPose = ml5.bodyPose("BlazePose", { runtime: "mediapipe" });
}

// Mirror both the camera and the skeleton, like a selfie view.
// Set to false if you want the "true" (non-mirrored) view.
const MIRROR = true;

let cnv;

function setup() {
  // Skeleton canvas takes the right half of the screen
  cnv = createCanvas(windowWidth / 2, windowHeight, WEBGL);

  // Live webcam shown on the left half. To use a recorded clip instead:
  // video = createVideo("myclip.mp4"); video.loop();
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.style("object-fit", "cover");   // fill the half, crop edges if needed
  video.style("background", "#000");
  if (MIRROR) video.style("transform", "scaleX(-1)");

  bodyPose.detectStart(video, gotPoses);
  connections = bodyPose.getSkeleton();

  colorMode(HSB, 360, 100, 100, 1);

  // Knee readout floating over the skeleton half
  kneeLabel = createDiv("Waiting for a body...");
  kneeLabel.style("font-family", "monospace");
  kneeLabel.style("font-size", "18px");
  kneeLabel.style("color", "#eee");
  kneeLabel.style("padding", "8px 0");

  layout();
}

// Places the camera on the left and the skeleton on the right, 50/50
function layout() {
  const half = windowWidth / 2;

  video.position(0, 0);
  video.style("width", half + "px");
  video.style("height", windowHeight + "px");

  cnv.position(half, 0);
  kneeLabel.position(half + 16, 16);
}

function windowResized() {
  resizeCanvas(windowWidth / 2, windowHeight);
  layout();
}

function gotPoses(results) {
  poses = results;
}

function draw() {
  background(0, 0, 5);
  orbitControl();          // click + drag to rotate, scroll to zoom

  // BlazePose 3D values are in meters, roughly -1..1, centered on the hips.
  // Scale so 1 meter = half the canvas height.
  scale(height / 2);
  if (MIRROR) scale(-1, 1, 1);   // flip left/right to match the mirrored camera

  drawFloor();

  if (poses.length === 0) return;

  const raw = poses[0].keypoints3D;
  smoothKeypoints(raw);

  // Bones
  strokeWeight(3);
  for (const [a, b] of connections) {
    const pa = smoothed[a];
    const pb = smoothed[b];
    if (raw[a].confidence > MIN_CONF && raw[b].confidence > MIN_CONF) {
      stroke(190, 60, 100);
      line(pa.x, pa.y, pa.z, pb.x, pb.y, pb.z);
    }
  }

  // Joints, colored by depth (z)
  noStroke();
  for (let i = 0; i < smoothed.length; i++) {
    if (raw[i].confidence < MIN_CONF) continue;
    const p = smoothed[i];
    const hue = map(p.z, -0.5, 0.5, 0, 280, true);
    fill(hue, 80, 100);
    push();
    translate(p.x, p.y, p.z);
    sphere(0.025, 8, 6);
    pop();
  }

  updateKneeAngles(raw);
}

function smoothKeypoints(raw) {
  for (let i = 0; i < raw.length; i++) {
    const k = raw[i];
    if (!smoothed[i]) {
      smoothed[i] = { x: k.x, y: k.y, z: k.z };
    } else {
      smoothed[i].x = lerp(smoothed[i].x, k.x, SMOOTHING);
      smoothed[i].y = lerp(smoothed[i].y, k.y, SMOOTHING);
      smoothed[i].z = lerp(smoothed[i].z, k.z, SMOOTHING);
    }
  }
}

function drawFloor() {
  push();
  translate(0, 1, 0);      // about 1 m below the hips
  rotateX(HALF_PI);
  stroke(0, 0, 30);
  strokeWeight(1);
  noFill();
  const size = 2;          // 2 m x 2 m
  const step = 0.25;
  for (let v = -size / 2; v <= size / 2 + 0.001; v += step) {
    line(v, -size / 2, 0, v, size / 2, 0);
    line(-size / 2, v, 0, size / 2, v, 0);
  }
  pop();
}

// Angle at the knee between thigh and shin, in 3D.
// ~180 = straight leg, smaller = more bent.
function jointAngle(a, b, c) {
  const ba = createVector(a.x - b.x, a.y - b.y, a.z - b.z);
  const bc = createVector(c.x - b.x, c.y - b.y, c.z - b.z);
  return degrees(ba.angleBetween(bc));
}

function updateKneeAngles(raw) {
  // BlazePose indices: 23/24 hips, 25/26 knees, 27/28 ankles (left/right)
  const leftOk = [23, 25, 27].every(i => raw[i].confidence > MIN_CONF);
  const rightOk = [24, 26, 28].every(i => raw[i].confidence > MIN_CONF);

  const left = leftOk ? jointAngle(smoothed[23], smoothed[25], smoothed[27]).toFixed(0) + "°" : "--";
  const right = rightOk ? jointAngle(smoothed[24], smoothed[26], smoothed[28]).toFixed(0) + "°" : "--";

  kneeLabel.html(`Left knee: ${left} &nbsp;&nbsp; Right knee: ${right}`);
}
