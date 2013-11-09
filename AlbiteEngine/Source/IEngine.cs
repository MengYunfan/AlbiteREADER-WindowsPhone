﻿using SvetlinAnkov.Albite.BookLibrary;
using SvetlinAnkov.Albite.Engine.LayoutSettings;
using System;

namespace SvetlinAnkov.Albite.Engine
{
    public interface IEngine
    {
        /// <summary>
        /// BookPresenter for this engine
        /// </summary>
        BookPresenter BookPresenter { get; }

        /// <summary>
        /// Settings for this engine
        /// </summary>
        Settings Settings { get; }

        /// <summary>
        /// The Uri used for loading the engine.
        /// Generally, that is the main page that is used to show
        /// all chapters. It does not change.
        /// </summary>
        Uri Uri { get; }

        /// <summary>
        /// Inform the engine that the settings have been modified.
        /// This will cause the engine to relayout the current chapter
        /// </summary>
        void UpdateLayout();

        /// <summary>
        /// Called whenever the viewport is resized or the dimensions
        /// might have changed (e.g. after the client has loaded).
        /// </summary>
        void UpdateDimensions();

        /// <summary>
        /// Navigator for this engine
        /// </summary>
        IEngineNavigator Navigator { get; }

        /// <summary>
        /// Process a message from the client.
        /// </summary>
        /// <param name="message">JSON-encoded message from the JS client</param>
        void ReceiveMessage(string message);
    }
}