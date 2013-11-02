﻿using SvetlinAnkov.Albite.BookLibrary;
using System.IO;

namespace SvetlinAnkov.Albite.Engine
{
    public abstract class AbstractNavigator : IEngineNavigator
    {
        protected readonly AbstractEngine engine;

        public AbstractNavigator(AbstractEngine engine)
        {
            this.engine = engine;
        }

        public abstract BookPresenter.Location BookLocation { get; set; }

        internal string DomLocation
        {
            get { return engine.Messenger.DomLocation; }
            set { engine.Messenger.DomLocation = value; }
        }

        public int Page
        {
            get { return engine.Messenger.Page; }
            set { engine.Messenger.Page = value; }
        }

        public int PageCount
        {
            get { return engine.Messenger.PageCount; }
        }

        public void GoToFirstPage()
        {
            Page = 1;
        }

        public void GoToLastPage()
        {
            Page = engine.Messenger.PageCount;
        }

        protected void SetChapterPage(string fileUrl, int page)
        {
            SetChapter(InitialLocation.GetPageLocation(page), fileUrl);
        }

        protected void SetChapterFirstPage(string fileUrl)
        {
            SetChapter(InitialLocation.GetFirstLocation(), fileUrl);
        }

        protected void SetChapterLastPage(string fileUrl)
        {
            SetChapter(InitialLocation.GetLastLocation(), fileUrl);
        }

        protected void SetChapterDomLocation(string fileUrl, string location)
        {
            SetChapter(InitialLocation.GetDomLocation(location), fileUrl);
        }

        private void SetChapter(InitialLocation initialLocation, string fileUrl)
        {
            // Set up main.xhtml
            engine.TemplateController.UpdateChapter(
                initialLocation,
                IsFirstChapter, IsLastChapter,
                Path.Combine("/" + engine.BookPresenter.RelativeContentPath, fileUrl));

            // Now reload the web browser
            engine.Controller.ReloadBrowser();
        }

        /// <summary>
        /// Reload the current chapter and navigate to the current DomLocation
        /// </summary>
        public void Reload()
        {
            engine.TemplateController.UpdateInitialLocation(
                InitialLocation.GetDomLocation(DomLocation));

            // Now reload the web browser
            engine.Controller.ReloadBrowser();
        }

        public abstract bool IsFirstChapter { get; }
        public abstract bool IsLastChapter { get; }
        public abstract void GoToPreviousChapter();
        public abstract void GoToNextChapter();
    }
}
