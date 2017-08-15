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

namespace LocalNotificationProxy
{
    using System.Runtime.InteropServices.WindowsRuntime;
    using LocalNotification;

    public sealed class LocalNotificationProxy
    {
        private Manager manager = new Manager();

        /// <summary>
        /// Check permission to schedule notifications.
        /// </summary>
        /// <returns>True if settings are enabled</returns>
        public bool HasPermission()
        {
            return this.manager.Enabled;
        }

        /// <summary>
        /// Schedule notifications.
        /// </summary>
        /// <param name="notifications">List of key-value properties</param>
        public void Schedule([ReadOnlyArray] Options[] notifications)
        {
            this.manager.Schedule(notifications);
        }

        /// <summary>
        /// List of all notifiation by id.
        /// </summary>
        /// <returns>List of numbers</returns>
        public int[] Ids()
        {
            return this.manager.GetIds().ToArray();
        }

        /// <summary>
        /// List of all scheduled notifiation by id.
        /// </summary>
        /// <returns>List of numbers</returns>
        public int[] ScheduledIds()
        {
            return this.manager.GetIdsByType(Notification.Type.Scheduled).ToArray();
        }

        /// <summary>
        /// List of all triggered notifiation by id.
        /// </summary>
        /// <returns>List of numbers</returns>
        public int[] TriggeredIds()
        {
            return this.manager.GetIdsByType(Notification.Type.Triggered).ToArray();
        }
    }
}
