const NORMAL = 0;
const HARD = 1;
const EXPERT = 2;
const DIFFICULTY_LIST = [
	NORMAL,
	HARD,
	EXPERT
];

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
	},
	notes_standard_rate: {
		name: "standardRate",
	},
	notes_tenuto_rate: {
		name: "tenutoRate",
	},
	notes_trill_rate: {
		name: "trillRate",
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
				difficulty: difficulty,
			});
		
			resultList.push(result);
		});
	});

	sendResponse(resultList);
});