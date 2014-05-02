function renderFavicon(url) {
  var div = document.createElement("img");
  div.className = "favicon";
  div.src = url;
  return div;
}

function renderTitle(text, url) {
  var div = document.createElement("div");
  div.className = "title";
  div.appendChild(document.createTextNode(text));
  if (url) {
    div.setAttribute("url", url);
    div.onclick = function() {
      chrome.tabs.query({currentWindow: true, url: url}, function(tabs) {
	  if (tabs != null && tabs.length > 0) {
	    chrome.tabs.update(tabs[0].id, {active: true});
	  } else {
	    chrome.tabs.create({
		selected: true,
		url: div.getAttribute("url")
	      });
	  }
	});
    }
  }
  return div;
}

function renderSubtitle(text) {
  var div = document.createElement("div");
  div.className = "subtitle";
  div.appendChild(document.createTextNode(text));
  return div;
}

function renderChannelStatus(favicon, title, subtitle) {
  var div = document.createElement("div");
  div.className = "channel_status";
  if (favicon) {
    div.appendChild(favicon);
  }
  if (title) {
    div.appendChild(title);
  }
  if (subtitle) {
    div.appendChild(subtitle);
  }
  return div;
}

function renderChannel(channel_status) {
  var div = document.createElement("div");
  div.className = "channel";
  div.appendChild(channel_status);
  return div;
}

function render(root, statusList) {
  for (var i = 0, ie = statusList.length; i < ie; ++i) {
    var status = statusList[i];
    if (!status.active) {
      continue;
    }

    var channel = renderChannel(
      renderChannelStatus(
        renderFavicon(status.favicon_url),
	renderTitle(status.title, status.url),
	renderSubtitle(status.subtitle)));

    root.appendChild(channel);
  }

  for (var i = 0, ie = statusList.length; i < ie; ++i) {
    var status = statusList[i];
    if (status.active) {
      continue;
    }

    var channel = renderChannel(
      renderChannelStatus(
        renderFavicon(status.favicon_url),
	renderTitle(status.channel_id, null),
	null));
    channel.id = "inactive";

    root.appendChild(channel);
  }
}

function renderFolderSelector (root, bookmarkId) {
  getBookmarkFolders(function(folders) {
      for (var i = 0; i < folders.length; i++) {
	var option = document.createElement("option");
	option.value = folders[i].id;
	option.appendChild(document.createTextNode(folders[i].title));
	if (bookmarkId == folders[i].id) {
	  option.selected = true;
	}
	root.appendChild(option);
      }

      root.onchange = function() {
	saveChannelFolder(this.value);
      };
    });
}

function main() {
  var root = document.getElementsByClassName("contents")[0];
  root.innerHTML = "";

  loadChannels(function(bookmarkId, channels) {
      loadChannelStatus(channels, function(statusList) {
	  render(root, statusList);

	  var selector = document.getElementsByClassName("folder_selector")[0];
	  selector.innerHTML = "";
	  renderFolderSelector(selector, bookmarkId);

	  var buttons = document.getElementsByClassName("button");
	  for (var i = 0; i < buttons.length; i++) {
	    var button = buttons[i];
	    if (button.id == "reload") {
	      button.onclick = main;
	    }
	  }
	});
    });
}

function loadChannelStatus(channels, callback) {
  var numRequests = 0;
  var statusList = [];

  for (var i = 0; i < channels.length; i++) {
    console.log("getChannelStatus: " + channels[i]);
    getChannelStatus(channels[i], appendStatus);
    numRequests++;
  }

  function appendStatus(status) {
    statusList.push(status);
    numRequests--;
    if (numRequests <= 0) {
      callback(statusList);
    }
  }
}

document.addEventListener("DOMContentLoaded", main);
chrome.storage.onChanged.addListener(main);

