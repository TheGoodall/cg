import * as THREE from 'https://cdn.skypack.dev/three@0.136.0';
import {
    PointerLockControls
} from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/controls/PointerLockControls.js';
import {
    ParametricGeometry
} from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/geometries/ParametricGeometry.js';
import {
    GLTFLoader
} from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/loaders/GLTFLoader.js';
import * as TILES from './city_tiles.js';

let camera, scene, renderer, controls;

const objects = [];

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = false;
let sprint = false;

let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const vertex = new THREE.Vector3();
const color = new THREE.Color();



camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 2000);
camera.position.y = 10;

scene = new THREE.Scene();

// Set up lighting

scene.background = new THREE.Color(0xaaaaff);
scene.fog = new THREE.Fog(0xaaaaaa, 100, 1000);

const hemisphere_light = new THREE.HemisphereLight(0xeeeeff, 0x777788, 0.4);
hemisphere_light.position.set(0.5, 1, 0.75);
scene.add(hemisphere_light);

const directional_light = new THREE.DirectionalLight(0xaaaaff, 0.75);
directional_light.position.set(100, 10, 0);
directional_light.target.position.set(0, 0, 0);
scene.add(directional_light);
scene.add(directional_light.target);

// Set up controls

controls = new PointerLockControls(camera, document.body);

document.body.addEventListener('click', function() {

    controls.lock();

});


scene.add(controls.getObject());

const onKeyDown = function(event) {

    switch (event.code) {

        case 'ArrowUp':
        case 'KeyW':
            moveForward = true;
            break;

        case 'ArrowLeft':
        case 'KeyA':
            moveLeft = true;
            break;

        case 'ArrowDown':
        case 'KeyS':
            moveBackward = true;
            break;

        case 'ArrowRight':
        case 'KeyD':
            moveRight = true;
            break;

        case 'Space':
            if (canJump === true) velocity.y += 350;
            canJump = false;
            break;
        case 'ShiftLeft':
            sprint = true;
            break;

    }

};

const onKeyUp = function(event) {

    switch (event.code) {

        case 'ArrowUp':
        case 'KeyW':
            moveForward = false;
            break;

        case 'ArrowLeft':
        case 'KeyA':
            moveLeft = false;
            break;

        case 'ArrowDown':
        case 'KeyS':
            moveBackward = false;
            break;

        case 'ArrowRight':
        case 'KeyD':
            moveRight = false;
            break;
        case 'ShiftLeft':
            sprint = false;
            break;

    }

};

document.addEventListener('keydown', onKeyDown);
document.addEventListener('keyup', onKeyUp);

// Set up floor

let paramFunc = function(u, v, vec) {
    let x = u * 2000 - 1000;
    let z = v * 2000 - 1000;

    vec.setX(x);
    vec.setZ(z);
    vec.setY(TILES.perlin_noise(x, z, 1000, 900) * 150);
    return v;
}

let paramermetricFloorGeometry = new ParametricGeometry(paramFunc, 100, 100)

// Create canvas for floor texture rendering

const ground_res = 8192;

const ctx = document.createElement('canvas').getContext('2d');
ctx.canvas.width = ground_res;
ctx.canvas.height = ground_res;
ctx.fillStyle = '#FFF';
ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

const texture = new THREE.CanvasTexture(ctx.canvas);

// Function to place an image on a canvas given all the required parameters and a rotation (expressed as a multiple of 90)
let place_image = function(image, x, y, x_size, y_size, rotation) {
    ctx.translate(x + x_size / 2, y + y_size / 2);
    ctx.rotate(rotation * Math.PI / 2);
    ctx.translate(-x - x_size / 2, -y - y_size / 2);
    ctx.drawImage(
        image,
        x,
        y,
        x_size,
        y_size);
    ctx.setTransform(1, 0, 0, 1, 0, 0)
}

const road_scale = 32;

let grass = new Image();
grass.src = 'images/grass.jpg';
let grass_loaded = false;

let road = new Image();
road.src = 'images/road.jpg';
let road_loaded = false;

let road_junc = new Image();
road_junc.src = 'images/road_4-way.jpg';
let road_junc_loaded = false;

// Wait until all images have been loaded
let images_loaded = function() {

    const grass_scale = 16;

    for (let i = 0; i < grass_scale * 2; i++) {
        for (let j = 0; j < grass_scale * 2; j++) {
            place_image(
                grass,
                j * (ground_res / grass_scale) / 2 +
                Math.random() * ground_res / grass_scale / 4,
                i * (ground_res / grass_scale) / 2 +
                Math.random() * ground_res / grass_scale / 4,
                ground_res / grass_scale,
                ground_res / grass_scale);
        }
    }


    for (let i = 0; i < road_scale; i++) {
        for (let j = 0; j < road_scale; j++) {
            if (j % 4 == 0 || i % 4 == 0) {
                if (j % 4 == 0 && i % 4 == 0) {
                    // Crossroads
                    place_image(
                        road_junc,
                        j * (ground_res / road_scale),
                        i * (ground_res / road_scale),
                        ground_res / road_scale,
                        ground_res / road_scale,
                        1
                    );
                } else if (j % 4 == 0) {
                    // vertical
                    place_image(
                        road,
                        j * (ground_res / road_scale),
                        i * (ground_res / road_scale),
                        ground_res / road_scale,
                        ground_res / road_scale,
                        1
                    );

                } else if (i % 4 == 0) {
                    // horizontal
                    place_image(
                        road,
                        j * (ground_res / road_scale),
                        i * (ground_res / road_scale),
                        ground_res / road_scale,
                        ground_res / road_scale,
                        0
                    );

                }

            }
        }
    }
    texture.needsUpdate = true;
}

let check_images_loaded = function() {
    if (grass_loaded && road_loaded && road_junc_loaded) {
        return true;
    } else {
        return false;
    }
}

grass.onload = function() {
    grass_loaded = true;
    if (check_images_loaded) {
        images_loaded();
    }
}
road.onload = function() {
    road_loaded = true;
    if (check_images_loaded) {
        images_loaded();
    }
}
road_junc.onload = function() {
    road_junc_loaded = true;
    if (check_images_loaded) {
        images_loaded();
    }
}





// Create floor material

texture.magFilter = THREE.LinearFilter;
texture.minFilter = THREE.LinearMipmapLinearFilter;

const floorMaterial = new THREE.MeshStandardMaterial({
    roughness: 1,
    metalness: 0,
    map: texture,
});
floorMaterial.side = THREE.DoubleSide;

const floor = new THREE.Mesh(paramermetricFloorGeometry, floorMaterial);
scene.add(floor);
objects.push(floor);


// Set up renderer

renderer = new THREE.WebGLRenderer({
    antialias: true
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Add resize listener

window.addEventListener('resize', onWindowResize);

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

}


// Generate skyscrapers

const loader = new THREE.TextureLoader();


// Rotation
const rotation = new THREE.Euler();
rotation.x, rotation.y, rotation.z = 0
const quaternion = new THREE.Quaternion();
quaternion.setFromEuler(rotation);

let mixer = null;
let ped = null
const gltf_loader = new GLTFLoader();
gltf_loader.load('blender/HUMAN.glb', function( gltf ) {
	gltf.scene.scale.x = 5
	gltf.scene.scale.y = 5
	gltf.scene.scale.z = 5
	mixer = new THREE.AnimationMixer(gltf.scene);
	const animationAction = mixer.clipAction(gltf.animations[0]).play()
	ped = gltf.scene

	scene.add(ped)
})
gltf_loader.load('blender/building_cube.glb', function(gltf) {
    const mesh = gltf.scene.children[1];

    let building_mesh = mesh.geometry.clone();
    let building_material = mesh.material.clone();

	const geometry = new THREE.BoxGeometry(2,2,2);
	const material = new THREE.MeshStandardMaterial({
		map: loader.load('images/building.jpg'),
		color: 0xbbbbbb,
	});

    for (let i = 0; i < road_scale / 4; i++) {
        for (let j = 0; j < road_scale / 4; j++) {
            // Position
            let x = 2000 / road_scale * (i + 1) * 4 - 1000 - (1.5 * 2000 / road_scale);
            let z = 2000 / road_scale * j * 4 - 1000 + (1.5 * 2000 / road_scale);


            // Scale
            const scale = new THREE.Vector3();
            scale.y = 100;
            scale.x = (Math.random() + 0.5) * 2000 / road_scale;
            scale.z = (Math.random() + 0.5) * 2000 / road_scale;

            let height = Math.max(Math.round(2 + TILES.perlin_noise(x, z, 2000, 900) * 10), 0)

            let lod = new THREE.LOD();

            const cubes = new THREE.InstancedMesh(geometry, material, height);
            const non_cubes = new THREE.InstancedMesh(building_mesh, building_material, height);


            for (let k = 0; k < height; k++) {
                const position = new THREE.Vector3();
                position.x = 0;
                position.z = 0;

                position.y = (TILES.perlin_noise(x, z, 1000, 900) * 150) + 200 * k;

                const matrix = new THREE.Matrix4();
                matrix.compose(position, quaternion, scale);
                cubes.setMatrixAt(k, matrix);
                non_cubes.setMatrixAt(k, matrix);
            }
			lod.addLevel(cubes, 500);
			lod.addLevel(non_cubes, 0);
			lod.position.setX(x);
			lod.position.setZ(z);
            scene.add(lod);
        }
    }

})

animate();





// Animate function

function animate() {
    requestAnimationFrame(animate);

    const time = performance.now();
	const delta = (time - prevTime) / 1000;

	if (mixer != null) {
		mixer.update(delta)
		ped.position.z += 8 * delta;
		ped.position.y = TILES.perlin_noise(ped.position.x, ped.position.z, 1000, 900) * 150
		if (ped.position.z > 500) {
			ped.position.z = -500
		}
	}


    if (controls.isLocked === true) {


        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;

        velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize(); // this ensures consistent movements in all directions

        let sprintmod = 1;
        if (sprint) {
            sprintmod = 3;
        }


        if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta * sprintmod;
        if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta * sprintmod;

        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);

        controls.getObject().position.y += (velocity.y * delta); // new behavior

        let height = TILES.perlin_noise(controls.getObject().position.x, controls.getObject().position.z, 1000, 900) * 150
        if (controls.getObject().position.y < height + 20) {

            velocity.y = 0;
            controls.getObject().position.y = height + 20;

            canJump = true;

        }

    }

    prevTime = time;

    renderer.render(scene, camera);


}
