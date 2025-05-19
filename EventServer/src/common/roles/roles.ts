/**
 * 계정 권한
 */
export enum UserRoles {
    /**
     * 일반 계정
     *
     * 허용 액션 = 보상 요청
     */
    USER = 'USER',

    /**
     * 운영자
     *
     * 허용 액션 = 이벤트 등록, 보상 등록
     */
    OPERATOR = 'OPERATOR',

    /**
     * 감사자
     *
     * 허용 액션 = 보상 이력 조회
     */
    AUDITOR = 'AUDITOR',

    /**
     * 최고 관리자
     *
     * 허용 액션 = 모든 기능 접근 가능
     */
    ADMIN = 'ADMIN',
}
