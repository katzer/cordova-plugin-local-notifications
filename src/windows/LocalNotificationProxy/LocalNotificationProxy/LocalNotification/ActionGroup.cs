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
    using global::LocalNotificationProxy.LocalNotification.Toast;

    public sealed class ActionGroup
    {
        /// <summary>
        /// Saves all groups for later lookup.
        /// </summary>
        private static Dictionary<string, ActionGroup> groups = new Dictionary<string, ActionGroup>();

        /// <summary>
        /// Initializes a new instance of the <see cref="ActionGroup"/> class.
        /// </summary>
        /// <param name="id">The ID of the action group.</param>
        /// <param name="actions">The list of actions to group for.</param>
        public ActionGroup(string id, [ReadOnlyArray] IAction[] actions)
        {
            this.Id = id;
            this.Actions = actions;
        }

        /// <summary>
        /// Gets or sets the action group ID.
        /// </summary>
        public string Id { get; set; }

        /// <summary>
        /// Gets or sets the notification actions.
        /// </summary>
        public IAction[] Actions { get; set; }

        /// <summary>
        /// Lookup the action groups with the specified group id.
        /// </summary>
        /// <param name="id">The ID of the action group to find.</param>
        /// <returns>Null if no group was found.</returns>
        public static ActionGroup Lookup(string id)
        {
            return groups[id];
        }

        /// <summary>
        /// Register the provided set of actions under the specified group id.
        /// </summary>
        /// <param name="group">The action group to register.</param>
        public static void Register(ActionGroup group)
        {
            groups.Add(group.Id, group);
        }

        /// <summary>
        /// Unregister the action group.
        /// </summary>
        /// <param name="id">The id of the action group to remove.</param>
        public static void Unregister(string id)
        {
            groups.Remove(id);
        }

        /// <summary>
        /// Check if a action group with that id is registered.
        /// </summary>
        /// <param name="id">The id of the action group to check for.</param>
        /// <returns>True if a group with the ID could be found.</returns>
        public static bool IsRegistered(string id)
        {
            return groups.ContainsKey(id);
        }
    }
}
