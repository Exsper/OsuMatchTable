// ==UserScript==
// @name         osu! 单局mp表格生成工具
// @namespace    https://github.com/Exsper/OsuMatchTable
// @version      1.0.3
// @description  一个简单的表格生成工具，获取单局mp网页上的数据并生成表格
// @supportURL   https://github.com/Exsper/OsuMatchTable/issues
// @author       Exsper
// @match        https://osu.ppy.sh/community/matches/*
// @grant        none
// ==/UserScript==


var $ = window.$;

//隐藏0分成绩
var hideZeroScore = true;



// 从mods-box中获取Mods
function GetMods($mods){
    var mods = [];
    if ($(".mod--4K",$mods).length > 0) mods.push("4K"); //也可使用title
    if ($(".mod--5K",$mods).length > 0) mods.push("5K");
    if ($(".mod--6K",$mods).length > 0) mods.push("6K");
    if ($(".mod--7K",$mods).length > 0) mods.push("7K");
    if ($(".mod--8K",$mods).length > 0) mods.push("8K");
    if ($(".mod--9K",$mods).length > 0) mods.push("9K");
    if ($(".mod--AP",$mods).length > 0) mods.push("AutoPilot");
    if ($(".mod--DT",$mods).length > 0) mods.push("DoubleTime");
    if ($(".mod--EZ",$mods).length > 0) mods.push("Easy");
    if ($(".mod--FI",$mods).length > 0) mods.push("Fader");
    if ($(".mod--FL",$mods).length > 0) mods.push("FlashLight");
    if ($(".mod--HD",$mods).length > 0) mods.push("Hidden");
    if ($(".mod--HR",$mods).length > 0) mods.push("HardRock");
    if ($(".mod--HT",$mods).length > 0) mods.push("HalfTime");
    if ($(".mod--NC",$mods).length > 0) mods.push("NightCore");
    if ($(".mod--NF",$mods).length > 0) mods.push("NoFail");
    if ($(".mod--NM",$mods).length > 0) mods.push("NoMod");
    if ($(".mod--PF",$mods).length > 0) mods.push("Perfect");
    if ($(".mod--Relax",$mods).length > 0) mods.push("Relax");
    if ($(".mod--SD",$mods).length > 0) mods.push("SuddenDeath");
    if ($(".mod--SO",$mods).length > 0) mods.push("SpunOut");
    if ($(".mod--TD",$mods).length > 0) mods.push("TouchDevice");
    if (mods.length == 0) mods.push("NoMod");

    return mods;
}



// 获取比赛页面上的所有数据
function GetMatchData(){
    var matchData = {};
    matchData.mpTitle = $(".osu-page-header__title:not(.osu-page-header__title--small)").text();
    matchData.matches = [];
    var $matches = $(".mp-history-events__game");
    $.each($matches, function(i, match){
        var $game = $(".mp-history-game", match);
        if ($game.length <= 0) return true;
        else {
            var gameData = {};

            // 单局比赛信息
            gameData.gameInfo = {};
            var $gameHeader = $(".mp-history-game__header", $game);
            gameData.gameInfo.mapLink = $gameHeader.attr("href");
            var $gameStats = $(".mp-history-game__stats-box", $gameHeader).children(".mp-history-game__stat");
            gameData.gameInfo.timeSpan = $gameStats[0].innerText;
            gameData.gameInfo.gameMode = $gameStats[1].innerText;
            gameData.gameInfo.sortType = $gameStats[2].innerText;
            var $gameMetadata = $(".mp-history-game__metadata-box", $gameHeader);
            gameData.gameInfo.mapTitle = $gameMetadata.children(".mp-history-game__metadata--title").text();
            gameData.gameInfo.artist = $gameMetadata.children(".mp-history-game__metadata--artist").text();
            var $gameMods = $(".mp-history-game__mods", $gameHeader);
            gameData.gameInfo.mapMod = GetMods($gameMods);
            var $gameTeamType = $(".mp-history-game__team-type", $gameHeader);
            gameData.gameInfo.teamType = $gameTeamType.attr("title");

            //单局比赛成绩
            gameData.scoreInfo = [];
            var $gameScores = $(".mp-history-game__player-score.mp-history-player-score", $game);
            $.each($gameScores, function(i, score){
                var scoreData = {};
                var style = $(".mp-history-player-score__shapes", score).attr("style");
                var teamColorStringStart = style.indexOf("team-") + 5;
                var teamColorStringEnd = style.indexOf(".svg");
                scoreData.teamColor = style.slice(teamColorStringStart, teamColorStringEnd); //blue, red, none
                scoreData.player = $(".mp-history-player-score__username", score).text();
                scoreData.playerLink = $(".mp-history-player-score__username", score).attr("href");
                scoreData.isFailed = ($(".mp-history-player-score__failed", score).length > 0);
                scoreData.playerCountry = $(".flag-country", score).attr("title");
                var $playerMods = $(".mp-history-player-score__mods-box", score);
                scoreData.playerMods = GetMods($playerMods);
                var $playerCombo = $(".mp-history-player-score__stat--combo", score);
                scoreData.playerCombo = parseInt($playerCombo.children(".mp-history-player-score__stat-number").text().replace(/,/g, ''));
                var $playerAccuracy = $(".mp-history-player-score__stat--accuracy", score);
                scoreData.playerAccuracy = $playerAccuracy.children(".mp-history-player-score__stat-number").text().replace("%","")/100;
                var $playerScore = $(".mp-history-player-score__stat--score", score);
                scoreData.playerScore = parseInt($playerScore.children(".mp-history-player-score__stat-number").text().replace(/,/g, ''));
                //300,100,50,miss个数所在的元素没有独特的class供定位，暂时不进行获取

                gameData.scoreInfo.push(scoreData);
            });

            // 单局团队成绩
            gameData.gameResult = {};
            var $gameTeamScores = $(".mp-history-game__team-scores", $game);
            if ($gameTeamScores.length > 0){
                var $redTeamScore = $(".mp-history-game__team-score--red", $gameTeamScores);
                gameData.gameResult.redTeamScore = parseInt($redTeamScore.children(".mp-history-game__team-score-text--score").text().replace(/,/g, ''));
                var $blueTeamScore = $(".mp-history-game__team-score--blue", $gameTeamScores);
                gameData.gameResult.blueTeamScore = parseInt($blueTeamScore.children(".mp-history-game__team-score-text--score").text().replace(/,/g, ''));
            }
            var $gameTeamResults = $(".mp-history-game__results", $game);
            if ($gameTeamResults.length > 0){
                gameData.gameResult.resultText = $(".mp-history-game__results-text:not(.mp-history-game__results-text--score)", $gameTeamResults).text();
                gameData.gameResult.resultTextScore = $(".mp-history-game__results-text--score", $gameTeamResults).text();
            }
            matchData.matches.push(gameData);
        }
    });

    //console.log(matchData);
    return matchData;
}





function CreateRoundTable(roundId, oneMatchData, container){
    $("<p style='margin-top:50px; font-size:24px;'>round " + roundId + "</p>").appendTo(container);

    // 地图信息
    var mapInfoTable = $("<table>", {id:"mapInfo-" + roundId, style:"font-size:16px; margin:auto", border:"1"}).appendTo(container);
    var tr;
    tr = $("<tr>").appendTo(mapInfoTable);
    $("<td>谱面：</td>").appendTo(tr);
    $('<td><a href="' + oneMatchData.gameInfo.mapLink+'" target="_blank">' + oneMatchData.gameInfo.mapTitle + '</a></td>').appendTo(tr);
    tr = $("<tr>").appendTo(mapInfoTable);
    $("<td>作者：</td>").appendTo(tr);
    $("<td>" + oneMatchData.gameInfo.artist + "</td>").appendTo(tr);
    tr = $("<tr>").appendTo(mapInfoTable);
    $("<td>模式：</td>").appendTo(tr);
    $("<td>" + oneMatchData.gameInfo.gameMode + "</td>").appendTo(tr);
    tr = $("<tr>").appendTo(mapInfoTable);
    $("<td>Mod：</td>").appendTo(tr);
    $("<td>" + oneMatchData.gameInfo.mapMod.join(",") + "</td>").appendTo(tr);
    tr = $("<tr>").appendTo(mapInfoTable);
    $("<td>胜利条件：</td>").appendTo(tr);
    $("<td>" + oneMatchData.gameInfo.sortType + "</td>").appendTo(tr);
    tr = $("<tr>").appendTo(mapInfoTable);
    $("<td>分组方式：</td>").appendTo(tr);
    $("<td>" + oneMatchData.gameInfo.teamType + "</td>").appendTo(tr);
    tr = $("<tr>").appendTo(mapInfoTable);
    $("<td>比赛时间：</td>").appendTo(tr);
    $("<td>" + oneMatchData.gameInfo.timeSpan + "</td>").appendTo(tr);


    // 比赛成绩
    var mapScoreTable = $("<table>", {id:"mapScore-" + roundId, style:"width:100%; font-size:16px; margin:auto", border:"1"}).appendTo(container);
    var mapScoreTableThead = $("<thead>").appendTo(mapScoreTable);
    var mapScoreTableTbody = $("<tbody>").appendTo(mapScoreTable);
    //标题行
    var mapScoreTableTheadTr = $("<tr>",{style:"background-color: #805f86;"}).appendTo(mapScoreTableThead);
    $("<td>", {text:"团队", "class":"mapScoreTable-Team"}).appendTo(mapScoreTableTheadTr);
    $("<td>", {text:"玩家", "class":"mapScoreTable-Player"}).appendTo(mapScoreTableTheadTr);
    $("<td>", {text:"国家", "class":"mapScoreTable-Country"}).appendTo(mapScoreTableTheadTr);
    $("<td>", {text:"Mod", "class":"mapScoreTable-Mod"}).appendTo(mapScoreTableTheadTr);
    $("<td>", {text:"连击", "class":"mapScoreTable-Combo"}).appendTo(mapScoreTableTheadTr);
    $("<td>", {text:"准确率", "class":"mapScoreTable-Accuracy"}).appendTo(mapScoreTableTheadTr);
    $("<td>", {text:"得分", "class":"mapScoreTable-Score"}).appendTo(mapScoreTableTheadTr);
    //填充表格
    for(var i = 0; i < oneMatchData.scoreInfo.length; ++i){
        if (hideZeroScore && (oneMatchData.scoreInfo[i].playerScore <= 0)) continue;
        tr = $("<tr>").appendTo(mapScoreTableTbody);
        if (oneMatchData.scoreInfo[i].isFailed) tr.css("background-color","#ff2525");
        else if (oneMatchData.scoreInfo[i].teamColor == "red") tr.css("background-color","#ffd5dd");
        else if (oneMatchData.scoreInfo[i].teamColor == "blue") tr.css("background-color","#bfdcf5");
        $("<td>" + oneMatchData.scoreInfo[i].teamColor + "</td>").appendTo(tr);
        $('<td><a href="' + oneMatchData.scoreInfo[i].playerLink + '" target="_blank">' + oneMatchData.scoreInfo[i].player + '</a></td>').appendTo(tr);
        $("<td>" + oneMatchData.scoreInfo[i].playerCountry + "</td>").appendTo(tr);
        $("<td>" + oneMatchData.scoreInfo[i].playerMods.join(",") + "</td>").appendTo(tr);
        $("<td>" + oneMatchData.scoreInfo[i].playerCombo + "</td>").appendTo(tr);
        $("<td>" + Number(oneMatchData.scoreInfo[i].playerAccuracy*100).toFixed(2) + "%</td>").appendTo(tr);
        $("<td>" + oneMatchData.scoreInfo[i].playerScore + "</td>").appendTo(tr);
    }
    if (Object.keys(oneMatchData.gameResult).length !== 0){
        var mapResultTable = $("<table>", {id:"mapResult-" + roundId, style:"width:100%; font-size:16px; margin:auto", border:"1"}).appendTo(container);
        tr = $("<tr>").appendTo(mapResultTable);
        $("<td>红队总分：" + oneMatchData.gameResult.redTeamScore + "</td>").appendTo(tr);
        $("<td>蓝队总分：" + oneMatchData.gameResult.blueTeamScore + "</td>").appendTo(tr);
        $("<td>" + oneMatchData.gameResult.resultText + oneMatchData.gameResult.resultTextScore + "</td>").appendTo(tr);
    }
}


function CreateTable(){
    var matchData = GetMatchData();
    var container = $("<div>", {id:"matchDataTable", style:"text-align:center"}).appendTo(".mp-history-events");
    $("<p style='margin-top:100px; font-size:32px;'>" + matchData.mpTitle + "</p>").appendTo(container);

    var outputCountryResultAsExcel = $('<button type="button" style="color: #000">导出</button>').appendTo(container);
    outputCountryResultAsExcel.click(function() {
        tableToExcel("matchDataTable");
    });

    for(var i = 0; i < matchData.matches.length; ++i){
        CreateRoundTable(i+1, matchData.matches[i], container);
    }
}

//导出为excel
var tableToExcel = (function() {
    var uri = 'data:application/vnd.ms-excel;base64,',
        template = '<html><head><meta charset="UTF-8"></head><body><table>{table}</table></body></html>',
        base64 = function(s) { return window.btoa(unescape(encodeURIComponent(s))); },
        format = function(s, c) {
            return s.replace(/{(\w+)}/g,
                             function(m, p) { return c[p]; }); };
    return function(table, name) {
        if (!table.nodeType) table = document.getElementById(table);
        var ctx = {worksheet: name || 'Worksheet', table: table.innerHTML};
        window.location.href = uri + base64(format(template, ctx));
    };
})();


function showFullHistory(){
    // 显示全部记录
    function checkFullHistory() {
        CreateTable();
        /*
        if ($(".mp-history-content__show-more-box").length > 0){
            if ($(".mp-history-content__show-more").length > 0){
                $(".mp-history-content__show-more").click();
            }
            setTimeout(checkFullHistory, 100);
        }
        else {
            CreateTable();
        }
        */
    }

    checkFullHistory();
}


window.onload = function(){
    showFullHistory();
}

