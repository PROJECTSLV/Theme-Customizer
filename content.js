// Основной класс расширения
class GitHubRainbowExtension {
  constructor() {
    this.isEnabled = true;
    this.theme = 'rainbow';
    this.init();
  }

  async init() {
    // Загружаем настройки
    await this.loadSettings();
    
    // Ждем загрузки страницы
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupPage());
    } else {
      this.setupPage();
    }
    
    // Следим за изменениями на странице (GitHub - SPA)
    this.setupMutationObserver();
    
    // Добавляем стили для расширенной статистики
    this.addCustomStyles();
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.local.get(['enabled', 'theme']);
      this.isEnabled = result.enabled !== false; // По умолчанию включено
      this.theme = result.theme || 'rainbow';
    } catch (error) {
      console.log('GitHub Rainbow: Не удалось загрузить настройки', error);
    }
  }

  setupPage() {
    // Добавляем кнопку переключения
    this.addToggleButton();
    
    // Применяем тему
    this.applyTheme();
    
    // Добавляем информационный баннер
    this.addInfoBanner();
    
    // Улучшаем статистику
    this.enhanceStats();
  }

  addToggleButton() {
    // Проверяем, есть ли уже кнопка
    if (document.getElementById('rainbow-toggle-button')) return;
    
    // Ищем подходящее место для кнопки
    const possibleLocations = [
      document.querySelector('.js-profile-editable-area'),
      document.querySelector('.user-profile-nav'),
      document.querySelector('.UnderlineNav-body'),
      document.querySelector('.position-relative > .d-flex')
    ];
    
    let location = null;
    for (const loc of possibleLocations) {
      if (loc) {
        location = loc;
        break;
      }
    }
    
    if (!location) {
      // Если не нашли стандартное место, создаем свое
      location = document.createElement('div');
      location.style.cssText = 'position: fixed; top: 70px; right: 20px; z-index: 10000;';
      document.body.appendChild(location);
    }
    
    // Создаем кнопку
    const button = document.createElement('button');
    button.id = 'rainbow-toggle-button';
    button.innerHTML = this.isEnabled ? 
      '<span>🌈 Вкл</span>' : 
      '<span>🌿 Выкл</span>';
    
    if (!this.isEnabled) {
      button.classList.add('off');
    }
    
    button.title = 'Переключить радужную тему для графика контрибуций';
    
    button.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      this.isEnabled = !this.isEnabled;
      await chrome.storage.local.set({ enabled: this.isEnabled });
      
      if (this.isEnabled) {
        button.innerHTML = '<span>🌈 Вкл</span>';
        button.classList.remove('off');
        this.applyTheme();
        this.showNotification('Радужная тема включена! 🌈');
      } else {
        button.innerHTML = '<span>🌿 Выкл</span>';
        button.classList.add('off');
        this.removeTheme();
        this.showNotification('Радужная тема выключена');
      }
    });
    
    location.appendChild(button);
  }

  applyTheme() {
    if (!this.isEnabled) return;
    
    // Добавляем класс темы к body
    document.body.classList.add('github-rainbow-theme');
    
    // Обновляем цвета графика
    this.updateGraphColors();
    
    // Обновляем статистику
    this.updateStats();
  }

  removeTheme() {
    document.body.classList.remove('github-rainbow-theme');
    
    // Убираем кастомные цвета
    const coloredElements = document.querySelectorAll('[style*="fill"][data-level]');
    coloredElements.forEach(el => {
      el.style.fill = '';
      el.style.backgroundColor = '';
    });
  }

  updateGraphColors() {
    // GitHub использует разные селекторы для графика
    const graphSelectors = [
      '.ContributionCalendar-day',
      'rect[data-level]',
      '[data-testid="contribution-cell"]',
      '.js-calendar-graph rect'
    ];
    
    graphSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        const level = parseInt(el.getAttribute('data-level') || '0');
        this.applyColorToElement(el, level);
      });
    });
  }

  applyColorToElement(element, level) {
    const colors = this.getColorScheme();
    const color = colors[Math.min(level, colors.length - 1)];
    
    element.style.fill = color;
    element.style.backgroundColor = color;
    
    // Добавляем data-атрибут с цветом для отладки
    element.setAttribute('data-rainbow-color', color);
  }

  getColorScheme() {
    const schemes = {
      rainbow: [
        '#FFEBEE', '#FFCDD2', '#EF9A9A', '#E57373', '#EF5350',
        '#FF8A65', '#FFB74D', '#FFD54F', '#AED581', '#81C784'
      ],
      neon: [
        '#FF00FF', '#00FFFF', '#FFFF00', '#FF0080', '#80FF00',
        '#00FF80', '#FF8000', '#0080FF', '#8000FF', '#FF0080'
      ],
      pastel: [
        '#FFDEE2', '#FFCCD5', '#FFB6C1', '#FFA7B6', '#FF8FA3',
        '#FFB3BA', '#FFDAC1', '#E2F0CB', '#B5EAD7', '#C7CEEA'
      ]
    };
    
    return schemes[this.theme] || schemes.rainbow;
  }

  addInfoBanner() {
    const banner = document.createElement('div');
    banner.id = 'rainbow-extension-banner';
    banner.innerHTML = `
      <strong>GitHub Rainbow Extension включен!</strong>
      <span style="margin-left: 10px; font-size: 12px;">
        Ваш график контрибуций теперь радужный 🌈
      </span>
    `;
    
    // Добавляем баннер перед графиком
    const graph = document.querySelector('.js-calendar-graph');
    if (graph && graph.parentNode) {
      graph.parentNode.insertBefore(banner, graph);
      banner.classList.add('show');
      
      // Скрываем баннер через 5 секунд
      setTimeout(() => {
        banner.style.opacity = '0';
        banner.style.transition = 'opacity 0.5s';
        setTimeout(() => banner.remove(), 500);
      }, 5000);
    }
  }

  enhanceStats() {
    // Находим элементы статистики
    const stats = document.querySelectorAll('.text-emphasized, .f4, .js-contribution-count');
    
    stats.forEach(stat => {
      if (stat.textContent && /\d+/.test(stat.textContent)) {
        const number = parseInt(stat.textContent.replace(/,/g, ''));
        
        // Добавляем иконку в зависимости от количества
        let icon = '';
        if (number > 1000) icon = '🚀 ';
        else if (number > 500) icon = '⭐ ';
        else if (number > 100) icon = '✨ ';
        else if (number > 50) icon = '👍 ';
        
        if (icon && !stat.innerHTML.includes(icon)) {
          stat.innerHTML = icon + stat.innerHTML;
        }
        
        // Подсвечиваем большие числа
        if (number > 100) {
          stat.style.color = '#FF6B6B';
          stat.style.fontWeight = 'bold';
        }
      }
    });
  }

  updateStats() {
    // Обновляем отображение статистики при включении темы
    if (this.isEnabled) {
      const totalContributions = document.querySelector('.js-yearly-contributions h2');
      if (totalContributions) {
        const text = totalContributions.textContent;
        if (!text.includes('🌈')) {
          totalContributions.textContent = text + ' 🌈';
        }
      }
    }
  }

  addCustomStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .github-rainbow-theme .js-calendar-graph {
        animation: rainbow-border 3s infinite;
      }
      
      @keyframes rainbow-border {
        0% { border-color: #FF6B6B; }
        25% { border-color: #4ECDC4; }
        50% { border-color: #45B7D1; }
        75% { border-color: #96CEB4; }
        100% { border-color: #FF6B6B; }
      }
      
      .github-rainbow-stats {
        background: linear-gradient(135deg, #f8f9fa, #e9ecef);
        border-radius: 10px;
        padding: 15px;
        margin: 10px 0;
      }
    `;
    document.head.appendChild(style);
  }

  showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(45deg, #FF6B6B, #4ECDC4);
      color: white;
      padding: 10px 20px;
      border-radius: 8px;
      z-index: 10000;
      font-weight: bold;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
      animation: slideIn 0.3s ease;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
    
    // Добавляем анимации
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  setupMutationObserver() {
    // GitHub - одностраничное приложение, нужно следить за изменениями
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length) {
          // Проверяем, появился ли график контрибуций
          const hasGraph = document.querySelector('.js-calendar-graph, .ContributionCalendar');
          if (hasGraph) {
            // Небольшая задержка, чтобы DOM обновился
            setTimeout(() => {
              this.addToggleButton();
              if (this.isEnabled) {
                this.applyTheme();
              }
            }, 500);
          }
        }
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
}

// Запускаем расширение
new GitHubRainbowExtension();
