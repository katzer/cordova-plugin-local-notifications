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
    using Microsoft.Toolkit.Uwp.Notifications;
    using Windows.UI.Notifications;

    internal class Builder
    {
        /// <summary>
        /// Notification properties
        /// </summary>
        private Options options;

        /// <summary>
        /// Initializes a new instance of the <see cref="Builder"/> class.
        /// </summary>
        /// <param name="options">Notification properties to set.</param>
        internal Builder(Options options)
        {
            this.options = options;
        }

        /// <summary>
        /// Gets options
        /// </summary>
        public Options Options { get => this.options; }

        /// <summary>
        /// Build a toast notification specified by the options.
        /// </summary>
        /// <returns>A fully configured toast notification instance.</returns>
        public ScheduledToastNotification Build()
        {
            var toast = new ToastContent()
            {
                Launch = this.Options.Identifier,
                Audio = this.Options.ToastAudio,

                Visual = new ToastVisual()
                {
                    BindingGeneric = new ToastBindingGeneric()
                    {
                        Children =
                        {
                            new AdaptiveText()
                            {
                                Text = this.Options.Title
                            },

                            new AdaptiveText()
                            {
                                Text = this.Options.Text
                            }
                        },

                        AppLogoOverride = this.Options.ToastLogo
                    }
                }
            };

            foreach (var image in this.Options.ImageAttachments)
            {
                toast.Visual.BindingGeneric.Children.Add(image);
            }

            var xml = toast.GetXml();
            var at = this.Options.TriggerDate;
            ScheduledToastNotification notification;

            if (this.Options.IsRepeating())
            {
                var interval = this.Options.RepeatInterval;
                notification = new ScheduledToastNotification(xml, at, interval, 5);
            }
            else
            {
                notification = new ScheduledToastNotification(xml, at);
            }

            notification.Id = this.Options.ID.ToString();
            notification.Tag = notification.Id;

            return notification;
        }
    }
}
