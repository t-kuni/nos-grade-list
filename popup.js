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

document.addEventListener('DOMContentLoaded', () => {
	
	getCurrentTabUrl((url) => {
		var $moveBtn = $('#move-btn');
		var $createBtn = $('#create-btn');
		
		if (isMusicDataPage(url)) {
			$moveBtn.hide();
			$createBtn.show();
		} else {
			$moveBtn.show();
			$createBtn.hide();
		}
		
		$createBtn.click(onClickCreatingGradeList);
		$moveBtn.click(() => {window.open('https://p.eagate.573.jp/game/nostalgia/nst/playdata/entrance.html?k=music_data');});
	});
});

/**
 * カラムのデータ形式を設定する
 * @param {Worksheet} ws ワークシート
 * @param {String} col 列名
 * @param {String} type データ形式
 */
function setColType(ws, col, type) {
	$.each(Object.keys(ws), function() {
		var ref = this;
		var match = ref.match(/^([A-Z]+)([0-9]+)$/)
		if (!match)
			return;

		var colRef = match[1];
		var rowRef = parseInt(match[2]);
		// ヘッダーは対象外
		if (rowRef > 1 && colRef == col) {
			ws[ref].t = type;
		}
	});
}

// 「グレード表を作成」ボタンが押された
function onClickCreatingGradeList() {
	// UIを切り替え
	$('#progress').show();
	$('#create-btn').prop('disabled', true);

	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		chrome.tabs.sendMessage(tabs[0].id, {greeting: "hello"}, function(table) {
			var ws = XLSX.utils.aoa_to_sheet(table);
			setColType(ws, 'P', 'n');
			var wb = XLSX.utils.book_new();
			var wsName = "グレード表";
			wb.SheetNames.push(wsName);
			wb.Sheets[wsName] = ws;
			XLSX.writeFile(wb, 'greads.xlsx');

			// UIを切り替え
			$('#progress').hide();
			$('#create-btn').prop('disabled', false);
		});
	});
}

function isMusicDataPage(url) {
	return url && url.match(/(p\.eagate\.573\.jp).*(entrance\.html\?k=music_data)/);
}


function showAd() {
	
	var url = makeAdURL();
	
	retryable(5, fetchAd.bind(url)).catch(function() {
		console.log('広告取得失敗');
	});
}

// Promiseを使ってリトライする
function retryable(retryCount, func) {
	let promise = Promise.reject().catch(() => func());
	for (let i = 0; i < retryCount; i++) {
		promise = promise.catch(err => func());
	}
	return promise;
}

function fetchAd() {
	var url = this;
	return new Promise(function(resolve, reject) {
		$.ajax({
			url:url,
			type:'GET'
		})
		.done(function(data){
			var $xml = $(data);
			var $items = $xml.find("Item");
			
			var randIdx = getRandomInt(0, 1); // 上位２つまでが対象
			var $item = $items.eq(randIdx);
			var url = $item.find("DetailPageURL").text();
			var imgUrl = $item.find("MediumImage URL").text();
			var title = $item.find("ItemAttributes Title").text();
			
			$img = $("<img>").attr("src", imgUrl);
			$title = $("<p>").text(title);
			$link = $("<a>").attr("href", url).attr("target", "_blank");
			$link.append($img).append($title);
			$("#ad-area").append($link);
			
			resolve();
		})
		.fail(function(){
			reject();
		});
	});
}

function makeAdURL() {
	// Your Access Key ID, as taken from the Your Account page
	var access_key_id = "";

	// Your Secret Key corresponding to the above ID, as taken from the Your Account page
	var secret_key = "";

	// The region you are interested in
	var endpoint = "webservices.amazon.co.jp";

	var uri = "/onca/xml";

	var params = {
		"Service" : "AWSECommerceService",
		"Operation" : "ItemSearch",
		"AWSAccessKeyId" : "AKIAIF3HXGCCUNGYCCMA",
		"AssociateTag" : "testparam083-22",
		"SearchIndex" : "Music",
		"Keywords" : getRandomKeyword(),
		"Sort" : "-orig-rel-date",
		"ResponseGroup" : "Images,ItemAttributes,Offers"
	};

	// Set current timestamp if not set
	if (params["Timestamp"] == undefined) {
		params["Timestamp"] = new Date().toISOString().slice(0, -5);
	}
	
	var pairs = [];
	
	$.each(Object.keys(params).sort(), function() {
		var key = this;
		var value = params[key];
		pairs.push(encodeURIComponent(key) + "=" + encodeURIComponent(value));
	});

	// Generate the canonical query
	var canonical_query_string = pairs.join('&');

	// Generate the string to be signed
	var string_to_sign = "GET\n" + endpoint + "\n" + uri + "\n" + canonical_query_string;

	// Generate the signature required by the Product Advertising API
	var signature = CryptoJS.HmacSHA256(string_to_sign, secret_key).toString(CryptoJS.enc.Base64);

	// Generate the signed URL
	return 'http://'+endpoint+uri+'?'+canonical_query_string+'&Signature='+encodeURIComponent(signature);
}

function getRandomInt(min, max) {
  return Math.floor( Math.random() * (max - min + 1) ) + min;
}

function getRandomKeyword() {
	
	var keywords = [
		"KONAMI",
		"BEMANI",
		"GITADORA",
		"jubeat",
		"maimai",
		"CHUNITHM"
	];
	
	var max = keywords.length - 1;
	
	return keywords[getRandomInt(0, max)];
}