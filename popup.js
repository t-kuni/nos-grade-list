// Copyright (c) 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * Get the current URL.
 *
 * @param {function(string)} callback called when the URL of the current tab
 *   is found.
 */
function getCurrentTabUrl(callback) {
  // Query filter to be passed to chrome.tabs.query - see
  // https://developer.chrome.com/extensions/tabs#method-query
  var queryInfo = {
    active: true,
    currentWindow: true
  };

  chrome.tabs.query(queryInfo, (tabs) => {
    // chrome.tabs.query invokes the callback with a list of tabs that match the
    // query. When the popup is opened, there is certainly a window and at least
    // one tab, so we can safely assume that |tabs| is a non-empty array.
    // A window can only have one active tab at a time, so the array consists of
    // exactly one tab.
    var tab = tabs[0];

    // A tab is a plain object that provides information about the tab.
    // See https://developer.chrome.com/extensions/tabs#type-Tab
    var url = tab.url;

    // tab.url is only available if the "activeTab" permission is declared.
    // If you want to see the URL of other tabs (e.g. after removing active:true
    // from |queryInfo|), then the "tabs" permission is required to see their
    // "url" properties.
    console.assert(typeof url == 'string', 'tab.url should be a string');

    callback(url);
  });

  // Most methods of the Chrome extension APIs are asynchronous. This means that
  // you CANNOT do something like this:
  //
  // var url;
  // chrome.tabs.query(queryInfo, (tabs) => {
  //   url = tabs[0].url;
  // });
  // alert(url); // Shows "undefined", because chrome.tabs.query is async.
}

// This extension loads the saved background color for the current tab if one
// exists. The user can select a new background color from the dropdown for the
// current page, and it will be saved as part of the extension's isolated
// storage. The chrome.storage API is used for this purpose. This is differentx
// from the window.localStorage API, which is synchronous and stores data bound
// to a document's origin. Also, using chrome.storage.sync instead of
// chrome.storage.local allows the extension data to be synced across multiple
// user devices.
document.addEventListener('DOMContentLoaded', () => {
	  console.log('DOMContentLoaded');
  getCurrentTabUrl((url) => {
	  console.log('getCurrentTabUrl');
    var createButton = document.getElementById('create-button');
	
	createButton.addEventListener('click', () => {
		
	// 送信
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
  chrome.tabs.sendMessage(tabs[0].id, {greeting: "hello"}, function(table) {
	var ws = XLSX.utils.aoa_to_sheet(table);
	var wb = XLSX.utils.book_new();
	var wsName = "グレード表";
	wb.SheetNames.push(wsName);
	wb.Sheets[wsName] = ws;
	XLSX.writeFile(wb, 'greads.xlsx');
  });
});
		
	  console.log('clicked createButton');
		var musics = $(".cl_music_data");
		musics.each(function() {
			var music = $(this);
			var seq = music.find('.cl_music_data_seq').text();
			
			var title = music.find('.cl_music_data_title').text();
			
			if (!title) return;
			
			var level = getScore(seq, "level");
			var score = parseInt(getScore(seq, "best_score"));
			var rank = calcRank(score);
			var miss = getScore(seq, "best_judge_miss");
			var combo = parseInt(getScore(seq, "max_combo"));
			var noteCount = getNoteCount(seq);
			var nobi = noteCount - combo;
			var grade = getScore(seq, "grade");
			var grade = grade.substr(0, 2) + '.' + grade.substr(-2);

			out([
				seq,
				title,
				level,
				score,
				rank,
				miss,
				combo,
				noteCount,
				nobi,
				grade,
			]);
		});
	});
  });
});

function getScore(seq, key) {
	return $("[data-pdataMap~='music_list.music[" + seq + "].sheet[2]." + key + "']").text();
}

function getNoteCount(seq) {
	var sjust = parseInt(getScore(seq, "best_judge_superjust"));
	var just = parseInt(getScore(seq, "best_judge_just"));
	var good = parseInt(getScore(seq, "best_judge_good"));
	var miss = parseInt(getScore(seq, "best_judge_miss"));
	var near = parseInt(getScore(seq, "best_judge_near"));
	return sjust + just + good + miss + near;
}

function out(values) {
	var buf = '';
	$.each(values, function() {
		if (buf.length > 0) {
			buf += '\t';
		}
		buf += this;
	});
	console.log(buf);
}

function calcRank(score) {
	if (score >= 950000) {
		return "S";
	} else if (score >= 900000) {
		return "A+";
	} else if (score >= 850000) {
		return "A";
	} else {
		return "-";
	}
}

function name() {
	return 'popup';
}

window.addEventListener("message", function(event) {
  // We only accept messages from ourselves
  if (event.source != window)
    return;

  if (event.data.type && (event.data.type == "FROM_CONTENT")) {
    console.log("うけとった: " + event.data.text);
  }
}, false);