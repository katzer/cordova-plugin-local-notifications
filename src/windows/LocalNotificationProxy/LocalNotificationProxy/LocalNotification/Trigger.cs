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

        /// <summary>
        /// Gets the trigger type.
        /// </summary>
        public string Type { get; } = "calendar";

        /// <summary>
        /// Gets or sets the fix trigger date.
        /// </summary>
        public long At { get; set; } = 0;

        /// <summary>
        /// Gets or sets the first trigger date.
        /// </summary>
        public long FirstAt { get; set; } = 0;

        /// <summary>
        /// Gets or sets the after trigger date.
        /// </summary>
        public long After { get; set; } = 0;

        /// <summary>
        /// Gets or sets the relative trigger date from now.
        /// </summary>
        public int In { get; set; } = 0;

        /// <summary>
        /// Gets or sets the trigger count.
        /// </summary>
        public int Count { get; set; } = 1;

        /// <summary>
        /// Gets the trigger occurrence.
        /// </summary>
        public int Occurrence { get; internal set; } = 1;

        /// <summary>
        /// Gets or sets the trigger interval.
        /// </summary>
        public object Every { get; set; }

        /// <summary>
        /// Gets or sets the trigger unit.
        /// </summary>
        public string Unit { get; set; } = "second";

        /// <summary>
        /// Gets the date when to trigger the notification.
        /// </summary>
        internal DateTime? Date
        {
            get
            {
                if (!this.triggerDate.HasValue)
                {
                    this.triggerDate = this.Every is Every ? this.GetRelDate() : this.GetFixDate();
                }

                if (!this.triggerDate.HasValue)
                {
                    return null;
                }

                var date = this.GetNextTriggerDate();
                var minDate = DateTime.Now.AddSeconds(0.2);

                if (!date.HasValue)
                {
                    return null;
                }

                if (date >= minDate)
                {
                    return date;
                }

                if ((minDate - date).Value.TotalMinutes <= 1)
                {
                    return minDate;
                }

                return null;
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

            trigger.At = int.Parse(node.GetAttribute("at"));
            trigger.FirstAt = int.Parse(node.GetAttribute("firstAt"));
            trigger.After = int.Parse(node.GetAttribute("after"));
            trigger.In = int.Parse(node.GetAttribute("in"));
            trigger.Unit = node.GetAttribute("unit");
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
            node.SetAttribute("firstAt", this.FirstAt.ToString());
            node.SetAttribute("after", this.After.ToString());
            node.SetAttribute("in", this.In.ToString());
            node.SetAttribute("unit", this.Unit);
            node.SetAttribute("count", this.Count.ToString());
            node.SetAttribute("occurrence", this.Occurrence.ToString());

            if (this.Every != null && !(this.Every is Every))
            {
                node.SetAttribute("every", this.Every.ToString());
            }

            return node.GetXml();
        }

        /// <summary>
        /// Adds the interval to the specified date.
        /// </summary>
        /// <param name="date">The date where to add the interval of ticks</param>
        /// <param name="interval">minute, hour, day, ...</param>
        /// <param name="ticks">The number of minutes, hours, days, ...</param>
        /// <returns>A new datetime instance</returns>
        private DateTime? AddInterval(DateTime date, string interval, int ticks)
        {
            switch (interval)
            {
                case null:
                case "":
                    return null;
                case "second":
                    return date.AddSeconds(ticks);
                case "minute":
                    return date.AddMinutes(ticks);
                case "hour":
                    return date.AddHours(ticks);
                case "day":
                    return date.AddDays(ticks);
                case "week":
                    return date.AddDays(ticks * 7);
                case "month":
                    return date.AddMonths(ticks);
                case "quarter":
                    return date.AddMonths(ticks * 3);
                case "year":
                    return date.AddYears(ticks);
                default:
                    return null;
            }
        }

        /// <summary>
        /// Gets the date when to trigger the notification.
        /// </summary>
        /// <returns>The fix date specified by trigger.at or trigger.in</returns>
        private DateTime? GetFixDate()
        {
            if (this.At != 0)
            {
                return this.GetDateTime(this.At);
            }

            if (this.FirstAt != 0)
            {
                return this.GetDateTime(this.FirstAt);
            }

            return this.AddInterval(DateTime.Now, this.Unit, this.In);
        }

        /// <summary>
        /// Gets the date when to trigger the notification.
        /// </summary>
        /// <returns>The first matching date specified by trigger.every</returns>
        private DateTime? GetRelDate()
        {
            if (this.After != 0)
            {
                return this.GetDateTime(this.After);
            }

            return this.GetRelDate(DateTime.Now);
        }

        /// <summary>
        /// Gets the date when to trigger the notification.
        /// </summary>
        /// <param name="now">The relative date to calculate the date from.</param>
        /// <returns>The first matching date specified by trigger.every</returns>
        private DateTime? GetRelDate(DateTime now)
        {
            var every = this.Every as Every;
            var date = every.ToDateTime(now);

            if (date >= now)
            {
                return date;
            }

            if (every.Interval == null || date.Year < now.Year)
            {
                return null;
            }

            if (date.Month < now.Month)
            {
                switch (every.Interval)
                {
                    case "minute":
                    case "hour":
                    case "day":
                        if (!every.Year.HasValue)
                        {
                            return date.AddYears(now.Year - date.Year + 1);
                        }

                        break;
                    case "year":
                        return date.AddYears(now.Year - date.Year + 1);
                }
            }
            else if (date.Day < now.Day)
            {
                switch (every.Interval)
                {
                    case "minute":
                    case "hour":
                        if (!every.Month.HasValue)
                        {
                            return date.AddMonths(now.Month - date.Month + 1);
                        }
                        else if (!every.Year.HasValue)
                        {
                            return date.AddYears(now.Year - date.Year + 1);
                        }

                        break;
                    case "month":
                        return date.AddMonths(now.Month - date.Month + 1);
                    case "year":
                        return date.AddYears(now.Year - date.Year + 1);
                }
            }
            else if (date.Hour < now.Hour)
            {
                switch (every.Interval)
                {
                    case "minute":
                        if (!every.Day.HasValue)
                        {
                            return date.AddDays(now.Day - date.Day + 1);
                        }
                        else if (!every.Month.HasValue)
                        {
                            return date.AddMonths(now.Month - date.Month + 1);
                        }

                        break;
                    case "hour":
                        return date.AddHours(now.Hour - date.Hour);
                    case "day":
                        return date.AddDays(now.Day - date.Day + 1);
                    case "month":
                        return date.AddMonths(now.Month - date.Month + 1);
                    case "year":
                        return date.AddYears(now.Year - date.Year + 1);
                }
            }
            else if (date.Minute < now.Minute)
            {
                switch (every.Interval)
                {
                    case "minute":
                        return date.AddMinutes(now.Minute - date.Minute + 1);
                    case "hour":
                        return date.AddHours(now.Hour - date.Hour + 1);
                    case "day":
                        return date.AddDays(now.Day - date.Day + 1);
                    case "month":
                        return date.AddMonths(now.Month - date.Month + 1);
                    case "year":
                        return date.AddYears(now.Year - date.Year + 1);
                }
            }

            return null;
        }

        /// <summary>
        /// Calculates the next trigger date by adding (interval * occurence)
        /// </summary>
        /// <returns>The next valid trigger date</returns>
        private DateTime? GetNextTriggerDate()
        {
            var every = this.Every;
            var multiple = this.Occurrence;
            var date = this.triggerDate.Value;
            DateTime? nextDate;

            if (this.Every is Every)
            {
                every = (this.Every as Every).Interval;
                multiple -= 1;
            }

            if (every == null)
            {
                return date;
            }

            if (every is double)
            {
                var ticks = Convert.ToInt32(every);

                if (ticks == 0)
                {
                    return null;
                }

                nextDate = this.AddInterval(date, this.Unit, multiple * ticks);
            }
            else
            {
                nextDate = this.AddInterval(date, every as string, multiple);

                if (nextDate.HasValue && this.Every is Every)
                {
                    nextDate = this.GetRelDate(nextDate.Value);
                }
            }

            return nextDate;
        }

        /// <summary>
        /// Convert the milliseconds into a date time object.
        /// </summary>
        /// <param name="time">The milli seconds since unix zero.</param>
        /// <returns>The date time</returns>
        private DateTime GetDateTime(long time)
        {
            return DateTimeOffset.FromUnixTimeMilliseconds(time).LocalDateTime;
        }
    }

}
