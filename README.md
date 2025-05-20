# 실행 방법
## Docker compose
실행
```bash
docker-compose -p iambest up
```

종료
```bash
docker-compose -p iambest down
```
## API 테스트 데이터
문서 하단에 제공
## 테스트 코드
일부 서비스 레이어 기능의 통합 테스트 코드가 작성되어 있으며 docker container 내부에 접속하여 테스트 코드를 실행할 수 있습니다.
```bash
// 컨테이너 접속
docker exec -it 컨테이너명 sh
또는
docker exec -it 컨테이너명 bash

// 테스트 코드 실행
npm run test

// 컨테이너 나가기
exit
```
테스트 코드가 준비된 컨테이너명은 `auth`, `event` 입니다.

![docs-6.png](images/docs-6.png)

실행 모습

# 구성
## 서버 아키텍처
![docs-1.png](images/docs-1.png)
- 각 컴포넌트는 Docker 컨테이너로 구성되어 있습니다.
  - GatewayServer = 3000 port
  - AuthServer = 3001 port
  - EventServer = 3002 port
  - MongoDB = 27017 port
  
![docs-5.png](images/docs-5.png)

GatewayServer 외 컴포넌트의 inbound port는 후술할 문제로 인해 host 측에 열어 놓았습니다.

## 게이트웨이
![docs-2.png](images/docs-2.png)
- 게이트웨이는 `req.header`의 `authorizaion`에 들어있는 JWT 토큰 정보를 검증하여 유효한 토큰인지 확인 합니다. (JwtAuthGuard)
- 이후 유효한 토큰이라면 JWT payload에서 권한 정보를 확인 합니다. (RolesGuard)
- 일반 유저 권한이라면 자신의 리소스에만 접근할 수 있도록 `req.params.userId`가 JWT payload의 인증 정보와 동일한지 확인 합니다.
- 디코딩된 인증 정보는 `x-user` 헤더로 포함하여 하위 라우트 컨테이너에 전달 합니다. 전달 받은 컨테이너에서는 JWT 검증 필요 없이 `x-user` 값을 바로 사용할 수 있습니다.

# 부연 설명
## 완료 조건
![docs-3.png](images/docs-3.png)
- `EventCalculator` : 이벤트 완료 조건을 계산하는 클래스 입니다.
- `EventCondition` : 이벤트 완료 조건을 정의하는 인터페이스 입니다. 사전 정의된 연산자와 두 개의 피연산자 조합으로 구성됩니다. 
- `UserDataSet` : 이벤트 완료 여부 계산에 활용할 유저의 서비스 이용 데이터 모음입니다. 이 곳에서는 `EventCondition`의 첫 번째 피연산자와 매칭되는 유저의 데이터를 획득 합니다.

## 보상
![docs-4.png](images/docs-4.png)
- 위 사진은 개발에 참고한 시스템 입니다.
- 보상은 이벤트의 완료 조건을 만족한 유저에게 지급됩니다. 보상은 `ITEM`, `POINT` 두 종류로 나누어 정의 했습니다.

## MongoDB 트랜잭션
`@Transactional()`가 적용된 함수를 실행하면 내부적으로 mongodb session을 열고 트랜잭션을 시작합니다.

그런데 트랜잭션이 적용되려면 mongoose는 명령문에 session 객체를 명시적으로 전달해야하므로 함수가 session 객체를 알아야하는 상황이 발생합니다.

AOP 분리를 위해 `@Transactional()`가 생성한 session 객체를 als(async local storage)에 저장하고, 사전에 `GlobalClsTransactionPlugin`를 미리 초기화하여 mongoose schema pre-hook을 등록 했습니다.
이 pre-hook은 mongoose 명령문 쿼리를 실행하면 `@Transactional()`에 의해 생성된 session 객체를 현재의 비동기 context에서 가져온 후 명시적으로 전달하는 역할을 합니다.

또한, 트랜잭션을 적용하기 위해 MongoDB 서버를 분산 환경 옵션(Replica Set = 1)으로 설정 했습니다.

# 구현중 마주한 이슈
## Docker Compose network bridge 오류
- 상황
  - 모든 컨테이너가 네트워크 브릿지에 연결되었음에도 컨테이너 간의 통신이 이어지지 않는 현상 발생
  - ping은 가능하나 HTTP 통신에서 타 컨테이너로의 통신이 불가능
  - MacOS Docker Desktop 환경에서 발생하는 문제로 확인 (이런 일을 겪지 말라고 Docker를 사용하는건데...)
- 해결
  - 컨테이너 호스트명 통신 방식 대신, host.docker.internal 호스트명을 사용하여 통신.
  - container >> host >> container 로 통신 경로 우회
  - 이 과정에서 GatewayServer 외의 컨테이너도 host 측에 inbound port를 열어주게 되었음

# API 활용 사례
서비스 기능을 활용하기 위한 일부 핵심 API 호출 예시입니다. (작성되지 않은 API는 각 컨트롤러를 참조)
## 유저 생성
### 요청
```
curl --location 'localhost:3000/users' \
--header 'Content-Type: application/json' \
--data-raw '{
    "email": "user@user.user",
    "password": "user",
    "name": "user",
    "role": "USER"
}'
```
### 응답
```
{
    "message": {
        "id": "66781ea9-b11a-49e3-9076-b91b6787d92d",
        "email": "user@user.user",
        "name": "user",
        "role": "USER",
        "createdAt": "2025-05-20T07:41:51.196Z"
    },
    "success": true,
    "timestamp": 1747726911210
}
```
## 인증
### 요청
```
curl --location 'localhost:3000/auth/login' \
--header 'Content-Type: application/json' \
--data-raw '{
    "email": "user@user.user",
    "password": "user"
}
```
### 응답
```
{
    "message": {
        "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ2ZXJzaW9uIjoxLCJpZCI6IjY2NzgxZWE5LWIxMWEtNDllMy05MDc2LWI5MWI2Nzg3ZDkyZCIsIm5hbWUiOiJ1c2VyIiwiZW1haWwiOiJ1c2VyQHVzZXIudXNlciIsInJvbGUiOiJVU0VSIiwiaWF0IjoxNzQ3NzI3MDMyLCJleHAiOjE3NDc4MTM0MzJ9.TQ7LpEzyD4nkF4exaQq7C37VB-R2odOA-99TbYWlDqk"
    },
    "success": true,
    "timestamp": 1747727032470
}
```
## 유저 조회
### 요청
```
curl --location 'localhost:3000/users/{your id}' \
--header 'Authorization: Bearer {your token}'
```
### 응답
```
{
    "message": {
        "id": "66781ea9-b11a-49e3-9076-b91b6787d92d",
        "email": "user@user.user",
        "name": "user",
        "role": "USER",
        "createdAt": "2025-05-20T07:41:51.196Z"
    },
    "success": true,
    "timestamp": 1747727194768
}
```
## 이벤트 생성 및 보상 등록
### 요청
```
curl --location 'localhost:3000/events' \
--header 'Authorization: Bearer {your token}' \
--header 'Content-Type: application/json' \
--data '{
    "title": "아이템 버닝",
    "description": "장비와 함께 성장하는 나, 아이템 버닝을 통해 더욱 더 강력하게 성장해 보세요!",
    "startDate": "2025-05-01T00:00:00.000Z",
    "endDate": "2025-06-30T00:00:00.000Z",
    "condition": {
        "expressions": [{
            "operator": "lt",
            "syntax": ["$user_level", 260]
        }]
    },
    "rewards": [{
        "type": "ITEM",
        "code": 15200,
        "quantity": 1
    }, {
        "type": "ITEM",
        "code": 10100,
        "quantity": 500
    }, {
        "type": "POINT",
        "point": 3000,
        "quantity": 1
    }]
}'
```
### 응답
```
{
    "message": {
        "code": "19461a9a-dcfc-4b11-9aba-471def609454",
        "title": "아이템 버닝",
        "description": "장비와 함께 성장하는 나, 아이템 버닝을 통해 더욱 더 강력하게 성장해 보세요!",
        "condition": {
            "expressions": [
                {
                    "operator": "lt",
                    "syntax": [
                        "$user_level",
                        260
                    ]
                }
            ]
        },
        "startDate": "2025-05-01T00:00:00.000Z",
        "endDate": "2025-06-30T00:00:00.000Z",
        "rewards": [
            {
                "quantity": 1,
                "type": "ITEM",
                "code": 15200,
                "key": "500ae402-4f65-4c48-b16c-df3d6c7441ec"
            },
            {
                "quantity": 500,
                "type": "ITEM",
                "code": 10100,
                "key": "4bbe328a-8059-43a6-b462-012a9fd8bf9d"
            },
            {
                "quantity": 1,
                "type": "POINT",
                "point": 3000,
                "key": "bcb7c23d-825e-4c2a-a77b-75026bf3d65d"
            }
        ],
        "issuer": "49ce2e59-6e5d-49b1-a506-96db89bc7ca6"
    },
    "success": true,
    "timestamp": 1747727683637
}
```
## 이벤트 참여
### 요청
```
curl --location --request POST 'localhost:3000/users/{your id}/events/{event code}' \
--header 'Authorization: Bearer {your token}'
```
### 응답
```
{
    "message": {
        "code": "19461a9a-dcfc-4b11-9aba-471def609454",
        "status": "ACCEPTED",
        "rewards": [
            {
                "key": "500ae402-4f65-4c48-b16c-df3d6c7441ec",
                "remain": 1
            },
            {
                "key": "4bbe328a-8059-43a6-b462-012a9fd8bf9d",
                "remain": 500
            },
            {
                "key": "bcb7c23d-825e-4c2a-a77b-75026bf3d65d",
                "remain": 1
            }
        ],
        "createdAt": "2025-05-20T08:00:42.139Z",
        "updatedAt": "2025-05-20T08:00:42.139Z"
    },
    "success": true,
    "timestamp": 1747728042148
}
```
## 이벤트 완료 조건을 달성하기 위한 유저 데이터셋 설정
### 요청
```
curl --location --request PATCH 'localhost:3000/users/{your id}/data-set' \
--header 'Authorization: Bearer {your token}' \
--header 'Content-Type: application/json' \
--data '{
    "$user_level": 100
}'
```
### 응답
```
{
    "message": {
        "user": "66781ea9-b11a-49e3-9076-b91b6787d92d",
        "data": {
            "$user_level": 100
        }
    },
    "success": true,
    "timestamp": 1747728448464
}
```
## 유저의 이벤트 진행도 갱신
### 요청
```
curl --location --request POST 'localhost:3000/users/{your id}/events/{event code}/refresh' \
--header 'Authorization: Bearer {your token}'
```
### 응답
```
{
    "message": {
        "code": "19461a9a-dcfc-4b11-9aba-471def609454",
        "status": "COMPLETED",
        "rewards": [
            {
                "key": "500ae402-4f65-4c48-b16c-df3d6c7441ec",
                "remain": 1
            },
            {
                "key": "4bbe328a-8059-43a6-b462-012a9fd8bf9d",
                "remain": 500
            },
            {
                "key": "bcb7c23d-825e-4c2a-a77b-75026bf3d65d",
                "remain": 1
            }
        ],
        "createdAt": "2025-05-20T08:00:42.139Z",
        "updatedAt": "2025-05-20T08:12:10.818Z"
    },
    "success": true,
    "timestamp": 1747728730828
}
```
## 유저의 이벤트 보상 수령
### 요청
```
curl --location 'localhost:3000/users/{your id}/events/{event code}/take-reward' \
--header 'Authorization: Bearer {your token}' \
--header 'Content-Type: application/json' \
--data '{
    "key": "{your reward key}",
    "quantity": 100
}'
```
### 응답
```
{
    "message": {
        "code": "19461a9a-dcfc-4b11-9aba-471def609454",
        "status": "COMPLETED",
        "rewards": [
            {
                "key": "500ae402-4f65-4c48-b16c-df3d6c7441ec",
                "remain": 1
            },
            {
                "key": "4bbe328a-8059-43a6-b462-012a9fd8bf9d",
                "remain": 400
            },
            {
                "key": "bcb7c23d-825e-4c2a-a77b-75026bf3d65d",
                "remain": 1
            }
        ],
        "createdAt": "2025-05-20T08:00:42.139Z",
        "updatedAt": "2025-05-20T08:15:51.881Z"
    },
    "success": true,
    "timestamp": 1747728951890
}
```
## 보상 수령 데이터 조회 (인벤토리)
### 요청
```
curl --location 'localhost:3000/users/{user id}/inventory' \
--header 'Authorization: Bearer {your token}'
```
### 응답
```
{
    "message": {
        "items": [
            {
                "code": 10100,
                "quantity": 100
            }
        ]
    },
    "success": true,
    "timestamp": 1747729266694
}
```
## 보상 수령 데이터 조회 (포인트)
### 요청
```
curl --location 'localhost:3000/users/{user id}/point' \
--header 'Authorization: Bearer {your token}'
```
### 응답
```
{
    "message": {
        "point": 0,
        "total": 0,
        "used": 0
    },
    "success": true,
    "timestamp": 1747729159563
}
```
## 유저의 이벤트 보상 요청 내역 조회
### 요청 (유저별)
```
curl --location 'localhost:3000/users/{your id}/reward-logs' \
--header 'Authorization: Bearer {your token}'
```
### 요청 (전체)
```
curl --location 'localhost:3000/reward-logs' \
--header 'Authorization: Bearer {your token}'
```
### 응답
```
{
    "message": [
        {
            "_id": "682c3cc053ae48ea81ef5137",
            "user": "66781ea9-b11a-49e3-9076-b91b6787d92d",
            "success": true,
            "data": {
                "body": {
                    "key": "4bbe328a-8059-43a6-b462-012a9fd8bf9d",
                    "quantity": 100
                },
                "params": {
                    "userId": "66781ea9-b11a-49e3-9076-b91b6787d92d",
                    "eventId": "19461a9a-dcfc-4b11-9aba-471def609454"
                }
            },
            "createdAt": "2025-05-20T08:26:40.138Z",
            "updatedAt": "2025-05-20T08:26:40.138Z",
            "__v": 0
        }
    ],
    "success": true,
    "timestamp": 1747729656518
}
```
