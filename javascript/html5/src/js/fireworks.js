// Copyright (c) 2026 Oliver Merkel. All rights reserved.
// SPDX-License-Identifier: MIT

// Fireworks canvas overlay – 8 s celebration animation on game win.
// The canvas sits above board content (z-index 8) but below header/panel
// (z-index 10+) and is pointer-events:none, so all UI remains accessible.

const COLORS = [
	"#f4a261",
	"#e76f51",
	"#2a9d8f",
	"#e9c46a",
	"#8ad5ff",
	"#ff6b9d",
	"#c8f7c5",
	"#ffffff",
];

let _canvas = null;
let _ctx = null;
let _animId = null;
let _stopTimer = null;
let _launchTimer = null;
const _particles = [];

const _resize = () => {
	if (!_canvas) return;
	_canvas.width = window.innerWidth;
	_canvas.height = window.innerHeight;
};

const _randomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

const _launchShell = () => {
	if (!_canvas) return;
	const x = Math.random() * _canvas.width;
	const y = _canvas.height * (0.1 + Math.random() * 0.45);
	const color = _randomColor();
	const count = 60 + Math.floor(Math.random() * 50);
	for (let i = 0; i < count; i++) {
		const angle = (Math.PI * 2 * i) / count;
		const speed = 2 + Math.random() * 4;
		_particles.push({
			x,
			y,
			vx: Math.cos(angle) * speed,
			vy: Math.sin(angle) * speed,
			alpha: 1,
			color,
			radius: 1.5 + Math.random() * 2,
			decay: 0.011 + Math.random() * 0.009,
		});
	}
};

const _loop = () => {
	if (!_ctx || !_canvas) return;
	_ctx.clearRect(0, 0, _canvas.width, _canvas.height);

	for (let i = _particles.length - 1; i >= 0; i--) {
		const p = _particles[i];
		p.x += p.vx;
		p.y += p.vy;
		p.vy += 0.06; // gravity
		p.vx *= 0.99; // horizontal drag
		p.alpha -= p.decay;
		if (p.alpha <= 0) {
			_particles.splice(i, 1);
			continue;
		}
		_ctx.save();
		_ctx.globalAlpha = p.alpha;
		_ctx.beginPath();
		_ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
		_ctx.fillStyle = p.color;
		_ctx.fill();
		_ctx.restore();
	}

	_animId = requestAnimationFrame(_loop);
};

export const startFireworks = (duration = 8000) => {
	stopFireworks();
	_canvas = document.getElementById("fireworks-canvas");
	if (!_canvas) return;
	_ctx = _canvas.getContext("2d");
	_canvas.style.display = "block";
	_resize();
	window.addEventListener("resize", _resize);

	const end = Date.now() + duration;
	const scheduleLaunch = () => {
		const burst = 2 + Math.floor(Math.random() * 2);
		for (let i = 0; i < burst; i++) _launchShell();
		if (Date.now() < end) {
			_launchTimer = setTimeout(scheduleLaunch, 220 + Math.random() * 280);
		}
	};
	scheduleLaunch();
	_loop();
	_stopTimer = setTimeout(stopFireworks, duration);
};

export const stopFireworks = () => {
	if (_animId) {
		cancelAnimationFrame(_animId);
		_animId = null;
	}
	if (_stopTimer) {
		clearTimeout(_stopTimer);
		_stopTimer = null;
	}
	if (_launchTimer) {
		clearTimeout(_launchTimer);
		_launchTimer = null;
	}
	window.removeEventListener("resize", _resize);
	_particles.length = 0;
	if (_ctx && _canvas) {
		_ctx.clearRect(0, 0, _canvas.width, _canvas.height);
	}
	if (_canvas) {
		_canvas.style.display = "none";
	}
	_canvas = null;
	_ctx = null;
};
