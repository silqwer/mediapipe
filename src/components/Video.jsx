import React, { useRef } from "react";
import { Camera } from "@mediapipe/camera_utils";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import { HAND_CONNECTIONS, Hands } from "@mediapipe/hands";
import { useEffect } from "react";
import * as THREE from "three";

const Video = () => {
  let camera, scene, renderer;
  const threeContainer = useRef(null);
  const meshViewerContainer = useRef(null);

  window.THREE = THREE;

  const geometry = new THREE.BoxGeometry(200, 200, 200);
  const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  const mesh = new THREE.Mesh(geometry, material);

  let depth, vFOV, cameraVisibleHeight, cameraVisibleWidth, meshViewer;
  let myVector = new THREE.Vector3();

  const init = () => {
    camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      1,
      1000
    );
    camera.position.z = 400;

    depth = camera.position.z;
    vFOV = (camera.fov * Math.PI) / 180;

    cameraVisibleHeight = 2 * Math.tan(vFOV / 2) * Math.abs(depth);
    cameraVisibleWidth = cameraVisibleHeight * camera.aspect;

    myVector.project(camera);
    myVector.x = ((myVector.x + 1) * window.innerWidth) / 2;
    myVector.y = (-(myVector.y - 1) * window.innerHeight) / 2;
    myVector.z = 0;
    scene = new THREE.Scene();

    scene.add(mesh);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    threeContainer.current.appendChild(renderer.domElement);

    meshViewer = new window.MeshViewer(meshViewerContainer.current, {});
    console.log(meshViewer);
  };

  const animate = () => {
    requestAnimationFrame(animate);

    mesh.rotation.x += 0.005;
    mesh.rotation.y += 0.01;

    renderer.render(scene, camera);
  };

  useEffect(() => {
    init();
    animate();
    console.log(mesh);
    const videoElement = document.getElementsByClassName("input_video")[0];
    const canvasElement = document.getElementsByClassName("output_canvas")[0];
    const canvasCtx = canvasElement.getContext("2d");

    const onResults = (results) => {
      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
      canvasCtx.drawImage(
        results.image,
        0,
        0,
        canvasElement.width,
        canvasElement.height
      );

      // canvasCtx.beginPath();
      // canvasCtx.arc(100, 75, 50, 0, 2 * Math.PI);
      // canvasCtx.stroke();

      if (results.multiHandLandmarks) {
        for (const landmarks of results.multiHandLandmarks) {
          drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
            color: "#00FF00",
            lineWidth: 5,
          });
          drawLandmarks(canvasCtx, landmarks, {
            color: "#FF0000",
            lineWidth: 2,
          });
        }

        for (const landmarks of results.multiHandLandmarks) {
          const x = landmarks[8].x * canvasElement.width;
          const y = landmarks[8].y * canvasElement.height;
          canvasCtx.beginPath();
          canvasCtx.arc(x, y, 50, 0, 2 * Math.PI);
          canvasCtx.stroke();

          mesh.position.x = x;
          mesh.position.y = y;

          console.log(landmarks[8].x);
        }

        for (const landmarks of results.multiHandLandmarks) {
          const x =
            cameraVisibleWidth -
            landmarks[8].x * cameraVisibleWidth -
            0.5 * cameraVisibleWidth;
          const y =
            cameraVisibleHeight -
            landmarks[8].y * cameraVisibleHeight -
            0.5 * cameraVisibleHeight;

          const z = -(landmarks[8].z * cameraVisibleWidth);
          mesh.position.x = x;
          mesh.position.y = y;
          mesh.position.z = z;
        }

        // 맨 왼쪽이 0, 오른쪽이 1
      }
      canvasCtx.restore();
    };

    const hands = new Hands({
      locateFile: (file) => {
        console.log("hand file:", file);
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      },
    });

    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    hands.onResults(onResults);

    const camera = new Camera(videoElement, {
      onFrame: async () => {
        await hands.send({ image: videoElement });
      },
      width: 1280,
      height: 720,
    });
    camera.start();
  }, []);

  return (
    <>
      <video className="input_video"></video>
      <canvas className="output_canvas" width="1280px" height="720px"></canvas>
      <div
        ref={threeContainer}
        className="three_container"
        width="1280px"
        height="720px"
      />
      <div
        ref={meshViewerContainer}
        className="three_container"
        width="1280px"
        height="720px"
      />
    </>
  );
};

export default Video;
