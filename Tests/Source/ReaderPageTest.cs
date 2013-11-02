﻿using SvetlinAnkov.Albite.BookLibrary;
using SvetlinAnkov.Albite.Container;
using SvetlinAnkov.Albite.Core.Test;
using SvetlinAnkov.Albite.READER;
using System;
using System.Windows.Navigation;

namespace SvetlinAnkov.Albite.Tests
{
    public class ReaderPageTest : TestCase
    {
        private string book;
        private NavigationService navigation;

        public ReaderPageTest(string book, NavigationService navigation)
        {
            this.book = book;
            this.navigation = navigation;
        }

        protected override void TestImplementation()
        {
            // Get the context
            AlbiteContext context = ((IAlbiteApplication) App.Current).CurrentContext;

            // Get the library
            BookLibrary.Library library = context.Library;

            // Add the book
            library.Books.Add(new Book.Descriptor(book, BookContainerType.Epub));

            // Navigate
            navigation.Navigate(new Uri("/AlbiteREADER;component/Source/View/Pages/ReaderPage.xaml?id=1", UriKind.Relative));
        }
    }
}