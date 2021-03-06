﻿using Albite.Reader.BookLibrary.Location;
using System;

namespace Albite.Reader.Engine
{
    public interface IEnginePresenter
    {
        /// <summary>
        /// The width of the viewport of the control
        /// </summary>
        int Width { get; }

        /// <summary>
        /// The height of the viewport of the control
        /// </summary>
        int Height { get; }

        /// <summary>
        /// The padding taken by the ApplicationBar (if any).
        /// </summary>
        int ApplicationBarHeight { get; }

        /// <summary>
        /// Base path of the browser
        /// </summary>
        string BasePath { get; set; }

        /// <summary>
        /// Reloads the browser
        /// </summary>
        void ReloadBrowser();

        /// <summary>
        /// Send message to the JS client.
        /// </summary>
        /// <param name="message">JSON-encoded message</param>
        /// <returns></returns>
        string SendMessage(string message);

        /// <summary>
        /// Inform the control that loading has started
        /// </summary>
        void LoadingStarted();

        /// <summary>
        /// Inform the control that loading has completed
        /// </summary>
        void LoadingCompleted();

        /// <summary>
        /// Inform the control that the client has requested
        /// to navigate.
        /// </summary>
        /// <param name="uri">External URI</param>
        /// <returns>Returns true if the navigation was handled by the control,
        /// e.g. in cases of external links</returns>
        bool ExternalNavigationRequested(Uri uri, string title);

        /// <summary>
        /// Check if the internal navigation should be approved
        /// </summary>
        /// <param name="uri">Internal URI</param>
        /// <param name="title">Title of the link</param>
        /// <returns>Returns true if the internal navigation was approved.</returns>
        bool InternalNavigationApprovalRequested(Uri uri, string title);

        /// <summary>
        /// Informs the presenter when the engine navigation has failed
        /// </summary>
        /// <param name="title">link address</param>
        void NavigationFailed(Uri uri, string title);

        /// <summary>
        /// Inform the control in case of an error.
        /// E.g., this might happen if the data from the client is
        /// malformed, or if the client has generated an error itself.
        /// </summary>
        /// <param name="message">
        /// An error message indicating the source of the error.
        /// </param>
        void OnError(string message);
    }
}
