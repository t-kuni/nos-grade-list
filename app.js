
console.log('testaaa');

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
