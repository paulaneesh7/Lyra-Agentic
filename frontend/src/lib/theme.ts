export const THEME_STORAGE_KEY = "theme";

/** Runs before paint so the first frame matches the saved theme. */
export const THEME_INIT_SCRIPT = `try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)})||"light";if(t==="system")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";var r=document.documentElement;r.classList.toggle("dark",t==="dark");r.style.colorScheme=t==="dark"?"dark":"light"}catch(e){}`;
