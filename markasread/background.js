/**
 * "Fired when the extension is first installed, when the extension is 
 * updated to a new version, and when Chrome is updated to a new version."
 * 
 * Reference: https://developer.chrome.com/docs/extensions/reference/runtime/
 */
chrome.runtime.onInstalled.addListener(function () {
	// console.log("onInstalled");
	fetchRemoteDictionary();
})

/**
 * "Fired when a profile that has this extension installed first starts up. 
 * This event is not fired when an incognito profile is started."
 * 
 * Reference: https://developer.chrome.com/docs/extensions/reference/runtime/
 */
chrome.runtime.onStartup.addListener(function () {
	// console.log("onStartup");
	visited = {};
	fetchRemoteDictionary();
});

/**
 * Add/Remove mark as read icon in response to click.
 * 
 */
chrome.browserAction.onClicked.addListener(function(tabs) { 
	// Return if the tab is active and in current window.
	// Reference: https://developer.chrome.com/docs/extensions/reference/tabs/
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
* On tab activation, change mark as read icon based on database.
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
 * 
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

/**
 * "This event is fired when postMessage is called by the other end of the
 * port. The first parameter is the message, the second parameter is the port 
 * that received the message."
 * 
 * Reference: https://developer.chrome.com/docs/extensions/reference/runtime/
 */
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