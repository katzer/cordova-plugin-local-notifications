namespace LocalNotificationProxy.LocalNotification
{
    using System;
    using System.Collections.Generic;
    using Microsoft.Toolkit.Uwp.Notifications;
    using Windows.Data.Xml.Dom;

    internal class Content
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="Content"/> class.
        /// </summary>
        /// <param name="options">The options hash map from JS side.</param>
        public Content(Options options)
        {
            this.Options = options;
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="Content"/> class.
        /// </summary>
        /// <param name="xml">The options as a xml string.</param>
        public Content(string xml)
        {
            this.Options = Options.Parse(xml);
        }

        public Options Options { get; private set; }

        /// <summary>
        /// Gets a ToastAudio object based on the specified sound uri.
        /// </summary>
        public ToastAudio Sound
        {
            get
            {
                var sound = new ToastAudio();
                var path = this.Options.Sound;

                if (path == null || path.Length == 0 || path.Equals("false"))
                {
                    sound.Silent = true;
                }
                else
                if (path.StartsWith("file:///") || path.StartsWith("http"))
                {
                    sound.Src = new Uri(path, UriKind.Absolute);
                }
                else
                if (path.StartsWith("file://"))
                {
                    sound.Src = new Uri(path.Replace("file:/", "ms-appx:///www"));
                }
                else
                if (path.StartsWith("res://"))
                {
                    sound.Src = new Uri(path.Replace("res://", "ms-winsoundevent:notification."));
                }
                else
                if (path.StartsWith("app://"))
                {
                    sound.Src = new Uri(path.Replace("app:/", "ms-appdata://"));
                }

                return sound;
            }
        }

        /// <summary>
        /// Gets a GenericAppLogo object based on the specified icon uri.
        /// </summary>
        public ToastGenericAppLogo Image
        {
            get
            {
                var image = new ToastGenericAppLogo();
                var path = this.Options.Image;

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
        /// Gets the parsed image attachments.
        /// </summary>
        public List<AdaptiveImage> Attachments
        {
            get
            {
                var images = new List<AdaptiveImage>();

                if (this.Options.Attachments == null)
                {
                    return images;
                }

                foreach (string path in this.Options.Attachments)
                {
                    var image = new AdaptiveImage();

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

                    if (image.Source != null)
                    {
                        images.Add(image);
                    }
                }

                return images;
            }
        }

        /// <summary>
        /// Gets all toast buttons.
        /// </summary>
        public List<ToastButton> Buttons
        {
            get
            {
                var buttons = new List<ToastButton>();

                foreach (var action in this.Options.Buttons)
                {
                    buttons.Add(
                        new ToastButton(action.Title, this.Options.GetXml(action.ID))
                        {
                            ActivationType = action.Launch ? ToastActivationType.Foreground : ToastActivationType.Background
                        });
                }

                return buttons;
            }
        }

        /// <summary>
        /// Gets the date when to trigger the notification.
        /// </summary>
        public DateTime Date
        {
            get
            {
                var date = DateTimeOffset.FromUnixTimeMilliseconds(this.Options.At * 1000).LocalDateTime;
                var minDate = DateTime.Now.AddSeconds(0.1);

                return (date < minDate) ? minDate : date;
            }
        }

        /// <summary>
        /// Gets the parsed repeat interval.
        /// </summary>
        public TimeSpan Interval
        {
            get
            {
                switch (this.Options.Every)
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
        /// Gets the instance as an serialized xml element.
        /// </summary>
        /// <returns>Element with all property values set as attributes.</returns>
        public string GetXml()
        {
            return this.Options.GetXml();
        }

        /// <summary>
        /// If the notification shall be repeating.
        /// </summary>
        /// <returns>True if the Every property has some value.</returns>
        public bool IsRepeating()
        {
            var every = this.Options.Every;

            return every != null && every.Length > 0 && !every.Equals("0");
        }
    }
}
