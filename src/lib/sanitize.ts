import DOMPurify from "dompurify";

/**
 * HTML 문자열을 정화하여 XSS 공격을 방지합니다.
 * @param dirty - 정화할 HTML 문자열
 * @returns 안전한 HTML 문자열
 */
export function sanitizeHtml(dirty: string): string {
  if (typeof window === "undefined") {
    // 서버 사이드에서는 빈 문자열 반환 (클라이언트에서 렌더링)
    return dirty;
  }

  return DOMPurify.sanitize(dirty, {
    // 허용할 태그들 (TipTap 에디터에서 사용하는 태그들)
    ALLOWED_TAGS: [
      "p", "br", "strong", "em", "u", "s", "del",
      "h1", "h2", "h3", "h4", "h5", "h6",
      "ul", "ol", "li",
      "blockquote", "pre", "code",
      "a", "img",
      "table", "thead", "tbody", "tr", "th", "td",
      "span", "div", "mark",
    ],
    // 허용할 속성들
    ALLOWED_ATTR: [
      "href", "src", "alt", "title", "target", "rel",
      "class", "style",
      "data-color", "data-text-align",
      "colspan", "rowspan",
    ],
    // 스크립트 및 이벤트 핸들러 제거
    FORBID_TAGS: ["script", "style", "iframe", "object", "embed"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus", "onblur"],
    // URL 검증
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  });
}
