import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { isNative } from './platform'
import { useAuthStore } from './stores/authStore'
import { useWorkspaceStore } from './stores/workspaceStore'
import { useSidebarStore } from './stores/sidebarStore'
import App from './App'
import './index.css'

const root = createRoot(document.getElementById('root')!)

function render() {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

if (isNative()) {
  Promise.all([
    import('./platform/storage').then(m => m.createPlatformStorage()),
    import('./platform/statusbar').then(m => m.createStatusBarAdapter()),
  ]).then(() => {
    // Storage initialized — rehydrate all persisted stores from @capacitor/preferences
    return Promise.all([
      useAuthStore.persist.rehydrate(),
      useWorkspaceStore.persist.rehydrate(),
      useSidebarStore.persist.rehydrate(),
    ]);
  }).then(render).catch((err) => {
    console.error('[TaskMate] Native init failed:', err);
    document.getElementById('root')!.innerText =
      `Init error: ${err instanceof Error ? err.message : String(err)}`;
  })
} else {
  render()
}
