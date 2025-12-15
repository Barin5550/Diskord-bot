/**
 * Internationalization (i18n) Module
 * Supports: RU (default), EN, DE
 */

const i18n = {
    currentLang: 'ru',
    translations: {},

    // Translation dictionaries
    dictionaries: {
        ru: {
            // Navigation
            'nav.dashboard': 'Панель',
            'nav.moderation': 'Модерация',
            'nav.logs': 'Логи',
            'nav.folders': 'Папки',
            'nav.analytics': 'Аналитика',
            'nav.memes': 'Мемы',
            'nav.memeOfDay': 'Мем дня',
            'nav.tetris': 'Тетрис',
            'nav.snake': 'Змейка',
            'nav.constructor': 'Конструктор',
            'nav.gallery': 'Галерея',
            'nav.chat': 'Чат',
            'nav.profile': 'Профиль',
            'nav.help': 'Помощь',

            // Dashboard
            'dashboard.title': 'Панель управления',
            'dashboard.subtitle': 'Добро пожаловать в админ-консоль',
            'dashboard.totalUsers': 'Всего юзеров',
            'dashboard.activeServers': 'Активных серверов',
            'dashboard.commandsToday': 'Команд сегодня',
            'dashboard.uptime': 'Аптайм',
            'dashboard.botSettings': 'Настройки бота',
            'dashboard.commandPrefix': 'Префикс команд',
            'dashboard.serverLogs': 'Логи серверов',
            'dashboard.bigActions': 'Важные действия',
            'dashboard.autoModeration': 'Автомодерация',
            'dashboard.activityLogging': 'Логирование активности',
            'dashboard.welcomeMessages': 'Приветственные сообщения',
            'dashboard.quickActions': 'Быстрые действия',
            'dashboard.restartBot': 'Перезапустить бота',
            'dashboard.clearCache': 'Очистить кэш',
            'dashboard.syncData': 'Синхронизировать данные',
            'dashboard.activityFeed': 'Лента активности',

            // Moderation
            'moderation.title': 'Модерация',
            'moderation.subtitle': 'Управление администраторами и правами',
            'moderation.addAdmin': 'Добавить администратора',
            'moderation.userId': 'ID пользователя',
            'moderation.username': 'Имя пользователя',
            'moderation.role': 'Роль',
            'moderation.roleAdmin': 'Админ',
            'moderation.roleModerator': 'Модератор',
            'moderation.roleHelper': 'Хелпер',
            'moderation.add': 'Добавить',
            'moderation.adminList': 'Список администраторов',
            'moderation.actions': 'Действия',
            'moderation.noAdmins': 'Нет администраторов',

            // Logs
            'logs.title': 'Логи',
            'logs.subtitle': 'История сообщений и действий',
            'logs.messages': 'Сообщения',
            'logs.actions': 'Действия',
            'logs.refresh': 'Обновить',
            'logs.loadMore': 'Загрузить ещё',
            'logs.noLogs': 'Нет логов',
            'logs.loading': 'Загрузка...',

            // Folders
            'folders.title': 'Папки серверов',
            'folders.subtitle': 'Организуй серверы по папкам',
            'folders.create': 'Создать папку',
            'folders.folderName': 'Название папки',
            'folders.noFolders': 'Нет папок',
            'folders.addServer': 'Добавить сервер',
            'folders.edit': 'Редактировать',
            'folders.delete': 'Удалить',
            'folders.back': 'Назад',

            // Analytics
            'analytics.title': 'Аналитика',
            'analytics.subtitle': 'Статистика и графики активности',
            'analytics.messagesChart': 'Сообщения за неделю',
            'analytics.hourlyActivity': 'Активность по часам',
            'analytics.topUsers': 'Топ пользователей',
            'analytics.serverStats': 'Статистика серверов',
            'analytics.loading': 'Загрузка...',

            // Memes
            'memes.title': 'Мемы',
            'memes.subtitle': 'Загружай и оценивай мемы',
            'memes.upload': 'Загрузить мем',
            'memes.dropzone': 'Кликни или перетащи изображение',
            'memes.caption': 'Подпись (необязательно)',
            'memes.submit': 'Опубликовать',
            'memes.sortNew': 'Новые',
            'memes.sortTop': 'Топ',
            'memes.sortHot': 'Горячие',
            'memes.search': 'Поиск мемов...',
            'memes.noMemes': 'Нет мемов',
            'memes.delete': 'Удалить',
            'memes.like': 'Нравится',
            'memes.dislike': 'Не нравится',

            // Meme of Day
            'memeOfDay.title': 'Мем дня',
            'memeOfDay.subtitle': 'Мем с наибольшим количеством лайков сегодня',
            'memeOfDay.topMemes': '🔥 Топ-5 мемов недели',
            'memeOfDay.noMeme': 'Пока нет мема дня',
            'memeOfDay.likes': 'Лайков',
            'memeOfDay.views': 'Просмотров',
            'memeOfDay.rank': 'Рейтинг',
            'memeOfDay.uploadHint': 'Загрузи первый мем и собери лайки!',
            'memeOfDay.noRating': 'Недостаточно мемов для рейтинга',
            'memeOfDay.place': 'место',

            // Tetris
            'tetris.title': 'Тетрис',
            'tetris.subtitle': 'Классическая игра',
            'tetris.score': 'Счёт',
            'tetris.level': 'Уровень',
            'tetris.lines': 'Линии',
            'tetris.next': 'Следующая',
            'tetris.start': 'Старт',
            'tetris.pause': 'Пауза',
            'tetris.restart': 'Заново',
            'tetris.easy': 'Легко',
            'tetris.normal': 'Нормально',
            'tetris.hard': 'Сложно',
            'tetris.controls': 'Управление',
            'tetris.move': 'Движение',
            'tetris.rotate': 'Вращение',
            'tetris.drop': 'Сброс',
            'tetris.gameOver': 'Игра окончена',
            'tetris.pressStart': 'Нажми Старт',

            // Snake
            'snake.title': 'Змейка',
            'snake.subtitle': 'Классическая игра',
            'snake.score': 'Счёт',
            'snake.start': 'Старт',
            'snake.gameOver': 'Игра окончена',

            // Constructor 3D
            'constructor.title': '3D Конструктор',
            'constructor.subtitle': 'Создавай 3D модели',
            'constructor.file': 'Файл',
            'constructor.edit': 'Правка',
            'constructor.create': 'Создать',
            'constructor.view': 'Вид',
            'constructor.newScene': 'Новая сцена',
            'constructor.export': 'Экспорт',
            'constructor.import': 'Импорт',
            'constructor.undo': 'Отменить',
            'constructor.redo': 'Повторить',
            'constructor.delete': 'Удалить',
            'constructor.duplicate': 'Дублировать',
            'constructor.objects': 'Объекты',
            'constructor.properties': 'Свойства',
            'constructor.position': 'Позиция',
            'constructor.rotation': 'Вращение',
            'constructor.scale': 'Масштаб',
            'constructor.color': 'Цвет',
            'constructor.publish': 'Опубликовать в галерею',

            // Gallery 3D
            'gallery.title': 'Галерея 3D',
            'gallery.subtitle': 'Работы сообщества',
            'gallery.noModels': 'Нет моделей',
            'gallery.by': 'от',
            'gallery.view': 'Просмотр',

            // Chat
            'chat.title': 'Чат',
            'chat.subtitle': 'Общение в реальном времени',
            'chat.rooms': 'Комнаты',
            'chat.createRoom': 'Создать комнату',
            'chat.enterMessage': 'Введите сообщение...',
            'chat.send': 'Отправить',
            'chat.noRoom': 'Выберите комнату для начала общения',

            // Profile
            'profile.title': 'Профиль',
            'profile.subtitle': 'Управление аккаунтом',
            'profile.avatar': 'Аватар',
            'profile.displayName': 'Отображаемое имя',
            'profile.about': 'О себе',
            'profile.save': 'Сохранить',
            'profile.connectDiscord': 'Подключить Discord',
            'profile.connected': 'Подключено',

            // Help
            'help.title': 'Помощь',
            'help.subtitle': 'Справочный центр',
            'help.dashboard.title': 'Панель управления',
            'help.dashboard.desc': 'Общая статистика и быстрые действия для управления ботом',
            'help.moderation.title': 'Модерация',
            'help.moderation.desc': 'Управление администраторами, банами и правами доступа',
            'help.logs.title': 'Логи',
            'help.logs.desc': 'Просмотр истории сообщений и действий на серверах',

            // Settings Modal
            'settings.title': 'Настройки',
            'settings.interface': 'Интерфейс',
            'settings.skipIntro': 'Пропустить интро',
            'settings.skipIntroDesc': 'Отключить анимацию загрузки',
            'settings.animations': 'Анимации',
            'settings.animationsDesc': 'TRON эффекты и переходы',
            'settings.sound': 'Звуковые эффекты',
            'settings.soundDesc': 'Звуки уведомлений и игр',
            'settings.overkill': 'Перебор',
            'settings.overkillDesc': 'Экстремальные анимации везде (осторожно!)',
            'settings.theme': 'Тема оформления',
            'settings.themeTron': 'TRON',
            'settings.themeTronDesc': 'Тёмная неоновая',
            'settings.themeLight': 'Светлая',
            'settings.themeLightDesc': 'Чистая и минимальная',
            'settings.themeCute': 'Милая',
            'settings.themeCuteDesc': 'Мягкие цвета',
            'settings.language': 'Язык',
            'settings.data': 'Данные',
            'settings.clearCache': 'Очистить кэш',
            'settings.clearCacheDesc': 'Сбросить сохранённые данные',
            'settings.clear': 'Очистить',

            // Common
            'common.loading': 'Загрузка...',
            'common.error': 'Ошибка',
            'common.success': 'Успешно',
            'common.save': 'Сохранить',
            'common.cancel': 'Отмена',
            'common.delete': 'Удалить',
            'common.edit': 'Редактировать',
            'common.close': 'Закрыть',
            'common.confirm': 'Подтвердить',
            'common.yes': 'Да',
            'common.no': 'Нет',
            'common.back': 'Назад',
            'common.next': 'Далее',
            'common.search': 'Поиск',
            'common.noData': 'Нет данных',
            'common.refresh': 'Обновить',
            'common.login': 'Войти',
            'common.logout': 'Выйти',

            // Landing
            'landing.tagline': 'SYSTEM INTERFACE v2.0',
            'landing.online': 'ОНЛАЙН',
            'landing.servers': 'СЕРВЕРОВ',
            'landing.users': 'ЮЗЕРОВ',
            'landing.initConsole': '[ ИНИЦИАЛИЗАЦИЯ КОНСОЛИ ]',
            'landing.footer': 'TRON INTERFACE // ТОЛЬКО АВТОРИЗОВАННЫЙ ДОСТУП',

            // Toasts
            'toast.saved': 'Сохранено!',
            'toast.deleted': 'Удалено!',
            'toast.error': 'Произошла ошибка',
            'toast.copied': 'Скопировано!',
            'toast.cacheCleared': 'Кэш очищен!',
            'toast.overkillOn': '🔥 ПЕРЕБОР АКТИВИРОВАН!',
            'toast.overkillOff': 'Перебор отключён',
            'toast.soundOn': 'Звук включён',
            'toast.soundOff': 'Звук отключён',
            'toast.animationsOn': 'Анимации включены',
            'toast.animationsOff': 'Анимации отключены',
            'toast.introOn': 'Интро включено',
            'toast.introOff': 'Интро отключено',
            'toast.langChanged': 'Язык изменён',

            // Confirm dialogs
            'confirm.clearCache': 'Очистить все сохранённые данные? Это действие нельзя отменить.',
            'confirm.deleteFolder': 'Удалить папку и все серверы в ней?',
            'confirm.deleteMeme': 'Удалить этот мем?'
        },

        en: {
            // Navigation
            'nav.dashboard': 'Dashboard',
            'nav.moderation': 'Moderation',
            'nav.logs': 'Logs',
            'nav.folders': 'Folders',
            'nav.analytics': 'Analytics',
            'nav.memes': 'Memes',
            'nav.memeOfDay': 'Meme of Day',
            'nav.tetris': 'Tetris',
            'nav.snake': 'Snake',
            'nav.constructor': 'Constructor',
            'nav.gallery': 'Gallery',
            'nav.chat': 'Chat',
            'nav.profile': 'Profile',
            'nav.help': 'Help',

            // Dashboard
            'dashboard.title': 'Dashboard',
            'dashboard.subtitle': 'Welcome to admin console',
            'dashboard.totalUsers': 'Total Users',
            'dashboard.activeServers': 'Active Servers',
            'dashboard.commandsToday': 'Commands Today',
            'dashboard.uptime': 'Uptime',
            'dashboard.botSettings': 'Bot Settings',
            'dashboard.commandPrefix': 'Command Prefix',
            'dashboard.serverLogs': 'Server Logs',
            'dashboard.bigActions': 'Big Actions',
            'dashboard.autoModeration': 'Auto Moderation',
            'dashboard.activityLogging': 'Activity Logging',
            'dashboard.welcomeMessages': 'Welcome Messages',
            'dashboard.quickActions': 'Quick Actions',
            'dashboard.restartBot': 'Restart Bot',
            'dashboard.clearCache': 'Clear Cache',
            'dashboard.syncData': 'Sync Data',
            'dashboard.activityFeed': 'Activity Feed',

            // Moderation
            'moderation.title': 'Moderation',
            'moderation.subtitle': 'Manage administrators and permissions',
            'moderation.addAdmin': 'Add Administrator',
            'moderation.userId': 'User ID',
            'moderation.username': 'Username',
            'moderation.role': 'Role',
            'moderation.roleAdmin': 'Admin',
            'moderation.roleModerator': 'Moderator',
            'moderation.roleHelper': 'Helper',
            'moderation.add': 'Add',
            'moderation.adminList': 'Administrators List',
            'moderation.actions': 'Actions',
            'moderation.noAdmins': 'No administrators',

            // Logs
            'logs.title': 'Logs',
            'logs.subtitle': 'Messages and actions history',
            'logs.messages': 'Messages',
            'logs.actions': 'Actions',
            'logs.refresh': 'Refresh',
            'logs.loadMore': 'Load More',
            'logs.noLogs': 'No logs',
            'logs.loading': 'Loading...',

            // Folders
            'folders.title': 'Server Folders',
            'folders.subtitle': 'Organize servers into folders',
            'folders.create': 'Create Folder',
            'folders.folderName': 'Folder Name',
            'folders.noFolders': 'No folders',
            'folders.addServer': 'Add Server',
            'folders.edit': 'Edit',
            'folders.delete': 'Delete',
            'folders.back': 'Back',

            // Analytics
            'analytics.title': 'Analytics',
            'analytics.subtitle': 'Statistics and activity charts',
            'analytics.messagesChart': 'Messages This Week',
            'analytics.hourlyActivity': 'Hourly Activity',
            'analytics.topUsers': 'Top Users',
            'analytics.serverStats': 'Server Statistics',
            'analytics.loading': 'Loading...',

            // Memes
            'memes.title': 'Memes',
            'memes.subtitle': 'Upload and rate memes',
            'memes.upload': 'Upload Meme',
            'memes.dropzone': 'Click or drag image here',
            'memes.caption': 'Caption (optional)',
            'memes.submit': 'Publish',
            'memes.sortNew': 'New',
            'memes.sortTop': 'Top',
            'memes.sortHot': 'Hot',
            'memes.search': 'Search memes...',
            'memes.noMemes': 'No memes',
            'memes.delete': 'Delete',
            'memes.like': 'Like',
            'memes.dislike': 'Dislike',

            // Meme of Day
            'memeOfDay.title': 'Meme of the Day',
            'memeOfDay.subtitle': 'Meme with the most likes today',
            'memeOfDay.topMemes': '🔥 Top 5 Memes of the Week',
            'memeOfDay.noMeme': 'No meme of the day yet',
            'memeOfDay.likes': 'Likes',
            'memeOfDay.views': 'Views',
            'memeOfDay.rank': 'Rank',
            'memeOfDay.uploadHint': 'Upload the first meme and collect likes!',
            'memeOfDay.noRating': 'Not enough memes for ranking',
            'memeOfDay.place': 'place',

            // Tetris
            'tetris.title': 'Tetris',
            'tetris.subtitle': 'Classic game',
            'tetris.score': 'Score',
            'tetris.level': 'Level',
            'tetris.lines': 'Lines',
            'tetris.next': 'Next',
            'tetris.start': 'Start',
            'tetris.pause': 'Pause',
            'tetris.restart': 'Restart',
            'tetris.easy': 'Easy',
            'tetris.normal': 'Normal',
            'tetris.hard': 'Hard',
            'tetris.controls': 'Controls',
            'tetris.move': 'Move',
            'tetris.rotate': 'Rotate',
            'tetris.drop': 'Drop',
            'tetris.gameOver': 'Game Over',
            'tetris.pressStart': 'Press Start',

            // Snake
            'snake.title': 'Snake',
            'snake.subtitle': 'Classic game',
            'snake.score': 'Score',
            'snake.start': 'Start',
            'snake.gameOver': 'Game Over',

            // Constructor 3D
            'constructor.title': '3D Constructor',
            'constructor.subtitle': 'Create 3D models',
            'constructor.file': 'File',
            'constructor.edit': 'Edit',
            'constructor.create': 'Create',
            'constructor.view': 'View',
            'constructor.newScene': 'New Scene',
            'constructor.export': 'Export',
            'constructor.import': 'Import',
            'constructor.undo': 'Undo',
            'constructor.redo': 'Redo',
            'constructor.delete': 'Delete',
            'constructor.duplicate': 'Duplicate',
            'constructor.objects': 'Objects',
            'constructor.properties': 'Properties',
            'constructor.position': 'Position',
            'constructor.rotation': 'Rotation',
            'constructor.scale': 'Scale',
            'constructor.color': 'Color',
            'constructor.publish': 'Publish to Gallery',

            // Gallery 3D
            'gallery.title': '3D Gallery',
            'gallery.subtitle': 'Community works',
            'gallery.noModels': 'No models',
            'gallery.by': 'by',
            'gallery.view': 'View',

            // Chat
            'chat.title': 'Chat',
            'chat.subtitle': 'Real-time communication',
            'chat.rooms': 'Rooms',
            'chat.createRoom': 'Create Room',
            'chat.enterMessage': 'Enter message...',
            'chat.send': 'Send',
            'chat.noRoom': 'Select a room to start chatting',

            // Profile
            'profile.title': 'Profile',
            'profile.subtitle': 'Account management',
            'profile.avatar': 'Avatar',
            'profile.displayName': 'Display Name',
            'profile.about': 'About',
            'profile.save': 'Save',
            'profile.connectDiscord': 'Connect Discord',
            'profile.connected': 'Connected',

            // Help
            'help.title': 'Help',
            'help.subtitle': 'Help Center',
            'help.dashboard.title': 'Dashboard',
            'help.dashboard.desc': 'General statistics and quick actions for bot management',
            'help.moderation.title': 'Moderation',
            'help.moderation.desc': 'Manage administrators, bans and access permissions',
            'help.logs.title': 'Logs',
            'help.logs.desc': 'View message and action history on servers',

            // Settings Modal
            'settings.title': 'Settings',
            'settings.interface': 'Interface',
            'settings.skipIntro': 'Skip Intro',
            'settings.skipIntroDesc': 'Disable loading animation',
            'settings.animations': 'Animations',
            'settings.animationsDesc': 'TRON effects and transitions',
            'settings.sound': 'Sound Effects',
            'settings.soundDesc': 'Notification and game sounds',
            'settings.overkill': 'Overkill',
            'settings.overkillDesc': 'Extreme animations everywhere (caution!)',
            'settings.theme': 'Theme',
            'settings.themeTron': 'TRON',
            'settings.themeTronDesc': 'Dark neon',
            'settings.themeLight': 'Light',
            'settings.themeLightDesc': 'Clean and minimal',
            'settings.themeCute': 'Cute',
            'settings.themeCuteDesc': 'Soft colors',
            'settings.language': 'Language',
            'settings.data': 'Data',
            'settings.clearCache': 'Clear Cache',
            'settings.clearCacheDesc': 'Reset saved data',
            'settings.clear': 'Clear',

            // Common
            'common.loading': 'Loading...',
            'common.error': 'Error',
            'common.success': 'Success',
            'common.save': 'Save',
            'common.cancel': 'Cancel',
            'common.delete': 'Delete',
            'common.edit': 'Edit',
            'common.close': 'Close',
            'common.confirm': 'Confirm',
            'common.yes': 'Yes',
            'common.no': 'No',
            'common.back': 'Back',
            'common.next': 'Next',
            'common.search': 'Search',
            'common.noData': 'No data',
            'common.refresh': 'Refresh',
            'common.login': 'Login',
            'common.logout': 'Logout',

            // Landing
            'landing.tagline': 'SYSTEM INTERFACE v2.0',
            'landing.online': 'ONLINE',
            'landing.servers': 'SERVERS',
            'landing.users': 'USERS',
            'landing.initConsole': '[ INITIALIZE CONSOLE ]',
            'landing.footer': 'TRON INTERFACE // AUTHORIZED ACCESS ONLY',

            // Toasts
            'toast.saved': 'Saved!',
            'toast.deleted': 'Deleted!',
            'toast.error': 'An error occurred',
            'toast.copied': 'Copied!',
            'toast.cacheCleared': 'Cache cleared!',
            'toast.overkillOn': '🔥 OVERKILL ACTIVATED!',
            'toast.overkillOff': 'Overkill disabled',
            'toast.soundOn': 'Sound enabled',
            'toast.soundOff': 'Sound disabled',
            'toast.animationsOn': 'Animations enabled',
            'toast.animationsOff': 'Animations disabled',
            'toast.introOn': 'Intro enabled',
            'toast.introOff': 'Intro disabled',
            'toast.langChanged': 'Language changed',

            // Confirm dialogs
            'confirm.clearCache': 'Clear all saved data? This action cannot be undone.',
            'confirm.deleteFolder': 'Delete folder and all servers in it?',
            'confirm.deleteMeme': 'Delete this meme?'
        },

        de: {
            // Navigation
            'nav.dashboard': 'Dashboard',
            'nav.moderation': 'Moderation',
            'nav.logs': 'Protokolle',
            'nav.folders': 'Ordner',
            'nav.analytics': 'Analytik',
            'nav.memes': 'Memes',
            'nav.memeOfDay': 'Meme des Tages',
            'nav.tetris': 'Tetris',
            'nav.snake': 'Snake',
            'nav.constructor': 'Konstruktor',
            'nav.gallery': 'Galerie',
            'nav.chat': 'Chat',
            'nav.profile': 'Profil',
            'nav.help': 'Hilfe',

            // Dashboard
            'dashboard.title': 'Dashboard',
            'dashboard.subtitle': 'Willkommen in der Admin-Konsole',
            'dashboard.totalUsers': 'Benutzer gesamt',
            'dashboard.activeServers': 'Aktive Server',
            'dashboard.commandsToday': 'Befehle heute',
            'dashboard.uptime': 'Betriebszeit',
            'dashboard.botSettings': 'Bot-Einstellungen',
            'dashboard.commandPrefix': 'Befehlspräfix',
            'dashboard.serverLogs': 'Server-Protokolle',
            'dashboard.bigActions': 'Wichtige Aktionen',
            'dashboard.autoModeration': 'Auto-Moderation',
            'dashboard.activityLogging': 'Aktivitätsprotokoll',
            'dashboard.welcomeMessages': 'Willkommensnachrichten',
            'dashboard.quickActions': 'Schnellaktionen',
            'dashboard.restartBot': 'Bot neustarten',
            'dashboard.clearCache': 'Cache leeren',
            'dashboard.syncData': 'Daten synchronisieren',
            'dashboard.activityFeed': 'Aktivitätsfeed',

            // Moderation
            'moderation.title': 'Moderation',
            'moderation.subtitle': 'Administratoren und Berechtigungen verwalten',
            'moderation.addAdmin': 'Administrator hinzufügen',
            'moderation.userId': 'Benutzer-ID',
            'moderation.username': 'Benutzername',
            'moderation.role': 'Rolle',
            'moderation.roleAdmin': 'Admin',
            'moderation.roleModerator': 'Moderator',
            'moderation.roleHelper': 'Helfer',
            'moderation.add': 'Hinzufügen',
            'moderation.adminList': 'Administratorenliste',
            'moderation.actions': 'Aktionen',
            'moderation.noAdmins': 'Keine Administratoren',

            // Logs
            'logs.title': 'Protokolle',
            'logs.subtitle': 'Nachrichten- und Aktionsverlauf',
            'logs.messages': 'Nachrichten',
            'logs.actions': 'Aktionen',
            'logs.refresh': 'Aktualisieren',
            'logs.loadMore': 'Mehr laden',
            'logs.noLogs': 'Keine Protokolle',
            'logs.loading': 'Laden...',

            // Folders
            'folders.title': 'Server-Ordner',
            'folders.subtitle': 'Server in Ordnern organisieren',
            'folders.create': 'Ordner erstellen',
            'folders.folderName': 'Ordnername',
            'folders.noFolders': 'Keine Ordner',
            'folders.addServer': 'Server hinzufügen',
            'folders.edit': 'Bearbeiten',
            'folders.delete': 'Löschen',
            'folders.back': 'Zurück',

            // Analytics
            'analytics.title': 'Analytik',
            'analytics.subtitle': 'Statistiken und Aktivitätsdiagramme',
            'analytics.messagesChart': 'Nachrichten diese Woche',
            'analytics.hourlyActivity': 'Stündliche Aktivität',
            'analytics.topUsers': 'Top-Benutzer',
            'analytics.serverStats': 'Server-Statistiken',
            'analytics.loading': 'Laden...',

            // Memes
            'memes.title': 'Memes',
            'memes.subtitle': 'Memes hochladen und bewerten',
            'memes.upload': 'Meme hochladen',
            'memes.dropzone': 'Klicken oder Bild hierher ziehen',
            'memes.caption': 'Beschriftung (optional)',
            'memes.submit': 'Veröffentlichen',
            'memes.sortNew': 'Neu',
            'memes.sortTop': 'Top',
            'memes.sortHot': 'Heiß',
            'memes.search': 'Memes suchen...',
            'memes.noMemes': 'Keine Memes',
            'memes.delete': 'Löschen',
            'memes.like': 'Gefällt mir',
            'memes.dislike': 'Gefällt mir nicht',

            // Meme of Day
            'memeOfDay.title': 'Meme des Tages',
            'memeOfDay.subtitle': 'Meme mit den meisten Likes heute',
            'memeOfDay.topMemes': '🔥 Top 5 Memes der Woche',
            'memeOfDay.noMeme': 'Noch kein Meme des Tages',
            'memeOfDay.likes': 'Likes',
            'memeOfDay.views': 'Aufrufe',
            'memeOfDay.rank': 'Rang',
            'memeOfDay.uploadHint': 'Lade das erste Meme hoch und sammle Likes!',
            'memeOfDay.noRating': 'Nicht genug Memes für Bewertung',
            'memeOfDay.place': 'Platz',

            // Tetris
            'tetris.title': 'Tetris',
            'tetris.subtitle': 'Klassisches Spiel',
            'tetris.score': 'Punkte',
            'tetris.level': 'Level',
            'tetris.lines': 'Linien',
            'tetris.next': 'Nächste',
            'tetris.start': 'Start',
            'tetris.pause': 'Pause',
            'tetris.restart': 'Neustart',
            'tetris.easy': 'Leicht',
            'tetris.normal': 'Normal',
            'tetris.hard': 'Schwer',
            'tetris.controls': 'Steuerung',
            'tetris.move': 'Bewegen',
            'tetris.rotate': 'Drehen',
            'tetris.drop': 'Fallen lassen',
            'tetris.gameOver': 'Spiel vorbei',
            'tetris.pressStart': 'Start drücken',

            // Snake
            'snake.title': 'Snake',
            'snake.subtitle': 'Klassisches Spiel',
            'snake.score': 'Punkte',
            'snake.start': 'Start',
            'snake.gameOver': 'Spiel vorbei',

            // Constructor 3D
            'constructor.title': '3D-Konstruktor',
            'constructor.subtitle': '3D-Modelle erstellen',
            'constructor.file': 'Datei',
            'constructor.edit': 'Bearbeiten',
            'constructor.create': 'Erstellen',
            'constructor.view': 'Ansicht',
            'constructor.newScene': 'Neue Szene',
            'constructor.export': 'Exportieren',
            'constructor.import': 'Importieren',
            'constructor.undo': 'Rückgängig',
            'constructor.redo': 'Wiederholen',
            'constructor.delete': 'Löschen',
            'constructor.duplicate': 'Duplizieren',
            'constructor.objects': 'Objekte',
            'constructor.properties': 'Eigenschaften',
            'constructor.position': 'Position',
            'constructor.rotation': 'Rotation',
            'constructor.scale': 'Skalierung',
            'constructor.color': 'Farbe',
            'constructor.publish': 'In Galerie veröffentlichen',

            // Gallery 3D
            'gallery.title': '3D-Galerie',
            'gallery.subtitle': 'Community-Werke',
            'gallery.noModels': 'Keine Modelle',
            'gallery.by': 'von',
            'gallery.view': 'Ansehen',

            // Chat
            'chat.title': 'Chat',
            'chat.subtitle': 'Echtzeit-Kommunikation',
            'chat.rooms': 'Räume',
            'chat.createRoom': 'Raum erstellen',
            'chat.enterMessage': 'Nachricht eingeben...',
            'chat.send': 'Senden',
            'chat.noRoom': 'Wählen Sie einen Raum zum Chatten',

            // Profile
            'profile.title': 'Profil',
            'profile.subtitle': 'Kontoverwaltung',
            'profile.avatar': 'Avatar',
            'profile.displayName': 'Anzeigename',
            'profile.about': 'Über mich',
            'profile.save': 'Speichern',
            'profile.connectDiscord': 'Discord verbinden',
            'profile.connected': 'Verbunden',

            // Help
            'help.title': 'Hilfe',
            'help.subtitle': 'Hilfezentrum',
            'help.dashboard.title': 'Dashboard',
            'help.dashboard.desc': 'Allgemeine Statistiken und Schnellaktionen für die Bot-Verwaltung',
            'help.moderation.title': 'Moderation',
            'help.moderation.desc': 'Administratoren, Sperren und Zugriffsrechte verwalten',
            'help.logs.title': 'Protokolle',
            'help.logs.desc': 'Nachrichten- und Aktionsverlauf auf Servern anzeigen',

            // Settings Modal
            'settings.title': 'Einstellungen',
            'settings.interface': 'Benutzeroberfläche',
            'settings.skipIntro': 'Intro überspringen',
            'settings.skipIntroDesc': 'Ladeanimation deaktivieren',
            'settings.animations': 'Animationen',
            'settings.animationsDesc': 'TRON-Effekte und Übergänge',
            'settings.sound': 'Soundeffekte',
            'settings.soundDesc': 'Benachrichtigungs- und Spielsounds',
            'settings.overkill': 'Übertrieben',
            'settings.overkillDesc': 'Extreme Animationen überall (Vorsicht!)',
            'settings.theme': 'Design',
            'settings.themeTron': 'TRON',
            'settings.themeTronDesc': 'Dunkles Neon',
            'settings.themeLight': 'Hell',
            'settings.themeLightDesc': 'Sauber und minimal',
            'settings.themeCute': 'Niedlich',
            'settings.themeCuteDesc': 'Weiche Farben',
            'settings.language': 'Sprache',
            'settings.data': 'Daten',
            'settings.clearCache': 'Cache leeren',
            'settings.clearCacheDesc': 'Gespeicherte Daten zurücksetzen',
            'settings.clear': 'Leeren',

            // Common
            'common.loading': 'Laden...',
            'common.error': 'Fehler',
            'common.success': 'Erfolg',
            'common.save': 'Speichern',
            'common.cancel': 'Abbrechen',
            'common.delete': 'Löschen',
            'common.edit': 'Bearbeiten',
            'common.close': 'Schließen',
            'common.confirm': 'Bestätigen',
            'common.yes': 'Ja',
            'common.no': 'Nein',
            'common.back': 'Zurück',
            'common.next': 'Weiter',
            'common.search': 'Suchen',
            'common.noData': 'Keine Daten',
            'common.refresh': 'Aktualisieren',
            'common.login': 'Anmelden',
            'common.logout': 'Abmelden',

            // Landing
            'landing.tagline': 'SYSTEM INTERFACE v2.0',
            'landing.online': 'ONLINE',
            'landing.servers': 'SERVER',
            'landing.users': 'BENUTZER',
            'landing.initConsole': '[ KONSOLE INITIALISIEREN ]',
            'landing.footer': 'TRON INTERFACE // NUR AUTORISIERTER ZUGANG',

            // Toasts
            'toast.saved': 'Gespeichert!',
            'toast.deleted': 'Gelöscht!',
            'toast.error': 'Ein Fehler ist aufgetreten',
            'toast.copied': 'Kopiert!',
            'toast.cacheCleared': 'Cache geleert!',
            'toast.overkillOn': '🔥 ÜBERTRIEBEN AKTIVIERT!',
            'toast.overkillOff': 'Übertrieben deaktiviert',
            'toast.soundOn': 'Sound aktiviert',
            'toast.soundOff': 'Sound deaktiviert',
            'toast.animationsOn': 'Animationen aktiviert',
            'toast.animationsOff': 'Animationen deaktiviert',
            'toast.introOn': 'Intro aktiviert',
            'toast.introOff': 'Intro deaktiviert',
            'toast.langChanged': 'Sprache geändert',

            // Confirm dialogs
            'confirm.clearCache': 'Alle gespeicherten Daten löschen? Diese Aktion kann nicht rückgängig gemacht werden.',
            'confirm.deleteFolder': 'Ordner und alle Server darin löschen?',
            'confirm.deleteMeme': 'Dieses Meme löschen?'
        }
    },

    // Translate function - t("key")
    t(key, params = {}) {
        const dict = this.dictionaries[this.currentLang] || this.dictionaries.ru;
        let text = dict[key] || this.dictionaries.ru[key] || key;

        // Replace parameters like {name}
        Object.keys(params).forEach(param => {
            text = text.replace(`{${param}}`, params[param]);
        });

        return text;
    },

    // Set language
    setLanguage(lang) {
        if (!this.dictionaries[lang]) {
            lang = 'ru'; // Fallback
        }
        this.currentLang = lang;
        localStorage.setItem('botconsole_lang', lang);
        this.applyTranslations();
    },

    // Get current language
    getLanguage() {
        return this.currentLang;
    },

    // Initialize
    init() {
        // Load saved language
        const saved = localStorage.getItem('botconsole_lang');
        if (saved && this.dictionaries[saved]) {
            this.currentLang = saved;
        }
        this.applyTranslations();
    },

    // Apply all translations to DOM
    applyTranslations() {
        // Translate elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.dataset.i18n;
            const translation = this.t(key);

            // Check if it's an input placeholder
            if (el.hasAttribute('placeholder')) {
                el.placeholder = translation;
            } else if (el.hasAttribute('title')) {
                el.title = translation;
            } else {
                el.textContent = translation;
            }
        });

        // Translate data-i18n-placeholder
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            el.placeholder = this.t(el.dataset.i18nPlaceholder);
        });

        // Update language selector UI
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === this.currentLang);
        });
    }
};

// Global shortcut
window.t = (key, params) => i18n.t(key, params);
window.i18n = i18n;
