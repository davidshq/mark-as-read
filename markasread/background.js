/**
 * "Fired when the extension is first installed, when the extension is 
 * updated to a new version, and when Chrome is updated to a new version."
 * 
 * Reference: https://developer.chrome.com/docs/extensions/reference/runtime/
 */
chrome.runtime.onInstalled.addListener(function () {
	console.log("onInstalled");
	fetchMarkData();
})

/**
 * "Fired when a profile that has this extension installed first starts up. 
 * This event is not fired when an incognito profile is started."
 * 
 * Reference: https://developer.chrome.com/docs/extensions/reference/runtime/
 */
chrome.runtime.onStartup.addListener(function () {
	console.log("onStartup");
	visited = {};
	fetchMarkData();
});

/**
 * Add/Remove mark as read icon in response to click.
 * 
 */
chrome.browserAction.onClicked.addListener(function(tabs) { 
	// Return if the tab is active and in current window.
	// Reference: https://developer.chrome.com/docs/extensions/reference/tabs/
	chrome.tabs.query({'active': true, 'currentWindow': true}, function (tab) {
		if (!markedAsRead(tab[0].url)) {
			addUrl(tab[0].url);
			markAsVisited(tab[0].id);
		} else {
			removeUrl(tab[0].url);
			markAsNotVisited(tab[0].id);
		}
	});
})

/** 
* On tab activation, change mark as read icon based on status.
*/
chrome.tabs.onActivated.addListener(function callback(activeInfo) {
	console.log("onActivated");
	chrome.tabs.query({'active': true, 'currentWindow': true}, function (tab) {
		console.log(tab[0].url);
		if (!markedAsRead(tab[0].url)) {
			markAsNotVisited(tab[0].id);
		} else { 
			markAsVisited(tab[0].id);
		}
	});
});

/**
 * Listen for new urls being loaded in tabs and update mark as read icon appropriately.
 * 
 * Reference: https://developer.chrome.com/docs/extensions/reference/tabs/
 */
chrome.tabs.onUpdated.addListener(function callback(activeInfo, info) {
	console.log("onUpdated");
	// Gets tab active in current window
	chrome.tabs.getSelected(null, function(tab){
		if (!markedAsRead(tab.url)) {
			markAsNotVisited();
		} else { 
			markAsVisited();
		}
	});
});

/**
 * Pull Latest Data for Extension
 * 
 * Reference: https://developer.chrome.com/docs/extensions/reference/storage/
 */
function fetchMarkData() {	
	chrome.storage.sync.get("visited", function (obj) {
		if (obj["visited"] == undefined) {
			visited = {version: 2};
		} else {
			var objVisited = obj["visited"];
			if(objVisited.version == 2) {
				visited = objVisited;
			} else {
				visited = {version: 2};
				Object.keys(objVisited).forEach(
					url => addUrl(url)					);
			}
		}
	});
}

/**
 * Sync Data for Extension
 * 
 * Reference: https://developer.chrome.com/docs/extensions/reference/storage/
 */
function updateMarkData() {	
	chrome.storage.sync.set({"visited": visited}, function() {
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
	console.log("markAsNotVisited");
	chrome.browserAction.setIcon({path: "notvisited.png", tabId: atabId});
	updateMarkData();
}

/**
 * Mark Site as Visited
 * 
 * @param {*} atabId 
 */
function markAsVisited(atabId) {
	console.log("markAsVisited");
	chrome.browserAction.setIcon({path: "visited.png", tabId: atabId });
	updateMarkData();
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
						.filter(value => !markedAsRead(key + value))
						.forEach(value => addUrl(key + value));
					
				}
			);		
		updateMarkData();
    }
});

/**
 * Remove URL from data storage.
 * 
 * @param {*} url 
 */
function removeUrl(url) {
	console.log("Remove URL")
	var key = getKey(url);
	console.log(`Key ${key}`)
	var path = url.replace(key, '');
	console.log(`Path ${path}`)
	const index = visited[key].indexOf(path);
	console.log(`Index ${index}`)
	if (index > -1) {
		visited[key].splice(index, 1);
	}
	if(!visited[key].length) {
		delete visited[key];
	}
}

/**
 * Check if URL has been marked as read
 * 
 * @param {*} url 
 */
function markedAsRead(url) {
	if(url) {
		var key = getKey(url);
		if(visited[key]) {
			var path = url.replace(key, '');
			return visited[key].includes(path);
		}		
	}
	return false;
}

/**
 * Add url to data storage
 * 
 * @param {*} url 
 */
function addUrl(url){
	console.log("Add URL")
	var key = getKey(url);
	console.log(`Key ${key}`)
	var path = url.replace(key, '');
	console.log(`Path ${path}`)
	if(visited[key]) {
		visited[key].push(path);
	} else {
		visited[key] = [path];
	}
}

/**
 * Return URL of current page
 * 
 * Reference: https://developer.mozilla.org/en-US/docs/Web/API/URL/origin
 * 			  https://developer.mozilla.org/en-US/docs/Web/API/URL
 * 
 * @param {*} url 
 */
function getKey(url) {
	return new URL(url).origin;
}