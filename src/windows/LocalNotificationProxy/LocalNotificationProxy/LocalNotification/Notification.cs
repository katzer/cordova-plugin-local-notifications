namespace LocalNotificationProxy.LocalNotification
{
    using System;
    using System.Collections.Generic;
    using Microsoft.Toolkit.Uwp.Notifications;
    using Windows.UI.Notifications;

    internal class Notification
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="Notification"/> class.
        /// </summary>
        /// <param name="options">The options hash map from JS side.</param>
        public Notification(Options options)
        {
            this.Options = options;
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="Notification"/> class.
        /// </summary>
        /// <param name="xml">The options as a xml string.</param>
        public Notification(string xml)
        {
            this.Options = Options.Parse(xml);
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="Notification"/> class.
        /// </summary>
        /// <param name="toast">The options as a toast object.</param>
        public Notification(ScheduledToastNotification toast)
        {
            this.Options = Options.Parse(toast.Content.GetXml());
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="Notification"/> class.
        /// </summary>
        /// <param name="toast">The options as a toast object.</param>
        public Notification(ToastNotification toast)
        {
            var xml = toast.Content.DocumentElement.GetAttribute("launch");
            this.Options = Options.Parse(xml);
        }

        public enum Type
        {
            All, Scheduled, Triggered, Unknown
        }

        /// <summary>
        /// Gets the wrapped notification options.
        /// </summary>
        public Options Options { get; private set; }

        /// <summary>
        /// Gets the unique identifier for the toast.
        /// </summary>
        public string Id => $"{this.Options.Id}#{this.Options.Trigger.Occurrence}";

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

                foreach (var action in this.Options.Actions)
                {
                    if (action is Button)
                    {
                        buttons.Add(new ToastButton(action.Title, this.Options.GetXml(action.ID))
                        {
                            ActivationType = action.Launch ? ToastActivationType.Foreground : ToastActivationType.Background
                        });
                    }
                    else if (action is Input && (action as Input).SubmitTitle != null)
                    {
                        var input = action as Input;

                        buttons.Add(new ToastButton(input.SubmitTitle, this.Options.GetXml(input.ID))
                        {
                            ActivationType = input.Launch ? ToastActivationType.Foreground : ToastActivationType.Background,
                            TextBoxId = input.ID
                        });
                    }
                }

                return buttons;
            }
        }

        /// <summary>
        /// Gets all toast inputs.
        /// </summary>
        public List<ToastTextBox> Inputs
        {
            get
            {
                var inputs = new List<ToastTextBox>();

                foreach (var action in this.Options.Actions)
                {
                    if (!(action is Input))
                    {
                        continue;
                    }

                    inputs.Add(new ToastTextBox(action.ID)
                    {
                        Title = action.Title,
                        PlaceholderContent = (action as Input).EmptyText,
                        DefaultInput = (action as Input).DefaultValue
                    });
                }

                return inputs;
            }
        }

        /// <summary>
        /// Gets the date when to trigger the notification.
        /// </summary>
        public DateTime Date
        {
            get
            {
                var trigger = this.Options.Trigger;
                var time = trigger.At;
                var date = DateTimeOffset.FromUnixTimeMilliseconds(time * 1000).LocalDateTime;
                var minDate = DateTime.Now.AddSeconds(0.1);

                date = date.AddTicks(this.Interval.Ticks * (trigger.Occurrence - 1));

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
                var every = this.Options.Trigger.Every;

                switch (every)
                {
                    case null:
                    case "":
                        return TimeSpan.Zero;
                    case "second":
                        return new TimeSpan(TimeSpan.TicksPerSecond);
                    case "minute":
                        return new TimeSpan(TimeSpan.TicksPerMinute);
                    case "hour":
                        return new TimeSpan(TimeSpan.TicksPerHour);
                    case "day":
                        return new TimeSpan(TimeSpan.TicksPerDay);
                    case "week":
                        return new TimeSpan(TimeSpan.TicksPerDay * 7);
                    case "month":
                        return new TimeSpan(TimeSpan.TicksPerDay * 31);
                    case "quarter":
                        return new TimeSpan(TimeSpan.TicksPerHour * 2190);
                    case "year":
                        return new TimeSpan(TimeSpan.TicksPerDay * 365);
                }

                try
                {
                    return TimeSpan.FromSeconds(60 * int.Parse(every));
                }
                catch
                {
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
    }
}
