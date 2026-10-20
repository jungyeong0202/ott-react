const authErrorMessages = {
  'auth/invalid-email': '올바른 이메일 주소를 입력해 주세요.',
  'auth/invalid-credential': '이메일 또는 비밀번호가 올바르지 않습니다.',
  'auth/user-not-found': '이메일 또는 비밀번호가 올바르지 않습니다.',
  'auth/wrong-password': '이메일 또는 비밀번호가 올바르지 않습니다.',
  'auth/email-already-in-use': '이미 가입한 이메일입니다. 로그인해 주세요.',
  'auth/weak-password': '비밀번호가 너무 약합니다. 더 긴 비밀번호를 사용해 주세요.',
  'auth/password-does-not-meet-requirements': '비밀번호가 보안 조건을 충족하지 않습니다. 대문자, 소문자, 숫자, 특수문자를 포함해 주세요.',
  'auth/too-many-requests': '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.',
  'auth/network-request-failed': '인터넷 연결을 확인하고 다시 시도해 주세요.',
  'auth/user-disabled': '사용이 중지된 계정입니다. 관리자에게 문의해 주세요.',
  'auth/operation-not-allowed': '선택한 로그인 방식이 아직 활성화되지 않았습니다. 관리자에게 문의해 주세요.',
  'auth/popup-blocked': '로그인 팝업이 차단됐습니다. 브라우저에서 팝업을 허용한 뒤 다시 시도해 주세요.',
  'auth/popup-closed-by-user': '구글 로그인을 완료하지 않았습니다. 다시 시도해 주세요.',
  'auth/cancelled-popup-request': '구글 로그인이 취소됐습니다. 다시 시도해 주세요.',
  'auth/unauthorized-domain': '이 사이트에서 구글 로그인을 사용할 수 없습니다. 관리자에게 문의해 주세요.',
  'auth/account-exists-with-different-credential': '이미 다른 방식으로 가입한 이메일입니다. 기존 로그인 방식으로 로그인해 주세요.',
  'auth/configuration-not-found': '로그인 서비스 설정을 확인해 주세요.',
  'auth/invalid-api-key': '로그인 서비스 설정을 확인해 주세요.',
  'auth/app-not-authorized': '이 사이트에서 로그인을 사용할 수 없습니다. 관리자에게 문의해 주세요.',
  'auth/action-in-progress': '진행 중인 요청이 끝난 후 다시 시도해 주세요.',
  'auth/missing-configuration': '로그인 서비스가 아직 설정되지 않았습니다.',
};

export const getAuthErrorMessage = (error) =>
  authErrorMessages[error?.code] || '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.';

export const getAuthRedirect = (state) => {
  const target = state?.from;
  if (typeof target !== 'string' || !target.startsWith('/') || target.startsWith('//') || target.includes('\\')) {
    return '/profile';
  }
  const pathname = target.split(/[?#]/)[0];
  return ['/login', '/join'].includes(pathname) ? '/profile' : target;
};
