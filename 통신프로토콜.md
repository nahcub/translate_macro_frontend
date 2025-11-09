# 프로토콜 명세

## 규칙

1. 100ms (50ms)에 한 연결에 한 개의 요청만 받음 (나머지 무시, 클라이언트에서 샘플링 레이트 조정)
2. 모든 명령에 UUID 첨부, (서버 편의가 아닌 클라이언트에서 요청과 답변을 매칭시키기 편하게)
3. LEN은 바이트 수, 텍스트 길이 아님
4. 엔디안은 Big Endian

## FRAME 1 IN : 번역 : BINARY (번역 요청 시)
opcode = 0x2 (BINARY)
payload = [TYPE=0x01][UUID:16B][LEN_word:u8][WORD:utf8][LEN_para:u16][PARA:utf8]

## FRAME 1 OUT : 번역 : BINARY (번역 답변 - 번역어(또는 문장))
opcode = 0x2 (BINARY)
payload = [TYPE=0x01][UUID:16B][STATUS=0x00][LEN_word:u8][WORD:utf8][LEN_trans:u8][TRANSLATION:utf8]


## FRAME 2 IN : CEFR 요청 : BINARY (페이지 로드 시)
opcode = 0x2 (BINARY)
payload = [TYPE=0x02][UUID:16B][LEN_total:u32][NUM_words:u16][PAGE:utf8]

## FRAME 2 OUT : CEFR 요청 : BINARY (CEFR - [단어길이][난이도][단어] 배열)
opcode = 0x2 (BINARY)
payload = [TYPE=0x02][UUID:16B][STATUS=0x00][NUM_total:u16][LEN:u8][CEFR:u8][WORD:utf8][LEN:u8][CEFR:u8][WORD:utf8]...

([LEN:u8][CEFR:u8][WORD:utf8] 즉 단어바이트길이 난이도 단어 단어바이트길이 난이도 단어... )
난이도 :
0x00 : 난이도 없음 (하이라이팅 x)
0x01 ~ 0x06 : A1 ~ C2


## FRAME 3 IN : 번역 오류 피드백
opcode = 0x2 (BINARY)
payload = [TYPE=0x03][UUID:16B][LEN_word:u8][WORD:utf8][LEN_tran:u16][TRANSLATION:utf8][LEN_com:u16][COMMENT:utf8]

## FRAME 3 OUT : 번역 오류 피드백 ACK
opcode = 0x2 (BINARY)
payload = [TYPE=0x03][UUID:16B][STATUS=0x00][LEN_MESSAGE:u8][MESSAGE:utf8]


## FRAME 4 IN : 난이도 오류 피드백
opcode = 0x2 (BINARY)
payload = [TYPE=0x04][UUID:16B][LEN_word:u8][WORD:utf8][CEFR_provided:u8][CEFR_suggested:u8]

## FRAME 4 OUT :난이도 피드백 반영 ACK
opcode = 0x2 (BINARY)
payload = [TYPE=0x04][UUID:16B][STATUS=0x00][LEN_MESSAGE:u8][MESSAGE:utf8]


## FRAME 5 IN : 학습 완료 보고
opcode = 0x2 (BINARY)
payload = [TYPE=0x05][UUID:16B][LEN_id:u8][USER_id:utf8][WORD_len:u8][WORD:utf8]

## FRAME 5 OUT : 학습 반영 ACK
opcode = 0x2 (BINARY)
payload = [TYPE=0x05][UUID:16B][STATUS=0x00][LEN_MESSAGE:u8][MESSAGE:utf8]



## 에러 처리 (공통)
[TYPE][UUID:16B][STATUS=0x01][LEN_MESSAGE:u16][MESSAGE:utf8]
STATUS 0x02 부터는 예약. 사용 아직 안 함.

