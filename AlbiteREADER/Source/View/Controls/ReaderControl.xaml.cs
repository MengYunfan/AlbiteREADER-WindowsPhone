﻿using SvetlinAnkov.Albite.BookLibrary;
using SvetlinAnkov.Albite.Core.Diagnostics;
using SvetlinAnkov.Albite.Engine;
using SvetlinAnkov.Albite.Engine.LayoutSettings;
using System;
using System.Windows;
using System.Windows.Controls;

namespace SvetlinAnkov.Albite.READER.View.Controls
{
    public partial class ReaderControl : UserControl
    {
        private static readonly string tag = "ReaderControl";

        public event EventHandler ReaderError;
        public event EventHandler ContentLoadingStarted;
        public event EventHandler ContentLoadingCompleted;

        private EngineController controller;

        private ThreadCheck threadCheck = new ThreadCheck();

        public ReaderControl()
        {
            InitializeComponent();
            load();
        }

        #region LifeCycle
        private void load()
        {
            if (controller == null)
            {
                controller = new EngineController(this);
            }
        }

        private void unload()
        {
            if (controller == null)
            {
                return;
            }

            // Call LoadingCompleted so to hide the popup
            // and cancel the animation.
            controller.LoadingCompleted();
            controller = null;
        }
        #endregion

        #region UI Events
        private void WebBrowser_Loaded(object sender, RoutedEventArgs e)
        {
            threadCheck.Check();

            Log.D(tag, "WebBrowser Loaded");
            load();
        }

        private void WebBrowser_Unloaded(object sender, RoutedEventArgs e)
        {
            threadCheck.Check();

            Log.D(tag, "WebBrowser Unloaded");
            unload();
        }

        private void WebBrowser_Navigated(object sender, System.Windows.Navigation.NavigationEventArgs e)
        {
            threadCheck.Check();

            Log.D(tag, "Navigated: " + e.Uri.ToString());
        }

        private void WebBrowser_Navigating(object sender, Microsoft.Phone.Controls.NavigatingEventArgs e)
        {
            threadCheck.Check();

            Log.D(tag, "Navigating to: " + e.Uri.ToString());

            if (controller == null || controller.Engine == null)
            {
                return;
            }

            // Allow only the Engine Uri to be navigated to.
            if (controller.Engine.Uri != e.Uri)
            {
                Log.D(tag, "Cancelling navigation");
                e.Cancel = true;
                return;
            }

            controller.LoadingStarted();
        }

        private void WebBrowser_NavigationFailed(object sender, System.Windows.Navigation.NavigationFailedEventArgs e)
        {
            threadCheck.Check();

            // TODO: How should the user be informed and/or
            // what has to be done? This a fault of the app, not the epub.
            // TODO: Handling failed navigation in the iframe?
            // What about errors from the client?
            // What about an '{loadingError}' event from the client?
            Log.E(tag, "Navigation failed: " + e.Uri.ToString());
            e.Handled = true;
        }

        private void WebBrowser_ScriptNotify(object sender, Microsoft.Phone.Controls.NotifyEventArgs e)
        {
            threadCheck.Check();

            if (controller == null || controller.Engine == null)
            {
                return;
            }

            try
            {
                controller.Engine.ReceiveMessage(e.Value);
            }
            catch (Exception ex)
            {
                controller.OnError(ex.Message);
            }
        }

        public void WebBrowser_SizeChanged(object sender, SizeChangedEventArgs e)
        {
            threadCheck.Check();

            Log.D(tag, "SizeChanged: " + e.NewSize.Width + "x" + e.NewSize.Height);

            if (controller == null || controller.Engine == null)
            {
                return;
            }

            controller.Engine.UpdateDimensions();
        }
        #endregion

        #region Public API
        public void OpenBook(int bookId)
        {
            threadCheck.Check();
            if (controller == null)
            {
                return;
            }

            controller.OpenBook(bookId);
        }

        public void PersistBook()
        {
            threadCheck.Check();
            if (controller == null)
            {
                return;
            }

            controller.PersistBook();
        }
        #endregion

        #region EngineController
        private class EngineController : IEngineController
        {
            private readonly ReaderControl control;

            private BookPresenter bookPresenter;
            private AlbiteEngine engine;

            public bool IsLoading { get; private set; }

            public EngineController(ReaderControl control)
            {
                this.control = control;
            }

            public AlbiteEngine Engine
            {
                get { return engine; }
            }

            public int Width
            {
                get { return (int) control.WebBrowser.ActualWidth; }
            }

            public int Height
            {
                get { return (int) control.WebBrowser.ActualHeight; }
            }

            public string BasePath
            {
                get { return control.WebBrowser.Base; }
                set { control.WebBrowser.Base = value; }
            }

            public void ReloadBrowser()
            {
                LoadingStarted();
                control.WebBrowser.Navigate(Engine.Uri);
            }

            public BookPresenter BookPresenter
            {
                get { return bookPresenter; }
            }

            public void OpenBook(int bookId)
            {
                // TODO: The following needs to be run on
                // a different thread perhaps?

                // Get the library from the current context
                Library library = App.Context.Library;

                // Get the book for the given id
                Book book = library.Books[bookId];

                // Get the presenter
                bookPresenter = new BookPresenter(book);

                // TODO: The component background color needs to be data-bound
                //       to Resources["PhoneBackgroundBrush"]

                // Load the engine.
                // This will initialise the settings with their default values.
                engine = new AlbiteEngine(this, bookPresenter, new Settings());

                // Go to the last reading location
                engine.Navigator.BookLocation = bookPresenter.BookLocation;
            }

            public void PersistBook()
            {
                if (!IsLoading)
                {
                    // Can't get a book location when loading, so:
                    // 1. If it's the first load, nothing to persist anyway
                    // 2. Persist the location elsewhere before calling ReloadBrowser()
                    // True, real jumps would actually miss the latest location,
                    // e.g. when trying to persist while loading the next chapter,
                    // but that's the only problem with this approach and I don't
                    // see a better solution.
                    // It should also work when tombstoning the app.
                    bookPresenter.BookLocation = Engine.Navigator.BookLocation;
                }

                bookPresenter.Persist();
            }

            public string SendMessage(string message)
            {
                Log.D(tag, "SendMessage: " + message);

                if (IsLoading)
                {
                    Log.D(tag, "Can't send command. Still loading.");
                    return null;
                }

                return (string)control.WebBrowser.InvokeScript(
                    "albite_notify", new string[] { message });
            }

            public void LoadingStarted()
            {
                IsLoading = true;
                if (control.ContentLoadingStarted != null)
                {
                    control.ContentLoadingStarted(control, EventArgs.Empty);
                }
            }

            public void LoadingCompleted()
            {
                if (control.ContentLoadingCompleted != null)
                {
                    control.ContentLoadingCompleted(control, EventArgs.Empty);
                }
                IsLoading = false;
            }

            public void OnError(string message)
            {
                Log.E(tag, "ReaderError: " + message);

                if (control.ReaderError != null)
                {
                    control.ReaderError(control, EventArgs.Empty);
                }
            }
        }
        #endregion
    }
}
