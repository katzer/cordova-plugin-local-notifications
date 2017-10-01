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
        public int Minute { get; set; }

        /// <summary>
        /// Gets or sets the hour.
        /// </summary>
        public int Hour { get; set; }

        /// <summary>
        /// Gets or sets the day.
        /// </summary>
        public int Day { get; set; }

        /// <summary>
        /// Gets or sets the month.
        /// </summary>
        public int Month { get; set; }

        /// <summary>
        /// Gets or sets the year.
        /// </summary>
        public int Year { get; set; }

        /// <summary>
        /// Gets a value indicating whether the minute is not fix.
        /// </summary>
        internal bool MinuteIsVariable { get => this.Minute == 0; }

        /// <summary>
        /// Gets a value indicating whether the hour is not fix.
        /// </summary>
        internal bool HourIsVariable { get => this.Hour == 0; }

        /// <summary>
        /// Gets a value indicating whether the day is not fix.
        /// </summary>
        internal bool DayIsVariable { get => this.Day == 0; }

        /// <summary>
        /// Gets a value indicating whether the month is not fix.
        /// </summary>
        internal bool MonthIsVariable { get => this.Month == 0; }

        /// <summary>
        /// Gets a value indicating whether the year is not fix.
        /// </summary>
        internal bool YearIsVariable { get => this.Year == 0; }

        /// <summary>
        /// Gets the interval as a string representation.
        /// </summary>
        /// <returns>year, month, ...</returns>
        internal string Interval { get => Intervals[Array.IndexOf(this.ToArray(), 0) + 1]; }

        /// <summary>
        /// Converts the date time components into a datetime object.
        /// </summary>
        /// <returns>A datetime object</returns>
        internal DateTime ToDateTime()
        {
            var p = this.ToArray();
            var today = DateTime.Today;

            p[2] = this.DayIsVariable ? today.Day : this.Day;
            p[3] = this.MonthIsVariable ? today.Month : this.Month;
            p[4] = this.YearIsVariable ? today.Year : this.Year;

            return new DateTime(p[4], p[3], p[2], p[1], p[0], 0);
        }

        /// <summary>
        /// Gets an array of all date parts to construct a datetime instance.
        /// </summary>
        /// <returns>[min, hour, day, month, year]</returns>
        private int[] ToArray()
        {
            return new int[] { this.Minute, this.Hour, this.Day, this.Month, this.Year };
        }
    }
}
