document.addEventListener('DOMContentLoaded', async () => {
  const statusElement = document.getElementById('status');
  const toggleBtn = document.getElementById('toggleBtn');
  const themeRadios = document.querySelectorAll('input[name="theme"]');
  
  // Загружаем настройки
  let isEnabled = true;
  let currentTheme = 'rainbow';
  
  try {
    const result = await chrome.storage.local.get(['enabled', 'theme']);
    isEnabled = result.enabled !== false;
    currentTheme = result.theme || 'rainbow';
  } catch (error) {
    console.error('Ошибка загрузки настроек:', error);
  }
  
  // Обновляем UI
  updateUI();
  
  // Обработчик кнопки переключения
  toggleBtn.addEventListener('click', async () => {
    isEnabled = !isEnabled;
    
    try {
      await chrome.storage.local.set({ enabled: isEnabled });
      
      // Отправляем сообщение content script'у
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.id) {
        await chrome.tabs.sendMessage(tab.id, {
          action: 'toggleTheme',
          enabled: isEnabled
        });
      }
      
      updateUI();
    } catch (error) {
      console.error('Ошибка сохранения настроек:', error);
    }
  });
  
  // Обработчик выбора темы
  themeRadios.forEach(radio => {
    radio.addEventListener('change', async (e) => {
      if (e.target.checked) {
        currentTheme = e.target.value;
        
        try {
          await chrome.storage.local.set({ theme: currentTheme });
          
          // Отправляем сообщение content script'у
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (tab && tab.id) {
            await chrome.tabs.sendMessage(tab.id, {
              action: 'changeTheme',
              theme: currentTheme
            });
          }
        } catch (error) {
          console.error('Ошибка сохранения темы:', error);
        }
      }
    });
    
    // Устанавливаем текущую тему
    if (radio.value === currentTheme) {
      radio.checked = true;
    }
  });
  
  function updateUI() {
    if (isEnabled) {
      statusElement.innerHTML = `
        <strong>✅ Расширение включено</strong>
        <p style="margin: 5px 0 0; font-size: 12px;">
          График контрибуций радужный 🌈
        </p>
      `;
      toggleBtn.textContent = 'Выключить';
      toggleBtn.className = 'toggle-btn enabled';
    } else {
      statusElement.innerHTML = `
        <strong>⛔ Расширение выключено</strong>
        <p style="margin: 5px 0 0; font-size: 12px;">
          График стандартный
        </p>
      `;
      toggleBtn.textContent = 'Включить';
      toggleBtn.className = 'toggle-btn disabled';
    }
  }
});
