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

    public sealed class Every
    {
        private static readonly string[] Intervals = { null, "minute", "hour", "day", "month", "year" };

        /// <summary>
        /// Gets or sets the minute.
        /// </summary>
        public int? Minute { get; set; }

        /// <summary>
        /// Gets or sets the hour.
        /// </summary>
        public int? Hour { get; set; }

        /// <summary>
        /// Gets or sets the day.
        /// </summary>
        public int? Day { get; set; }

        /// <summary>
        /// Gets or sets the month.
        /// </summary>
        public int? Month { get; set; }

        /// <summary>
        /// Gets or sets the year.
        /// </summary>
        public int? Year { get; set; }

        /// <summary>
        /// Gets the interval as a string representation.
        /// </summary>
        /// <returns>year, month, ...</returns>
        internal string Interval { get => Intervals[Array.IndexOf(this.ToArray(), null) + 1]; }

        /// <summary>
        /// Converts the date time components into a datetime object.
        /// </summary>
        /// <param name="now">The relative date to calculate the date from.</param>
        /// <returns>A datetime object</returns>
        internal DateTime ToDateTime(DateTime now)
        {
            var p = this.ToArray();

            p[0] = this.Minute.GetValueOrDefault();
            p[1] = this.Hour.GetValueOrDefault();
            p[2] = this.Day.GetValueOrDefault(now.Day);
            p[3] = this.Month.GetValueOrDefault(now.Month);
            p[4] = this.Year.GetValueOrDefault(now.Year);

            return new DateTime(p[4].Value, p[3].Value, p[2].Value, p[1].Value, p[0].Value, 0);
        }

        /// <summary>
        /// Gets an array of all date parts to construct a datetime instance.
        /// </summary>
        /// <returns>[min, hour, day, month, year]</returns>
        private int?[] ToArray()
        {
            return new int?[] { this.Minute, this.Hour, this.Day, this.Month, this.Year };
        }
    }
}
