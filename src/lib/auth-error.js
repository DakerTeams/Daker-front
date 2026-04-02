function containsAny(message, keywords) {
  return keywords.some((keyword) => message.includes(keyword))
}

export function normalizeAuthErrorMessage(message) {
  if (!message) {
    return '입력값을 다시 확인해주세요.'
  }

  if (containsAny(message, ['password', '비밀번호']) && message.includes('공백')) {
    return '비밀번호를 입력해주세요.'
  }

  if (containsAny(message, ['email', '이메일']) && message.includes('공백')) {
    return '이메일을 입력해주세요.'
  }

  if (containsAny(message, ['nickname', '닉네임']) && message.includes('공백')) {
    return '닉네임을 입력해주세요.'
  }

  if (containsAny(message, ['password', '비밀번호']) && containsAny(message, ['8', 'size', '길이'])) {
    return '비밀번호는 8자 이상 입력해주세요.'
  }

  if (containsAny(message, ['email', '이메일']) && containsAny(message, ['well-formed', '형식'])) {
    return '올바른 이메일 형식으로 입력해주세요.'
  }

  if (containsAny(message, ['nickname', '닉네임']) && containsAny(message, ['size', '길이'])) {
    return '닉네임 길이를 다시 확인해주세요.'
  }

  if (message.includes('이미 가입된 이메일')) {
    return '이미 가입된 이메일입니다.'
  }

  if (message.includes('이미 사용 중인 닉네임')) {
    return '이미 사용 중인 닉네임입니다.'
  }

  if (containsAny(message, ['존재하지 않는 사용자', '사용자를 찾을 수 없습니다'])) {
    return '가입되지 않은 이메일입니다.'
  }

  if (containsAny(message, ['비밀번호가 일치하지 않습니다', '잘못된 비밀번호'])) {
    return '비밀번호가 올바르지 않습니다.'
  }

  return message
}

export function resolveAuthErrorField(message) {
  if (containsAny(message, ['nickname', '닉네임'])) {
    return 'nickname'
  }

  if (containsAny(message, ['email', '이메일', '사용자'])) {
    return 'email'
  }

  if (containsAny(message, ['password', '비밀번호'])) {
    return 'password'
  }

  return 'form'
}
