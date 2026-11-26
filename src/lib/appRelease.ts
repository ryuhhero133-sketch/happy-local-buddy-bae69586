declare const __APP_RELEASE_ID__: string;

/** Identidade do build, usada apenas para exibir a versão atual ao dono. */
export const APP_RELEASE_ID = typeof __APP_RELEASE_ID__ === "string" ? __APP_RELEASE_ID__ : "development";
export const APP_RELEASE_SHORT = APP_RELEASE_ID === "development" ? "dev" : APP_RELEASE_ID.slice(0, 7);
