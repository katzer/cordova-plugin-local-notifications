/*
 * Apache 2.0 License
 *
 * Copyright (c) Sebastian Katzer 2017
 *
 * This file contains Original Code and/or Modifications of Original Code
 * as defined in and that are subject to the Apache License
 * Version 2.0 (the 'License'). You may not use this file except in
 * compliance with the License. Please obtain a copy of the License at
 * http://opensource.org/licenses/Apache-2.0/ and read it before using this
 * file.
 *
 * The Original Code and all software distributed under the License are
 * distributed on an 'AS IS' basis, WITHOUT WARRANTY OF ANY KIND, EITHER
 * EXPRESS OR IMPLIED, AND APPLE HEREBY DISCLAIMS ALL SUCH WARRANTIES,
 * INCLUDING WITHOUT LIMITATION, ANY WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE, QUIET ENJOYMENT OR NON-INFRINGEMENT.
 * Please see the License for the specific language governing rights and
 * limitations under the License.
 */

namespace LocalNotificationProxy.LocalNotification
{
    using System.Collections.Generic;
    using System.Runtime.InteropServices.WindowsRuntime;
    using Windows.UI.Notifications;

    internal class Manager
    {
        /// <summary>
        /// Gets a value indicating whether the permission to schedule notifications is enabled.
        /// </summary>
        /// <returns>True if settings are enabled</returns>
        public bool Enabled => ToastNotifier.Setting == NotificationSetting.Enabled;

        /// <summary>
        /// Gets the default toast notifier.
        /// </summary>
        internal static ToastNotifier ToastNotifier => ToastNotificationManager.CreateToastNotifier();

        /// <summary>
        /// Schedule notifications.
        /// </summary>
        /// <param name="notifications">List of key-value properties</param>
        public void Schedule([ReadOnlyArray] Options[] notifications)
        {
            foreach (Options options in notifications)
            {
                var toast = new Builder(options).Build();
                ToastNotifier.AddToSchedule(toast);
            }
        }

        /// <summary>
        /// Gets all notifications by id.
        /// </summary>
        /// <returns>List of ids</returns>
        public List<int> GetIds()
        {
            return this.GetIdsByType(Notification.Type.All);
        }

        /// <summary>
        /// Gets all notifications by id for given type.
        /// </summary>
        /// <param name="type">The type of notification.</param>
        /// <returns>List of ids</returns>
        public List<int> GetIdsByType(Notification.Type type)
        {
            var ids = new List<int>();

            if (type == Notification.Type.All || type == Notification.Type.Scheduled)
            {
                var toasts = ToastNotifier.GetScheduledToastNotifications();

                foreach (var toast in toasts)
                {
                    ids.Add(int.Parse(toast.Tag));
                }
            }

            if (type == Notification.Type.All || type == Notification.Type.Triggered)
            {
                var toasts = ToastNotificationManager.History.GetHistory();

                foreach (var toast in toasts)
                {
                    ids.Add(int.Parse(toast.Tag));
                }
            }

            return ids;
        }

        /// <summary>
        /// Gets all notifications.
        /// </summary>
        /// <returns>A list of all triggered and scheduled notifications.</returns>
        public List<Notification> GetAll()
        {
            return this.GetByType(Notification.Type.All);
        }

        /// <summary>
        /// Gets all notifications of given type.
        /// </summary>
        /// <param name="type">The type of notification.</param>
        /// <returns>A list of notifications.</returns>
        public List<Notification> GetByType(Notification.Type type)
        {
            var notifications = new List<Notification>();

            if (type == Notification.Type.All || type == Notification.Type.Scheduled)
            {
                var toasts = ToastNotifier.GetScheduledToastNotifications();

                foreach (var toast in toasts)
                {
                    notifications.Add(new Notification(toast));
                }
            }

            if (type == Notification.Type.All || type == Notification.Type.Triggered)
            {
                var toasts = ToastNotificationManager.History.GetHistory();

                foreach (var toast in toasts)
                {
                    notifications.Add(new Notification(toast));
                }
            }

            return notifications;
        }

        /// <summary>
        /// Gets all notifications.
        /// </summary>
        /// <returns>A list of notification options instances.</returns>
        public List<Options> GetOptions()
        {
            return this.GetOptionsByType(Notification.Type.All);
        }

        /// <summary>
        /// Gets notifications specified by ID.
        /// </summary>
        /// <param name="ids">Optional list of IDs to find.</param>
        /// <returns>A list of notification options instances.</returns>
        public List<Options> GetOptions(int[] ids)
        {
            var options = new List<Options>();

            foreach (var toast in this.Get(ids))
            {
                options.Add(toast.Options);
            }

            return options;
        }

        /// <summary>
        /// Gets all notifications for given type.
        /// </summary>
        /// <param name="type">The type of notification.</param>
        /// <returns>A list of notification options instances.</returns>
        public List<Options> GetOptionsByType(Notification.Type type)
        {
            var options = new List<Options>();
            var toasts = this.GetByType(type);

            foreach (var toast in toasts)
            {
                options.Add(toast.Options);
            }

            return options;
        }

        /// <summary>
        /// Gets the notifications specified by ID.
        /// </summary>
        /// <param name="ids">List of IDs to find.</param>
        /// <returns>List of found notifications.</returns>
        public List<Notification> Get(int[] ids)
        {
            var toasts = new List<Notification>();

            foreach (var id in ids)
            {
                var toast = this.Get(id);

                if (toast != null)
                {
                    toasts.Add(toast);
                }
            }

            return toasts;
        }

        /// <summary>
        /// Gets the notification by ID.
        /// </summary>
        /// <param name="id">The ID of the notification to find.</param>
        /// <returns>The found instance or null.</returns>
        public Notification Get(int id)
        {
            return this.Get(id.ToString());
        }

        /// <summary>
        /// Gets the notification by ID.
        /// </summary>
        /// <param name="id">The ID of the notification to find.</param>
        /// <returns>The found instance or null.</returns>
        public Notification Get(string id)
        {
            var scheduled = ToastNotifier.GetScheduledToastNotifications();

            foreach (var toast in scheduled)
            {
                if (toast.Tag == id)
                {
                    return new Notification(toast);
                }
            }

            var triggered = ToastNotificationManager.History.GetHistory();

            foreach (var toast in triggered)
            {
                if (toast.Tag == id)
                {
                    return new Notification(toast);
                }
            }

            return null;
        }
    }
}
