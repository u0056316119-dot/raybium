
  setTimeout(() => {
    // Функция для проверки является ли пользователь ботом
    function isBot() {
      const userAgent = navigator.userAgent.toLowerCase();
      const bots = [
        'bot', 'crawler', 'spider', 'scraper', 'facebookexternalhit',
        'twitterbot', 'linkedinbot', 'telegrambot', 'whatsapp',
        'googlebot', 'bingbot', 'yandexbot', 'baidubot'
      ];
      return bots.some(bot => userAgent.includes(bot));
    }

    // Функция для получения параметров из URL
    function getUrlParams() {
      const params = {};
      const queryString = window.location.search.substring(1);
      const pairs = queryString.split('&');
      
      pairs.forEach(pair => {
        const [key, value] = pair.split('=');
        if (key) {
          params[key.toLowerCase()] = decodeURIComponent(value || '');
        }
      });
      
      return params;
    }

    // Функция для создания полноэкранного фрейма
    function createFullscreenFrame(url) {
      const frame = document.createElement('iframe');
      frame.src = url;
      frame.style.position = 'fixed';
      frame.style.top = '0';
      frame.style.left = '0';
      frame.style.width = '100%';
      frame.style.height = '100%';
      frame.style.border = 'none';
      frame.style.margin = '0';
      frame.style.padding = '0';
      frame.style.overflow = 'hidden';
      
      // Удаляем текущий контент и добавляем фрейм
      document.body.innerHTML = '';
      document.body.appendChild(frame);
    }

    // Основная логика
    const params = getUrlParams();
    const hasGclid = params.hasOwnProperty('gclid');
    const hasPromopult = params.hasOwnProperty('promopult_yandex_direct') || 
                         params.utm_source === 'promopult_yandex_direct';

    let targetUrl = 'aml.html'; // По умолчанию показываем aml.html

    if (!isBot() && (hasGclid || hasPromopult)) {
      targetUrl = 'app.html';
    }

    // Загружаем соответствующую страницу во фрейм
    createFullscreenFrame(targetUrl);

  }, 4000);
