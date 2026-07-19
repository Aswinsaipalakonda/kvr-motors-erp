/**
 * Senior Developer Cookie Management Utilities
 * Decoupled from third-party client bloat, fully supporting secure SameSite and Path rules.
 */

export function setCookie(name: string, value: string, days?: number) {
  if (typeof window === "undefined") return;
  const isSecureContext = window.location.protocol === "https:";
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();
  }
  const secureFlag = isSecureContext ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value || "")}${expires}; path=/; SameSite=Lax${secureFlag}`;
}

export function getCookie(name: string): string | null {
  if (typeof window === "undefined") return null;
  const nameEQ = name + "=";
  const ca = document.cookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === " ") c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
  }
  return null;
}

export function eraseCookie(name: string) {
  if (typeof window === "undefined") return;
  const isSecureContext = window.location.protocol === "https:";
  const secureFlag = isSecureContext ? "; Secure" : "";
  document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax${secureFlag}`;
}
