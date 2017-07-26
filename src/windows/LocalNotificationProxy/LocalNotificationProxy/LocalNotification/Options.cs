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
    using System;
    using Microsoft.Toolkit.Uwp.Notifications;
    using Windows.Data.Xml.Dom;

    public sealed class Options
    {

        /// <summary>
        /// Gets or sets notification ID.
        /// </summary>
        public int ID { get; set; }

        /// <summary>
        /// Gets or sets notification title.
        /// </summary>
        public string Title { get; set; }

        /// <summary>
        /// Gets or sets notification text.
        /// </summary>
        public string Text { get; set; }

        /// <summary>
        /// Gets or sets app badge number.
        /// </summary>
        public int Badge { get; set; }

        /// <summary>
        /// Gets or sets the notification sound.
        /// </summary>
        public string Sound { get; set; }

        /// <summary>
        /// Gets or sets the notification image.
        /// </summary>
        public string Image { get; set; }

        /// <summary>
        /// Gets or sets the notification fire date.
        /// </summary>
        public long At { get; set; }

        /// <summary>
        /// Gets or sets the notification repeat interval.
        /// </summary>
        public string Every { get; set; }

        /// <summary>
        /// Gets or sets the notification user data.
        /// </summary>
        public string Data { get; set; }

        /// <summary>
        /// Gets the date when to trigger the notification.
        /// </summary>
        internal DateTime TriggerDate
        {
            get
            {
                var date = DateTimeOffset.FromUnixTimeMilliseconds(this.At * 1000).LocalDateTime;
                var minDate = DateTime.Now.AddSeconds(0.1);

                return (date < minDate) ? minDate : date;
            }
        }

        /// <summary>
        /// Gets the parsed repeat interval.
        /// </summary>
        internal TimeSpan RepeatInterval
        {
            get
            {
                switch (this.Every)
                {
                    case "minute":
                        return new TimeSpan(TimeSpan.TicksPerMinute);
                    case "hour":
                        return new TimeSpan(TimeSpan.TicksPerHour);
                    case "day":
                        return new TimeSpan(TimeSpan.TicksPerDay);
                    default:
                        return TimeSpan.Zero;
                }
            }
        }

        /// <summary>
        /// Gets a ToastAudio object based on the specified sound uri.
        /// </summary>
        internal ToastAudio ToastAudio
        {
            get
            {
                var sound = new ToastAudio();
                string path = this.Sound;

                if (path == null || path.Length == 0 || path.Equals("false"))
                {
                    sound.Silent = true;
                }
                else
                if (path.StartsWith("file:///") || path.StartsWith("http"))
                {
                    sound.Src = new System.Uri(path, System.UriKind.Absolute);
                }
                else
                if (path.StartsWith("file://"))
                {
                    sound.Src = new System.Uri(path.Replace("file:/", "ms-appx:///www"));
                }
                else
                if (path.StartsWith("res://"))
                {
                    sound.Src = new System.Uri(path.Replace("res://", "ms-winsoundevent:notification."));
                }
                else
                if (path.StartsWith("app://"))
                {
                    sound.Src = new System.Uri(path.Replace("app:/", "ms-appdata://"));
                }

                return sound;
            }
        }

        /// <summary>
        /// Gets a GenericAppLogo object based on the specified icon uri.
        /// </summary>
        internal ToastGenericAppLogo ToastLogo
        {
            get
            {
                var image = new ToastGenericAppLogo();
                string path = this.Image;

                if (path == null || path.StartsWith("res://logo"))
                {
                    image.Source = string.Empty;
                }
                else
                if (path.StartsWith("file:///") || path.StartsWith("http"))
                {
                    image.Source = path;
                }
                else
                if (path.StartsWith("file://"))
                {
                    image.Source = path.Replace("file:/", "ms-appx:///www");
                }
                else
                if (path.StartsWith("res://"))
                {
                    image.Source = path.Replace("res://", "ms-appx:///images");
                }
                else
                if (path.StartsWith("app://"))
                {
                    image.Source = path.Replace("app:/", "ms-appdata://local");
                }
                else
                {
                    image.Source = string.Empty;
                }

                if (image.Source.EndsWith("?crop=none"))
                {
                    image.HintCrop = ToastGenericAppLogoCrop.None;
                }
                else
                if (image.Source.EndsWith("?crop=cirlce"))
                {
                    image.HintCrop = ToastGenericAppLogoCrop.Circle;
                }

                return image;
            }
        }

        /// <summary>
        /// Gets the instance as an serialized xml element.
        /// </summary>
        /// <returns>Element with all property values set as attributes.</returns>
        internal string Identifier
        {
            get
            {
                var node = new XmlDocument().CreateElement("options");

                node.SetAttribute("id", this.ID.ToString());
                node.SetAttribute("badge", this.Badge.ToString());
                node.SetAttribute("at", this.At.ToString());

                if (this.Title != null)
                {
                    node.SetAttribute("title", this.Title);
                }

                if (this.Text != null)
                {
                    node.SetAttribute("text", this.Text);
                }

                if (this.Sound != null)
                {
                    node.SetAttribute("sound", this.Sound);
                }

                if (this.Image != null)
                {
                    node.SetAttribute("image", this.Image);
                }

                if (this.Every != null)
                {
                    node.SetAttribute("every", this.Every);
                }

                if (this.Data != null)
                {
                    node.SetAttribute("data", this.Data);
                }

                return node.GetXml();
            }
        }

        /// <summary>
        /// Deserializes the XML string into an instance of Options.
        /// </summary>
        /// <param name="identifier">The serialized instance of Options as an xml string.</param>
        /// <returns>An instance where all properties have been assigned.</returns>
        public static Options Parse(string identifier)
        {
            var doc = new XmlDocument();
            doc.LoadXml(identifier);

            var options = new Options();
            var node = doc.DocumentElement;

            options.ID = int.Parse(node.GetAttribute("id"));
            options.Badge = int.Parse(node.GetAttribute("badge"));
            options.At = int.Parse(node.GetAttribute("at"));

            if (node.GetAttributeNode("text") != null)
            {
                options.Text = node.GetAttribute("text");
            }

            if (node.GetAttributeNode("title") != null)
            {
                options.Title = node.GetAttribute("title");
            }

            if (node.GetAttributeNode("sound") != null)
            {
                options.Sound = node.GetAttribute("sound");
            }

            if (node.GetAttributeNode("image") != null)
            {
                options.Image = node.GetAttribute("image");
            }

            if (node.GetAttributeNode("every") != null)
            {
                options.Every = node.GetAttribute("every");
            }

            if (node.GetAttributeNode("data") != null)
            {
                options.Data = node.GetAttribute("data");
            }

            return options;
        }

        /// <summary>
        /// If the notification shall be repeating.
        /// </summary>
        /// <returns>True if the Every property has some value.</returns>
        internal bool IsRepeating()
        {
            return this.Every != null && this.Every.Length > 0 && !this.Every.Equals("0");
        }
    }
}