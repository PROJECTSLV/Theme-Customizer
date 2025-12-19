// Добавляем кнопку переключения темы
function addThemeToggle() {
  if (document.getElementById('rainbow-toggle')) return;
  
  const header = document.querySelector('.js-profile-editable-area');
  if (!header) return;
  
  const toggle = document.createElement('button');
  toggle.id = 'rainbow-toggle';
  toggle.innerHTML = '🌈 Радужный режим';
  toggle.style.cssText = `
    margin-left: 10px;
    padding: 5px 10px;
    background: linear-gradient(45deg, #FF6B6B, #4ECDC4, #45B7D1);
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 12px;
  `;
  
  let isRainbow = true;
  toggle.addEventListener('click', () => {
    isRainbow = !isRainbow;
    document.body.classList.toggle('rainbow-mode', isRainbow);
    toggle.innerHTML = isRainbow ? '🌈 Радужный' : '🌿 Обычный';
  });
  
  header.appendChild(toggle);
}

// Запускаем после загрузки страницы
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', addThemeToggle);
} else {
  addThemeToggle();
}

// Обновляем при навигации (GitHub использует SPA)
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    setTimeout(addThemeToggle, 1000);
  }
}).observe(document, { subtree: true, childList: true });
