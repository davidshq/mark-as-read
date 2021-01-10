chrome.runtime.onInstalled.addListener(function () {
	// console.log("onInstalled");
	fetchRemoteDictionary();
})

chrome.runtime.onStartup.addListener(function () {
	// console.log("onStartup");
	visited = {};
	fetchRemoteDictionary();
});

/**
 * Upon mark as read icon click, add if not already checked.
 * Remove if already checked.
 */
chrome.browserAction.onClicked.addListener(function(tabs) { 
	chrome.tabs.query({'active': true, 'currentWindow': true}, function (tab) {
		// console.log(tab[0].url);
		if (!isVisited(tab[0].url)) {
			addUrl(tab[0].url);
			markAsVisited(tab[0].id);
		} else {
			removeUrl(tab[0].url);
			markAsNotVisited(tab[0].id);
		}
	});
})

/** 
* Upon switching to a new tab and on it being activated, we check if this is the tab's
* first time being loaded, and if so we mark it as not visited
*/
chrome.tabs.onActivated.addListener(function callback(activeInfo) {
	// console.log("onActivated");
	chrome.tabs.query({'active': true, 'currentWindow': true}, function (tab) {
		console.log(tab[0].url);
		if (!isVisited(tab[0].url)) {
			markAsNotVisited(tab[0].id);
		} else { 
			markAsVisited(tab[0].id);
		}
	});
});

chrome.tabs.onUpdated.addListener(function callback(activeInfo, info) {
	// console.log("onActivated");
	chrome.tabs.getSelected(null, function(tab){
		if (!isVisited(tab.url)) {
			markAsNotVisited();
		} else { 
			markAsVisited();
		}
	});
});

/**
 * Get Latest Data for Extension
 * 
 * Reference: https://developer.chrome.com/docs/extensions/reference/storage/
 */
function fetchRemoteDictionary() {	

	chrome.storage.sync.get("visited", function (obj) {
		if (obj["visited"] == undefined) {
			visited = {version: 2};
		} else {
			var objVisited = obj["visited"];
			if(objVisited.version == 2) {
				visited = objVisited;
			} else {
				visited = {version: 2};
				Object.keys(objVisited).forEach(url => addUrl(url));
			}
		}
	});
}

/**
 * Sync Data for Extension
 * 
 * Reference: https://developer.chrome.com/docs/extensions/reference/storage/
 */
function updateRemoteDictionary() {	
	chrome.storage.local.set({"visited": visited}, function() {
		if (chrome.runtime.error) {
			console.log("Runtime error.");
		}
	});
}

/**
 * Mark Site as Not Visited
 * 
 * @param {*} atabId 
 */
function markAsNotVisited(atabId) {
	// console.log("markAsNotVisited");
	chrome.browserAction.setIcon({path: "notvisited.png", tabId: atabId});
	updateRemoteDictionary();
}

/**
 * Mark Site as Visited
 * @param {*} atabId 
 */
function markAsVisited(atabId) {
	// console.log("markAsVisited");
	chrome.browserAction.setIcon({path: "visited.png", tabId: atabId });
	updateRemoteDictionary();
}

/**
 * Following code is for debugging.
 */
// chrome.storage.onChanged.addListener(function(changes, namespace) {
// 	for (key in changes) {
// 		var storageChange = changes[key];
// 		console.log('Storage key "%s" in namespace "%s" changed. ' +
// 			'Old value was "%s", new value is "%s".',
// 			key,
// 			namespace,
// 			storageChange.oldValue,
// 			storageChange.newValue);
// 	}
// });

chrome.runtime.onMessage.addListener(function (msg) {
    if (msg.action === 'import') {
		var data = msg.data;
		Object.keys(data)
			.filter(key => key != 'version')
			.forEach(
				key => {
					data[key]
						.filter(value => !isVisited(key + value))
						.forEach(value => addUrl(key + value));
					
				}
			);		
		updateRemoteDictionary();
    }
});

function containsSite(sites, url) {
	return sites.split("\n").filter(site => url.includes(site)).length;
}

function removeUrl(url) {
	var key = getKey(url);
	var path = url.replace(key, '');
	const index = visited[key].indexOf(path);
	if (index > -1) {
		visited[key].splice(index, 1);
	}
	if(!visited[key].length) {
		delete visited[key];
	}
}

function isVisited(url) {
	if(url) {
		var key = getKey(url);
		if(visited[key]) {
			var path = url.replace(key, '');
			return visited[key].includes(path);
		}		
	}
	return false;
}

function addUrl(url){
	var key = getKey(url);
	var path = url.replace(key, '');
	if(visited[key]) {
		visited[key].push(path);
	} else {
		visited[key] = [path];
	}
}

function getKey(url) {
	return new URL(url).origin;
}