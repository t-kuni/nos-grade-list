
function getScore(seq, key) {
	return $("[data-pdataMap~='music_list.music[" + seq + "].sheet[2]." + key + "']").text();
}

function out(values) {
	var buf = '';
	$.each(values, function() {
		if (buf.length > 0) {
			buf += '\t';
		}
		buf += this;
	});
	return buf;
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

function insertStr(str, index, insert) {
    return str.slice(0, index) + insert + str.slice(index, str.length);
}

// 受信
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if (request.greeting != "hello")
		return;

	var musics = $(".cl_music_data");
	var table = [[
		"番号",
		"曲名",
		"レベル",
		"スコア",
		"ランク",
		"◆Just",
		"Just",
		"Good",
		"Miss",
		"Near",
		"MaxCombo",
		"ノート数",
		"判定達成率",
		"コンボ達成率",
		"伸びしろ",
		"グレード",
	]];
	musics.each(function() {
		var music = $(this);
		var seq = parseInt(music.find('.cl_music_data_seq').text());
		
		var title = music.find('.cl_music_data_title').text();
		
		if (!title) return;
		
		var level = parseInt(getScore(seq, "level"));
		var score = parseInt(getScore(seq, "best_score"));
		var rank = calcRank(score);
		var sjust = parseInt(getScore(seq, "best_judge_superjust"));
		var just = parseInt(getScore(seq, "best_judge_just"));
		var good = parseInt(getScore(seq, "best_judge_good"));
		var miss = parseInt(getScore(seq, "best_judge_miss"));
		var near = parseInt(getScore(seq, "best_judge_near"));
		var combo = parseInt(getScore(seq, "max_combo"));
		var noteCount = sjust + just + good + miss + near; // 総ノート数
		var judgeRate = (sjust + 0.5 * just + 0.25 * good) / noteCount; // 判定達成率
		var comboRate = combo / noteCount; // コンボ達成率
		var nobi = noteCount - combo;
		var grade = getScore(seq, "grade");
		grade = insertStr(grade, grade.length - 2, '.');
	
		var row = [
			seq,
			title,
			level,
			score,
			rank,
			sjust,
			just,
			good,
			miss,
			near,
			combo,
			noteCount,
			judgeRate,
			comboRate,
			nobi,
			grade,
		];
		
		table.push(row);
	});
	sendResponse(table);
});