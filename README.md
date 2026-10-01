# 3D Pose Skeleton

Real-time 3D body pose tracking in the browser. Runs BlazePose through ml5.js
and renders the skeleton in 3D with p5.js (WEBGL), with smoothing, depth-based
coloring, and a live knee angle readout.

Based on the idea from [The Coding Train's "3D Pose Estimation with ml5.js"](link),
extended with smoothing, depth coloring, a floor grid, and knee angle tracking.

## What it does

- Captures your webcam and detects a 3D pose using Google's BlazePose model
- Renders the skeleton as a 3D point cloud you can rotate and zoom
- Smooths the raw keypoints so the skeleton doesn't jitter
- Colors each joint by depth (z-axis)
- Calculates and displays the knee angle in real time

## How to run it

1. Clone this repo
2. Open `index.html` in a browser (or serve it locally, e.g. `npx serve .`)
3. Allow camera access
4. Click and drag on the right half to rotate the 3D view, scroll to zoom

No build step, no install. Everything runs through the CDN-linked libraries.

## How it works

- `ml5.bodyPose("BlazePose", { runtime: "mediapipe" })` loads the pose model
- Each frame, `detectStart` returns 33 3D keypoints with a confidence score
- Keypoints below `MIN_CONF` are skipped so low-confidence detections don't jitter on screen
- `smoothKeypoints()` applies a simple lerp between frames to reduce noise
- `jointAngle()` computes the angle between three points using vector math,
  used here for the knee (hip–knee–ankle)

## Built with

- [p5.js](https://p5js.org/) for rendering
- [ml5.js](https://ml5js.org/) for running BlazePose
- [BlazePose](https://google.github.io/mediapipe/solutions/pose.html) (Google/MediaPipe) for pose detection

## Notes

This is a learning project, not a medical or clinical tool. Joint angles are
approximate and depend on camera angle, lighting, and how confidently the
model detects each point.
