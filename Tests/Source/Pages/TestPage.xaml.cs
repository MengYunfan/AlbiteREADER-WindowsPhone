﻿using Microsoft.Phone.Controls;
using SvetlinAnkov.Albite.BookLibrary;
using SvetlinAnkov.Albite.BookLibrary.Test;
using SvetlinAnkov.Albite.Container;
using SvetlinAnkov.Albite.Core.Diagnostics;
using System;
using System.IO.IsolatedStorage;

namespace SvetlinAnkov.Albite.Tests.Pages
{
    public partial class TestPage : PhoneApplicationPage
    {
        private static readonly string tag = "TestPage";

        public TestPage()
        {
            InitializeComponent();
        }

        private void removeStore()
        {
            // Remove the whole iso store for this app
            Log.D(tag, "Clearing Isolated Storage...");
            IsolatedStorageFile.GetUserStoreForApplication().Remove();
        }

        private void AutomatedTestsButton_Click(object sender, System.Windows.RoutedEventArgs e)
        {
            // Remove all local data
            removeStore();

            // Now run the tests
            new Tests().Test();
        }

        private void WebBrowserSecurityTestButton_Click(object sender, System.Windows.RoutedEventArgs e)
        {
            NavigationService.Navigate(new Uri("/Source/Pages/WebBrowserSecurityTestPage.xaml", UriKind.Relative));
        }

        private void WebBrowserStabilityTestButton_Click(object sender, System.Windows.RoutedEventArgs e)
        {
            NavigationService.Navigate(new Uri("/Source/Pages/WebBrowserStabilityTestPage.xaml", UriKind.Relative));
        }

        private void LibraryTestButton_Click(object sender, System.Windows.RoutedEventArgs e)
        {
            // Remove all local data
            removeStore();

            Book.Descriptor[] books
                = {
                      new Book.Descriptor(
                          "Test/epub/aliceDynamic.epub", BookContainerType.Epub)
                  };
            new LibraryAddBookTest("Test/Library/", books).Test();
        }

        private void ReaderPageTestButton_Click(object sender, System.Windows.RoutedEventArgs e)
        {
            // Remove all local data
            removeStore();

            // Now run the actual test
            new ReaderPageTest("Test/epub/aliceDynamic.epub", NavigationService).Test();
        }

        private void SpeechSynthesisTestButton_Click(object sender, System.Windows.RoutedEventArgs e)
        {
            new SpeechSynthesisTest().Test();
        }

        private void PaginationTestButton_Click(object sender, System.Windows.RoutedEventArgs e)
        {
            new PaginationTest("Test/epub/aliceDynamic.epub", 3, 16, NavigationService).Test();
        }
    }
}