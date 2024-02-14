let songList;
let searchResult = [];
let nowSongNum;
let player;
let prevSongNum;
let countUpSecondsInterval;
let countUpSecondsFlag = 0;
let playerFlag = 0;
let repeatFlag = 0;
let shuffleFlag = 0;
let history;

fetch(
  "https://script.google.com/macros/s/AKfycbytNLtf2bt9aYvo2lkd2YVkoZDiIYEn-djJQku-gtDS1oNR1SCM5B_4MSmSECJINWJ2/exec"
)
  .then((response) => response.json())
  .then((data) => {
    songList = data;

    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    // tracksを作成
    const tracksFragment = new DocumentFragment();
    for (let i = songList.length - 1; i >= 0; i--) {
      // テンプレートを複製
      const clone = document.getElementById("trackTemplate").content.cloneNode(true);
      // 複製した要素にデータを挿入
      clone.querySelector(".track").id = `trackNum${i}`;
      clone.querySelector(".track-button").value = i;
      clone.querySelector(
        ".track-button-video-thumb"
      ).src = `https://img.youtube.com/vi_webp/${songList[i].videoId}/default.webp`;
      clone.querySelector(".track-button-info-title").textContent = songList[i].songTitle;
      clone.querySelector(".track-button-info-title").title = songList[i].songTitle;
      clone.querySelector(".track-button-info-artist").textContent = songList[i].artist;
      clone.querySelector(".track-button-info-artist").title = songList[i].artist;
      clone.querySelector(
        ".track-ytlink"
      ).href = `https://youtu.be/${songList[i].videoId}?t=${songList[i].startSeconds}`;
      clone.querySelector(".track-ytlink").title = songList[i].videoTitle;
      clone.querySelector(".track-duration").textContent = formatSeconds(songList[i].duration);
      //　fragmentに追加
      tracksFragment.appendChild(clone);
    }
    // #tracksにtrackを追加
    document.getElementById("tracks").appendChild(tracksFragment);

    searchResult = songList.map((_, index) => index);

    entireNum.textContent = songList.length;
    searchResultNum.textContent = searchResult.length;
    // 生成したボタンたちにイベントリスナーを追加
    const trackButtons = document.getElementsByClassName("track-button");
    for (let trackButton of trackButtons) {
      trackButton.addEventListener("click", (e) => playSong(Number(e.currentTarget.value)));
    }
    // URLパラメータチェック
    const searchParams = new URLSearchParams(window.location.search);
    const queryKeyName = "q";
    if (searchParams.has(queryKeyName)) {
      const typeKeyName = "type";
      const query = searchParams.get(queryKeyName);
      const type = searchParams.get(typeKeyName);
      searchText.value = query;
      if (type) {
        searchOptionSongTitle.checked = Number(type.charAt(0));
        searchOptionArtist.checked = Number(type.charAt(1));
        searchOptionVideoTitle.checked = Number(type.charAt(2));
        searchOptionPostDate.checked = Number(type.charAt(3));
      }
      searchSong();
    }
    // historyインスタンスを作成
    history = new History(searchResult[searchResult.length - 1]);
  })
  .catch((error) => {
    window.alert(
      error +
        "【エラー】\nsongListの取得に失敗しました。しばらく時間をおいて再度アクセスしてください。"
    );
  });

function onYouTubeIframeAPIReady() {
  player = new YT.Player("player", {
    playervars: {
      rel: 0,
    },
    events: {
      onReady: onPlayerReady,
      onStateChange: onPlayerStateChange,
      onError: onPlayerError,
    },
    host: "https://www.youtube-nocookie.com",
  });
}

function onPlayerReady() {
  player.cueVideoById({
    videoId: songList[history.getCurrentTrackNum()]["videoId"],
    startSeconds: songList[history.getCurrentTrackNum()]["startSeconds"],
    endSeconds: songList[history.getCurrentTrackNum()]["endSeconds"],
  });

  insertSongInfo();

  document.querySelector("body").classList.add("loaded");
}

function onPlayerStateChange(e) {
  // 再生終了のとき
  if (e.data == 0 && playerFlag == 1) {
    toPlayIcon();
    playSong();
    playerFlag = 0;
    stopCountingUpSeconds();
  }

  // 一時停止のとき
  else if (e.data == 2) {
    toPlayIcon();
    playerFlag = 0;
    stopCountingUpSeconds();
  }

  // バッファリング中のとき
  else if (e.data == 3) {
    toPauseIcon();
    if (nowSongNum != prevSongNum) {
      insertSongInfo();
    }
  }

  // 再生中のとき
  else if (e.data == 1) {
    toPauseIcon();
    playerFlag = 1;
    if (countUpSecondsFlag == 0) {
      startCountingUpSeconds();
    }
  }
}

function onPlayerError() {
  insertSongInfo();
  playerFlag = 0;
  toPlayIcon();

  setTimeout(() => {
    if (playerFlag == 0) {
      playSong();
    }
  }, 5000);
}

function insertSeekBarValue(seconds) {
  if (typeof seconds == "number") {
    menuTimeSeekBar.value = seconds;
  } else {
    seconds = menuTimeSeekBar.value;
  }

  const percent = (seconds / songList[history.getCurrentTrackNum()].duration) * 100;
  menuTimeSeekBar.style.backgroundImage = `linear-gradient(to right, var(--brand-color) ${percent}%, var(--gray1) ${percent}%)`;
}

function formatSeconds(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainderSeconds = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return minutes + ":" + remainderSeconds;
}

function insertSongInfo() {
  // 現在の行を目立たせる
  document.getElementsByClassName("current")[0]?.classList.remove("current");
  document.getElementById(`trackNum${history.getCurrentTrackNum()}`).classList.add("current");
  // .playing-bar-informationの情報を更新
  const currentTrack = songList[history.getCurrentTrackNum()];
  playingBarThumb.src = `https://i.ytimg.com/vi_webp/${
    songList[history.getCurrentTrackNum()].videoId
  }/default.webp`;
  playingBarSongTitle.textContent = currentTrack.songTitle;
  playingBarSongTitle.title = currentTrack.songTitle;
  playingBarArtist.textContent = currentTrack.artist;
  playingBarArtist.title = currentTrack.artist;
  playingBarVideoTitle.textContent = currentTrack.videoTitle;
  playingBarVideoTitle.title = currentTrack.videoTitle;
  playingBarPostDate.textContent = currentTrack.postDate.substring(0, 10);
  playingBarPostDate.title = currentTrack.postDate;
  // .menu-timeの情報を更新
  insertSeekBarValue(0);
  menuTimeSeekBar.max = currentTrack.duration;
  menuTimeTextWhole.textContent = formatSeconds(currentTrack.duration);
}

function toPlayIcon() {
  playingBarPause.classList.add("to-hide");
  playingBarPlay.classList.remove("to-hide");
  menuControllerPause.classList.add("to-hide");
  menuControllerPlay.classList.remove("to-hide");

  playingBarStatus.setAttribute("title", "再生");
  menuControllerStatus.setAttribute("title", "再生");
}

function toPauseIcon() {
  playingBarPause.classList.remove("to-hide");
  playingBarPlay.classList.add("to-hide");
  menuControllerPause.classList.remove("to-hide");
  menuControllerPlay.classList.add("to-hide");

  playingBarStatus.setAttribute("title", "一時停止");
  menuControllerStatus.setAttribute("title", "一時停止");
}

function getSongCurrentTime() {
  // 曲の経過時間を計算する
  const currentSeconds = Math.round(
    player.getCurrentTime() - songList[history.getCurrentTrackNum()].startSeconds
  );
  // .menu-timeの情報を更新する
  insertSeekBarValue(currentSeconds);
  menuTimeTextNow.textContent = formatSeconds(currentSeconds);
}

function startCountingUpSeconds() {
  countUpSecondsFlag = 1;
  countUpSecondsInterval = setInterval(getSongCurrentTime, 250);
}

function stopCountingUpSeconds() {
  clearInterval(countUpSecondsInterval);
  countUpSecondsFlag = 0;
}

function playSong(songNum) {
  prevSongNum = nowSongNum;

  // 曲を指定されたとき
  if (typeof songNum == "number") {
    nowSongNum = songNum;
  }
  // 連続で再生されたとき
  else if (repeatFlag == 0) {
    if (searchResult.length != 0) {
      if (shuffleFlag == 0) {
        const checkForExistence = searchResult.indexOf(nowSongNum);

        // 通常再生で最後の曲になったとき
        if (checkForExistence <= 0) {
          nowSongNum = searchResult[searchResult.length - 1];
        }
        // 通常再生のとき
        else {
          nowSongNum = searchResult[checkForExistence - 1];
        }
      }
      // シャッフル再生のとき
      else {
        nowSongNum = searchResult[Math.floor(Math.random() * searchResult.length)];
      }
    }
    // 検索条件でリストが空のとき
    else {
      window.alert("検索条件に一致する項目がないため、次の曲を再生できません。");
      return;
    }
  }
  // リピート再生のとき、nowSongNumは変化なし

  player.loadVideoById({
    videoId: songList[nowSongNum]["videoId"],
    startSeconds: songList[nowSongNum]["startSeconds"],
    endSeconds: songList[nowSongNum]["endSeconds"],
  });
}

searchForm.addEventListener("input", searchSong);
document
  .querySelector('#searchOption input[type="checkbox"]')
  .addEventListener("change", searchSong);
function searchSong() {
  const searchWord = searchText.value;
  const songTitleChecked = searchOptionSongTitle.checked;
  const artistChecked = searchOptionArtist.checked;
  const videoTitleChecked = searchOptionVideoTitle.checked;
  const postDateChecked = searchOptionPostDate.checked;

  const currentTitle = `${
    searchWord !== "" ? `${searchWord} - ` : ""
  }ちまうた｜町田ちま非公式ファンサイト`;
  document.title = currentTitle;

  const shareURL = location.origin;
  const currentShareURL = new URL(shareURL);
  currentShareURL.search = new URLSearchParams({
    q: searchWord,
    type: [songTitleChecked, artistChecked, videoTitleChecked, postDateChecked]
      .map((v) => Number(v))
      .join(""),
  });
  history.replaceState("", currentTitle, currentShareURL.toString());

  const baseURL =
    "https://x.com/intent/tweet?ref_src=twsrc%5Etfw%7Ctwcamp%5Ebuttonembed%7Ctwterm%5Eshare%7Ctwgr%5E";
  const currentBaseURL = new URL(baseURL);
  currentBaseURL.search = new URLSearchParams({
    url: currentShareURL.toString(),
    text: currentTitle,
  });
  searchOptionShare.href = currentBaseURL.toString();

  if (searchWord == "") {
    toClearSearchValue.classList.add("invisible");
  } else {
    toClearSearchValue.classList.remove("invisible");
  }

  const searchWordRegex = new RegExp(searchWord, "i");

  searchResult = songList.flatMap((track, i) => {
    const testOfSongTitle = songTitleChecked && searchWordRegex.test(track.songTitle);
    const testOfArtist = artistChecked && searchWordRegex.test(track.artist);
    const testOfVideoTitle = videoTitleChecked && searchWordRegex.test(track.videoTitle);
    const testOfPostDate = postDateChecked && searchWordRegex.test(track.postDate);

    const beingProcessedTrackRow = document.getElementById(`trackNum${i}`);

    if (testOfSongTitle || testOfArtist || testOfVideoTitle || testOfPostDate) {
      beingProcessedTrackRow.classList.remove("to-hide");
      return i;
    } else {
      beingProcessedTrackRow.classList.add("to-hide");
      return [];
    }
  });

  searchResultNum.textContent = searchResult.length;
}

searchText.addEventListener("keypress", (e) => {
  if (e.key == "Enter") {
    e.preventDefault();
  }
});

toClearSearchValue.addEventListener("click", () => {
  searchText.value = "";
  searchText.focus();
  searchSong();
});

window.addEventListener("scroll", () => {
  if (window.scrollY > window.innerHeight) {
    toPageTop.classList.remove("invisible");
  } else {
    toPageTop.classList.add("invisible");
  }
});

toPageTop.addEventListener("click", () => {
  scrollTo({
    top: 0,
    behavior: "smooth",
  });
});

// playingBarのサムネイルがクリックされたら
playingBarThumbButton.addEventListener("click", () => {
  // 現在選択されているトラックの行を取得
  const currentTrackRow = document.getElementById(`trackNum${history.getCurrentTrackNum()}`);
  // その行がある位置までスクロール
  currentTrackRow.scrollIntoView({
    behavior: "smooth",
    block: "center",
  });
  // フォーカスを設定
  currentTrackRow.focus({ preventScroll: true });
});

playingBarStatus.addEventListener("click", changePlayerStatus);
menuControllerStatus.addEventListener("click", changePlayerStatus);
function changePlayerStatus() {
  if (playerFlag == 1) {
    toPlayIcon();
    player.pauseVideo();
    playerFlag = 0;
  } else {
    toPauseIcon();
    player.playVideo();
    playerFlag = 1;
  }
}

menuButton.addEventListener("click", () => {
  document.querySelector("body").classList.toggle("open-nav");

  if (menuButton.getAttribute("aria-expanded") == "false") {
    menuButton.setAttribute("aria-expanded", true);
    menuButton.setAttribute("title", "メニューを閉じる");
  } else {
    menuButton.setAttribute("aria-expanded", false);
    menuButton.setAttribute("title", "メニューを開く");
  }
});

menuControllerRepeat.addEventListener("click", () => {
  if (repeatFlag == 1) {
    menuControllerRepeat.classList.add("disabled");
    menuControllerRepeat.setAttribute("title", "1曲リピートを有効にする");
    repeatFlag = 0;
  } else {
    menuControllerRepeat.classList.remove("disabled");
    menuControllerRepeat.setAttribute("title", "1曲リピートを無効にする");
    repeatFlag = 1;
  }
});

menuControllerPrev.addEventListener("click", () => {
  playSong(nowSongNum);
});

menuControllerNext.addEventListener("click", playSong);

menuControllerShuffle.addEventListener("click", () => {
  if (shuffleFlag == 1) {
    menuControllerShuffle.classList.add("disabled");
    menuControllerShuffle.setAttribute("title", "シャッフルを有効にする");
    shuffleFlag = 0;
  } else {
    menuControllerShuffle.classList.remove("disabled");
    menuControllerShuffle.setAttribute("title", "シャッフルを無効にする");
    shuffleFlag = 1;
  }
});

menuTimeSeekBar.addEventListener("input", () => {
  stopCountingUpSeconds();
  insertSeekBarValue();
  menuTimeTextNow.textContent = formatSeconds(menuTimeSeekBar.value);
});

// シークバーが変更されたとき
menuTimeSeekBar.addEventListener("change", () => {
  // TODO: なんであるのかあんまりわかってない
  playerFlag = 0;
  // 指定された時間にシークする
  player.seekTo(
    songList[history.getCurrentTrackNum()].startSeconds + Number(menuTimeSeekBar.value)
  );
  // 再生する
  player.playVideo();
});
