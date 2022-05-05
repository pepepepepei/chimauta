let songList;
let searchResult = [];
let prevSongNum;
let nowSongNum;
let player;
let playerFlag = 0;
let repeatFlag = 0;
let shuffleFlag = 0;
let repeatCount = 1;
// let songHistory = [];
// let historyFlag = 0;


function escapeHTML(str) {
  if (typeof str !== 'string') {
    return str;
  }
  return str.replace(/[&'`"<>]/g, function (match) {
    return {
      '&': '&amp;',
      "'": '&#x27;',
      '`': '&#x60;',
      '"': '&quot;',
      '<': '&lt;',
      '>': '&gt;',
    }[match]
  });
}


fetch('https://script.google.com/macros/s/AKfycbxjLZhe1S-tRL5lBLuQjv_cFj2WffT0RUUfUILQGZOioj-IqiCV2uDHFeR1zUoMGjgN/exec')
  .then(response => {
    return response.json();
  })
  .then(data => {
    songList = data;

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    let tableInsert = '';
    for (let i = songList.length - 1; i >= 0; i--) {
      tableInsert += '<tr id="rowOfSongNum' + i + '"><td class="video-thumb"><label class="clickable video-thumb-area" for="buttonOfSongNum' + i + '"><img class="video-thumb-img" src="https://i.ytimg.com/vi_webp/' + songList[i]['videoId'] + '/default.webp"></label></td><td class="song-title"><label class="clickable" title="' + songList[i]['songTitle'] + '"><button type="button" class="song-title-button" id="buttonOfSongNum' + i + '" value="' + i + '">' + songList[i]['songTitle'] + '</button></label></td><td class="artist"><label class="clickable" for="buttonOfSongNum' + i + '" title="' + songList[i]['artist'] + '"><span class="artist-text">' + songList[i]['artist'] + '</span></label></td><td class="video-title"><a class="video-title-link" href="https://youtu.be/' + songList[i]['videoId'] + '?t=' + songList[i]['startSeconds'] + '" target="_blank" rel="noopener noreferrer" title="' + songList[i]['videoTitle'] + '">' + songList[i]['videoTitle'] + '</a></td><td class="post-time"><span class="post-time-text">' + songList[i]['postDate'] + '</span></td></tr>';

      searchResult[i] = i;
    }

    tableArea.innerHTML = tableInsert;
    entireNum.innerText = songList.length;
    searchResultNum.innerText = searchResult.length;

    const songButtons = document.getElementsByClassName('song-title-button');
    for (let songButton of songButtons) {
      songButton.addEventListener('click', (e) => {
        playSong(Number(e.target.value));
      });
    }
  })
  .catch(error => {
    window.alert('【エラー】\nsongListの取得に失敗しました。しばらく時間をおいて再度アクセスしてください。');
  });


function onYouTubeIframeAPIReady() {
  nowSongNum = songList.length - 1;

  player = new YT.Player('player', {
    playervars: {
      'rel': 0
    },
    events: {
      'onReady': onPlayerReady,
      'onStateChange': onPlayerStateChange,
      'onError': onPlayerError
    }
  });
}


function insertSongInfo() {
  if (typeof (prevSongNum) == 'number') {
    document.getElementById('rowOfSongNum' + prevSongNum).classList.remove('now-song-row');
  }
  document.getElementById('rowOfSongNum' + nowSongNum).classList.add('now-song-row');

  playingBarThumb.setAttribute('src', 'https://i.ytimg.com/vi_webp/' + songList[nowSongNum]['videoId'] + '/default.webp');
  playingBarSongTitle.innerHTML = songList[nowSongNum]['songTitle'];
  playingBarSongTitle.setAttribute('title', songList[nowSongNum]['songTitle']);
  playingBarArtist.innerHTML = songList[nowSongNum]['artist'];
  playingBarArtist.setAttribute('title', songList[nowSongNum]['artist']);
}


function onPlayerReady() {
  player.cueVideoById({
    videoId: songList[nowSongNum]['videoId'],
    startSeconds: songList[nowSongNum]['startSeconds'],
    endSeconds: songList[nowSongNum]['endSeconds']
  });

  insertSongInfo();

  document.querySelector('body').classList.add('loaded');
}


function toPlayIcon() {
  playingBarPause.classList.add('to-hide');
  playingBarPlay.classList.remove('to-hide');
  menuControllerPause.classList.add('to-hide');
  menuControllerPlay.classList.remove('to-hide');

  playingBarStatus.setAttribute('title', '再生');
  menuControllerStatus.setAttribute('title', '再生');
}

function toPauseIcon() {
  playingBarPause.classList.remove('to-hide');
  playingBarPlay.classList.add('to-hide');
  menuControllerPause.classList.remove('to-hide');
  menuControllerPlay.classList.add('to-hide');

  playingBarStatus.setAttribute('title', '一時停止');
  menuControllerStatus.setAttribute('title', '一時停止');
}


// function pushToSongHistory(songNum) {
//   if (songNum !== songHistory.slice(-1)[0]) {
//     songHistory.push(songNum);
//   }
// }


// プレーヤーの状態が変更されたとき
function onPlayerStateChange(e) {
  // 再生終了のとき
  if (e.data == 0 && playerFlag == 1) {
    toPlayIcon();
    playSong();
    playerFlag = 0;
  }

  // 一時停止のとき
  else if (e.data == 2) {
    toPlayIcon();
    playerFlag = 0;
  }

  // 再生中のとき
  else if (e.data == 1 || e.data == 3) {
    toPauseIcon();
    playerFlag = 1;
    // pushToSongHistory(nowSongNum);
    // console.log(songHistory);
  }
  // console.log(e.data);
}


function onPlayerError() {
  playerFlag = 0;

  setTimeout(function () {
    if (playerFlag == 0) {
      playSong();
    }
  }, 5000);
}


function playSong(songNum) {
  let nextSongNum;

  // 曲を指定されたとき
  if (typeof (songNum) == 'number') {
    nextSongNum = songNum;
  }
  // 連続で再生されたとき
  else if (repeatFlag == 0) {
    if (searchResult.length != 0) {
      if (shuffleFlag == 0) {
        const checkForExistence = searchResult.indexOf(nowSongNum);

        // 通常再生で最後の曲になったとき
        if (checkForExistence <= 0) {
          nextSongNum = searchResult[searchResult.length - 1];
        }
        // 通常再生のとき
        else {
          nextSongNum = searchResult[checkForExistence - 1];
        }
      }
      // シャッフル再生のとき
      else {
        nextSongNum = searchResult[Math.floor(Math.random() * searchResult.length)];
      }
    }
    // 検索条件でリストが空のとき
    else {
      window.alert('検索条件に一致する項目がないため、次の曲を再生できません。');
      return false;
    }
  }
  // リピート再生のとき
  else {
    nextSongNum = nowSongNum;
  }

  // 同じ曲を2回以上連続で再生したとき
  if (prevSongNum == nowSongNum) {
    repeatCount++;

    // 同じ曲聞きすぎアラート
    const maxRepeatCount = 5;
    if (repeatCount > maxRepeatCount) {
      const confirm = window.confirm('同じ曲を' + repeatCount + '回連続で再生しました。たまには他の曲もいかがですか？');

      if (confirm) {
        repeatCount = 1;
        nextSongNum = searchResult[Math.floor(Math.random() * searchResult.length)];
      }
      else {
        player.cueVideoById({
          videoId: songList[nextSongNum]['videoId'],
          startSeconds: songList[nextSongNum]['startSeconds'],
          endSeconds: songList[nextSongNum]['endSeconds']
        });

        return false;
      }
    }
  }
  else {
    repeatCount = 1;
  }

  player.loadVideoById({
    videoId: songList[nextSongNum]['videoId'],
    startSeconds: songList[nextSongNum]['startSeconds'],
    endSeconds: songList[nextSongNum]['endSeconds']
  });

  prevSongNum = nowSongNum;
  nowSongNum = nextSongNum;
  insertSongInfo();
}


searchForm.addEventListener('input', searchSong);
function searchSong() {
  const searchWord = escapeHTML(searchText.value);

  if (searchWord == '') {
    toClearSearchValue.classList.add('invisible');
  }
  else {
    toClearSearchValue.classList.remove('invisible');
  }

  searchResult = songList.flatMap((value, index) => {
    if (value.songTitle.indexOf(searchWord) > -1 || value.artist.indexOf(searchWord) > -1) {
      document.getElementById('rowOfSongNum' + index).classList.remove('to-hide');

      return index;
    }
    else {
      document.getElementById('rowOfSongNum' + index).classList.add('to-hide');

      return [];
    }
  });

  searchResultNum.innerText = searchResult.length;
}


toClearSearchValue.addEventListener('click', function () {
  searchText.value = '';
  searchText.focus();
  searchSong();
})


searchForm.addEventListener('keypress', function (e) {
  const key = e.keyCode || e.charCode || 0;
  // 13はEnterキーのキーコード
  if (key == 13) {
    // アクションを行わない
    e.preventDefault();
  }
});


const screenHeight = window.innerHeight;
window.addEventListener('scroll', function () {
  if (window.pageYOffset > screenHeight) {
    toPageTop.classList.remove('invisible');
  }
  else {
    toPageTop.classList.add('invisible');
  }
});


toPageTop.addEventListener('click', function () {
  scrollTo({
    top: 0,
    behavior: 'smooth'
  });
});


playingBarThumbButton.addEventListener('click', function () {
  const rowOfNowSongNum = document.getElementById('buttonOfSongNum' + nowSongNum);

  rowOfNowSongNum.scrollIntoView({
    behavior: 'smooth',
    block: 'center'
  });

  rowOfNowSongNum.focus({ preventScroll: true });
});


playingBarStatus.addEventListener('click', changePlayerStatus);
menuControllerStatus.addEventListener('click', changePlayerStatus);
function changePlayerStatus() {
  if (playerFlag == 1) {
    toPlayIcon();
    player.pauseVideo();
    playerFlag = 0;
  }
  else {
    toPauseIcon();
    player.playVideo();
    playerFlag = 1;
  }
}


menuButton.addEventListener('click', function () {
  document.querySelector('body').classList.toggle('open-nav');

  if (menuButton.getAttribute('aria-expanded') == 'false') {
    menuButton.setAttribute('aria-expanded', true);
    menuButton.setAttribute('title', 'メニューを閉じる');
  }
  else {
    menuButton.setAttribute('aria-expanded', false);
    menuButton.setAttribute('title', 'メニューを開く');
  }
});


menuControllerRepeat.addEventListener('click', function () {
  if (repeatFlag == 1) {
    menuControllerRepeat.classList.add('disabled');
    menuControllerRepeat.setAttribute('title', '1曲リピートを有効にする');
    repeatFlag = 0;
  }
  else {
    menuControllerRepeat.classList.remove('disabled');
    menuControllerRepeat.setAttribute('title', '1曲リピートを無効にする');
    repeatFlag = 1;
  }
});


menuControllerPrev.addEventListener('click', function () {
  playSong(nowSongNum);

  // console.log('getCurrentTime: ' + player.getCurrentTime());
  // console.log('startSeconds: ' + songList[nowSongNum]['startSeconds']);

  // const elapsedTime = player.getCurrentTime() - songList[nowSongNum]['startSeconds'];

  // if (elapsedTime < 4) {
  //   playSong(nowSongNum + 1);
  // }
  // else {
  //   playSong(nowSongNum);
  // }
});


menuControllerNext.addEventListener('click', playSong);


menuControllerShuffle.addEventListener('click', function () {
  if (shuffleFlag == 1) {
    menuControllerShuffle.classList.add('disabled');
    menuControllerShuffle.setAttribute('title', 'シャッフルを有効にする');
    shuffleFlag = 0;
  }
  else {
    menuControllerShuffle.classList.remove('disabled');
    menuControllerShuffle.setAttribute('title', 'シャッフルを無効にする');
    shuffleFlag = 1;
  }
});
