using System.Runtime.Serialization;

namespace De.APPPlant.Cordova.Plugin.LocalNotification
{
    /// <summary>
    /// Represents LiveTile options
    /// </summary>
    [DataContract]
    class LocalNotificationOptions
    {
        /// <summary>
        /// The Title that is displayed
        /// </summary>
        [DataMember(IsRequired = false, Name = "title")]
        public string Title { get; set; }

        /// <summary>
        /// The message that is displayed
        /// </summary>
        [DataMember(IsRequired = false, Name = "message")]
        public string Message { get; set; }

        /// <summary>
        /// Displays number badge to notification
        /// </summary>
        [DataMember(IsRequired = false, Name = "badge")]
        public int Badge { get; set; }

        /// <summary>
        /// Tile count
        /// </summary>
        [DataMember(IsRequired = false, Name = "Date")]
        public int Date { get; set; }

        /// <summary>
        /// Has the options of daily', 'weekly',''monthly','yearly')
        /// </summary>
        [DataMember(IsRequired = false, Name = "repeat")]
        public string Repeat { get; set; }

        /// <summary>
        /// Message-ID
        /// </summary>
        [DataMember(IsRequired = false, Name = "id")]
        public string ID { get; set; }

        /// <summary>
        /// A javascript function to be called if the app is in the background
        /// </summary>
        [DataMember(IsRequired = false, Name = "background")]
        public string Background { get; set; }

        /// <summary>
        /// A javascript function to be called if the app is running
        /// </summary>
        [DataMember(IsRequired = false, Name = "foreground")]
        public string Foreground { get; set; }
    }
}
