// Popup script for Paragraph Translator
document.addEventListener('DOMContentLoaded', function() {
  const difficultySlider = document.getElementById('difficultySlider');
  const difficultyValue = document.getElementById('difficultyValue');
  const toggleSwitch = document.getElementById('toggleSwitch');
  const statusDiv = document.getElementById('status');
  
  // 난이도 배열
  const difficultyLevels = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'];
  
  // 슬라이더 값을 난이도로 변환하는 함수
  function getDifficultyFromSlider(value) {
    return difficultyLevels[value];
  }
  
  // 난이도를 슬라이더 값으로 변환하는 함수
  function getSliderFromDifficulty(difficulty) {
    return difficultyLevels.indexOf(difficulty);
  }
  
  // 현재 상태 확인
  chrome.storage.local.get(['isActive', 'difficulty'], function(result) {
    const isActive = result.isActive || false;
    const difficulty = result.difficulty || 'a1';
    
    toggleSwitch.checked = isActive;
    difficultySlider.value = getSliderFromDifficulty(difficulty);
    difficultyValue.textContent = difficulty.toUpperCase();
    
    updateUI(isActive);
  });
  
  // 토글 스위치 변경 이벤트
  toggleSwitch.addEventListener('change', function() {
    const isActive = this.checked;
    
    // 상태 저장
    chrome.storage.local.set({isActive: isActive});
    
    // 현재 탭에 메시지 전송
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: isActive ? 'activate' : 'deactivate'
      });
    });
    
    updateUI(isActive);
  });
  
  // 슬라이더 변경 이벤트
  difficultySlider.addEventListener('input', function() {
    const difficulty = getDifficultyFromSlider(this.value);
    difficultyValue.textContent = difficulty.toUpperCase();
    
    // 난이도 값 저장
    chrome.storage.local.set({difficulty: difficulty});
    
    // 현재 탭에 난이도 변경 메시지 전송
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'difficultyChanged',
        difficulty: difficulty
      });
    });
  });
  
  function updateUI(isActive) {
    if (isActive) {
      statusDiv.textContent = '활성화됨';
      statusDiv.className = 'status active';
    } else {
      statusDiv.textContent = '비활성화됨';
      statusDiv.className = 'status inactive';
    }
  }
});

