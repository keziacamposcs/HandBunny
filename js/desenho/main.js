import { drawHandLandmarks, clearCanvas } from './drawingModule.js';
import { onResults, initializeHandDetection } from './handDetectionModule.js';
import { initializeCamera } from './cameraModule.js';
import { setupEventListeners } from './eventListenersModule.js';

const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');
const canvasQuadro = document.getElementById('quadro');
const ctx = canvasQuadro.getContext('2d');

const hands = initializeHandDetection(videoElement, (results) => onResults(results, canvasCtx, canvasElement, canvasQuadro, ctx));
const camera = initializeCamera(videoElement, hands);
camera.start();

setupEventListeners(canvasQuadro, ctx);
