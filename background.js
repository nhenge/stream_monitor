function getTwitchStatus(channel, callback, retryCount) {
  var channelStatus = {
    active : false,
    channel_id : channel,
    favicon_url : "http://www.twitch.tv/favicon.ico",
  };

  if (channel.indexOf("twitch#") != 0) {
    callback(channel, channelStatus);
    return;
  }

  var twitchUrl = ("https://api.twitch.tv/kraken/streams/"
		   + channel.substring("twitch#".length));
  var xhr = new XMLHttpRequest();
  xhr.open("GET", twitchUrl, true);
  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4) {
      if (xhr.status == 200) {
	var json = JSON.parse(xhr.responseText);
	if (json.stream != null) {
	  channelStatus = {
	    active : true,
	    channel_id : channel,
	    favicon_url : "http://www.twitch.tv/favicon.ico",
	    url : json.stream.channel.url,
	    title : json.stream.channel.status,
	    subtitle : (json.stream.channel.display_name
			+ " playing " +  json.stream.channel.game),
	  }
	}
	callback(channel, channelStatus);
      } else {
	if (retryCount > 0) {
	  console.log("retrying: " + twitchUrl);
	  getTwitchStatus(channel, callback, retryCount - 1);
	}
      }
    }
  }
  xhr.send();
}

function pollAllChannels() {
  loadChannels(function(_, channels) {
      pollChannels(channels);
    });
}

function pollChannels(channels) {
  var numRequests = 0;
  var activeMap = {};

  for (var i = 0; i < channels.length; i++) {
    var channel = channels[i];
    if (channel.indexOf("twitch#") == 0) {
      getTwitchStatus(channel, onGetChannelStatus, 5);
      numRequests++;
    }
  }

  function onGetChannelStatus(channel, status) {
    updateChannelStatus(channel, status);
    activeMap[channel] = status.active;

    var activeItems = 0;
    for (var key in activeMap) {
      if (activeMap[key]) {
	activeItems++;
      }
    }

    if (activeItems > 0) {
      chrome.browserAction.setBadgeText({ text: activeItems.toString() });
      chrome.browserAction.setBadgeBackgroundColor({ color: "#008800" });
    } else {
      chrome.browserAction.setBadgeText({ text: "" });
    }
  }
}

chrome.alarms.create({ delayInMinutes : 0.1, periodInMinutes : 5.0 });
chrome.alarms.onAlarm.addListener(pollAllChannels);
chrome.storage.onChanged.addListener(pollAllChannels);
