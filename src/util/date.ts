declare global {
  interface Date {
    toKST(): Date;
  }
}

// KST로 변환하는 메서드 추가
Date.prototype.toKST = function() {
  return new Date(this.getTime() + (9 * 60 * 60 * 1000));
};

// DB 변환용 유틸리티
export const fromUTC = (utcTime: string | null | undefined): Date | undefined => {
  if (!utcTime) return undefined;
  return new Date(utcTime).toKST();
};