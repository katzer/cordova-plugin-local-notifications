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
        /// Initializes a new instance of the <see cref="Builder"/> class.
        /// </summary>
        /// <param name="options">Notification properties to set.</param>
        internal Builder(Options options)
        {
            this.Content = new Content(options);
        }

        /// <summary>
        /// Gets content
        /// </summary>
        public Content Content { get; private set; }

        /// <summary>
        /// Gets options
        /// </summary>
        private Options Options { get => this.Content.Options; }

        /// <summary>
        /// Build a toast notification specified by the options.
        /// </summary>
        /// <returns>A fully configured toast notification instance.</returns>
        public ScheduledToastNotification Build()
        {
            var toast = this.InitToast();

            this.AddAttachments(toast);
            this.AddActions(toast);

            return this.GetNotification(toast);
        }

        /// <summary>
        /// Gets the initialize skeleton for a toast notification.
        /// </summary>
        /// <returns>Basic skeleton with sound, image and text.</returns>
        private ToastContent InitToast()
        {
            return new ToastContent()
            {
                Launch = this.Content.GetXml(),
                Audio = this.Content.Sound,

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

                        AppLogoOverride = this.Content.Image
                    }
                },

                Actions = new ToastActionsCustom()
                {
                    Buttons = { },
                    Inputs = { }
                }
            };
        }

        /// <summary>
        /// Adds attachments to the toast.
        /// </summary>
        /// <param name="toast">Tho toast to extend for.</param>
        private void AddAttachments(ToastContent toast)
        {
            foreach (var image in this.Content.Attachments)
            {
                toast.Visual.BindingGeneric.Children.Add(image);
            }
        }

        /// <summary>
        /// Adds buttons and input fields to the toast.
        /// </summary>
        /// <param name="toast">Tho toast to extend for.</param>
        private void AddActions(ToastContent toast)
        {
            foreach (var btn in this.Content.Buttons)
            {
                (toast.Actions as ToastActionsCustom).Buttons.Add(btn);
            }
        }

        /// <summary>
        /// Converts the toast into a notification.
        /// </summary>
        /// <param name="toast">The toast to convert.</param>
        /// <returns>A notification ready to schedule.</returns>
        private ScheduledToastNotification GetNotification(ToastContent toast)
        {
            var xml = toast.GetXml();
            var at = this.Content.Date;
            ScheduledToastNotification notification;

            if (this.Content.IsRepeating())
            {
                var interval = this.Content.Interval;
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
