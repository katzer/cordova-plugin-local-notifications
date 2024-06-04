interface LocalNotificationAction {
  id: string | null;
  type?: 'button' | 'input';
  title?: string | null;
  launch?: boolean;
  ui?: boolean;
  needsAuth?: boolean;
  icon?: string | null;
  emptyText?: string;
  submitTitle?: boolean;
  choices?: string[];
  defaultValue?: string;
}

interface FixTrigger {
  at: Date;
  type?: string;
}

interface TimespanTrigger {
  in: number;
  unit: 'second' |  'minute' | 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';
  type?: string
}

interface RepeatTrigger {
  count?: number;
  every: 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year' | {
    second?: number;
    minute?: number;
    hour?: number;
    day?: number;
    weekdayOrdinal?: number;
    week?: number;
    weekOfMonth: number;
    month: number;
    quarter: number,
    year: number;
  };
  before?: Date;
  firstAt?: Date;
  type?: string;
}

interface LocationTrigger {
  type: 'location';
  center: [number, number];
  radius?: number;
  notifyOnEntry?: boolean;
  notifyOnExit?: boolean;
  single?: boolean;
}

type LocalNotificationTrigger = FixTrigger | TimespanTrigger | RepeatTrigger | LocationTrigger;

type LocalNotificationLed = null | boolean | string | [string, number?, number?] | {
  on?: number;
  off?: number;
};

type LocalNotificationProgressBar = boolean | {
  enabled?: boolean;
  value?: number;
  maxValue?: number;
  intermediate?: boolean;
}

interface LocalNotification {
  actionGroupId?:  number | string | null;
  actions?: LocalNotificationAction[];
  attachments?: string[];
  autoClear?: boolean;
  badge?: number | null;
  channel?: string | null;
  color?: string;
  data?: any;
  defaults?: number;
  foreground?: boolean;
  group?: string | null;
  groupSummary?: boolean;
  icon?: string | null;
  id?: number;
  launch?: boolean;
  led?: LocalNotificationLed;
  lockscreen?: boolean;
  mediaSession?: string | null;
  number?: number;
  priority?: number;
  progressBar?: LocalNotificationProgressBar;
  showWhen?: boolean;
  silent?: boolean;
  smallIcon?: boolean;
  sound?: boolean | string;
  sticky?: boolean;
  summary?: string;
  text?: string;
  title?: string;
  trigger?: LocalNotificationTrigger;
  vibrate?: boolean;
  wakeup?: boolean;
}

interface CordovaPlugins {
  notification: {
    local: {
      hasPermission(callback?:  Function, scope?: Object): void;
      requestPermission(callback?: Function, scope?: Object): void;
      schedule(notifications: LocalNotification[], callback?: Function, scope?: Object): void;
      update(notifications: LocalNotification[], callback?: Function, scope?: Object): void;
      clear(ids: number[], callback?: Function, scope?: Object): void;
      clearAll(callback?: Function, scope?: Object): void;
      cancel(ids: number[], callback?: Function, scope?: Object): void;
      cancelAll(callback?: Function, scope?: Object): void;
      isPresent(id: number, callback?: Function, scope?: Object): void;
      isScheduled(id: number, callback?: Function, scope?: Object): void;
      isTriggered(id: number, callback?: Function, scope?: Object): void;
      getType(id: number, callback?: Function, scope?: Object): void;
      getIds(callback?: Function, scope?: Object): void;
      getScheduledIds(callback?: Function, scope?: Object): void;
      getTriggeredIds(callback?: Function, scope?: Object): void;
      get(ids?: number[], callback?: Function, scope?: Object): void;
      getAll(callback?: Function, scope?: Object): void;
      getScheduled(callback?: Function, scope?: Object): void;
      getTriggered(callback?: Function, scope?: Object): void;
      addActionGroup(id: string, actions: LocalNotificationAction[], calback?: Function, scope?: Object): void;
      getDefaults(): LocalNotification;
      setDefaults(defaults: LocalNotification): void;
      on(event: string, callback?: Function, scope?: Object): void;
      un(event: string, callback?: Function);
    }
  }
}
