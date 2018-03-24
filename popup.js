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
 */
function setColType(ws, col, type) {
	editCol(ws, col, function(ws, colRef, rowRef, cell) {
		cell.t = type;
		return cell;
	});
}

/**
 * カラムの書式を設定する
 */
function setColFormat(ws, col, format) {
	editCol(ws, col, function(ws, colRef, rowRef, cell) {
		cell.z = format;
		return cell;
	});
}

/**
 * 指定した列のセルをまとめて編集する
 * @param {Worksheet} ws ワークシート
 * @param {String} col 列名
 * @param {Function} callback コールバック
 */
function editCol(ws, col, callback) {
	$.each(Object.keys(ws), function() {
		var ref = this;
		var match = ref.match(/^([A-Z]+)([0-9]+)$/)
		if (!match)
			return;

		var colRef = match[1];
		var rowRef = parseInt(match[2]);
		// ヘッダーは対象外
		if (rowRef > 1 && colRef == col) {
			ws[ref] = callback(ws, colRef, rowRef, ws[ref]);
		}
	});
}

function calcRank(score) {
	if (score == 1000000) {
		return "P";
	} else if (score >= 950000) {
		return "S";
	} else if (score >= 900000) {
		return "A+";
	} else if (score >= 850000) {
		return "A";
	} else if (score >= 800000) {
		return "B+";
	} else if (score >= 750000) {
		return "B";
	} else if (score >= 700000) {
		return "C";
	} else {
		return "-";
	}
}

function calcRankRate(score) {
	return RANK_RATE[calcRank(score)];
}

const RANK_RATE = {
	"P" : 8.25,
	"S" : 7.25,
	"A+" : 6.5,
	"A" : 5.75,
	"B+" : 5.25,
	"B" : 4.75,
	"C" : 4.25,
	"-" : 3.25,
};

const COL_DEFINE = [
	{
		headerText: "番号",
		dataIndex: "seq", 
	},
	{
		headerText: "曲名",
		dataIndex: "title", 
	},
	{
		headerText: "レベル",
		dataIndex: "level", 
	},
	{
		headerText: "スコア",
		dataIndex: "score", 
	},
	{
		headerText: "ランク",
		dataIndex: "rank", 
	},
	{
		headerText: "Miss",
		dataIndex: "miss", 
	},
	{
		headerText: "MaxCombo",
		dataIndex: "combo", 
	},
	{
		headerText: "ノート数",
		dataIndex: "noteCount", 
	},
	{
		headerText: "判定達成率",
		dataIndex: "judgeRate", 
		format: '0%',
	},
	{
		headerText: "コンボ達成率",
		dataIndex: "comboRate", 
		format: '0%',
	},
	{
		headerText: "Grd",
		dataIndex: "grade", 
		type: 'n',
		format: '0.00',
	},
	{
		headerText: "Grd対象",
		dataIndex: "grdTarget", 
	},
	{
		headerText: "Grd期待値",
		dataIndex: "nobiGrade", 
		type: 'n',
		format: '0.00',
	},
	{
		headerText: "Grd伸び期待値",
		dataIndex: "nobi", 
		type: 'n',
		format: '0.00',
	},
	{
		headerText: "更新日時",
		dataIndex: "datetime", 
		type: 'd',
		format: 'm/d',
	},
];

// 「グレード表を作成」ボタンが押された
function onClickCreatingGradeList() {
	// UIを切り替え
	$('#progress').show();
	$('#create-btn').prop('disabled', true);

	const COL_GRADE = 'K';
	const COL_JUDGE_RATE = 'I';
	const COL_COMBO_RATE = 'J';
	const COL_EXCEPT = 'M';
	const COL_NOBI = 'N';
	const COL_DATE = 'O';

	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		chrome.tabs.sendMessage(tabs[0].id, {greeting: "hello"}, function(resultList) {

			// グレードの降順に並べ替え
			resultList.sort(function(a, b) {
				return parseFloat(b.grade) - parseFloat(a.grade);
			});
		
			var maxGrd = resultList[0].grade; // 最大グレード
			var minGrd = resultList[Math.min(resultList.length, 49)].grade; // 下限グレード

			$.each(resultList, function(index) {
				var r = this;

				var sjust = r.sjust;
				var just = r.just;
				var good = r.good;
				var miss = r.miss;
				var near = r.near;
				var combo = r.combo;

				var noteCount = sjust + just + good + miss + near; // 総ノート数
				var judgeRate = noteCount > 0 ? (sjust + 0.5 * just + 0.25 * good) / noteCount : 0; // 判定達成率
				var comboRate = noteCount > 0 ? combo / noteCount : 0; // コンボ達成率

				r.noteCount = noteCount;
				r.judgeRate = judgeRate;
				r.comboRate = comboRate;

				var level = r.level;

				// 目標スコア算出
				const NOBI_MISS = 2;
				const NOBI_JUST = calcIncNobiNote("just", miss, judgeRate, noteCount);
				const NOBI_GOOD = calcIncNobiNote("good", miss, judgeRate, noteCount);
				const NOBI_NEAR = calcIncNobiNote("near", miss, judgeRate, noteCount);

				var amari = NOBI_MISS;
				var nobiMiss = Math.max(miss - amari, 0);
				var diff = Math.min(miss, amari); // Missを減らした数
				amari = amari - diff;

				amari = amari + NOBI_NEAR;
				var nobiNear = near + diff;
				diff = Math.min(nobiNear, amari);
				nobiNear = Math.max(nobiNear - amari, 0);
				amari = amari - diff;

				amari = amari + NOBI_GOOD;
				var nobiGood = good + diff;
				diff = Math.min(nobiGood, amari);
				nobiGood = Math.max(nobiGood - amari, 0);
				amari = amari - diff;

				amari = amari + NOBI_JUST;
				var nobiJust = just + diff;
				diff = Math.min(nobiJust, amari);
				nobiJust = Math.max(nobiJust - amari, 0);
				amari = amari - diff;

				var nobiSJust = sjust + diff;
				nobiSJust = Math.max(nobiSJust - amari, 0);
				
				var nobiJudge = noteCount > 0 ? (nobiSJust + 0.5 * nobiJust + 0.25 * nobiGood) / noteCount : 0;
				var nobiCombo = calcIncComboRate(miss, comboRate);
				var nobiScore = noteCount > 0 ? 1000000 * ((nobiSJust + 0.7 * nobiJust + 0.5 * nobiGood) / noteCount) : 0;
				var nobiRankRate = calcRankRate(nobiScore);
				var nobiGrade = level * nobiRankRate * 1.5 * (0.85 * nobiJudge + 0.15 * nobiCombo); // 期待Grd

				r.nobiJudge = nobiJudge;
				r.nobiCombo = nobiCombo;
				r.nobiScore = nobiScore;
				r.nobiRankRate = nobiRankRate;
				r.nobiGrade = nobiGrade;

				// グレード対象かどうか
				var grdTarget = index < 50;
		
				// 伸びしろ（Grd期待値と下限Grdの差）を算出
				var grd = r.grade;
				var nobi = parseFloat(nobiGrade) - parseFloat(grdTarget ? grd : minGrd);
				nobi = Math.max(nobi, 0); // 0以下は丸める

				r.grdTarget = grdTarget ? "〇" : "-";
				r.nobi = nobi;
			});

			// 2次元配列に変換
			var tableAry = $.map(resultList, function(r) {
				var row = $.map(COL_DEFINE, function(col) {
					return r[col.dataIndex];
				});
				return [row]; // さらに配列で包まないと1次元配列になってしまう
			});

			// ヘッダー行作成
			var header = $.map(COL_DEFINE, function(col) {
				return col.headerText;
			});

			tableAry.unshift(header);

			tableAry[0].push('');
			tableAry[0].push('下限Grd');
			tableAry[0].push(minGrd);

			var ws = XLSX.utils.aoa_to_sheet(tableAry);

			var endRow = XLSX.utils.decode_range(ws["!ref"]).e.r;

			$.each(COL_DEFINE, function(colNo) {
				for (var rowNo = 1; rowNo <= endRow; rowNo++) {
					var cellRef = XLSX.utils.encode_cell({c:colNo, r:rowNo})
					var cell = ws[cellRef];

					var type = this.type;
					var fmt = this.format;

					if (type) cell.t = type;
					if (fmt) cell.z = fmt;
				}
			});

			ws['!autofilter'] = {
				ref: XLSX.utils.encode_range({
					s: {
						c: 0, 
						r: 0,
					},
					e: {
						c: COL_DEFINE.length - 1,
						r: 0,
					}
				})
			};

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

// ミス数が2減った時のコンボ達成率を取得します
function calcIncComboRate(miss, comboRate) {
	if (miss <= 2) {
		return 1;
	}

	var inc = 0.4355 / (1.15 * miss);

	return Math.min(1, comboRate + inc);
}

function calcIncNobiNote(judge, miss, judgeRate, noteCount) {
	var ratio = 1;
	switch (judge) {
		case "just":
			ratio = 0.2;
			break;
		case "good":
			ratio = 0.3;
			break;
		case "near":
			ratio = 0.5;
			break;
	}
	var nobiRate = (1 - judgeRate) * 0.5 * ratio;
	return Math.round(noteCount * nobiRate);
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