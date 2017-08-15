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
        /// Gets the notification by ID.
        /// </summary>
        /// <param name="id">The ID of the notification to find.</param>
        /// <returns>The found instance or null.</returns>
        private Notification Get(string id)
        {
            foreach (var toast in ToastNotifier.GetScheduledToastNotifications())
            {
                if (toast.Id == id)
                {
                    return new Notification(toast);
                }
            }

            return null;
        }
    }
}
