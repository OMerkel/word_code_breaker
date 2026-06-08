// Copyright (c) 2026 Oliver Merkel. All rights reserved.
// SPDX-License-Identifier: MIT

const CACHE_NAME = "word-code-breaker-v1";
const CORE_ASSETS = Object.freeze([
	"./",
	"./index.html",
	"./css/index.css",
	"./js/hmi.js",
	"./js/renderer.js",
	"./js/store.js",
	"./js/board.js",
	"./js/common.js",
	"./js/controller.js",
	"./data/en_5_letters.txt",
	"./data/de_5_letters.txt",
]);
const ASSETS_TO_CACHE = [
	"./",
	"./index.html",
	"./css/index.css",
	"./js/hmi.js",
	"./js/renderer.js",
	"./js/store.js",
	"./js/board.js",
	"./js/common.js",
	"./js/controller.js",
	"./data/en_5_letters.txt",
	"./data/de_5_letters.txt",
	"./manifest.json",
	"./img/icons/codebreaker32.png",
	"./img/icons/codebreaker128.png",
	"./img/icons/codebreaker256.png",
];

const precacheAssets = async (cache) => {
	const attempts = await Promise.allSettled(
		ASSETS_TO_CACHE.map((asset) => cache.add(asset)),
	);
	const failedAssets = attempts
		.map((result, index) =>
			result.status === "rejected"
				? { asset: ASSETS_TO_CACHE[index], reason: result.reason }
				: null,
		)
		.filter(Boolean);

	if (failedAssets.length === 0) return;

	const failedCore = failedAssets.filter((item) =>
		CORE_ASSETS.includes(item.asset),
	);
	if (failedCore.length > 0) {
		const summary = failedCore.map((item) => item.asset).join(", ");
		throw new Error(`Failed to precache core assets: ${summary}`);
	}

	console.warn("Optional assets failed to precache:", failedAssets);
};

// Install event: cache static assets
self.addEventListener("install", (event) => {
	event.waitUntil(
		caches
			.open(CACHE_NAME)
			.then((cache) => precacheAssets(cache))
			.then(() => self.skipWaiting()),
	);
});

// Activate event: clean up old caches
self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((cacheNames) => {
				return Promise.all(
					cacheNames
						.filter((cacheName) => cacheName !== CACHE_NAME)
						.map((cacheName) => {
							console.log("Deleting old cache:", cacheName);
							return caches.delete(cacheName);
						}),
				);
			})
			.then(() => self.clients.claim()),
	);
});

// Fetch event: network-first with fallback to cache
self.addEventListener("fetch", (event) => {
	// Only cache GET requests
	if (event.request.method !== "GET") {
		return;
	}

	// Skip cross-origin requests
	if (!event.request.url.startsWith(self.location.origin)) {
		return;
	}

	event.respondWith(
		// Try network first
		fetch(event.request)
			.then((response) => {
				// Cache successful responses
				if (response && response.status === 200) {
					const responseClone = response.clone();
					caches.open(CACHE_NAME).then((cache) => {
						cache.put(event.request, responseClone);
					});
				}
				return response;
			})
			.catch(() => {
				// Fallback to cache if network fails
				return caches.match(event.request).then((cachedResponse) => {
					return (
						cachedResponse ||
						new Response("Offline - content not cached", {
							status: 503,
							statusText: "Service Unavailable",
						})
					);
				});
			}),
	);
});
