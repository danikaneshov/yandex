/**
 * Яндекс Еда Казахстан — Интерактивный калькулятор дохода в тенге (₸)
 * Оптимизировано для мобильных устройств и тач-управления
 */

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // 1. КОНФИГУРАЦИЯ И СТАВКИ КАЛЬКУЛЯТОРА В ТЕНГЕ (₸)
  // ==========================================
  
  // Базовая часовая ставка по городам Казахстана (тенге/час)
  const CITY_BASE_RATES = {
    almaty: 2300,   // Алматы и область
    astana: 2200,   // Астана и Акмолинская область
    shymkent: 1900, // Шымкент и южные регионы
    regions: 1700   // Караганда, Актобе, Атырау, Павлодар и др.
  };

  // Коэффициенты в зависимости от способа доставки
  const TRANSPORT_MULTIPLIERS = {
    walk: 1.0,    // Пешком
    bike: 1.35,   // Велосипед / Электросамокат (+35% к заказам и доходу)
    auto: 1.75    // Автомобиль (+75% к заказам и дальность)
  };

  // Элементы калькулятора
  const citySelect = document.getElementById('citySelect');
  const transportTabs = document.querySelectorAll('.transport-tab');
  const hoursSlider = document.getElementById('hoursSlider');
  const daysSlider = document.getElementById('daysSlider');
  const hoursValueEl = document.getElementById('hoursValue');
  const daysValueEl = document.getElementById('daysValue');
  const presetBtns = document.querySelectorAll('.preset-btn');

  // Элементы вывода результатов
  const monthlyIncomeEl = document.getElementById('monthlyIncome');
  const dailyIncomeEl = document.getElementById('dailyIncome');
  const weeklyIncomeEl = document.getElementById('weeklyIncome');
  const ctaIncomeAmountEl = document.getElementById('ctaIncomeAmount');
  const stickyMonthlyAmountEl = document.getElementById('stickyMonthlyAmount');

  // Текущее состояние (по умолчанию: Алматы, Вело/Самокат, 6 ч, 5 дней)
  let state = {
    city: 'almaty',
    transport: 'bike',
    hours: 6,
    days: 5
  };

  // Хранилище предыдущих значений для плавной анимации
  let prevValues = {
    monthly: 0,
    daily: 0,
    weekly: 0
  };

  /**
   * Форматирование числа с разделителем тысяч (например, 403 300)
   */
  function formatMoney(num) {
    return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  /**
   * Плавная анимация изменения цифр (Count Up effect)
   */
  function animateValue(element, start, end, duration = 350) {
    if (!element) return;
    if (start === end) {
      element.textContent = formatMoney(end);
      return;
    }

    const startTime = performance.now();
    const diff = end - start;

    function update(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function: easeOutExpo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = Math.round(start + diff * ease);

      element.textContent = formatMoney(current);

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        element.textContent = formatMoney(end);
      }
    }

    requestAnimationFrame(update);
  }

  /**
   * Обновление градиента трека слайдера для красивой заливки
   */
  function updateSliderBackground(slider) {
    if (!slider) return;
    const min = parseFloat(slider.min) || 0;
    const max = parseFloat(slider.max) || 100;
    const val = parseFloat(slider.value) || 0;
    const percentage = ((val - min) / (max - min)) * 100;
    slider.style.background = `linear-gradient(to right, #FCE000 0%, #FCE000 ${percentage}%, #E5E3DE ${percentage}%, #E5E3DE 100%)`;
  }

  /**
   * Главная функция расчета заработка в тенге (₸)
   */
  function calculateEarnings() {
    const baseCityRate = CITY_BASE_RATES[state.city] || CITY_BASE_RATES.almaty;
    const transportMult = TRANSPORT_MULTIPLIERS[state.transport] || TRANSPORT_MULTIPLIERS.bike;

    // Эффективная ставка в час в тенге
    const effectiveHourlyRate = baseCityRate * transportMult;

    // Расчеты дохода в тенге
    const dailyIncome = Math.round(state.hours * effectiveHourlyRate);
    const weeklyIncome = Math.round(dailyIncome * state.days);
    // В месяце в среднем 4.33 недели
    const monthlyIncome = Math.round(weeklyIncome * 4.33);

    // Анимация вывода цифр
    animateValue(monthlyIncomeEl, prevValues.monthly, monthlyIncome);
    animateValue(dailyIncomeEl, prevValues.daily, dailyIncome);
    animateValue(weeklyIncomeEl, prevValues.weekly, weeklyIncome);

    // Обновление кнопок с суммами в тенге
    if (ctaIncomeAmountEl) {
      animateValue(ctaIncomeAmountEl, prevValues.monthly, monthlyIncome);
    }
    if (stickyMonthlyAmountEl) {
      stickyMonthlyAmountEl.textContent = `${formatMoney(monthlyIncome)} ₸`;
    }

    // Сохраняем текущие значения для следующей анимации
    prevValues.monthly = monthlyIncome;
    prevValues.daily = dailyIncome;
    prevValues.weekly = weeklyIncome;
  }

  // ==========================================
  // 2. ОБРАБОТЧИКИ СОБЫТИЙ КАЛЬКУЛЯТОРА
  // ==========================================

  // Выбор города в Казахстане
  if (citySelect) {
    citySelect.addEventListener('change', (e) => {
      state.city = e.target.value;
      calculateEarnings();
    });
  }

  // Выбор транспорта (табы)
  transportTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      transportTabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      state.transport = tab.getAttribute('data-transport');
      calculateEarnings();
    });
  });

  // Ползунок часов
  if (hoursSlider && hoursValueEl) {
    updateSliderBackground(hoursSlider);
    const onHoursChange = (e) => {
      state.hours = parseInt(e.target.value, 10);
      hoursValueEl.textContent = state.hours;
      updateSliderBackground(e.target);
      resetActivePresets();
      calculateEarnings();
    };
    hoursSlider.addEventListener('input', onHoursChange);
    hoursSlider.addEventListener('change', onHoursChange);
  }

  // Ползунок дней
  if (daysSlider && daysValueEl) {
    updateSliderBackground(daysSlider);
    const onDaysChange = (e) => {
      state.days = parseInt(e.target.value, 10);
      daysValueEl.textContent = state.days;
      updateSliderBackground(e.target);
      resetActivePresets();
      calculateEarnings();
    };
    daysSlider.addEventListener('input', onDaysChange);
    daysSlider.addEventListener('change', onDaysChange);
  }

  // Пресеты
  function resetActivePresets() {
    presetBtns.forEach(b => b.classList.remove('active'));
  }

  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      resetActivePresets();
      btn.classList.add('active');

      const h = parseInt(btn.getAttribute('data-hours'), 10);
      const d = parseInt(btn.getAttribute('data-days'), 10);

      state.hours = h;
      state.days = d;

      if (hoursSlider) {
        hoursSlider.value = h;
        updateSliderBackground(hoursSlider);
      }
      if (hoursValueEl) hoursValueEl.textContent = h;

      if (daysSlider) {
        daysSlider.value = d;
        updateSliderBackground(daysSlider);
      }
      if (daysValueEl) daysValueEl.textContent = d;

      calculateEarnings();
    });
  });

  // Первоначальный расчет
  calculateEarnings();


  // ==========================================
  // 3. АККОРДЕОН FAQ
  // ==========================================
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const trigger = item.querySelector('.faq-trigger');
    if (!trigger) return;

    trigger.addEventListener('click', () => {
      const isOpen = item.classList.contains('active');

      // Закрываем остальные для компактности
      faqItems.forEach(other => {
        other.classList.remove('active');
        const otherTrigger = other.querySelector('.faq-trigger');
        if (otherTrigger) otherTrigger.setAttribute('aria-expanded', 'false');
      });

      if (!isOpen) {
        item.classList.add('active');
        trigger.setAttribute('aria-expanded', 'true');
      }
    });
  });


  // ==========================================
  // 4. МОБИЛЬНОЕ МЕНЮ И НАВИГАЦИЯ
  // ==========================================
  const burgerBtn = document.getElementById('burgerBtn');
  const mobileNav = document.getElementById('mobileNav');

  if (burgerBtn && mobileNav) {
    burgerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      mobileNav.classList.toggle('open');
      const isOpen = mobileNav.classList.contains('open');
      burgerBtn.setAttribute('aria-expanded', isOpen);
    });

    // Закрытие при клике по ссылкам мобильного меню
    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileNav.classList.remove('open');
        burgerBtn.setAttribute('aria-expanded', 'false');
      });
    });

    // Закрытие при клике вне меню
    document.addEventListener('click', (e) => {
      if (!mobileNav.contains(e.target) && !burgerBtn.contains(e.target)) {
        if (mobileNav.classList.contains('open')) {
          mobileNav.classList.remove('open');
          burgerBtn.setAttribute('aria-expanded', 'false');
        }
      }
    });
  }


  // ==========================================
  // 5. ЛИПКАЯ ПЛАШКА НА МОБИЛЬНЫХ УСТРОЙСТВАХ
  // ==========================================
  const mobileStickyBar = document.getElementById('mobileStickyBar');
  const navbar = document.getElementById('navbar');

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        const scrollY = window.scrollY || window.pageYOffset;

        // Тень у шапки
        if (navbar) {
          if (scrollY > 15) {
            navbar.classList.add('scrolled');
          } else {
            navbar.classList.remove('scrolled');
          }
        }

        // Показ липкой плашки внизу экрана телефона
        if (mobileStickyBar) {
          if (scrollY > 260) {
            mobileStickyBar.classList.add('visible');
          } else {
            mobileStickyBar.classList.remove('visible');
          }
        }

        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
});
