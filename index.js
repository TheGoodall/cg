import * as THREE from 'https://cdn.skypack.dev/three@0.136.0';
import { PointerLockControls } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/controls/PointerLockControls.js';
import * as TILES from './city_tiles.js';

let camera, scene, renderer, controls;

const objects = [];

let raycaster;

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



camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 2000 );
camera.position.y = 10;

scene = new THREE.Scene();

// Set up lighting

scene.background = new THREE.Color( 0xaaaaff );
scene.fog = new THREE.Fog( 0xffffff, 100, 1000 );

const hemisphere_light = new THREE.HemisphereLight( 0xeeeeff, 0x777788, 0.4 );
hemisphere_light.position.set( 0.5, 1, 0.75 );
scene.add( hemisphere_light );

const directional_light = new THREE.DirectionalLight(0xaaaaff, 0.75);
directional_light.position.set(100,10,0);
directional_light.target.position.set(0, 0, 0);
scene.add(directional_light);
scene.add(directional_light.target);

// Set up controls

controls = new PointerLockControls( camera, document.body );

document.body.addEventListener( 'click', function () {

	controls.lock();

} );


scene.add( controls.getObject() );

const onKeyDown = function ( event ) {

	switch ( event.code ) {

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
			if ( canJump === true ) velocity.y += 350;
			canJump = false;
			break;
		case 'ShiftLeft':
			sprint = true;
			break;

	}

};

const onKeyUp = function ( event ) {

	switch ( event.code ) {

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

document.addEventListener( 'keydown', onKeyDown );
document.addEventListener( 'keyup', onKeyUp );

// Set up floor and physics

raycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ), 0, 60 );

let floorGeometry = new THREE.PlaneGeometry( 2000, 2000, 10, 10 );
floorGeometry.rotateX( - Math.PI / 2 );

let position = floorGeometry.attributes.position;

for ( let i = 0, l = position.count; i < l; i ++ ) {

	vertex.fromBufferAttribute( position, i );

	// Big hills
	vertex.y += TILES.perlin_noise(vertex.x, vertex.z, 1000, 900) * 50

	// Small details
	vertex.y += TILES.perlin_noise(vertex.x, vertex.z, 1000, 150) * 10

	position.setY( i, vertex.y );

}

const floorMaterial = new THREE.MeshStandardMaterial({
	color: 0xff0000,
	roughness: 1,
	metalness: 0,
});

const floor = new THREE.Mesh( floorGeometry, floorMaterial );
scene.add( floor );
objects.push( floor );


// Set up renderer

renderer = new THREE.WebGLRenderer( { antialias: true } );
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

// Add resize listener

window.addEventListener( 'resize', onWindowResize );

function onWindowResize() {

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );

}

function animate() {

	requestAnimationFrame( animate );


	const time = performance.now();


	if ( controls.isLocked === true ) {

		raycaster.ray.origin.copy( controls.getObject().position );
		raycaster.ray.origin.y += 40;

		const intersections = raycaster.intersectObjects( objects, false );

		const onObject = intersections.length > 0;

		const delta = ( time - prevTime ) / 1000;

		velocity.x -= velocity.x * 10.0 * delta;
		velocity.z -= velocity.z * 10.0 * delta;

		velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

		direction.z = Number( moveForward ) - Number( moveBackward );
		direction.x = Number( moveRight ) - Number( moveLeft );
		direction.normalize(); // this ensures consistent movements in all directions
		
		let sprintmod = 1;
		if (sprint) {
			sprintmod = 3;
		}


		if ( moveForward || moveBackward ) velocity.z -= direction.z * 400.0 * delta * sprintmod;
		if ( moveLeft || moveRight ) velocity.x -= direction.x * 400.0 * delta * sprintmod;

		if ( onObject === true ) {
			let highest_object = intersections[0];
			for (var i = 1; i<intersections.length; i++) {
				if (intersections[i].distance < highest_object.distance) {
					highest_object = intersections[i]
				}
			}

			controls.getObject().position.y += (60-highest_object.distance);

			velocity.y = Math.max( 0, velocity.y );
			canJump = true;

		}

		controls.moveRight( - velocity.x * delta );
		controls.moveForward( - velocity.z * delta );

		controls.getObject().position.y += ( velocity.y * delta ); // new behavior

		if ( controls.getObject().position.y < 10 ) {

			velocity.y = 0;
			controls.getObject().position.y = 10;

			canJump = true;

		}

	}

	prevTime = time;

	renderer.render( scene, camera );

}
animate();
