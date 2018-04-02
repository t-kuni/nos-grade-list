const NORMAL = 0;
const HARD = 1;
const EXPERT = 2;
const DIFFICULTY_LIST = [
	NORMAL,
	HARD,
	EXPERT
];
const DIFFICULTY_TEXTS = [
	"Normal",
	'Hard',
	'Expert'
]

function getScore(seq, difficulty, key) {
	return $("[data-pdataMap~='music_list.music[" + seq + "].sheet[" + difficulty + "]." + key + "']").attr("data-pdataval");
}

const SCORE_CONFIG = {
	best_judge_good: {
		name: "good",
		filter: function(value) {
			return parseInt(value);
		}
	},
	best_judge_just: {
		name: "just",
		filter: function(value) {
			return parseInt(value);
		}
	},
	best_judge_miss: {
		name: "miss",
		filter: function(value) {
			return parseInt(value);
		}
	},
	best_judge_near: {
		name: "near",
		filter: function(value) {
			return parseInt(value);
		}
	},
	best_judge_superjust: {
		name: "sjust",
		filter: function(value) {
			return parseInt(value);
		}
	},
	best_score: {
		name: "score",
		filter: function(value) {
			return parseInt(value);
		}
	},
	best_time: {
		name: "datetime",
		filter: function(value) {
			return value + ":00";
		}
	},
	clear_count: {
		name: "clearCount",
		filter: function(value) {
			return parseInt(value);
		}
	},
	fc_type: {
		name: "fc",
		filter: function(value) {
			switch (value) {
				case '0':
					return "";
				case '1':
					return "NF";
				case '2':
					return "F";
				default:
					return "";
			}
		}
	},
	fullcombo_count: {
		name: "fcCount",
		filter: function(value) {
			return parseInt(value);
		}
	},
	grade: {
		name: "grade",
		filter: function(value) {
			return insertStr(value, value.length - 2, '.'); // Floatにすると誤差がでるので文字列のまま
		}
	},
	level: {
		name: "level",
		filter: function(value) {
			return parseInt(value);
		}
	},
	max_combo: {
		name: "combo",
		filter: function(value) {
			return parseInt(value);
		}
	},
	notes_glissando_rate: {
		name: "glissandoRate",
		filter: function(value) {
			return parseRate(value);
		}
	},
	notes_standard_rate: {
		name: "standardRate",
		filter: function(value) {
			return parseRate(value);
		}
	},
	notes_tenuto_rate: {
		name: "tenutoRate",
		filter: function(value) {
			return parseRate(value);
		}
	},
	notes_trill_rate: {
		name: "trillRate",
		filter: function(value) {
			return parseRate(value);
		}
	},
	pianistic_count: {
		name: "pianisticCount",
		filter: function(value) {
			return parseInt(value);
		}
	},
	play_count: {
		name: "playCount",
		filter: function(value) {
			return parseInt(value);
		}
	},
	rank: {
		name: "rank",
	},
}

function parseRate(value) {
	var matched = value.match(/^(\d+)\.(\d)%$/);
	if (matched) {
		// パーセント表記から実数表記に変換する
		var int = matched[1];
		var dec = matched[2];	
		var real = ('0000' + int + dec).slice(-4); // 0埋め
		real = insertStr(real, 1, '.'); // 少数点を入れる
		return real;
	} else {
		return "-";
	}
}

function getScores(seq, difficulty) {
	var scores = {};
	$("[data-pdataMap*='music_list.music[" + seq + "].sheet[" + difficulty + "].']").each(function() {
		var $el = $(this);
		var pdataMap = $el.attr("data-pdataMap");
		var fullName = pdataMap.split(" ")[0];
		var origName = fullName.split(".")[3];
		var origValue = $el.attr("data-pdataval");
		var name = SCORE_CONFIG[origName].name;
		var filter = SCORE_CONFIG[origName].filter;
		var value = filter != undefined ? filter(origValue) : origValue;
		scores[name] = value;
	});
	return scores;
}

function insertStr(str, index, insert) {
    return str.slice(0, index) + insert + str.slice(index, str.length);
}

// 受信
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if (request.greeting != "hello")
		return;
		
	var resultList = [];

	var $musics = $(".cl_music_data");
	$musics.each(function() {
		var $music = $(this);
		var seq = parseInt($music.find('.cl_music_data_seq').text());
		var title = $music.find('.cl_music_data_title').text();

		if (!title) return;

		$.each(DIFFICULTY_LIST, function() {
			var difficulty = this;
			var scores = getScores(seq, difficulty);
			var result = $.extend(scores, {
				seq: seq,
				title: title,
				difficulty: DIFFICULTY_TEXTS[difficulty],
			});
		
			resultList.push(result);
		});
	});

	sendResponse(resultList);
});