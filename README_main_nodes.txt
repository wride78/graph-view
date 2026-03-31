# Google Sheets 구조

## 0번 시트: main_nodes
컬럼:
- main-id : 1부터 입력
- main-label : text
- description : text
- remarks : text

## 1번 시트: nodes
컬럼:
- id : A부터 시작
- label : text
- links : id값 입력 (쉼표 구분)
- main-links : 0번 시트의 main-id 값 (쉼표 구분 가능)
- group : text
- description : text
- url : url
- manager : text
- state : 계획, 진행중, 완료
- remarks : text

설명:
- links: nodes 시트 내 일반 노드끼리 연결
- main-links: 일반 노드 → main_nodes 시트의 메인 노드 연결
