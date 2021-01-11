## `chrome.runtime`
- Reference: https://developer.chrome.com/docs/extensions/reference/runtime/
### `chrome.runtime.onInstalled`
- "Fired when the extension is first installed, when the extension is updated to a new version, and when Chrome is updated to a new version."
### `chrome.runtime.onMessage`
 - "This event is fired when postMessage is called by the other end of the port. The first parameter is the message, the second parameter is the port that received the message."
### `chrome.runtime.onStartup`
- "Fired when a profile that has this extension installed first starts up. This event is not fired when an incognito profile is started."

## `chrome.browserAction`
### `chrome.browserAction.onClicked`
### `chrome.browserAction.setIcon`

## `chrome.tabs`
- Reference: https://developer.chrome.com/docs/extensions/reference/tabs/
### `chrome.tabs.query`
### `chrome.tabs.onActivated`
### `chrome.tabs.onUpdated`

## `chrome.commands`

## `chrome.storage`
- Reference: https://developer.chrome.com/docs/extensions/reference/storage/
### `chrome.storage.sync`
#### `chrome.storage.sync.get`
#### `chrome.storage.sync.set`

## Web API: URL
- Reference: https://developer.mozilla.org/en-US/docs/Web/API/URL
### URL().origin
- Reference: https://developer.mozilla.org/en-US/docs/Web/API/URL/origin