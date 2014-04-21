﻿using System.Collections.Generic;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Media;

namespace Albite.Reader.App.Browse
{
    public abstract class BrowsingService
    {
        /// <summary>
        /// Service name, e.g. SD, OneDrive, etc.
        /// </summary>
        public abstract string Name { get; }

        /// <summary>
        /// Service id (should be unique)
        /// </summary>
        public abstract string Id { get; }

        /// <summary>
        /// Service icon
        /// </summary>
        public abstract ImageSource Icon { get; }

        /// <summary>
        /// True if the user ought to log in before
        /// they can use the service
        /// </summary>
        public abstract bool LoginRequired { get; }

        /// <summary>
        /// Logs the user in
        /// </summary>
        public abstract Task LogIn();

        /// <summary>
        /// Logs the user out
        /// </summary>
        public abstract void LogOut();

        /// <summary>
        /// True if the user is currently logged in
        /// Throws InvalidOperationException if LoginRequired is false
        /// </summary>
        public abstract bool LoggedIn { get; }

        /// <summary>
        /// Retrieves the folder contents for a particular path
        /// </summary>
        /// <param name="path">The folder item. If null, it looks in the root folder.</param>
        /// <returns></returns>
        public abstract Task<ICollection<FolderItem>> GetFolderContentsAsync(FolderItem folder, CancellationToken ct);

        public Task<ICollection<FolderItem>> GetFolderContentsAsync(FolderItem folder)
        {
            return GetFolderContentsAsync(folder, CancellationToken.None);
        }

        /// <summary>
        /// Retrieves the contents of a file
        /// </summary>
        /// <param name="path">The file path</param>
        /// <returns></returns>
        public abstract Task<Stream> GetFileContentsAsync(string path);

        /// <summary>
        /// Returns true if a file should be listed
        /// </summary>
        /// <param name="file">file name</param>
        /// <returns></returns>
        public delegate bool IsFileAccepted(string file);
        public IsFileAccepted IsFileAcceptedDelegate { get; set; }

        /// <summary>
        /// File icon
        /// </summary>
        public delegate ImageSource GetFileIcon();
        public GetFileIcon GetFileIconDelegate { get; set; }
    }
}
