export type Locale = 'en' | 'es' | 'zh';

const STORAGE_KEY = 'GameLocale';

type StringTable = Record<string, string>;

const STRINGS: Record<Locale, StringTable> = {
  en: {
    'btn.translate': 'Translate',
    'btn.start': 'START',
    'btn.endless': 'ENDLESS',
    'btn.menu': 'MENU',
    'warning.title': 'WARNING',
    'warning.body': 'This game has some loud sounds. Play at your own risk.',
    'warning.continue': 'Press any key to continue',
    'warning.mute': 'Start with sound muted',
    'hud.notebooks': 'Notebooks: {count}/{total}',
    'hud.notebooksEndless': 'Notebooks: {count}',
    'hud.stamina': 'Stamina',
    'hud.staminaLow': "You're running low on stamina!",
    'math.solve': 'SOLVE MATH Q{n}:',
    'math.ok': 'OK!',
    'jump.title': "Let's play some infinite jump rope!",
    'jump.prompt': 'Press the space bar to jump!',
    'jump.promptTouch': 'Tap JUMP to jump!',
    'pause.title': 'PAUSED',
    'pause.continue': 'Continue',
    'pause.options': 'Options',
    'pause.quit': 'Quit to Menu',
    'options.title': 'OPTIONS',
    'options.music': 'Music Volume',
    'options.sfx': 'Sound Effects Volume',
    'options.back': 'Back',
    'results.title': 'Congratulations! You won!',
    'results.menu': 'Main Menu',
    'results.story': "You studied all 23 of Hilbert's problems and escaped!",
    'results.endless': "You studied {count} of Hilbert's problems! (High score: {high})",
    'touch.sprint': 'Sprint',
    'touch.behind': 'Behind',
    'touch.interact': 'Interact',
    'touch.use': 'Use',
    'touch.pause': 'Pause',
    'touch.jump': 'JUMP',
    'touch.rotate': 'Rotate your device',
  },
  es: {
    'btn.translate': 'Traducir',
    'btn.start': 'EMPEZAR',
    'btn.endless': 'INFINITO',
    'btn.menu': 'MENÚ',
    'warning.title': 'AVISO',
    'warning.body': 'Este juego tiene sonidos fuertes. Juega bajo tu propio riesgo.',
    'warning.continue': 'Pulsa cualquier tecla para continuar',
    'warning.mute': 'Empezar con el sonido silenciado',
    'hud.notebooks': 'Cuadernos: {count}/{total}',
    'hud.notebooksEndless': 'Cuadernos: {count}',
    'hud.stamina': 'Energía',
    'hud.staminaLow': '¡Te queda poca energía!',
    'math.solve': 'RESUELVE MATH Q{n}:',
    'math.ok': '¡OK!',
    'jump.title': '¡Juguemos a la comba infinita!',
    'jump.prompt': '¡Pulsa la barra espaciadora para saltar!',
    'jump.promptTouch': '¡Toca SALTAR para saltar!',
    'pause.title': 'PAUSA',
    'pause.continue': 'Continuar',
    'pause.options': 'Opciones',
    'pause.quit': 'Salir al menú',
    'options.title': 'OPCIONES',
    'options.music': 'Volumen de música',
    'options.sfx': 'Volumen de efectos',
    'options.back': 'Atrás',
    'results.title': '¡Felicidades! ¡Ganaste!',
    'results.menu': 'Menú principal',
    'results.story': '¡Estudiaste los 23 problemas de Hilbert y escapaste!',
    'results.endless': '¡Estudiaste {count} problemas de Hilbert! (Récord: {high})',
    'touch.sprint': 'Correr',
    'touch.behind': 'Atrás',
    'touch.interact': 'Usar',
    'touch.use': 'Objeto',
    'touch.pause': 'Pausa',
    'touch.jump': 'SALTAR',
    'touch.rotate': 'Gira tu dispositivo',
  },
  zh: {
    'btn.translate': '翻译',
    'btn.start': '开始',
    'btn.endless': '无尽模式',
    'btn.menu': '菜单',
    'warning.title': '警告',
    'warning.body': '本游戏包含较大音量。请自行承担风险。',
    'warning.continue': '按任意键继续',
    'warning.mute': '静音开始',
    'hud.notebooks': '笔记本：{count}/{total}',
    'hud.notebooksEndless': '笔记本：{count}',
    'hud.stamina': '体力',
    'hud.staminaLow': '体力不足！',
    'math.solve': '解答数学题 Q{n}：',
    'math.ok': '确定！',
    'jump.title': '来玩无限跳绳吧！',
    'jump.prompt': '按空格键跳跃！',
    'jump.promptTouch': '点击“跳跃”来跳！',
    'pause.title': '已暂停',
    'pause.continue': '继续',
    'pause.options': '选项',
    'pause.quit': '返回主菜单',
    'options.title': '选项',
    'options.music': '音乐音量',
    'options.sfx': '音效音量',
    'options.back': '返回',
    'results.title': '恭喜！你赢了！',
    'results.menu': '主菜单',
    'results.story': '你学完了希尔伯特的全部 23 个问题并成功逃脱！',
    'results.endless': '你学习了 {count} 个希尔伯特问题！（最高分：{high}）',
    'touch.sprint': '冲刺',
    'touch.behind': '回头',
    'touch.interact': '互动',
    'touch.use': '使用',
    'touch.pause': '暂停',
    'touch.jump': '跳跃',
    'touch.rotate': '请旋转设备',
  },
};

const LOCALES: Locale[] = ['en', 'es', 'zh'];

function readStoredLocale(): Locale {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === 'en' || raw === 'es' || raw === 'zh') return raw;
  return 'en';
}

class I18n {
  private locale: Locale = readStoredLocale();
  private listeners = new Set<() => void>();

  getLocale(): Locale {
    return this.locale;
  }

  t(key: string, vars?: Record<string, string | number>): string {
    const table = STRINGS[this.locale] ?? STRINGS.en;
    let text = table[key] ?? STRINGS.en[key] ?? key;
    if (vars) {
      for (const [name, value] of Object.entries(vars)) {
        text = text.replaceAll(`{${name}}`, String(value));
      }
    }
    return text;
  }

  setLocale(locale: Locale) {
    if (this.locale === locale) {
      this.applyDom();
      return;
    }
    this.locale = locale;
    localStorage.setItem(STORAGE_KEY, locale);
    this.applyDom();
    for (const listener of this.listeners) listener();
  }

  cycleLocale(): Locale {
    const idx = LOCALES.indexOf(this.locale);
    const next = LOCALES[(idx + 1) % LOCALES.length];
    this.setLocale(next);
    return next;
  }

  onChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Update every element marked with data-i18n / data-i18n-aria. */
  applyDom(root: ParentNode = document) {
    document.documentElement.lang = this.locale;

    root.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
      const key = el.dataset.i18n;
      if (!key) return;
      el.textContent = this.t(key);
    });

    root.querySelectorAll<HTMLElement>('[data-i18n-aria]').forEach((el) => {
      const key = el.dataset.i18nAria;
      if (!key) return;
      el.setAttribute('aria-label', this.t(key));
    });
  }
}

export const i18n = new I18n();
