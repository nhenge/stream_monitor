function saveChannelFolder(bookmarkId) {
  chrome.storage.sync.set({ "channel_folder" : bookmarkId }, function() {
      console.log("save channel_folder: " + bookmarkId);
    });
}

function loadChannelFolder(callback) {
  chrome.storage.sync.get("channel_folder", function(items) {
      if (items != null && items.channel_folder != null) {
	callback(items.channel_folder);
      } else {
	callback("0");
      }
    });
}

function loadChannels(callback) {
  loadChannelFolder(function(bookmarkId) {
      getBookmarkLeafs(bookmarkId, function(leafs) {
	  var channels = []
	  for (var i = 0; i < leafs.length; i++) {
	    var channel = getChannelIdFrom(leafs[i].url);
	    if (channel) {
	      channels.push(channel);
	    }
	  }

	  callback(bookmarkId, channels);
	});
    });
}

function getChannelIdFrom(url) {
  var found = url.match("http://www.twitch.tv/([^/]+)");
  if (found) {
    return "twitch#" + found[1];
  }

  return null;
}

function getBookmarkFolders(callback) {
  chrome.bookmarks.getTree(function(nodes) {
      var folders = [];
      for (var i = 0; i < nodes.length; i++) {
	extractFolderNodes(nodes[i], "", folders);
      }
      callback(folders);
    });

  function extractFolderNodes(node, indent, result) {
    if (!node.url) {
      node.title = indent + node.title;
      if (node.title == "") {
	node.title = "(root)";
      }
      result.push(node);
    }

    if (node.children) {
      for (var i = 0; i < node.children.length; i++) {
        extractFolderNodes(node.children[i], indent + "--", result);
      }
    }
  }
}

function getBookmarkLeafs(bookmarkId, callback) {
  chrome.bookmarks.getSubTree(bookmarkId, function(nodes) {
      var leafs = [];
      for (var i = 0; i < nodes.length; i++) {
	extractLeafNodes(nodes[i], leafs);
      }
      callback(leafs);
    });

  function extractLeafNodes(node, result) {
    if (node.url) {
      result.push(node);
    }

    if (node.children) {
      for (var i = 0; i < node.children.length; i++) {
        extractLeafNodes(node.children[i], result);
      }
    }
  }
}

function updateChannelStatus(channel, channelStatus) {
  var obj = {};
  obj["status_" + channel] = channelStatus;
  chrome.storage.sync.set(obj, function() {
      console.log("save channel status: " + channel);
    });
}

function getChannelStatus(channel, callback) {
  chrome.storage.sync.get("status_" + channel, function(items) {
      console.log("got: " + JSON.stringify(items));
      if (items != null && items["status_" + channel]) {
	callback(items["status_" + channel]);
      } else {
	callback({ active : false, channel_id : channel });
      }
    });
}
