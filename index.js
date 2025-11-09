const WS_URL = "ws://localhost:8082";
let socket = null;
let lastTitle = "";
let isActive = false;
let reconnectTimer = null;
let difficulty = 'a1'; // 기본 난이도

// UUID 생성 함수 (16바이트)
function generateUUID() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return array;
}

// CEFR BINARY 프로토콜로 데이터 패킹
function packCEFRData(pageTitle) {
  const TYPE = 0x02;
  const UUID = generateUUID();
  const PAGE = new TextEncoder().encode(pageTitle);
  const NUM_words = 1; // 단어 개수 (현재는 1개)
  const LEN_total = 1 + 16 + 4 + 2 + PAGE.length; // TYPE + UUID + LEN_total + NUM_words + PAGE
  
  const buffer = new ArrayBuffer(LEN_total);
  const view = new DataView(buffer);
  let offset = 0;
  
  // TYPE (1 byte)
  view.setUint8(offset, TYPE);
  offset += 1;
  
  // UUID (16 bytes)
  for (let i = 0; i < 16; i++) {
    view.setUint8(offset + i, UUID[i]);
  }
  offset += 16;
  
  // LEN_total (4 bytes, little-endian)
  view.setUint32(offset, LEN_total, true);
  offset += 4;
  
  // NUM_words (2 bytes, little-endian)
  view.setUint16(offset, NUM_words, true);
  offset += 2;
  
  // PAGE (utf8 string)
  for (let i = 0; i < PAGE.length; i++) {
    view.setUint8(offset + i, PAGE[i]);
  }
  
  return buffer;
}

// 난이도를 0x01~0x06으로 변환하는 함수
function convertDifficultyToHex(difficulty) {
  const difficultyMap = {
    'a1': 0x01,
    'a2': 0x02,
    'b1': 0x03,
    'b2': 0x04,
    'c1': 0x05,
    'c2': 0x06
  };
  return difficultyMap[difficulty] || 0x01;
}

// 제목 추출 함수
function getTitle() {
  const og = document.querySelector("meta[property='og:title']")?.getAttribute("content");
  if (og) return og.trim();
  
  const h1 = document.querySelector("h1")?.innerText?.trim();
  if (h1) return h1;
  
  const title = document.querySelector("title")?.innerText?.trim();
  return title || "";
}

// 제목 전송 함수 (CEFR BINARY 프로토콜)
function sendTitle() {
  if (!isActive) return; // 비활성화 상태면 전송하지 않음
  
  const title = getTitle();
  
  if (!title || title === lastTitle) return; // 제목이 없거나 동일하면 전송하지 않음
  
  lastTitle = title;
  
  // CEFR BINARY 프로토콜로 데이터 패킹
  const binaryData = packCEFRData(title);
  
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(binaryData);
    console.log("📤 CEFR BINARY 전송:", title, "크기:", binaryData.byteLength, "bytes");
  } else {
    console.warn("⚠️ WebSocket 연결 없음");
  }
}

// WebSocket 연결
function connectWS() {
  if (!isActive) return; // 비활성화 상태면 연결하지 않음
  
  socket = new WebSocket(WS_URL);

  socket.addEventListener("open", () => {
    console.log("✅ WebSocket 연결됨");
    sendTitle(); // 연결되면 즉시 제목 전송
  });

  socket.addEventListener("message", (e) => {
    console.log("📩 서버 응답:", e.data);
  });

  socket.addEventListener("close", () => {
    console.warn("❌ WebSocket 연결 끊어짐");
    if (isActive) {
      // 활성화 상태일 때만 재연결 시도
      reconnectTimer = setTimeout(connectWS, 3000);
    }
  });

  socket.addEventListener("error", (err) => {
    console.error("🚨 WebSocket 오류:", err);
  });
}

// WebSocket 연결 해제
function disconnectWS() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  
  if (socket) {
    socket.close();
    socket = null;
  }
}

// 활성화/비활성화 함수
function activate() {
  isActive = true;
  console.log("🟢 확장 프로그램 활성화");
  connectWS();
}

function deactivate() {
  isActive = false;
  console.log("🔴 확장 프로그램 비활성화");
  disconnectWS();
}

// 팝업에서 오는 메시지 수신
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'activate') {
    activate();
  } else if (request.action === 'deactivate') {
    deactivate();
  } else if (request.action === 'difficultyChanged') {
    difficulty = request.difficulty; // 난이도 업데이트
    console.log("📊 난이도 변경:", difficulty, "→", "0x" + convertDifficultyToHex(difficulty).toString(16).toUpperCase());
    // 난이도가 변경되면 즉시 제목 재전송
    if (isActive) {
      lastTitle = ""; // 강제로 재전송하도록
      sendTitle();
    }
  }
});

// 페이지 로드 시 저장된 상태 확인
chrome.storage.local.get(['isActive', 'difficulty'], function(result) {
  if (result.difficulty) {
    difficulty = result.difficulty;
  }
  if (result.isActive) {
    activate();
  }
});

// URL 변경 감지 (SPA 페이지용)
let currentUrl = location.href;
setInterval(() => {
  if (isActive && location.href !== currentUrl) {
    currentUrl = location.href;
    sendTitle();
  }
}, 1000);
