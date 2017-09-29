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
    using Windows.Data.Xml.Dom;

    public sealed class Trigger
    {
        private DateTime? triggerDate;
        private TimeSpan? triggerInterval;

        /// <summary>
        /// Gets trigger type.
        /// </summary>
        public string Type { get; } = "calendar";

        /// <summary>
        /// Gets or sets trigger date.
        /// </summary>
        public long At { get; set; } = 0;

        /// <summary>
        /// Gets or sets relative trigger date in seconds from now.
        /// </summary>
        public long In { get; set; } = 0;

        /// <summary>
        /// Gets or sets trigger count.
        /// </summary>
        public int Count { get; set; } = 1;

        /// <summary>
        /// Gets trigger occurrence.
        /// </summary>
        public int Occurrence { get; internal set; } = 1;

        /// <summary>
        /// Gets or sets trigger interval.
        /// </summary>
        public object Every { get; set; }

        /// <summary>
        /// Gets the date when to trigger the notification.
        /// </summary>
        internal DateTime Date
        {
            get
            {
                var minDate = DateTime.Now.AddSeconds(0.1);

                if (!this.triggerDate.HasValue)
                {
                    this.triggerDate = this.Every is Every ? this.GetRelDate() : this.GetFixDate();
                }

                var ticks = this.Interval.Ticks * (this.Occurrence - 1);
                var date = this.triggerDate.Value.AddTicks(ticks);

                return (date < minDate) ? minDate : date;
            }
        }

        /// <summary>
        /// Gets the parsed repeat interval.
        /// </summary>
        internal TimeSpan Interval
        {
            get
            {
                if (this.triggerInterval.HasValue)
                {
                    return this.triggerInterval.Value;
                }

                var every = this.Every is Every ? (this.Every as Every).Interval : this.Every;

                try
                {
                    switch (every)
                    {
                        case null:
                        case "":
                            this.triggerInterval = TimeSpan.Zero;
                            break;
                        case "second":
                            this.triggerInterval = new TimeSpan(TimeSpan.TicksPerSecond);
                            break;
                        case "minute":
                            this.triggerInterval = new TimeSpan(TimeSpan.TicksPerMinute);
                            break;
                        case "hour":
                            this.triggerInterval = new TimeSpan(TimeSpan.TicksPerHour);
                            break;
                        case "day":
                            this.triggerInterval = new TimeSpan(TimeSpan.TicksPerDay);
                            break;
                        case "week":
                            this.triggerInterval = new TimeSpan(TimeSpan.TicksPerDay * 7);
                            break;
                        case "month":
                            this.triggerInterval = new TimeSpan(TimeSpan.TicksPerDay * 31);
                            break;
                        case "quarter":
                            this.triggerInterval = new TimeSpan(TimeSpan.TicksPerHour * 2190);
                            break;
                        case "year":
                            this.triggerInterval = new TimeSpan(TimeSpan.TicksPerDay * 365);
                            break;
                        default:
                            this.triggerInterval = TimeSpan.FromSeconds(60 * int.Parse(every as string));
                            break;
                    }
                }
                catch
                {
                    this.triggerInterval = TimeSpan.Zero;
                }

                return this.triggerInterval.Value;
            }
        }

        /// <summary>
        /// Deserializes the XML string into an instance of Trigger.
        /// </summary>
        /// <param name="xml">The serialized instance of Options as an xml string.</param>
        /// <returns>An instance where all properties have been assigned.</returns>
        internal static Trigger Parse(string xml)
        {
            var doc = new XmlDocument();
            doc.LoadXml(xml);

            var trigger = new Trigger();
            var node = doc.DocumentElement;

            trigger.At = long.Parse(node.GetAttribute("at"));
            trigger.In = long.Parse(node.GetAttribute("in"));
            trigger.Count = int.Parse(node.GetAttribute("count"));
            trigger.Occurrence = int.Parse(node.GetAttribute("occurrence"));

            if (node.GetAttributeNode("every") != null)
            {
                trigger.Every = node.GetAttribute("every");
            }

            return trigger;
        }

        /// <summary>
        /// Gets the instance as an serialized xml element.
        /// </summary>
        /// <returns>Element with all property values set as attributes.</returns>
        internal string GetXml()
        {
            var node = new XmlDocument().CreateElement("trigger");

            node.SetAttribute("at", this.At.ToString());
            node.SetAttribute("in", this.In.ToString());
            node.SetAttribute("count", this.Count.ToString());
            node.SetAttribute("occurrence", this.Occurrence.ToString());

            if (this.Every is string)
            {
                node.SetAttribute("every", this.Every as string);
            }

            return node.GetXml();
        }

        /// <summary>
        /// Gets the date when to trigger the notification.
        /// </summary>
        /// <returns>The fix date specified by trigger.at or trigger.in</returns>
        private DateTime GetFixDate()
        {
            DateTime date;

            if (this.In != 0)
            {
                date = DateTime.Now.AddSeconds(this.In);
            }
            else
            {
                date = DateTimeOffset.FromUnixTimeMilliseconds(this.At * 1000).LocalDateTime;
            }

            return date;
        }

        /// <summary>
        /// Gets the date when to trigger the notification.
        /// </summary>
        /// <returns>The first matching date specified by trigger.every</returns>
        private DateTime GetRelDate()
        {
            var every = this.Every as Every;
            var p = every.ToArray2();
            var date = every.ToDateTime();
            var now = DateTime.Now;

            if (date >= now || date.Year < now.Year)
            {
                return date;
            }

            if (date.Month < now.Month)
            {
                switch (every.Interval)
                {
                    case "minute":
                    case "hour":
                    case "day":
                        if (every.YearIsVariable)
                        {
                            p[4] = now.Year + 1;
                        }

                        break;
                    case "year":
                        p[4] = now.Year + 1;
                        break;
                }
            }
            else if (date.Day < now.Day)
            {
                switch (every.Interval)
                {
                    case "minute":
                    case "hour":
                        if (every.MonthIsVariable)
                        {
                            // TODO: end of year
                            p[3] = now.Month + 1;
                        }
                        else if (every.YearIsVariable)
                        {
                            p[4] = now.Year + 1;
                        }

                        break;
                    case "month":
                        // TODO: end of year
                        p[3] = now.Month + 1;
                        break;
                    case "year":
                        p[4] = now.Year + 1;
                        break;
                }
            }
            else if (date.Hour < now.Hour)
            {
                switch (every.Interval)
                {
                    case "minute":
                        if (every.DayIsVariable)
                        {
                            // TODO: end of month
                            p[2] = now.Day + 1;
                        }
                        else if (every.MonthIsVariable)
                        {
                            // TODO: end of year
                            p[3] = now.Month + 1;
                        }

                        break;
                    case "hour":
                        // TODO: end of day
                        p[1] = now.Hour;
                        break;
                    case "day":
                        // TODO: end of month
                        p[2] = now.Day + 1;
                        break;
                    case "month":
                        // TODO: end of year
                        p[3] = now.Month + 1;
                        break;
                    case "year":
                        p[4] = now.Year + 1;
                        break;
                }
            }
            else if (date.Minute < now.Minute)
            {
                switch (every.Interval)
                {
                    case "minute":
                        // TODO: end of hour
                        p[0] = now.Minute + 1;
                        break;
                    case "hour":
                        // TODO: end of day
                        p[1] = now.Hour + 1;
                        break;
                    case "day":
                        // TODO: end of month
                        p[2] = now.Day + 1;
                        break;
                    case "month":
                        // TODO: end of year
                        p[3] = now.Month + 1;
                        break;
                    case "year":
                        p[4] = now.Year + 1;
                        break;
                }
            }

            date = new DateTime(p[4], p[3], p[2], p[1], p[0], 0);

            return date;
        }
    }
}
