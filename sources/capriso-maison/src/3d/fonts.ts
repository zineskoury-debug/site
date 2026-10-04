// Kept free of three.js imports so the main bundle can preload fonts without pulling in WebGL code.
export const SERIF = '"Fraunces Variable", Georgia, serif'
export const SANS = '"Manrope Variable", system-ui, sans-serif'

/** Canvas textures draw text: make sure the web fonts are ready first. */
export async function loadTextureFonts() {
  try {
    await Promise.all([document.fonts.load(`italic 300 100px ${SERIF}`), document.fonts.load(`600 30px ${SANS}`)])
  } catch {
    // fall back to system fonts
  }
}
