import * as THREE from '../three/build/three.module.js';
import { shape } from './shape.js';
import { shapeParameters } from './shapeParameters.js';
import { cutComputeShader } from './cutComputeShader.js';
import { point } from './point.js';
import { fragment } from './fragment.js';
import { Mathf } from './Mathf.js';



import { OBJLoader } from '../three/examples/jsm/loaders/OBJLoader.js';
import { BasisTextureLoader } from '../three/examples/jsm/loaders/BasisTextureLoader.js';

const Deg2Rad = 0.01745329222;
var appId;
var url;

function getQueryString(name) {
    let reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
    let r = window.location.search.substr(1).match(reg);
    if (r != null) {
        return decodeURIComponent(r[2]);
    };
    return null;
}

var renderer, width, height, canvas_warp;

function initRender() {
    canvas_warp = document.getElementById('canvas-frame');
    width = canvas_warp.clientWidth;
    height = canvas_warp.clientHeight;
    renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
    });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize(width, height);
    canvas_warp.appendChild(renderer.domElement);
    renderer.setClearColor(0x000000, 0.0);

}

var pointPool = [];
var currentPoint;
var fragmentPool = [[], [], []];
var shapePool = [];
var geometryPool = [];
var objPool = [[], [], []];
var objUv2Pool = [];

var loader, basisloader;

var frontMap, backMap, shapeMask;

function load() {
    loader = new OBJLoader();
    objUv2Pool.length = 3;
    objPool[0].length = 90;
    for (let i = 1; i <= 90; i++) {
        loader.load('../obj/DodecagonShape/DodecagonShape_'.concat(i.toString()).concat('.obj'), function (object) {
            object.traverse(function (child) {
                if (child.isMesh) {
                    objPool[0][i - 1] = child.geometry;
                }
            });
        });
    }
    loader.load('../obj/DodecagonShape_uv.obj', function (object) {
        object.traverse(function (child) {
            if (child.isMesh) {
                objUv2Pool[0] = child.geometry.attributes.uv;
            }
        });
    });

    objPool[1].length = 90;
    for (let i = 1; i <= 90; i++) {
        loader.load('../obj/OctagonShape/OctagonShape_'.concat(i.toString()).concat('.obj'), function (object) {
            object.traverse(function (child) {
                if (child.isMesh) {
                    objPool[1][i - 1] = child.geometry;
                }
            });
        });
    }
    loader.load('../obj/OctagonShape_uv.obj', function (object) {
        object.traverse(function (child) {
            if (child.isMesh) {
                objUv2Pool[1] = child.geometry.attributes.uv;
            }
        });
    });

    objPool[2].length = 90;
    for (let i = 1; i <= 90; i++) {
        loader.load('../obj/DecagonShape/DecagonShape_'.concat(i.toString()).concat('.obj'), function (object) {
            object.traverse(function (child) {
                if (child.isMesh) {
                    objPool[2][i - 1] = child.geometry;
                }
            });
        });
    }
    loader.load('../obj/DecagonShape_uv.obj', function (object) {
        object.traverse(function (child) {
            if (child.isMesh) {
                objUv2Pool[2] = child.geometry.attributes.uv;
            }
        });
    });

    basisloader = new BasisTextureLoader();
    basisloader.setTranscoderPath('../three/examples/js/libs/basis/');
    basisloader.detectSupport(renderer);
    frontMap = basisloader.load("../basis/front.basis");
    backMap = basisloader.load("../basis/back.basis");
    shapeMask = basisloader.load("../basis/shapeMask.basis");
}

var camera, camera_width, camera_height;

function initCamera() {
    camera = new THREE.PerspectiveCamera(60, width / height, 1, 1000);
    camera.position.x = 0;
    camera.position.y = 0;
    camera.position.z = 20;
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    camera_height = Math.tan(camera.fov * 0.5 * Deg2Rad) * camera.position.z * 2;
    camera_width = camera_height * camera.aspect;
}

var scene, clock;

function initScene() {
    scene = new THREE.Scene();
    clock = new THREE.Clock();

    // const geometry = new THREE.PlaneGeometry(20, 20);
    // const material = new THREE.MeshStandardMaterial({ color: 0xffff00, side: THREE.DoubleSide });
    // const plane = new THREE.Mesh(geometry, material);
    // plane.rotation.set(0, 0, 0);
    // plane.position.set(0, 0, -5);
    // plane.receiveShadow = true;
    // scene.add(plane);

    // const controls = new OrbitControls(camera, renderer.domElement);

    // const params = {
    //     Rotation: 0,
    //     ZPos: 0
    // };
    // const gui = new GUI();
    // const folder = gui.addFolder('Test');

    // folder.add(params, 'Rotation', 0, 90).step(0.01).onChange(function (value) {

    //     mainShape.shape.rotation.set(-value * Deg2Rad, 0, 0);

    // });
    // folder.add(params, 'ZPos', -10, 10).step(0.01).onChange(function (value) {

    //     mainShape.shape.position.set(0, 0, -value);
    //     plane.position.set(0, 0, -5 - value);

    // });

    // folder.open();

}

var light;

function initLight() {
    light = new THREE.DirectionalLight(0xFFFFFF, 1.0, 0);
    light.position.set(3.744493, 35.0965, 25.08195);
    light.lookAt(0, 0, 0);
    // light.castShadow = true;
    // light.shadow.mapSize.width = 512;
    // light.shadow.mapSize.height = 512;
    // light.shadow.camera.near = 0.5;
    // light.shadow.camera.far = 100;
    scene.add(light);
}

var mainShape;
var shapeIndex = 0;
var shape_parameters;
var cutCompute;

function initApp() {
    appId = getQueryString('appId');
    url = window.location.hostname;

    geometryPool.length = 3;
    for (let i = 0; i != 3; i++) {
        let geometry = objPool[i][0];
        geometry.attributes.uv2 = objUv2Pool[i];
        geometry.morphAttributes.position = [];
        geometry.morphAttributes.normal = [];
        objPool[i].forEach((o, index) => {
            geometry.morphAttributes.position[index] = o.attributes.position;
            geometry.morphAttributes.normal[index] = o.attributes.normal;
        })

        geometryPool[i] = geometry;
    }

    cutCompute = new cutComputeShader(renderer);
    shape_parameters = new shapeParameters();

    shapePool.length = 3;
    let name = ['Dodecagon', 'Octagon', 'Decagon'];
    for (let i = 0; i != 3; i++) {
        shapePool[i] = new shape(geometryPool[i], i, name[i]);
        shapePool[i].cutCompute = cutCompute;
        shapePool[i].edg_A = shape_parameters.shapes[i].edg_A;
        shapePool[i].edg_B = shape_parameters.shapes[i].edg_B;
        shapePool[i].minHeight = shape_parameters.shapes[i].minHeight;
        shapePool[i].initCut = shape_parameters.shapes[i].initCut;
        shapePool[i].shapeScale = shape_parameters.shapes[i].shapeScale;
        shapePool[i].material.uniforms['_frontMap'].value = frontMap;
        shapePool[i].material.uniforms['_backMap'].value = backMap;
        shapePool[i].material.uniforms['_shapeMask'].value = shapeMask;
        shapePool[i].material.uniforms['_shapeIndex'].value = i;

        scene.add(shapePool[i].shape);
    }

    newShape();

}
var changeShapeBtn,
    newShapeBtn,
    sendBtn,
    mouse_div,
    progress_div,
    progress_bar,
    debug_p

function initDocument() {
    changeShapeBtn = document.getElementById('ChangeShape');
    newShapeBtn = document.getElementById('NewShape');
    sendBtn = document.getElementById('Send');
    mouse_div = document.getElementById('mouse_div');
    progress_div = document.getElementById('progress');
    progress_bar = document.getElementById('progress_bar');
    debug_p = document.getElementById('debug');


    //newShapeBtn.style.display = 'none';

    sendBtn.addEventListener('click', send);
    newShapeBtn.addEventListener('click', newShape);
    changeShapeBtn.addEventListener('click', changeShape);
}
function init() {
    initRender();
    initCamera();
    initScene();
    initLight();
    initDocument();

    window.addEventListener('resize', onWindowResize, { passive: false });
    canvas_warp.addEventListener('touchstart', onTouchStart, { passive: false });
}

var isSend = false;
var timeCount = 0;
var spawnTime = 3;
var newTimeCount = 2;
var minCutCount = 3;
var targetY = 0;
var targetFov = 0;
var fovVel = { val: 0 };
var posVel = { val: 0 };
var touched = false;
var progress = 0;
var target_progress = 0;
var loaded = false;
var progressVel = { val: 0 };

function update(delta) {
    pointPool.forEach((o, index) => {
        if (o.active) {
            o.update(delta, camera_width, camera_height);

            //o.point.style.backgroundColor = mainShape.insideShape(o.currentPos) ? 'rgba(0, 0, 255, 0.25)' : 'rgba(255, 255, 0, 0.25)';
            if (o.currentPos.distanceTo(o.prePos) >= o.cutListGap) {
                let current_inside = mainShape.insideShape(o.currentPos);

                if (!o.inside && current_inside) {

                    o.cutLine.kill();
                    o.cutLine.spawn(o.prePos);
                    o.cutList.push(new THREE.Vector2().copy(o.prePos));
                    o.dis2preDot = 0;

                }
                if (current_inside && o.cutLine.active) {

                    o.dis2preDot += o.currentPos.distanceTo(o.prePos);
                    while (o.dis2preDot > o.cutLineGap) {
                        let x = o.cutLine.preDot.x + (o.currentPos.x - o.cutLine.preDot.x) * o.cutLineGap / o.dis2preDot;
                        let y = o.cutLine.preDot.y + (o.currentPos.y - o.cutLine.preDot.y) * o.cutLineGap / o.dis2preDot;
                        o.cutLine.addPoint(new THREE.Vector2(x, y));
                        o.dis2preDot -= o.cutLineGap;
                    }
                    o.cutList.push(new THREE.Vector2().copy(o.currentPos));

                    if (mainShape.self_Intersected(o.cutList)) {
                        o.cutLine.kill();
                        o.cutList.length = 0;
                    }

                }
                if (o.inside && !current_inside && o.cutLine.active) {

                    o.cutList.push(new THREE.Vector2().copy(o.currentPos));
                    let cutResult = mainShape.cut(o.cutList);
                    cutResult.forEach((c) => {
                        newFragment(c);
                    });
                    mainShape.refresh();
                    o.cutLine.kill();
                    if (cutResult.length >= 2) {
                        newShape();
                    }
                }
                o.inside = current_inside;
                o.prePos.copy(o.currentPos);
            }
        }
    })
    fragmentPool.forEach((o, index) => {
        o.forEach((f) => {
            if (f.active) {
                f.update(delta);
            }
        })
    })

    if (!loaded) {
        progress = Mathf.SmoothDamp(progress, target_progress, progressVel, 0.05, Number.MAX_VALUE, delta);
        progress_bar.style.width = progress * 100 + '%';
    }
    if (progress >= 0.999 && !loaded) {
        progress_div.style.display = 'none';
        loaded = true;
        initApp();
    }

    if (mainShape == null)
        return;
    if (!isSend) {
        if (timeCount + delta < spawnTime * 69 / 90) {
            timeCount += delta;
            mainShape.setAnimation(timeCount / spawnTime);
            changeShapeBtn.classList.add('disable');
            sendBtn.classList.add('disable');
        }
        else if (!mainShape.cutable) {
            changeShapeBtn.classList.remove('disable');
            timeCount = spawnTime * 69 / 90;
            mainShape.setAnimation(timeCount / spawnTime);
            mainShape.cutable = true;

            initCut(mainShape.initCut);
            // CurrentCutShape.InitCut();
        }
        if (mainShape.cutCount >= minCutCount) {
            sendBtn.classList.remove('disable');
        } else {
            sendBtn.classList.add('disable');
        }
    }
    else {
        if (mainShape.cutable)
            mainShape.cutable = false;
        if (timeCount + delta < spawnTime) {
            timeCount += delta;
            mainShape.setAnimation(timeCount / spawnTime);
        }
        else if (timeCount < spawnTime) {
            timeCount += delta;
            mainShape.setAnimation(1);
            mainShape.kill();
            //Spawn();
        }
        if (newTimeCount <= 0) {
            newShapeBtn.classList.remove('disable');
            canvas_warp.style.pointerEvents = 'none';
        }
        else {
            newTimeCount -= delta;
        }
    }
    if (mainShape != null) {
        targetY = (mainShape.rect.y_max + mainShape.rect.y_min) * 0.5;
        let shapeHeight = mainShape.rect.y_max - mainShape.rect.y_min;
        let shapeWidth = Math.max(Math.abs(mainShape.rect.x_min), Math.abs(mainShape.rect.x_max)) * 2;
        let targetHeight = shapeHeight;
        if (shapeWidth / shapeHeight > camera.aspect) {
            targetHeight = shapeWidth / camera.aspect;
        }
        targetHeight += 4;
        targetFov = Math.atan(targetHeight * 0.5 / (camera.position.z)) * 2 / Deg2Rad;
        targetY += -0.02 * targetHeight;
    }

    let fov = Mathf.SmoothDamp(camera.fov, targetFov, fovVel, 0.5, Number.MAX_VALUE, delta);
    let posY = Mathf.SmoothDamp(camera.position.y, targetY, posVel, 0.5, Number.MAX_VALUE, delta);
    camera.fov = fov;
    camera.position.set(0, posY, 20);
    camera.updateProjectionMatrix();
    camera_height = Math.tan(camera.fov * 0.5 * Deg2Rad) * camera.position.z * 2;
    camera_width = camera_height * camera.aspect;
}
function send() {
    if (mainShape == null || !mainShape.cutable)
        return;

    var httpRequest = new XMLHttpRequest();

    httpRequest.open('POST', 'http://' + url + '/php/data_control.php', true);
    httpRequest.setRequestHeader("Content-type", "application/json");
    let data_package = {
        'appId': appId,
        'shapeIndex': mainShape.shapeIndex,
        'rect': mainShape.rect,
        'pointList': mainShape.pointList
    }
    httpRequest.send(JSON.stringify(data_package));
    httpRequest.onreadystatechange = function () {
        if (httpRequest.readyState == 4 && httpRequest.status == 200) {
            var response = httpRequest.responseText;
            console.log(response);
            //debug_p.innerHTML = response;
        }
    };

    isSend = true;
    newTimeCount = 2;
    changeShapeBtn.classList.add('disable');
    sendBtn.classList.add('disable');
}
function changeShape() {
    newFragment({ shape: mainShape.pointList, rect: mainShape.rect });
    newShape();
}
function newShape() {

    timeCount = 0;
    isSend = false;
    newShapeBtn.classList.add('disable');
    canvas_warp.style.pointerEvents = 'auto';

    if (mainShape != null)
        mainShape.kill();

    mainShape = shapePool[shapeIndex];

    mainShape.pointList.length = 0;

    shape_parameters.shapes[shapeIndex].pointList.forEach((p) => {
        mainShape.pointList.push(new THREE.Vector2(p.x, p.y));
    });

    mainShape.rect = mainShape.getRect(mainShape.pointList);
    mainShape.refresh();

    mainShape.spawn();

    shapeIndex++;
    if (shapeIndex >= 3)
        shapeIndex -= 3;
}
function animation() {
    let delta = clock.getDelta();
    update(delta);
    renderer.clear();
    renderer.render(scene, camera);
    requestAnimationFrame(animation);
}

function onWindowResize() {
    width = canvas_warp.clientWidth;
    height = canvas_warp.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    camera_height = Math.tan(camera.fov * 0.5 * Deg2Rad) * camera.position.z * 2;
    camera_width = camera_height * camera.aspect;
    renderer.setSize(width, height);
    composer.setSize(width, height);
}

function newPoint(x, y) {
    if (currentPoint != null)
        currentPoint.kill();
    currentPoint = null;

    for (let i = 0; i != pointPool.length; i++) {
        if (!pointPool[i].active) {
            currentPoint = pointPool[i];
            break;
        }
    }
    if (currentPoint == null) {
        currentPoint = new point(mouse_div, camera);
        pointPool.push(currentPoint);
    }

    currentPoint.spawn(new THREE.Vector2(x, y), camera_width, camera_height);
    currentPoint.inside = mainShape.insideShape(new THREE.Vector2(x, y));
}

function initCut(start_end) {
    let cutList = [new THREE.Vector2(start_end[0], start_end[1])];
    let x = (start_end[2] + start_end[0]) * 0.5;
    let y = (start_end[1] + start_end[3]) * 0.5;
    cutList.push(new THREE.Vector2(x, y));
    cutList.push(new THREE.Vector2(start_end[2], start_end[3]));

    let cutResult = mainShape.cut(cutList);
    cutResult.forEach((c) => {
        newFragment(c);
    });
    mainShape.refresh();
}

function newFragment(shape) {

    let currentFragment = null;

    for (let i = 0; i != fragmentPool[mainShape.shapeIndex].length; i++) {
        if (!fragmentPool[mainShape.shapeIndex][i].active) {
            currentFragment = fragmentPool[mainShape.shapeIndex][i];
            break;
        }
    }
    if (currentFragment == null) {
        currentFragment = new fragment(geometryPool[mainShape.shapeIndex]);
        currentFragment.shapeScale = shape_parameters.shapes[mainShape.shapeIndex].shapeScale;
        currentFragment.cutCompute = cutCompute;
        currentFragment.material.uniforms['_frontMap'].value = frontMap;
        currentFragment.material.uniforms['_backMap'].value = backMap;
        currentFragment.material.uniforms['_shapeMask'].value = shapeMask;
        currentFragment.material.uniforms['_shapeIndex'].value = mainShape.shapeIndex;
        fragmentPool[mainShape.shapeIndex].push(currentFragment);
        scene.add(currentFragment.fragment);
    }

    currentFragment.spawn(shape);
}

function onTouchStart(event) {
    event.preventDefault();
    touched = true;
    var touch = event.targetTouches[0];
    let rect = renderer.domElement.getBoundingClientRect();

    let x = (touch.clientX - rect.left) / rect.width;
    let y = 1 - (touch.clientY - rect.top) / rect.height;

    y += 0.05;

    if (currentPoint != null)
        currentPoint.kill();
    currentPoint = null;



    newPoint(x, y);

    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd, { passive: false });
}
function onTouchMove(event) {
    event.preventDefault();

    var touch = event.targetTouches[0];
    let rect = renderer.domElement.getBoundingClientRect();
    let x = (touch.clientX - rect.left) / rect.width;
    let y = 1 - (touch.clientY - rect.top) / rect.height;

    y += 0.05;

    if (currentPoint != null)
        currentPoint.screenPos.copy(new THREE.Vector2(x, y));
}
function onTouchEnd(event) {
    event.preventDefault();
    touched = false;
    if (currentPoint != null)
        currentPoint.kill();
    currentPoint = null;

    window.removeEventListener('touchmove', onTouchMove);
    window.removeEventListener('touchend', onTouchEnd);
}

window.onload = function () {
    init();
    load();
    animation();
}

THREE.DefaultLoadingManager.onLoad = function (url, itemsLoaded, itemsTotal) {

}
THREE.DefaultLoadingManager.onProgress = function (url, itemsLoaded, itemsTotal) {

    target_progress = itemsLoaded / itemsTotal;

};

