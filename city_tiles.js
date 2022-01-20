
perlin.seed();
export function perlin_noise(x, y, seed, scale) {
	return perlin.get((x/scale)+(1000*seed), y/scale+(1000*seed));
}

export function get_value(x, y) {
	return perlin_noise(x, y, 0, 100);
}



