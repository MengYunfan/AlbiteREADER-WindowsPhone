﻿using System;
using System.Net;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Documents;
using System.Windows.Ink;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Animation;
using System.Windows.Shapes;
using System.IO;
using SvetlinAnkov.Albite.Core.Utils;
using System.Collections.Generic;

namespace SvetlinAnkov.Albite.READER.Model.Container
{
    public abstract class BookContainer : IAlbiteContainer
    {
        private static readonly string tag = "BookContainer";

        protected IAlbiteContainer Container;

        public abstract IEnumerable<string> Items { get; }

        /// <summary>
        /// Returns true if there was a problem when creating
        /// the container.
        /// </summary>
        public bool HadErrors { get; protected set; }

        public bool Fallback { get; private set; }

        public BookContainer()
        {
            HadErrors = false;
        }

        /// <summary>
        /// Creates a new BookContainer
        /// </summary>
        /// <param name="container">The source IAlbiteContainer</param>
        /// <param name="fallback">
        ///     If true, non-fatal errors when using this containre won't cause
        ///     an exception. Use HadErrors to check if there were any.
        /// </param>
        public BookContainer(IAlbiteContainer container, bool fallback)
        {
            this.Container = container;
            this.Fallback = fallback;
        }

        /// <summary>
        /// Extracts the contents into the isolated storage.
        /// Doesn't throw if the container has been initialised with
        /// fallback as false.
        /// </summary>
        /// <param name="path">The path on the isolated storage to copy to.</param>
        /// <returns>True if there were no errors</returns>
        public virtual bool Install(string path)
        {
            bool hadErrors = false;
            IEnumerable<string> items = Items;

            foreach (string item in items)
            {
                try
                {
                    // This assumes that all items have been thoroughly checked before being
                    // added to the list, i.e. that their names are valid and that
                    // they are not using relative paths so that they wouldn't be
                    // a security issue.
                    // Doing the check here is not as easy as it seems, therefore it's
                    // the responsibility of the implementing class
                    using (AlbiteIsolatedStorage output = new AlbiteIsolatedStorage(System.IO.Path.Combine(path, item)))
                    {
                        using (Stream input = Stream(item))
                        {
                            output.Write(input);
                        }
                    }
                }
                catch (Exception e)
                {
                    Log.E(tag, "Failed unpacking " + item, e);
                    hadErrors = true;

                    if (!Fallback)
                    {
                        throw e;
                    }
                }
            }

            return hadErrors;
        }

        public virtual Stream Stream(string entityName)
        {
            return Container.Stream(entityName);
        }

        public void Dispose()
        {
            Container.Dispose();
        }
    }

    public class BookContainerException : Exception
    {
        public BookContainerException(string message) : base(message) { }
        public BookContainerException(string message, Exception innerException) : base(message, innerException) { }
    }
}
