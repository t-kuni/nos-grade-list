
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

function calcRankRate(score) {
	return RANK_RATE[calcRank(score)];
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
		"Miss",
		"MaxCombo",
		"ノート数",
		"判定達成率",
		"コンボ達成率",
		"Grd",
		"Grd対象",
		"Grd期待値",
		"伸びしろ",
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
		var judgeRate = noteCount > 0 ? (sjust + 0.5 * just + 0.25 * good) / noteCount : 0; // 判定達成率
		var comboRate = noteCount > 0 ? combo / noteCount : 0; // コンボ達成率
		var grade = getScore(seq, "grade");
		grade = insertStr(grade, grade.length - 2, '.');

		const NOBI_RATE = 0.3; // 成長率(0～1)

		// 目標スコア算出
		var nobiJudge = Math.min((1- judgeRate) * NOBI_RATE + judgeRate, 1);
		var nobiCombo = Math.min((1- comboRate) * NOBI_RATE + comboRate, 1);
		var nobiScore = 1000000 * nobiJudge;
		var nobiRankRate = calcRankRate(nobiScore);
		var except = level * nobiRankRate * 1.5 * (0.85 * nobiJudge + 0.15 * nobiCombo); // 期待Grd
	
		var row = [
			seq,
			title,
			level,
			score,
			rank,
			miss,
			combo,
			noteCount,
			judgeRate,
			comboRate,
			grade,
			'',
			except,
		];
		
		table.push(row);
	});

	// グレード列の番号
	const COL_EXCEPT = 12;
	const COL_GRADE = 10;

	// グレードの降順に並べ替え
	table.sort(function(a, b) {
		return parseFloat(b[COL_GRADE]) - parseFloat(a[COL_GRADE]);
	});

	var maxGrd = table[1][COL_GRADE]; // 最大グレード
	var minGrd = table[Math.min(table.length, 50)][COL_GRADE]; // 下限グレード

	table[0].push('');
	// table[0].push('最大Grd');
	// table[0].push(maxGrd);
	table[0].push('下限Grd');
	table[0].push(minGrd);

	for (var row = 1; row < table.length; row++) {

		// グレード対象かどうか
		var grdTarget = row <= 50;

		// グレード対象かどうかを追加
		table[row][COL_GRADE+1] = grdTarget ? "〇" : "-";

		// 伸びしろ（SランクGrd期待値と下限Grdの差）を算出
		var except = table[row][COL_EXCEPT];
		var grd = table[row][COL_GRADE];
		var nobi = parseFloat(except) - parseFloat(grdTarget ? grd :minGrd);
		nobi = Math.max(nobi, 0); // 0以下は丸める
		var except = table[row].push(nobi);
	}

	sendResponse(table);
});