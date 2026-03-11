import { useEffect } from 'react';

/**
 * Устанавливает CSS-переменную --viewport-height на <html>,
 * отслеживая реальную видимую высоту через visualViewport API.
 *
 * Решает проблему мобильных браузеров, где 100vh/100dvh включает
 * область за панелью управления браузера.
 */
export function useViewportHeight() {
  useEffect(() => {
    function update() {
      // Не меняем высоту, если фокус находится в поле ввода (открыта виртуальная клавиатура).
      // Это критически важно для iOS Safari, где изменение высоты контейнера до visualViewport.height
      // при открытой клавиатуре ломает верстку (белый экран над клавиатурой).
      if (document.activeElement) {
        const tag = document.activeElement.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
          return;
        }
      }

      const h = window.visualViewport?.height ?? window.innerHeight;
      document.documentElement.style.setProperty('--viewport-height', `${h}px`);
    }

    update();

    const vp = window.visualViewport;
    if (vp) {
      vp.addEventListener('resize', update);
      return () => vp.removeEventListener('resize', update);
    }
    
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
}
