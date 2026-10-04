import { createRoot } from 'react-dom/client'
import '@fontsource-variable/fraunces/soft.css'
import '@fontsource-variable/fraunces/soft-italic.css'
import '@fontsource-variable/manrope/index.css'
import { loadTextureFonts } from '../3d/fonts'
import { Studio } from './Studio'

loadTextureFonts().then(() => createRoot(document.getElementById('root')!).render(<Studio />))
