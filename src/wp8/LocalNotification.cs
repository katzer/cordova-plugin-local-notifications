/**
 *  LocalNotification.cs
 *  Cordova LocalNotification Plugin
 *
 *  Created by Sebastian Katzer (github.com/katzer) on 07/10/2013.
 *  Copyright 2013 Sebastian Katzer. All rights reserved.
 *  GPL v2 licensed
 */

using System;
using System.Linq;

using Microsoft.Phone.Shell;

using WPCordovaClassLib.Cordova;
using WPCordovaClassLib.Cordova.Commands;
using WPCordovaClassLib.Cordova.JSON;

using De.APPPlant.Cordova.Plugin.LocalNotification;

namespace Cordova.Extension.Commands
{
    /// <summary>
    /// Implementes access to application live tiles
    /// http://msdn.microsoft.com/en-us/library/hh202948(v=VS.92).aspx
    /// </summary>
    public class LocalNotification : BaseCommand
    {
        /// <summary>
        /// Sets application live tile
        /// </summary>
        public void add (string jsonArgs)
        {
            string[] args                    = JsonHelper.Deserialize<string[]>(jsonArgs);
            LocalNotificationOptions options = JsonHelper.Deserialize<LocalNotificationOptions>(args[0]);
            // Application Tile is always the first Tile, even if it is not pinned to Start.
            ShellTile AppTile                = ShellTile.ActiveTiles.First();

            if (AppTile != null)
            {
                // Set the properties to update for the Application Tile
                // Empty strings for the text values and URIs will result in the property being cleared.
                StandardTileData TileData = CreateTileData(options);

                // Update the Application Tile
                AppTile.Update(TileData);
            }

            DispatchCommandResult();
        }

        /// <summary>
        /// Clears the application live tile
        /// </summary>
        public void cancel (string jsonArgs)
        {
            cancelAll(jsonArgs);
        }

        /// <summary>
        /// Clears the application live tile
        /// </summary>
        public void cancelAll (string jsonArgs)
        {
            // Application Tile is always the first Tile, even if it is not pinned to Start.
            ShellTile AppTile = ShellTile.ActiveTiles.First();

            if (AppTile != null)
            {
                // Set the properties to update for the Application Tile
                // Empty strings for the text values and URIs will result in the property being cleared.
                StandardTileData TileData = new StandardTileData
                {
                    Title       = "",
                    BackTitle   = "",
                    BackContent = ""
                };

                // Update the Application Tile
                AppTile.Update(TileData);
            }

            DispatchCommandResult();
        }

        /// <summary>
        /// Creates tile data
        /// </summary>
        private StandardTileData CreateTileData (LocalNotificationOptions options)
        {
            StandardTileData tile = new StandardTileData();

            // Badge sollte nur gelöscht werden, wenn expliziet eine `0` angegeben wurde
            if (options.Badge != 0)
            {
                tile.Count = options.Badge;
            }

            tile.BackTitle   = options.Title;
            tile.Title       = options.Title;
            tile.BackContent = options.Message;

            return tile;
        }
    }
}
