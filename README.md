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
