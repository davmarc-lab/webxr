import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const width = window.innerWidth;
const height = window.innerHeight;
// inizializza il renderer con eventuali parametri aggiuntivi
const renderer = new THREE.WebGLRenderer({ antialias: true });
// imposta la grandezza in pixel dell'elemento dove renderizzare la scena
renderer.setSize(width, height);

// parametri per una telecamera con proiezione prospettica
const FOV = 45;
const NEAR = 0.1;
const FAR = 100;
// inizializza la telecamera prospettica
const camera = new THREE.PerspectiveCamera(FOV, width / height, NEAR, FAR);
camera.position.z = 5;
const controls = new OrbitControls(camera, renderer.domElement);

// creazione di una scena
const scene = new THREE.Scene();

// creazione di una mesh con la geometria di un cubo
const geometry = new THREE.BoxGeometry(1, 1, 1);
// creazione di un material di colore rosso
const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const mesh = new THREE.Mesh(geometry, material);
// aggiunta della mesh alla scena
scene.add(mesh);
// aggiungo l'elemento creato dal renderer, se non specificato, alla pagina HTML
document.body.appendChild(renderer.domElement);

// definisce quale funzione eseguire ad ogni `requestAnimationFrame()`
renderer.setAnimationLoop(animate);
function animate(time) {
    // operazioni sulle mesh ad ogni frame
    // mesh.rotation.x = time / 2000;
    mesh.rotation.y = time / 1000;
    // render della scena nel canvas
    renderer.render(scene, camera);
}
