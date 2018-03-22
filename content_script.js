
function getScore(seq, key) {
	return $("[data-pdataMap~='music_list.music[" + seq + "].sheet[2]." + key + "']").attr("data-pdataval");
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
		
		var level = parseInt(getScore(seq, "level"));
		var score = parseInt(getScore(seq, "best_score"));
		var rank = getScore(seq, "rank");
		var sjust = parseInt(getScore(seq, "best_judge_superjust"));
		var just = parseInt(getScore(seq, "best_judge_just"));
		var good = parseInt(getScore(seq, "best_judge_good"));
		var miss = parseInt(getScore(seq, "best_judge_miss"));
		var near = parseInt(getScore(seq, "best_judge_near"));
		var combo = parseInt(getScore(seq, "max_combo"));
		var grade = getScore(seq, "grade");
		grade = insertStr(grade, grade.length - 2, '.'); // Floatにすると誤差がでるので文字列のまま
		var datetime =  getScore(seq, "best_time") + ":00";
	
		var result = {
			seq: seq,
			title: title,
			level: level,
			score: score,
			rank: rank,
			sjust: sjust,
			just: just,
			good: good,
			miss: miss,
			near: near,
			combo: combo,
			grade: grade,
			datetime: datetime,
		};
		
		resultList.push(result);
	});

	sendResponse(resultList);
});